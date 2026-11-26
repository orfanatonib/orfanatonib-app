import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Integração — Teste E2E Full-Stack", () => {
  test("1. Autenticação real e carregamento de /area-do-membro/integracoes dentro da casca", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/area-do-membro/integracoes");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("integration-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("member-area-sidebar")).toBeVisible();
    await expect(page.getByTestId("member-nav-integrations")).toHaveAttribute("aria-current", "page");
  });

  test("1b. O endereço antigo /adm/integracoes redireciona para a Área do Membro", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/adm/integracoes");
    await expect(page).toHaveURL(/\/area-do-membro\/integracoes$/);
  });

  test("1c. Membro comum não acessa as Integrações FM", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto("/area-do-membro/integracoes");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("integration-manager")).toHaveCount(0);
  });

  test("2. A rota /integracao (registro de acolhido na integração) não existe mais: mostra a página 404", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/integracao");
    await expect(page.getByTestId("not-found-page")).toBeVisible({ timeout: 20_000 });
  });
});
