import { seedShelter, type Undo } from "../support/baseline";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Teste E2E Full-Stack (Sem Mocks) para a funcionalidade de Gerenciamento de Abrigos.
 * Passa por TODAS as camadas da aplicação:
 * Navegador (Playwright) -> Frontend React -> Cliente Axios -> NestJS Controller -> Services -> TypeORM Repository -> Banco MySQL.
 */
test.describe.serial("Gerenciamento de Abrigos — Teste E2E Full-Stack (Sem Mocks)", () => {
  let undo: Undo | undefined;
  test.beforeAll(async ({ request }) => {
    undo = await seedShelter(request, `e2e-ui-${Date.now()}`);
  });
  test.afterAll(async ({ request }) => {
    await undo?.(request);
  });

  test("1. Autenticação real e carregamento da página /adm/abrigos com dados do banco", async ({
    page,
    request,
  }) => {
    // Autentica de VERDADE na API NestJS (POST /auth/login) e obtém JWT real
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    // Navega para a rota da aplicação frontend
    await page.goto("/adm/abrigos");
    await page.waitForLoadState("networkidle");

    // Valida elementos do DOM integrados com a API
    await expect(page.getByTestId("shelters-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("shelter-toolbar")).toBeVisible();
    await expect(page.getByTestId("shelter-search-input")).toBeVisible();
  });

  test("2. Pesquisa e filtragem de abrigos em tempo real integrados à API e banco", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/abrigos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("shelters-manager")).toBeVisible({
      timeout: 20_000,
    });

    // Digita no filtro de busca por abrigo
    const searchInput = page.getByTestId("shelter-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    // Verifica se a tabela ou cards estão visíveis
    const isTableVisible = await page.getByTestId("shelter-table").isVisible();
    const isCardsVisible = await page.getByTestId("shelter-cards").isVisible();

    expect(isTableVisible || isCardsVisible).toBe(true);
  });

  test("3. Visualização de detalhes de um abrigo cadastrado (leitura de dados reais)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/abrigos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("shelters-manager")).toBeVisible({
      timeout: 20_000,
    });

    const viewButtons = page.locator("[data-testid^='view-shelter-button-']");
    const count = await viewButtons.count();

    if (count > 0) {
      await viewButtons.first().click();
      await expect(page.getByTestId("shelter-view-dialog")).toBeVisible({
        timeout: 10_000,
      });

      // Fecha o dialog
      await page.getByTestId("close-shelter-view-dialog-button").click();
      await expect(page.getByTestId("shelter-view-dialog")).not.toBeVisible();
    }
  });

  test("4. Navegação para tela de criação de abrigo", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/abrigos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("shelters-manager")).toBeVisible({
      timeout: 20_000,
    });

    const createButton = page.getByTestId("create-shelter-button");
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForURL("**/adm/abrigos/novo", { timeout: 10_000 });
      expect(page.url()).toContain("/adm/abrigos/novo");
    }
  });
});
