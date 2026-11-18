import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Perfil de Usuário — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e navegação para /perfil", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/perfil");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });

  test("2. Autenticação e acesso ao gerenciador de perfis (/adm/perfis)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/perfis");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("profiles-manager")).toBeVisible({
      timeout: 20_000,
    });
  });
});
