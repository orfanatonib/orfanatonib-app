import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Páginas de Imagens e Fotos de Abrigos — Teste E2E Full-Stack", () => {
  test("1. Autenticação e acesso a /adm/paginas-fotos", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/paginas-fotos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("image-pages-manager")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("2. Autenticação e acesso a /adm/fotos-abrigos", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/fotos-abrigos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("image-sections-manager")).toBeVisible({
      timeout: 20_000,
    });
  });
});
