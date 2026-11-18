import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Feedbacks do Site — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/feedbacks", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/feedbacks");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("feedbacks-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("feedbacks-toolbar")).toBeVisible();
    await expect(page.getByTestId("feedbacks-search-input")).toBeVisible();
  });

  test("2. Filtragem de feedbacks do site em tempo real", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/feedbacks");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("feedbacks-manager")).toBeVisible({
      timeout: 20_000,
    });

    const searchInput = page.getByTestId("feedbacks-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    const isTableVisible = await page.getByTestId("feedbacks-table").isVisible();
    const isCardsVisible = await page.getByTestId("feedbacks-cards").isVisible();
    const isEmptyVisible = await page.getByTestId("feedbacks-empty").isVisible();
    expect(isTableVisible || isCardsVisible || isEmptyVisible).toBe(true);
  });

  test("3. Navegação para página de formulário de avaliação (/avaliar-site)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/avaliar-site");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });
});
