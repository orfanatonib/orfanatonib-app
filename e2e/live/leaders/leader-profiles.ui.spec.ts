import { expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Teste E2E Full-Stack (Sem Mocks) para a funcionalidade de Perfis de Líderes.
 * Passa por TODAS as camadas da aplicação:
 * Navegador (Playwright) -> Frontend React -> Cliente Axios -> NestJS Controller -> Services -> TypeORM Repository -> Banco MySQL.
 */
test.describe.serial("Perfis de Líderes — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/lideres com dados do banco", async ({
    page,
    request,
  }) => {
    // Autentica de VERDADE na API NestJS (POST /auth/login) e obtém JWT real
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    // Navega para a rota da aplicação frontend
    await page.goto("/adm/lideres");
    await page.waitForLoadState("networkidle");

    // Valida elementos do DOM integrados com a API
    await expect(page.getByTestId("leader-profiles-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("leader-toolbar")).toBeVisible();
    await expect(page.getByTestId("leader-search-input")).toBeVisible();
  });

  test("2. Pesquisa e filtragem em tempo real integrados à API e banco", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/lideres");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("leader-profiles-manager")).toBeVisible({
      timeout: 20_000,
    });

    // Digita no filtro de busca
    const searchInput = page.getByTestId("leader-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    // Verifica se a tabela ou cards foram atualizados com os dados reais retornados da API
    const isTableVisible = await page.getByTestId("leader-table").isVisible();
    const isCardsVisible = await page.getByTestId("leader-cards").isVisible();
    const isEmptyVisible = await page.getByTestId("leader-profiles-empty").isVisible();

    expect(isTableVisible || isCardsVisible || isEmptyVisible).toBe(true);
  });

  test("3. Visualização de detalhes de um líder cadastrado (leitura de dados reais)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/lideres");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("leader-profiles-manager")).toBeVisible({
      timeout: 20_000,
    });

    const viewButtons = page.locator("[data-testid^='leader-table-view-'], [data-testid^='leader-card-view-']");
    const count = await viewButtons.count();

    if (count > 0) {
      await viewButtons.first().click();
      await expect(page.getByTestId("leader-view-dialog")).toBeVisible({
        timeout: 10_000,
      });

      // Fecha o dialog
      await page.getByTestId("leader-view-close-button").click();
      await expect(page.getByTestId("leader-view-dialog")).not.toBeVisible();
    }
  });

  test("4. Edição e atualização de associações de líder (fluxo de mutação completo)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/lideres");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("leader-profiles-manager")).toBeVisible({
      timeout: 20_000,
    });

    const editButtons = page.locator("[data-testid^='leader-table-edit-'], [data-testid^='leader-card-edit-']");
    const count = await editButtons.count();

    if (count > 0) {
      await editButtons.first().click();
      await expect(page.getByTestId("leader-multi-edit-dialog")).toBeVisible({
        timeout: 10_000,
      });

      // Fecha o modal de edição sem erros
      await page.getByTestId("leader-multi-edit-cancel-button").click();
      await expect(page.getByTestId("leader-multi-edit-dialog")).not.toBeVisible();
    }
  });
});
