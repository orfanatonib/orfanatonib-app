import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Prévia de e-mails (plano 10): admin vê, os demais perfis não, chave inexistente é 404.
 * A prévia só renderiza com dados de exemplo (não envia nada, não grava nada) e por isso
 * NÃO tem flag própria — o interruptor dos envios é `email_*`/`email_delivery`.
 */
test.describe.serial("E-mails — prévia", () => {
  let tokens: { admin: string; leader: string; member: string };
  let KEY = "";

  test.beforeAll(async ({ request }) => {
    tokens = {
      admin: (await loginAs(request, "admin")).accessToken,
      leader: (await loginAs(request, "leader")).accessToken,
      member: (await loginAs(request, "member")).accessToken,
    };
    const list = await request.get(`${API_URL}/email-previews`, { headers: authHeaders(tokens.admin) });
    const body = (await list.json()) as { templates: Array<{ key: string }> };
    KEY = body.templates[0].key;
    expect(KEY).toBeTruthy();
  });

  test("[email-notification.get.email-previews#perfil-anonimo] GET /email-previews como visitante: 401", async ({ request }) => {
    const res = await request.get(`${API_URL}/email-previews`);
    expect(res.status()).toBe(401);
  });

  test("[email-notification.get.email-previews#perfil-membro] GET /email-previews como membro: 403", async ({ request }) => {
    const res = await request.get(`${API_URL}/email-previews`, { headers: authHeaders(tokens.member) });
    expect(res.status()).toBe(403);
  });

  test("[email-notification.get.email-previews#perfil-lider] GET /email-previews como líder: 403", async ({ request }) => {
    const res = await request.get(`${API_URL}/email-previews`, { headers: authHeaders(tokens.leader) });
    expect(res.status()).toBe(403);
  });

  test("[email-notification.get.email-previews#perfil-admin] GET /email-previews como admin: 200 (lista)", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews`, { headers: authHeaders(tokens.admin) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { templates: unknown[] };
    expect(body.templates.length).toBeGreaterThan(0);
  });

  test("[email-notification.get.email-previews#feliz] GET /email-previews como admin: 200 (lista)", async ({ request }) => {
    const res = await request.get(`${API_URL}/email-previews`, { headers: authHeaders(tokens.admin) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { templates: unknown[] };
    expect(body.templates.length).toBeGreaterThan(0);
  });

  test("[email-notification.get.email-previews-key#perfil-anonimo] GET /email-previews/${KEY} como visitante: 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}`);
    expect(res.status()).toBe(401);
  });

  test("[email-notification.get.email-previews-key#perfil-membro] GET /email-previews/${KEY} como membro: 403", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}`, { headers: authHeaders(tokens.member) });
    expect(res.status()).toBe(403);
  });

  test("[email-notification.get.email-previews-key#perfil-lider] GET /email-previews/${KEY} como líder: 403", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}`, { headers: authHeaders(tokens.leader) });
    expect(res.status()).toBe(403);
  });

  test("[email-notification.get.email-previews-key#perfil-admin] GET /email-previews/${KEY} como admin: 200 (HTML)", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}`, { headers: authHeaders(tokens.admin) });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/html");
    expect(await res.text()).toContain("<html");
  });

  test("[email-notification.get.email-previews-key#feliz] GET /email-previews/${KEY} como admin: 200 (HTML)", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}`, { headers: authHeaders(tokens.admin) });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/html");
    expect(await res.text()).toContain("<html");
  });

  test("[email-notification.get.email-previews-key#nao-encontrado] GET /email-previews/chave-que-nao-existe (chave inexistente): 404", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/chave-que-nao-existe`, { headers: authHeaders(tokens.admin) });
    expect(res.status()).toBe(404);
  });

  test("[email-notification.get.email-previews-key-text#perfil-anonimo] GET /email-previews/${KEY}/text como visitante: 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}/text`);
    expect(res.status()).toBe(401);
  });

  test("[email-notification.get.email-previews-key-text#perfil-membro] GET /email-previews/${KEY}/text como membro: 403", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}/text`, { headers: authHeaders(tokens.member) });
    expect(res.status()).toBe(403);
  });

  test("[email-notification.get.email-previews-key-text#perfil-lider] GET /email-previews/${KEY}/text como líder: 403", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}/text`, { headers: authHeaders(tokens.leader) });
    expect(res.status()).toBe(403);
  });

  test("[email-notification.get.email-previews-key-text#perfil-admin] GET /email-previews/${KEY}/text como admin: 200 (texto)", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}/text`, { headers: authHeaders(tokens.admin) });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");
    expect((await res.text()).length).toBeGreaterThan(10);
  });

  test("[email-notification.get.email-previews-key-text#feliz] GET /email-previews/${KEY}/text como admin: 200 (texto)", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/${KEY}/text`, { headers: authHeaders(tokens.admin) });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");
    expect((await res.text()).length).toBeGreaterThan(10);
  });

  test("[email-notification.get.email-previews-key-text#nao-encontrado] GET /email-previews/chave-que-nao-existe/text (chave inexistente): 404", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/email-previews/chave-que-nao-existe/text`, { headers: authHeaders(tokens.admin) });
    expect(res.status()).toBe(404);
  });
});
