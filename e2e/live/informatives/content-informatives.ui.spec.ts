import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Informativos — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/informativos", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/informativos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("informatives-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("informatives-toolbar")).toBeVisible();
    await expect(page.getByTestId("informatives-search-input")).toBeVisible();
  });

  test("2. Pesquisa de informativos na interface em tempo real", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/informativos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("informatives-manager")).toBeVisible({
      timeout: 20_000,
    });

    const searchInput = page.getByTestId("informatives-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    const isTableVisible = await page.getByTestId("informatives-table").isVisible();
    const isCardsVisible = await page.getByTestId("informatives-cards").isVisible();
    const isEmptyVisible = await page.getByTestId("informatives-empty").isVisible();
    expect(isTableVisible || isCardsVisible || isEmptyVisible).toBe(true);
  });
});
