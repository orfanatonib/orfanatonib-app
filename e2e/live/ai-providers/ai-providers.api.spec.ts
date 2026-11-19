import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Painel de provedores de IA (ChatGPT/OpenAI e Gemini), igual ao do Clubinho: só admin, atrás das flags
 * `content_studio` + `content_studio_provider_admin`; a chave é guardada CIFRADA e nunca volta em nenhuma resposta.
 * A chave usada aqui é falsa (não existe na OpenAI) e é removida ao final.
 */
const BASE = `${API_URL}/api/v1/lessons/providers`;
const FLAGS = ["content_studio", "content_studio_provider_admin"] as const;
/** O PUT de `settings` é o contrato da tela: provedor ativo + os dois blocos (campos omitidos mantêm o valor salvo). */
const settingsBody = (openai: object = {}, gemini: object = {}, llmProvider = "openai") => ({ llmProvider, openai, gemini });
const FAKE_KEY = "sk-e2e-chave-falsa-para-teste-123456";

test.describe.serial("Provedores de IA — painel", () => {
  let admin: string;
  let leader: string;
  let member: string;
  const before: Record<string, number> = {};
  let geminiModelBefore = "";

  const setFlags = async (request: import("@playwright/test").APIRequestContext, enabled: boolean | "restore") => {
    for (const key of FLAGS) {
      await request.patch(`${API_URL}/feature-flags/${key}`, {
        headers: authHeaders(admin),
        data: { enabled: enabled === "restore" ? before[key] === 1 : enabled },
      });
    }
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    for (const key of FLAGS) {
      before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    }
    await setFlags(request, true);
    const current = (await (await request.get(`${BASE}/settings`, { headers: authHeaders(admin) })).json()) as {
      gemini: { generalModel: string };
    };
    geminiModelBefore = current.gemini.generalModel;
  });

  test.afterAll(async ({ request }) => {
    await request.put(`${BASE}/openai/settings`, { headers: authHeaders(admin), data: { apiKey: "" } });
    // O teste troca o modelo do Gemini: devolve o que estava salvo antes.
    await request.put(`${BASE}/gemini/settings`, { headers: authHeaders(admin), data: { generalModel: geminiModelBefore } });
    await setFlags(request, "restore");
    await closeDb();
  });

  for (const path of ["settings", "openai/models", "gemini/models"]) {
    test(`GET ${path}: visitante 401, membro 403, líder 403, admin 200`, async ({ request }) => {
      expect((await request.get(`${BASE}/${path}`)).status()).toBe(401);
      expect((await request.get(`${BASE}/${path}`, { headers: authHeaders(member) })).status()).toBe(403);
      expect((await request.get(`${BASE}/${path}`, { headers: authHeaders(leader) })).status()).toBe(403);
      expect((await request.get(`${BASE}/${path}`, { headers: authHeaders(admin) })).status()).toBe(200);
    });
  }

  test("PUT settings: visitante 401, membro/líder 403", async ({ request }) => {
    const data = settingsBody();
    expect((await request.put(`${BASE}/settings`, { data })).status()).toBe(401);
    expect((await request.put(`${BASE}/settings`, { headers: authHeaders(member), data })).status()).toBe(403);
    expect((await request.put(`${BASE}/settings`, { headers: authHeaders(leader), data })).status()).toBe(403);
  });

  test("salvar a chave: a resposta só diz que existe e NUNCA devolve a chave (nem cifrada)", async ({ request }) => {
    const res = await request.put(`${BASE}/settings`, { headers: authHeaders(admin), data: settingsBody({ apiKey: FAKE_KEY }) });
    expect(res.status(), await res.text()).toBe(200);
    const saved = await res.text();
    expect(saved).not.toContain(FAKE_KEY);
    expect(JSON.parse(saved).openai.hasApiKey).toBe(true);

    // A cifra AES-256-GCM (`enc:v2:`) exige AI_PROVIDER_SETTINGS_ENCRYPTION_KEY; no ambiente local sem ela o
    // valor fica em texto puro (e a API recusa salvar fora do local sem a chave). A cifra é coberta no Jest
    // (`ai-provider-settings.spec.ts`); aqui o que importa é o que sai pela API.
    const row = await queryOne<{ settings: string }>("SELECT settings FROM ai_provider_settings WHERE provider = 'openai'");
    expect(row?.settings).toBeTruthy();

    const read = await (await request.get(`${BASE}/settings`, { headers: authHeaders(admin) })).text();
    expect(read).not.toContain(FAKE_KEY);
    expect(read).not.toContain("enc:v");
  });

  test("ChatGPT e Gemini: trocar o modelo padrão persiste sem apagar a chave (apiKey omitida mantém)", async ({ request }) => {
    const res = await request.put(`${BASE}/settings`, {
      headers: authHeaders(admin),
      data: settingsBody({ generalModel: "gpt-4o-mini" }),
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as { openai: { generalModel: string; hasApiKey: boolean } };
    expect(body.openai.generalModel).toBe("gpt-4o-mini");
    expect(body.openai.hasApiKey).toBe(true);

    const gem = await request.put(`${BASE}/settings`, {
      headers: authHeaders(admin),
      data: settingsBody({}, { generalModel: "gemini-2.0-flash" }),
    });
    expect(gem.status(), await gem.text()).toBe(200);
  });

  test("chave já cifrada (enc:) é recusada (422) e provedor inválido é 400", async ({ request }) => {
    const enc = await request.put(`${BASE}/settings`, {
      headers: authHeaders(admin),
      data: settingsBody({ apiKey: "enc:v2:aaa:bbb:ccc:ddd:eee" }),
    });
    expect(enc.status()).toBe(422);
    const bad = await request.put(`${BASE}/settings`, { headers: authHeaders(admin), data: settingsBody({}, {}, "outro") });
    expect(bad.status()).toBe(400);
  });

  test("não dá para ativar um provedor sem chave; apiKey vazia no bloco do provedor remove a chave", async ({ request }) => {
    // Pelo PUT geral, o provedor ATIVO precisa ter chave (regra do painel).
    const refused = await request.put(`${BASE}/settings`, { headers: authHeaders(admin), data: settingsBody({ apiKey: "" }) });
    expect(refused.status()).toBe(422);
    // Remover a chave é pelo bloco do próprio provedor.
    const res = await request.put(`${BASE}/openai/settings`, { headers: authHeaders(admin), data: { apiKey: "" } });
    expect(res.status(), await res.text()).toBe(200);
    expect(((await res.json()) as { hasApiKey: boolean }).hasApiKey).toBe(false);
  });

  test("flags desligadas ⇒ 403 FEATURE_DISABLED (leitura e escrita)", async ({ request }) => {
    await setFlags(request, false);
    const get = await request.get(`${BASE}/settings`, { headers: authHeaders(admin) });
    const put = await request.put(`${BASE}/settings`, { headers: authHeaders(admin), data: settingsBody() });
    expect(get.status()).toBe(403);
    expect(put.status()).toBe(403);
    expect(JSON.stringify(await put.json())).toContain("FEATURE_DISABLED");
    await setFlags(request, true);
  });

  for (const provider of ["openai", "gemini"]) {
    test(`POST ${provider}/health: só admin; sem chave devolve NO_KEY sem vazar nada`, async ({ request }) => {
      const url = `${BASE}/${provider}/health`;
      expect((await request.post(url)).status()).toBe(401);
      expect((await request.post(url, { headers: authHeaders(member) })).status()).toBe(403);
      expect((await request.post(url, { headers: authHeaders(leader) })).status()).toBe(403);
      if (provider === "openai") await request.put(`${BASE}/openai/settings`, { headers: authHeaders(admin), data: { apiKey: "" } });
      const res = await request.post(url, { headers: authHeaders(admin) });
      expect(res.status()).toBe(201);
      const body = (await res.json()) as { provider: string; ok: boolean; status: string; message: string; checkedAt: string };
      expect(body.provider).toBe(provider);
      if (provider === "openai") expect(body).toMatchObject({ ok: false, status: "NO_KEY" });
      expect(typeof body.message).toBe("string");
      expect(Number.isNaN(Date.parse(body.checkedAt))).toBe(false);
      expect(JSON.stringify(body)).not.toContain(FAKE_KEY);
    });
  }

  test("chave inválida salva ⇒ health FAILED com motivo, sem vazar a chave", async ({ request }) => {
    await request.put(`${BASE}/settings`, { headers: authHeaders(admin), data: settingsBody({ apiKey: FAKE_KEY }) });
    const res = await request.post(`${BASE}/openai/health`, { headers: authHeaders(admin) });
    const body = (await res.json()) as { ok: boolean; status: string; message: string };
    expect(body.ok).toBe(false);
    expect(["FAILED", "MODEL_MISSING"]).toContain(body.status);
    expect(JSON.stringify(body)).not.toContain(FAKE_KEY);
    await request.put(`${BASE}/openai/settings`, { headers: authHeaders(admin), data: { apiKey: "" } });
  });

  test("GET ai-management/usage: só admin com a flag; valida a janela e devolve totais", async ({ request }) => {
    const url = `${API_URL}/ai-management/usage`;
    expect((await request.get(url)).status()).toBe(401);
    expect((await request.get(url, { headers: authHeaders(member) })).status()).toBe(403);
    expect((await request.get(`${url}?days=0`, { headers: authHeaders(admin) })).status()).toBe(400);
    expect((await request.get(`${url}?days=9999`, { headers: authHeaders(admin) })).status()).toBe(400);
    const ok = await request.get(`${url}?days=30`, { headers: authHeaders(admin) });
    expect(ok.status()).toBe(200);
    const body = (await ok.json()) as { days: number; generations: number; totalTokens: number; byModel: unknown[] };
    expect(body.days).toBe(30);
    expect(body.byModel.length >= 0 && body.generations >= 0 && body.totalTokens >= 0).toBe(true);
    await setFlags(request, false);
    expect((await request.get(url, { headers: authHeaders(admin) })).status()).toBe(403);
    await setFlags(request, true);
  });
});
