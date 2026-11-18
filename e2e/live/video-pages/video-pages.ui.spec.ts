import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Páginas de Vídeos — Teste E2E Full-Stack", () => {
  test("1. Autenticação e acesso a /adm/paginas-videos", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/paginas-videos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("video-pages-manager")).toBeVisible({
      timeout: 20_000,
    });
  });
});
