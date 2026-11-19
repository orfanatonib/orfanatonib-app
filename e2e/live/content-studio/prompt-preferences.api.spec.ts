import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Orientações de criação (`/content-studio/prompt-preferences/me`): pessoais do administrador, por público e etapa, com controle de versão. */
const BASE = `${API_URL}/content-studio/prompt-preferences/me`;
const TEXT = "Use exemplos do cotidiano de um abrigo e frases curtas.";
let admin = "";
let member = "";
let leader = "";
let userId = "";
let flagBefore = 0;
/** Versão atual da etapa LESSON/TEEN ao longo dos testes (a linha sobrevive entre rodadas). */
let version = 0;

type Item = { stage: string; basePrompt: string; customPrompt: string | null; effectivePrompt: string; lockVersion: number | null; updatedAt: string | null };

const list = async (request: import("@playwright/test").APIRequestContext, audience = "TEEN") =>
  (await (await request.get(`${BASE}?audience=${audience}`, { headers: authHeaders(admin) })).json()) as Item[];

test.describe.serial("Orientações de criação", () => {
  test.beforeAll(async ({ request }) => {
    const session = await loginAs(request, "admin");
    admin = session.accessToken;
    member = (await loginAs(request, "member")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    userId = (await queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", ["e2e.admin@orfanatonib.test"]))!.id;
    flagBefore = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = 'content_studio'"))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/content_studio`, { headers: authHeaders(admin), data: { enabled: true } });
  });
  test.afterAll(async ({ request }) => {
    // Devolve todas as etapas de TEEN ao padrão (a linha fica, com texto nulo).
    for (const item of await list(request)) {
      if (item.customPrompt) await request.post(`${BASE}/reset`, { headers: authHeaders(admin), data: { audience: "TEEN", stage: item.stage, lockVersion: item.lockVersion } });
    }
    await request.patch(`${API_URL}/feature-flags/content_studio`, { headers: authHeaders(admin), data: { enabled: flagBefore === 1 } });
    await closeDb();
  });

  test("permissões: visitante 401, membro e líder 403; público inválido 400; flag desligada 403", async ({ request }) => {
    expect((await request.get(`${BASE}?audience=TEEN`)).status()).toBe(401);
    expect((await request.get(`${BASE}?audience=TEEN`, { headers: authHeaders(member) })).status()).toBe(403);
    expect((await request.get(`${BASE}?audience=TEEN`, { headers: authHeaders(leader) })).status()).toBe(403);
    expect((await request.get(`${BASE}?audience=NAO`, { headers: authHeaders(admin) })).status()).toBe(400);
    expect((await request.get(BASE, { headers: authHeaders(admin) })).status()).toBe(400);
    await request.patch(`${API_URL}/feature-flags/content_studio`, { headers: authHeaders(admin), data: { enabled: false } });
    expect((await request.get(`${BASE}?audience=TEEN`, { headers: authHeaders(admin) })).status()).toBe(403);
    await request.patch(`${API_URL}/feature-flags/content_studio`, { headers: authHeaders(admin), data: { enabled: true } });
  });

  test("lista as 6 etapas com as regras oficiais do público, sem orientação própria", async ({ request }) => {
    const items = await list(request);
    expect(items.map((i) => i.stage)).toEqual(["CANONICAL_BASE", "LESSON", "DISCUSSION", "ACTIVITY", "VISUAL", "FACILITATOR_GUIDANCE"]);
    for (const item of items) {
      expect(item.basePrompt.length).toBeGreaterThan(20);
      expect(item.effectivePrompt.length).toBeGreaterThanOrEqual(item.basePrompt.length);
    }
    // As regras mudam por público: bebê e adulto não recebem o mesmo texto de etapa.
    const baby = await list(request, "BABY");
    expect(baby.find((i) => i.stage === "LESSON")!.basePrompt).not.toBe(items.find((i) => i.stage === "LESSON")!.basePrompt);
  });

  test("salvar: grava, soma às regras na prévia e versiona; aparece só para este público/etapa", async ({ request }) => {
    // A linha sobrevive à restauração (com texto nulo), então uma rodada anterior pode ter deixado uma versão.
    const start = (await list(request)).find((i) => i.stage === "LESSON")!.lockVersion;
    const first = await request.patch(BASE, { headers: authHeaders(admin), data: { audience: "TEEN", stage: "LESSON", customPrompt: `  ${TEXT}  `, lockVersion: start ?? undefined } });
    expect(first.status()).toBe(200);
    const saved = (await first.json()) as Item;
    expect(saved).toMatchObject({ stage: "LESSON", customPrompt: TEXT, lockVersion: (start ?? 0) + 1 });
    const v1 = saved.lockVersion!;
    expect(saved.effectivePrompt).toContain(TEXT);
    expect(saved.effectivePrompt).toContain(saved.basePrompt);
    expect(await countRows("content_prompt_preferences", { user_id: userId, audience: "TEEN", stage_type: "LESSON" })).toBe(1);

    const others = (await list(request)).filter((i) => i.stage !== "LESSON");
    expect(others.every((i) => i.customPrompt === null)).toBe(true);
    expect((await list(request, "CHILD")).every((i) => i.customPrompt === null)).toBe(true);

    const second = await request.patch(BASE, { headers: authHeaders(admin), data: { audience: "TEEN", stage: "LESSON", customPrompt: `${TEXT} Termine com uma oração.`, lockVersion: v1 } });
    version = ((await second.json()) as Item).lockVersion!;
    expect(version).toBe(v1 + 1);
  });

  test("conflito de versão: texto salvo com versão velha ou sem versão ⇒ 409 e nada muda", async ({ request }) => {
    const stale = await request.patch(BASE, {
      headers: authHeaders(admin),
      data: { audience: "TEEN", stage: "LESSON", customPrompt: "Texto com versão velha, deve ser recusado.", lockVersion: version - 1 },
    });
    expect(stale.status()).toBe(409);
    const withoutVersion = await request.patch(BASE, { headers: authHeaders(admin), data: { audience: "TEEN", stage: "LESSON", customPrompt: "Texto sem versão informada, deve ser recusado." } });
    expect(withoutVersion.status()).toBe(409);
    const current = (await list(request)).find((i) => i.stage === "LESSON")!;
    expect(current.customPrompt).toContain("Termine com uma oração.");
    expect(current.lockVersion).toBe(version);
  });

  test("validação: texto curto, grande demais, sensível ou etapa inválida ⇒ 400, sem gravar", async ({ request }) => {
    const send = (data: object) => request.patch(BASE, { headers: authHeaders(admin), data });
    expect((await send({ audience: "TEEN", stage: "ACTIVITY", customPrompt: "curto" })).status()).toBe(400);
    expect((await send({ audience: "TEEN", stage: "ACTIVITY", customPrompt: "a".repeat(6_001) })).status()).toBe(400);
    expect((await send({ audience: "TEEN", stage: "ACTIVITY", customPrompt: "Inclua o CPF e o endereço da criança no texto da atividade" })).status()).toBe(400);
    expect((await send({ audience: "TEEN", stage: "NAO_EXISTE", customPrompt: TEXT })).status()).toBe(400);
    expect((await send({ audience: "TEEN", stage: "ACTIVITY" })).status()).toBe(400);
    expect(await countRows("content_prompt_preferences", { user_id: userId, audience: "TEEN", stage_type: "ACTIVITY" })).toBe(0);
  });

  test("restaurar: volta ao padrão, mantém a linha com a versão seguinte; versão velha ⇒ 409", async ({ request }) => {
    const stale = await request.post(`${BASE}/reset`, { headers: authHeaders(admin), data: { audience: "TEEN", stage: "LESSON", lockVersion: version - 1 } });
    expect(stale.status()).toBe(409);
    const res = await request.post(`${BASE}/reset`, { headers: authHeaders(admin), data: { audience: "TEEN", stage: "LESSON", lockVersion: version } });
    expect(res.status()).toBe(200);
    const reset = (await res.json()) as Item;
    expect(reset).toMatchObject({ customPrompt: null, lockVersion: version + 1 });
    expect(reset.effectivePrompt).toBe(reset.basePrompt);
    const row = await queryOne<{ custom_prompt: string | null; lock_version: number }>(
      "SELECT custom_prompt, lock_version FROM content_prompt_preferences WHERE user_id = ? AND audience = 'TEEN' AND stage_type = 'LESSON'",
      [userId],
    );
    expect(row).toMatchObject({ custom_prompt: null, lock_version: version + 1 });
  });
});
