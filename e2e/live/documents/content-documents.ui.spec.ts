import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Documentos — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/documentos", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/documentos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("documents-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("documents-toolbar")).toBeVisible();
    await expect(page.getByTestId("documents-search-input")).toBeVisible();
  });

  test("2. Filtragem e busca na lista de documentos em tempo real", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/documentos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("documents-manager")).toBeVisible({
      timeout: 20_000,
    });

    const searchInput = page.getByTestId("documents-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    const isTableVisible = await page.getByTestId("documents-table").isVisible();
    const isCardsVisible = await page.getByTestId("documents-cards").isVisible();
    expect(isTableVisible || isCardsVisible).toBe(true);
  });
});
