import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Bootstrap/config (plano 01): `/`, `/health` (liveness) e `/health/ready`
 * (readiness com `SELECT 1`) são públicos e SEM efeito colateral: respondem o
 * mesmo para qualquer perfil, não exigem sessão e não gravam nada. O
 * `/health/detailed` deixou de existir (404).
 */
test.describe("Bootstrap/config — API", () => {
  test("[bootstrap-config.get.health-detailed#removido] /health/detailed não existe mais (404)", async ({
    request,
  }) => {
    expect((await request.get(`${API_URL}/health/detailed`)).status()).toBe(404);
  });

  test("[bootstrap-config.get.raiz#feliz] GET /: visitante recebe 200 sem efeito colateral", async ({ request }) => {
    const res = await request.get(`${API_URL}/`);
    expect(res.status()).toBe(200);
    expect((await res.text()).length).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.raiz#perfil-anonimo] GET /: visitante recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/`);
    expect(res.status()).toBe(200);
    expect((await res.text()).length).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.raiz#perfil-membro] GET /: membro recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const session = await loginAs(request, "member");
    const res = await request.get(`${API_URL}/`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    expect((await res.text()).length).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.raiz#perfil-lider] GET /: líder recebe 200 sem efeito colateral", async ({ request }) => {
    const session = await loginAs(request, "leader");
    const res = await request.get(`${API_URL}/`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    expect((await res.text()).length).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.raiz#perfil-admin] GET /: admin recebe 200 sem efeito colateral", async ({ request }) => {
    const session = await loginAs(request, "admin");
    const res = await request.get(`${API_URL}/`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    expect((await res.text()).length).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health#feliz] GET /health (liveness): visitante recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/health`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; uptime: number };
    expect(body.status).toBe("ok");
    expect(body.uptime).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health#perfil-anonimo] GET /health (liveness): visitante recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/health`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; uptime: number };
    expect(body.status).toBe("ok");
    expect(body.uptime).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health#perfil-membro] GET /health (liveness): membro recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const session = await loginAs(request, "member");
    const res = await request.get(`${API_URL}/health`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; uptime: number };
    expect(body.status).toBe("ok");
    expect(body.uptime).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health#perfil-lider] GET /health (liveness): líder recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const session = await loginAs(request, "leader");
    const res = await request.get(`${API_URL}/health`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; uptime: number };
    expect(body.status).toBe("ok");
    expect(body.uptime).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health#perfil-admin] GET /health (liveness): admin recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const session = await loginAs(request, "admin");
    const res = await request.get(`${API_URL}/health`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; uptime: number };
    expect(body.status).toBe("ok");
    expect(body.uptime).toBeGreaterThan(0);
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health-ready#feliz] GET /health/ready (readiness, SELECT 1): visitante recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/health/ready`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; checks?: { database?: string } };
    expect(body.status).toBe("ok");
    expect(body.checks?.database).toBe("ok");
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health-ready#perfil-anonimo] GET /health/ready (readiness, SELECT 1): visitante recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/health/ready`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; checks?: { database?: string } };
    expect(body.status).toBe("ok");
    expect(body.checks?.database).toBe("ok");
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health-ready#perfil-membro] GET /health/ready (readiness, SELECT 1): membro recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const session = await loginAs(request, "member");
    const res = await request.get(`${API_URL}/health/ready`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; checks?: { database?: string } };
    expect(body.status).toBe("ok");
    expect(body.checks?.database).toBe("ok");
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health-ready#perfil-lider] GET /health/ready (readiness, SELECT 1): líder recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const session = await loginAs(request, "leader");
    const res = await request.get(`${API_URL}/health/ready`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; checks?: { database?: string } };
    expect(body.status).toBe("ok");
    expect(body.checks?.database).toBe("ok");
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("[bootstrap-config.get.health-ready#perfil-admin] GET /health/ready (readiness, SELECT 1): admin recebe 200 sem efeito colateral", async ({
    request,
  }) => {
    const session = await loginAs(request, "admin");
    const res = await request.get(`${API_URL}/health/ready`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { status: string; checks?: { database?: string } };
    expect(body.status).toBe("ok");
    expect(body.checks?.database).toBe("ok");
    expect(res.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
