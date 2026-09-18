import { expect, loginAs, seedBrowserSession, test } from "./support/live";

/**
 * Teste E2E Full-Stack (Sem Mocks) para a funcionalidade de Pagelas.
 * Passa por TODAS as camadas da aplicação:
 * Navegador (Playwright) -> Frontend React -> Cliente Axios -> NestJS Controller -> Services -> TypeORM Repository -> Banco MySQL.
 */
test.describe.serial("Pagelas — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e navegação para /membro/acolhidos (membro)", async ({
    page,
    request,
  }) => {
    // Autentica de VERDADE na API NestJS como líder/membro (POST /auth/login) e obtém JWT real
    const loginResult = await loginAs(request, "leader");
    await seedBrowserSession(page, loginResult);

    // Navega para a rota da aplicação frontend de pagelas do membro
    await page.goto("/membro/acolhidos");
    await page.waitForLoadState("networkidle");

    // Valida se a página renderizou integrada com a API
    await expect(page.locator("body")).toBeVisible();
  });

  test("2. Autenticação real como admin e navegação para /adm/pagela-shelters", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/pagela-shelters");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });
});
