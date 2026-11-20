import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Andamento da geração por SSE (`GET /content-studio/packages/:id/generations/stream`).
 * Funciona com o provedor simulado ou real: o job termina em SUCCEEDED ou FAILED, e o stream mostra a transição.
 */
const FLAGS = ["content_studio", "content_studio_generation"] as const;
const before: Record<string, number> = {};
let admin = "";
let member = "";
let leader = "";
let packageId = "";
let stageId = "";

type Pkg = { id: string; tracks: Array<{ audience: string; stages: Array<{ id: string; stageType: string }> }> };
type JobEvent = { stageId: string; status: string };

/** Lê o stream até `until` devolver true (ou o tempo acabar) e devolve os eventos `jobs` recebidos. */
async function readStream(token: string, until: (events: JobEvent[][]) => boolean, maxMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), maxMs);
  const events: JobEvent[][] = [];
  const response = await fetch(`${API_URL}/content-studio/packages/${packageId}/generations/stream`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
    signal: controller.signal,
  });
  const contentType = response.headers.get("content-type") ?? "";
  let buffer = "";
  try {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index: number;
      while ((index = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (block.startsWith("event: jobs")) events.push(JSON.parse(block.split("\ndata: ")[1]) as JobEvent[]);
      }
      if (until(events)) break;
    }
  } catch {
    // abortado por tempo: devolvemos o que chegou
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
  return { events, contentType, status: response.status };
}

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  member = (await loginAs(request, "member")).accessToken;
  leader = (await loginAs(request, "leader")).accessToken;
  for (const key of FLAGS) {
    before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
  }
  const res = await request.post(`${API_URL}/content-studio/packages`, {
    headers: authHeaders(admin),
    data: { theme: `e2e-sse ${Date.now()}`, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" },
  });
  const pkg = (await res.json()) as Pkg;
  packageId = pkg.id;
  stageId = pkg.tracks.find((t) => t.audience === "CHILD")!.stages.find((s) => s.stageType === "LESSON")!.id;
});

test.afterAll(async ({ request }) => {
  if (packageId) await request.post(`${API_URL}/content-studio/packages/${packageId}/archive`, { headers: authHeaders(admin) });
  for (const key of FLAGS) {
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
  }
  await closeDb();
});

test("permissões: visitante 401, membro 403, líder 403, pacote inexistente 404", async ({ request }) => {
  const url = `${API_URL}/content-studio/packages/${packageId}/generations/stream`;
  expect((await request.get(url)).status()).toBe(401);
  expect((await request.get(url, { headers: authHeaders(member) })).status()).toBe(403);
  expect((await request.get(url, { headers: authHeaders(leader) })).status()).toBe(403);
  const missing = await request.get(`${API_URL}/content-studio/packages/00000000-0000-4000-8000-000000000000/generations/stream`, {
    headers: authHeaders(admin),
  });
  expect(missing.status()).toBe(404);
  expect((await request.get(`${API_URL}/content-studio/packages/nao-e-uuid/generations/stream`, { headers: authHeaders(admin) })).status()).toBe(400);
});

test("sem geração: abre como text/event-stream e manda o estado inicial vazio", async () => {
  const { events, contentType, status } = await readStream(admin, (e) => e.length >= 1, 10_000);
  expect(status).toBe(200);
  expect(contentType).toContain("text/event-stream");
  expect(events[0]).toEqual([]);
});

test("pedir geração: o stream mostra o job e a transição até o fim", async ({ request }) => {
  const stream = readStream(
    admin,
    (e) => e.some((list) => list.some((job) => job.stageId === stageId && ["SUCCEEDED", "FAILED"].includes(job.status))),
    40_000,
  );
  await new Promise((resolve) => setTimeout(resolve, 500));
  const res = await request.post(`${API_URL}/content-studio/packages/${packageId}/stages/${stageId}/generations`, {
    headers: authHeaders(admin),
    data: { capability: "TEXT_STRUCTURED", idempotencyKey: `sse-${Date.now()}` },
  });
  expect(res.status()).toBe(202);
  const { events } = await stream;
  const statuses = events.flatMap((list) => list.filter((job) => job.stageId === stageId).map((job) => job.status));
  expect(statuses.length).toBeGreaterThan(0);
  expect(["SUCCEEDED", "FAILED"]).toContain(statuses[statuses.length - 1]);
});
