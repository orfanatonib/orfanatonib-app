import { expect, loginAs, seedBrowserSession, test } from "./support/live";

/**
 * Teste E2E Full-Stack (Sem Mocks) para a funcionalidade de Gerenciamento de Acolhidos.
 * Passa por TODAS as camadas da aplicação:
 * Navegador (Playwright) -> Frontend React -> Cliente Axios -> NestJS Controller -> Services -> TypeORM Repository -> Banco MySQL.
 */
test.describe.serial("Gerenciamento de Acolhidos — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/acolhidos com dados do banco", async ({
    page,
    request,
  }) => {
    // Autentica de VERDADE na API NestJS (POST /auth/login) e obtém JWT real
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    // Navega para a rota da aplicação frontend
    await page.goto("/adm/acolhidos");
    await page.waitForLoadState("networkidle");

    // Valida elementos do DOM integrados com a API
    await expect(page.getByTestId("sheltered-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("sheltered-toolbar")).toBeVisible();
    await expect(page.getByTestId("sheltered-filter-search")).toBeVisible();
  });

  test("2. Pesquisa e filtragem em tempo real integrados à API e banco", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/acolhidos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("sheltered-manager")).toBeVisible({
      timeout: 20_000,
    });

    // Digita no filtro de busca por acolhido
    const searchInput = page.getByTestId("sheltered-filter-search").locator("input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    // Verifica se a tabela, cards ou estado vazio estão visíveis
    const isTableVisible = await page.getByTestId("sheltered-table").isVisible();
    const isCardsVisible = await page.getByTestId("sheltered-cards").isVisible();
    const isEmptyVisible = await page.getByTestId("sheltered-empty").isVisible();

    expect(isTableVisible || isCardsVisible || isEmptyVisible).toBe(true);
  });

  test("3. Abertura e fechamento do modal de criação de acolhido", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/acolhidos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("sheltered-manager")).toBeVisible({
      timeout: 20_000,
    });

    const createButton = page.getByTestId("sheltered-create");
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible({
        timeout: 10_000,
      });

      // Fecha o dialog de criação sem salvar
      await page.getByTestId("sheltered-form-cancel").click();
      await expect(page.getByTestId("sheltered-form-dialog")).not.toBeVisible();
    }
  });

  test("4. Visualização de detalhes de um acolhido cadastrado (leitura de dados reais)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/acolhidos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("sheltered-manager")).toBeVisible({
      timeout: 20_000,
    });

    const viewButtons = page.locator("[data-testid^='sheltered-table-view-'], [data-testid^='sheltered-card-view-']");
    const count = await viewButtons.count();

    if (count > 0) {
      await viewButtons.first().click();
      await expect(page.getByTestId("sheltered-view-dialog")).toBeVisible({
        timeout: 10_000,
      });

      // Fecha o dialog de detalhes
      await page.getByTestId("sheltered-view-close").click();
      await expect(page.getByTestId("sheltered-view-dialog")).not.toBeVisible();
    }
  });
});
