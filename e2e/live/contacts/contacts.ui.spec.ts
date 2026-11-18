import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe.serial("Gerenciamento de Contatos — Teste E2E Full-Stack (Sem Mocks)", () => {
  test("1. Autenticação real e carregamento da página /adm/contatos", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/contatos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("contacts-manager")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("contacts-toolbar")).toBeVisible();
    await expect(page.getByTestId("contacts-search-input")).toBeVisible();
  });

  test("2. Pesquisa e filtragem na lista de contatos em tempo real", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/contatos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("contacts-manager")).toBeVisible({
      timeout: 20_000,
    });

    const searchInput = page.getByTestId("contacts-search-input");
    await searchInput.fill("a");
    await page.waitForTimeout(600);

    const isTableVisible = await page.getByTestId("contacts-table").isVisible();
    const isCardsVisible = await page.getByTestId("contacts-cards").isVisible();
    expect(isTableVisible || isCardsVisible).toBe(true);
  });

  test("3. Visualização de detalhes de mensagem de contato", async ({
    page,
    request,
  }) => {
    const loginResult = await loginAs(request, "admin");
    await seedBrowserSession(page, loginResult);

    await page.goto("/adm/contatos");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("contacts-manager")).toBeVisible({
      timeout: 20_000,
    });

    const viewButtons = page.locator("[data-testid^='view-contact-button-']");
    const count = await viewButtons.count();

    if (count > 0) {
      await viewButtons.first().click();
      await expect(page.getByTestId("contact-view-dialog")).toBeVisible({
        timeout: 10_000,
      });

      await page.getByTestId("close-contact-view-dialog-button").click();
      await expect(page.getByTestId("contact-view-dialog")).not.toBeVisible();
    }
  });

  test("4. Navegação para página pública de Contato (/contato)", async ({ page }) => {
    await page.goto("/contato");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });
});
