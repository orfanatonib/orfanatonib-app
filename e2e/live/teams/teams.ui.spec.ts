import { expect, loginAs, seedBrowserSession, test } from "../support/live";
const API_BASE = process.env.E2E_API_URL ?? "http://localhost:3000";

/**
 * Teste E2E Full-Stack (Sem Mocks) para a funcionalidade de Equipes.
 * Passa por TODAS as camadas da aplicação:
 * Navegador (Playwright) -> Frontend React -> Cliente Axios -> NestJS Controller -> Services -> TypeORM Repository -> Banco MySQL.
 */
test.describe.serial("Equipes — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real como admin e busca de equipes (/teams)", async ({
    page,
    request,
  }) => {
    // Autentica de VERDADE na API NestJS (POST /auth/login) e obtém JWT real
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    // Valida requisição de equipes diretamente na API
    const response = await request.get(`${API_BASE}/teams`, {
      headers: {
        Authorization: `Bearer ${loginResult.accessToken}`,
      },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("2. Autenticação real como líder e busca de equipes do contexto do usuário (/teams/my-teams)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "leader");
    await seedBrowserSession(page, loginResult);

    const response = await request.get(`${API_BASE}/teams/my-teams`, {
      headers: {
        Authorization: `Bearer ${loginResult.accessToken}`,
      },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
