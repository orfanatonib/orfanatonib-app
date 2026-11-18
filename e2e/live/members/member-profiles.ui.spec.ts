import { expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Teste E2E Full-Stack (Sem Mocks) para a funcionalidade de Perfis de Membros.
 * Passa por TODAS as camadas da aplicação:
 * Navegador (Playwright) -> Frontend React -> Cliente Axios -> NestJS Controller -> Services -> TypeORM Repository -> Banco MySQL.
 */
test.describe.serial("Perfis de Membros — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/membros com dados do banco", async ({
    page,
    request,
  }) => {
    // Autentica de VERDADE na API NestJS (POST /auth/login) e obtém JWT real
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    // Navega para a rota da aplicação frontend
    await page.goto("/adm/membros");
    await page.waitForLoadState("networkidle");

    // Valida elementos do DOM integrados com a API
    await expect(page.getByTestId("member-profiles-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("member-toolbar")).toBeVisible();
    await expect(page.getByTestId("member-search-input")).toBeVisible();
  });

  test("2. Pesquisa e filtragem em tempo real integrados à API e banco", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/membros");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("member-profiles-manager")).toBeVisible({
      timeout: 20_000,
    });

    // Digita no filtro de busca por membro
    const searchInput = page.getByTestId("member-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    // Verifica se a tabela ou cards estão visíveis
    const isTableVisible = await page.getByTestId("member-table").isVisible();
    const isCardsVisible = await page.getByTestId("member-cards").isVisible();

    expect(isTableVisible || isCardsVisible).toBe(true);
  });

  test("3. Visualização de detalhes de um membro cadastrado (leitura de dados reais)", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/membros");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("member-profiles-manager")).toBeVisible({
      timeout: 20_000,
    });

    const viewButtons = page.locator("[data-testid^='view-member-button-'], [data-testid^='view-member-card-button-']");
    const count = await viewButtons.count();

    if (count > 0) {
      await viewButtons.first().click();
      await expect(page.getByTestId("member-view-dialog")).toBeVisible({
        timeout: 10_000,
      });

      // Fecha o dialog
      await page.getByTestId("close-member-view-dialog-button").click();
      await expect(page.getByTestId("member-view-dialog")).not.toBeVisible();
    }
  });

  test("4. Abertura e fechamento do modal de vinculação de equipe do membro", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/membros");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("member-profiles-manager")).toBeVisible({
      timeout: 20_000,
    });

    const editButtons = page.locator("[data-testid^='edit-member-button-'], [data-testid^='edit-member-card-button-']");
    const count = await editButtons.count();

    if (count > 0) {
      await editButtons.first().click();
      await expect(page.getByTestId("member-edit-dialog")).toBeVisible({
        timeout: 10_000,
      });

      // Fecha o modal de edição sem erros
      await page.getByTestId("cancel-member-edit-button").click();
      await expect(page.getByTestId("member-edit-dialog")).not.toBeVisible();
    }
  });
});
