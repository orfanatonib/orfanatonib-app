import { expect, test } from "../support/test";

test.describe("Criador de Páginas (/adm/criar-pagina)", () => {
  test("exibe o modo card com todas as 5 opções de modelos de página no estado inicial", async ({ page }) => {
    await page.goto("/adm/criar-pagina");

    await expect(page.getByTestId("page-creator-select-template-container")).toBeVisible();
    await expect(page.getByTestId("page-creator-select-template-header")).toBeVisible();
    await expect(page.getByTestId("page-creator-card-grid")).toBeVisible();

    // Validar presença de cada card template no modo card
    await expect(page.getByTestId("page-template-card-visit-materials")).toBeVisible();
    await expect(page.getByTestId("page-template-card-meditation")).toBeVisible();
    await expect(page.getByTestId("page-template-card-gallery")).toBeVisible();
    await expect(page.getByTestId("page-template-card-videos")).toBeVisible();
    await expect(page.getByTestId("page-template-card-ideas")).toBeVisible();
  });

  test("esconde a página de cards e exibe a tela de criação ao clicar em um card", async ({ page }) => {
    await page.goto("/adm/criar-pagina");

    const visitCard = page.getByTestId("page-template-card-visit-materials");
    await visitCard.click();

    // A página de cards deve sumir completamente
    await expect(page.getByTestId("page-creator-card-grid")).toHaveCount(0);
    await expect(page.getByTestId("page-creator-select-template-header")).toHaveCount(0);

    // A tela de criação e a setinha de voltar devem ficar visíveis
    await expect(page.getByTestId("page-creator-selected-template-preview")).toBeVisible();
    await expect(page.getByTestId("page-creator-back-to-cards-btn")).toBeVisible();
  });

  test("retorna para a página de cards ao clicar no botão/setinha de voltar", async ({ page }) => {
    await page.goto("/adm/criar-pagina");

    // Selecionar Meditação
    const meditationCard = page.getByTestId("page-template-card-meditation");
    await meditationCard.click();

    await expect(page.getByTestId("page-creator-selected-template-preview")).toBeVisible();

    // Clicar no botão com setinha de voltar
    const backBtn = page.getByTestId("page-creator-back-to-cards-btn");
    await backBtn.click();

    // A tela de criação deve sumir e o modo card deve retornar
    await expect(page.getByTestId("page-creator-selected-template-preview")).toHaveCount(0);
    await expect(page.getByTestId("page-creator-card-grid")).toBeVisible();
  });

  test("suporta seleção por teclado pressionando Enter", async ({ page }) => {
    await page.goto("/adm/criar-pagina");

    const galleryCard = page.getByTestId("page-template-card-gallery");
    await galleryCard.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("page-creator-card-grid")).toHaveCount(0);
    await expect(page.getByTestId("page-creator-selected-template-preview")).toBeVisible();
  });
});
