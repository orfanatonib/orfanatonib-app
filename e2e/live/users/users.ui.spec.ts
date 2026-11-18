import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Usuários — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/usuarios", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/usuarios");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("users-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("users-toolbar")).toBeVisible();
    await expect(page.getByTestId("users-search-input")).toBeVisible();
  });

  test("2. Pesquisa de usuários em tempo real", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/usuarios");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("users-manager")).toBeVisible({
      timeout: 20_000,
    });

    const searchInput = page.getByTestId("users-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    const isTableVisible = await page.getByTestId("users-table").isVisible();
    const isCardsVisible = await page.getByTestId("users-cards").isVisible();
    expect(isTableVisible || isCardsVisible).toBe(true);
  });
});
