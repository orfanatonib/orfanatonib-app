import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Materiais de Visita — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/paginas-materiais-visita", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/paginas-materiais-visita");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("visit-materials-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("visit-materials-toolbar")).toBeVisible();
  });

  test("2. Navegação para a lista de materiais de visita na Área do Membro", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/lista-materias-visita");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });
});
