import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Contrato de erro da API (plano 04), com erros REAIS (entrada inválida, perfil
 * sem permissão, recurso inexistente — nunca simulados): o corpo traz
 * `requestId` igual ao cabeçalho `X-Request-Id`, categoria, e NUNCA stack,
 * SQL nem a query string.
 */
type ErrorBody = {
  statusCode: number;
  message: string | string[];
  category: string;
  requestId: string;
  path: string;
  error: string;
  stack?: unknown;
};

const UUID_RE = /^[0-9a-f-]{36}$/;
const NO_LEAK = ["stack", "SELECT ", "typeorm", "node_modules", "at Object."];

async function assertContract(res: import("@playwright/test").APIResponse, status: number, category: string) {
  expect(res.status()).toBe(status);
  const body = (await res.json()) as ErrorBody;
  const header = res.headers()["x-request-id"];
  expect(header).toMatch(UUID_RE);
  expect(body.requestId, "requestId do corpo = cabeçalho").toBe(header);
  expect(body.statusCode).toBe(status);
  expect(body.category).toBe(category);
  expect(body.path.includes("?"), "path sem query string").toBe(false);
  expect(body).not.toHaveProperty("stack");
  const raw = JSON.stringify(body);
  for (const forbidden of NO_LEAK) expect(raw).not.toContain(forbidden);
  return body;
}

test.describe("Erros da API — contrato", () => {
  test("[http-errors-observability.post.auth-login#validacao] corpo inválido: 400 RULE com requestId do cabeçalho e sem a query", async ({
    request,
  }) => {
    const res = await request.post(`${API_URL}/auth/login?token=nao-pode-aparecer`, { data: { email: "nao-e-email" } });
    const body = await assertContract(res, 400, "RULE");
    expect(JSON.stringify(body)).not.toContain("nao-pode-aparecer");
  });

  test("[http-errors-observability.get.users#perfil-membro] membro em rota de admin: 403 sem detalhe interno", async ({
    request,
  }) => {
    const member = await loginAs(request, "member");
    const res = await request.get(`${API_URL}/users`, { headers: authHeaders(member.accessToken) });
    await assertContract(res, 403, "BUSINESS");
  });

  test("[http-errors-observability.get.users-id#nao-encontrado] recurso inexistente: 404 BUSINESS", async ({
    request,
  }) => {
    const admin = await loginAs(request, "admin");
    const res = await request.get(`${API_URL}/users/3f2504e0-4f89-41d3-9a0c-0305e82c3301`, {
      headers: authHeaders(admin.accessToken),
    });
    await assertContract(res, 404, "BUSINESS");
  });

  test("[http-errors-observability.get.rota-inexistente#nao-encontrado] rota que não existe: 404 com requestId", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/rota-que-nao-existe?x=1`);
    await assertContract(res, 404, "BUSINESS");
  });

  test("[http-errors-observability.get.users#perfil-anonimo] sem sessão: 401 com requestId", async ({ request }) => {
    const res = await request.get(`${API_URL}/users`);
    await assertContract(res, 401, "BUSINESS");
  });

  test("[http-errors-observability.get.requestid#servidor-ignora-cliente] X-Request-Id enviado pelo cliente é ignorado (o servidor gera o seu)", async ({
    request,
  }) => {
    const forged = "00000000-0000-4000-8000-000000000000";
    const res = await request.get(`${API_URL}/rota-que-nao-existe`, { headers: { "X-Request-Id": forged } });
    const body = (await res.json()) as ErrorBody;
    expect(body.requestId).not.toBe(forged);
    expect(res.headers()["x-request-id"]).toBe(body.requestId);
  });
});
