import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Geração de conteúdo do Estúdio com o PROVEDOR SIMULADO (AI_PROVIDER_MODE=fake):
 * nenhum LLM real é chamado. Falhas e limites vêm de diretivas `[[fake:…]]`
 * no tema do pacote (o worker usa o tipo da etapa; o tema vai no `input`).
 * Pré-requisito: API iniciada com AI_PROVIDER_MODE=fake.
 */
const TAG = `e2e-llm-${Date.now()}`;

type Stage = { id: string; stageType: string; status: string };
type Pkg = { id: string; tracks: Array<{ stages: Stage[] }> };

let admin: string;
const FLAGS = ["content_studio", "content_studio_generation"];

async function setFlags(request: import("@playwright/test").APIRequestContext, enabled: boolean): Promise<void> {
  for (const key of FLAGS) {
    const res = await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled } });
    expect(res.ok()).toBe(true);
  }
}

async function newPackage(request: import("@playwright/test").APIRequestContext, directive = ""): Promise<{ packageId: string; stage: Stage }> {
  const res = await request.post(`${API_URL}/content-studio/packages`, {
    headers: authHeaders(admin),
    data: { theme: `${TAG} ${directive}`.trim(), biblicalReferences: "Jo 3:16", canonicalObjective: "Objetivo" },
  });
  expect(res.status()).toBe(201);
  const pkg = (await res.json()) as Pkg;
  const stage = pkg.tracks[0].stages.find((s) => s.stageType === "LESSON") ?? pkg.tracks[0].stages[0];
  return { packageId: pkg.id, stage };
}

/** "Visuais da lição" só gera depois das perguntas (quantidade, tipo, desenho e formato); o desenho é o padrão da categoria. */
const VISUAL_CONFIG_BY_AUDIENCE: Record<string, object> = {
  BABY: { quantity: 4, format: "CUTOUT_KIT", style: "CUTE_CARTOON", orientation: "LANDSCAPE" },
  CHILD: { quantity: 4, format: "CUTOUT_KIT", style: "CUTE_CARTOON", orientation: "LANDSCAPE" },
  TEEN: { quantity: 4, format: "STORY_SCENES", style: "MODERN_ILLUSTRATION", orientation: "LANDSCAPE" },
  ADULT: { quantity: 4, format: "STORY_SCENES", style: "EDITORIAL_PAINTING", orientation: "PORTRAIT" },
};

const request202 = (
  request: import("@playwright/test").APIRequestContext,
  packageId: string,
  stageId: string,
  key: string,
  visualAudience?: string,
) =>
  request.post(`${API_URL}/content-studio/packages/${packageId}/stages/${stageId}/generations`, {
    headers: authHeaders(admin),
    data: {
      capability: "TEXT_STRUCTURED",
      idempotencyKey: key,
      ...(visualAudience ? { visualConfig: VISUAL_CONFIG_BY_AUDIENCE[visualAudience] } : {}),
    },
  });

const jobRow = (id: string) =>
  queryOne<{ status: string; attempts: number; errorCode: string | null }>("SELECT status, attempts, errorCode FROM content_generation_jobs WHERE id = ?", [id]);

async function waitJob(id: string, done: (status: string) => boolean): Promise<{ status: string; attempts: number; errorCode: string | null }> {
  for (let i = 0; i < 80; i++) {
    const row = await jobRow(id);
    if (row && done(row.status)) return row;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`job ${id} não chegou ao estado esperado`);
}

