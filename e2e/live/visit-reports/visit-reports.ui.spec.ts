import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Relatórios de Visita — Teste E2E Full-Stack", () => {
  test("1. Autenticação real e carregamento da página /adm/relatorios-visita", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/relatorios-visita");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("visit-reports-manager")).toBeVisible({
      timeout: 20_000,
    });
  });

  test("2. Navegação para a página de pendências de relatórios de visita (/adm/relatorios/pendencias)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/relatorios/pendencias");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });
});
