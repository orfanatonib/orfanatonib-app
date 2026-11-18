import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Páginas de Ideias — Teste E2E Full-Stack", () => {
  test("1. Autenticação e acesso a /adm/paginas-ideias", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/paginas-ideias");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("ideas-pages-manager")).toBeVisible({
      timeout: 20_000,
    });
  });
});