test.describe.serial("Geração com provedor simulado — ao vivo", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    await setFlags(request, true);
  });
  test.afterAll(async ({ request }) => {
    await setFlags(request, false);
    await closeDb();
  });

  test("a geração conclui: job SUCCEEDED, versão gravada com snapshot do provedor FAKE e etapa em DRAFT", async ({ request }) => {
    const { packageId, stage } = await newPackage(request);
    const res = await request202(request, packageId, stage.id, `${TAG}-ok`);
    expect(res.ok()).toBe(true);
    const { id } = (await res.json()) as { id: string };

    const job = await waitJob(id, (s) => s === "SUCCEEDED" || s === "FAILED");
    expect(job.status).toBe("SUCCEEDED");
    const version = await queryOne<{ generationSnapshot: string | { provider?: string } }>(
      "SELECT generationSnapshot FROM content_versions WHERE stage_id = ?",
      [stage.id],
    );
    const snap = typeof version?.generationSnapshot === "string" ? JSON.parse(version.generationSnapshot) : version?.generationSnapshot;
    expect(snap?.provider).toBe("FAKE");
    const row = await queryOne<{ status: string }>("SELECT status FROM content_stages WHERE id = ?", [stage.id]);
    expect(row?.status).toBe("DRAFT");
  });

  test("repetir a mesma chave devolve o mesmo job e não cria outro", async ({ request }) => {
    const { packageId, stage } = await newPackage(request);
    const key = `${TAG}-idem`;
    const first = (await (await request202(request, packageId, stage.id, key)).json()) as { id: string };
    const second = (await (await request202(request, packageId, stage.id, key)).json()) as { id: string };
    expect(second.id).toBe(first.id);
    await waitJob(first.id, (s) => s === "SUCCEEDED" || s === "FAILED");
    const rows = await queryAll<{ n: number }>("SELECT COUNT(*) AS n FROM content_generation_jobs WHERE stage_id = ?", [stage.id]);
    expect(rows[0].n).toBe(1);
  });

  test("anônimo 401 e membro 403, sem criar job", async ({ request }) => {
    const { packageId, stage } = await newPackage(request);
    const member = (await loginAs(request, "member")).accessToken;
    const url = `${API_URL}/content-studio/packages/${packageId}/stages/${stage.id}/generations`;
    expect((await request.post(url, { data: { capability: "TEXT_STRUCTURED", idempotencyKey: "x" } })).status()).toBe(401);
    expect((await request.post(url, { headers: authHeaders(member), data: { capability: "TEXT_STRUCTURED", idempotencyKey: "x" } })).status()).toBe(403);
    const rows = await queryAll<{ n: number }>("SELECT COUNT(*) AS n FROM content_generation_jobs WHERE stage_id = ?", [stage.id]);
    expect(rows[0].n).toBe(0);
  });

  test("sem geração ativa o cancelamento é 404", async ({ request }) => {
    const { packageId, stage } = await newPackage(request);
    const res = await request.delete(`${API_URL}/content-studio/packages/${packageId}/stages/${stage.id}/generations`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
  });

  test("limite de taxa (429): reagenda e conclui na 2ª tentativa, sem erro final", async ({ request }) => {
    const { packageId, stage } = await newPackage(request, "[[fake:429:1]]");
    const { id } = (await (await request202(request, packageId, stage.id, `${TAG}-429`)).json()) as { id: string };
    const job = await waitJob(id, (s) => s === "SUCCEEDED" || s === "FAILED");
    expect(job.status).toBe("SUCCEEDED");
    expect(job.attempts).toBe(2);
    expect(job.errorCode).toBeNull();
  });

  test("cota esgotada (quota): falha definitiva na 1ª tentativa, etapa FAILED, nenhuma versão gravada", async ({ request }) => {
    const { packageId, stage } = await newPackage(request, "[[fake:quota]]");
    const { id } = (await (await request202(request, packageId, stage.id, `${TAG}-quota`)).json()) as { id: string };
    const job = await waitJob(id, (s) => s === "SUCCEEDED" || s === "FAILED");
    expect(job).toMatchObject({ status: "FAILED", attempts: 1, errorCode: "QUOTA" });
    expect((await queryOne<{ status: string }>("SELECT status FROM content_stages WHERE id = ?", [stage.id]))?.status).toBe("FAILED");
    expect((await queryAll<{ n: number }>("SELECT COUNT(*) AS n FROM content_versions WHERE stage_id = ?", [stage.id]))[0].n).toBe(0);
  });

  test("bloqueio de segurança: falha definitiva sem retry", async ({ request }) => {
    const { packageId, stage } = await newPackage(request, "[[fake:moderation]]");
    const { id } = (await (await request202(request, packageId, stage.id, `${TAG}-mod`)).json()) as { id: string };
    const job = await waitJob(id, (s) => s === "SUCCEEDED" || s === "FAILED");
    expect(job).toMatchObject({ status: "FAILED", attempts: 1, errorCode: "SAFETY" });
  });

  test("429 permanente: tenta 3 vezes e falha; depois a etapa aceita nova geração", async ({ request }) => {
    const { packageId, stage } = await newPackage(request, "[[fake:429]]");
    const { id } = (await (await request202(request, packageId, stage.id, `${TAG}-esgota`)).json()) as { id: string };
    const job = await waitJob(id, (s) => s === "FAILED" || s === "SUCCEEDED");
    expect(job).toMatchObject({ status: "FAILED", attempts: 3, errorCode: "RATE_LIMIT" });
    const again = await request202(request, packageId, stage.id, `${TAG}-esgota-2`);
    expect(again.ok()).toBe(true);
  });

  test("todo público (bebê, criança, adolescente, adulto) gera todas as etapas do seu catálogo, e o conteúdo muda por público", async ({ request }) => {
    const res = await request.post(`${API_URL}/content-studio/packages`, {
      headers: authHeaders(admin),
      data: { theme: `${TAG} públicos`, biblicalReferences: "Jo 10.1-18", canonicalObjective: "Jesus cuida" },
    });
    const pkg = (await res.json()) as { id: string; tracks: Array<{ audience: string; stages: Array<{ id: string; stageType: string }> }> };
    expect(pkg.tracks.map((t) => t.audience).sort()).toEqual(["ADULT", "BABY", "CHILD", "TEEN"]);

    const lessonWords: Record<string, number> = {};
    for (const track of pkg.tracks) {
      // respeita as dependências: gera na ordem do catálogo, esperando cada etapa concluir
      for (const stage of track.stages) {
        const job = (await (await request202(request, pkg.id, stage.id, `${TAG}-${track.audience}-${stage.stageType}`, stage.stageType === "LESSON_VISUALS" ? track.audience : undefined)).json()) as { id: string };
        const done = await waitJob(job.id, (s) => s === "SUCCEEDED" || s === "FAILED");
        expect(done.status, `${track.audience} ${stage.stageType}`).toBe("SUCCEEDED");
        const version = await queryOne<{ structuredContent: string | { story?: Array<{ body: string }> }; generationSnapshot: string | { audience?: string; stageType?: string; promptVersion?: string } }>(
          "SELECT structuredContent, generationSnapshot FROM content_versions WHERE stage_id = ?",
          [stage.id],
        );
        const snap = typeof version?.generationSnapshot === "string" ? JSON.parse(version.generationSnapshot) : version?.generationSnapshot;
        expect(snap).toMatchObject({ audience: track.audience, stageType: stage.stageType, promptVersion: "orfanato.studio.prompts/2.2.0" });
        if (stage.stageType === "LESSON") {
          const content = typeof version?.structuredContent === "string" ? JSON.parse(version.structuredContent) : version?.structuredContent;
          lessonWords[track.audience] = (content?.story ?? []).reduce((n: number, b: { body: string }) => n + b.body.split(" ").length, 0);
        }
      }
    }
    // bebê: narrativa curta; adulto: estudo longo
    expect(lessonWords.BABY).toBeLessThan(lessonWords.CHILD);
    expect(lessonWords.CHILD).toBeLessThan(lessonWords.ADULT);
  });
});
