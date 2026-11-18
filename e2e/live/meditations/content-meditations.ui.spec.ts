import { seedMeditation, type Undo } from "../support/baseline";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Meditações — Teste E2E Full-Stack (Sem Mocks)", () => {
  let undo: Undo | undefined;
  test.beforeAll(async ({ request }) => {
    undo = await seedMeditation(request, `e2e-ui-${Date.now()}`);
  });
  test.afterAll(async ({ request }) => {
    await undo?.(request);
  });

  test("1. Autenticação real e carregamento da página /adm/meditacoes", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/meditacoes");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("meditations-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("meditations-toolbar")).toBeVisible();
    await expect(page.getByTestId("meditations-search-input")).toBeVisible();
  });

  test("2. Filtragem de meditações na interface", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/meditacoes");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("meditations-manager")).toBeVisible({
      timeout: 20_000,
    });

    const searchInput = page.getByTestId("meditations-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    const isTableVisible = await page.getByTestId("meditations-table").isVisible();
    const isCardsVisible = await page.getByTestId("meditations-cards").isVisible();
    expect(isTableVisible || isCardsVisible).toBe(true);
  });
});
