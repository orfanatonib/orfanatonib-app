import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Integração — Teste E2E Full-Stack", () => {
  test("1. Autenticação real e carregamento da página /adm/integracoes", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/integracoes");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("integration-manager")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("2. Navegação para página de integração de acolhidos na Área do Membro (/integracao)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/integracao");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });
});
