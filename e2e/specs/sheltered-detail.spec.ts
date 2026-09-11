import { expect, test } from "../support/test";

test.describe("Acolhidos — detalhe", () => {
  test("abre o detalhe da linha e carrega o registro completo", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-row-view-sheltered-1").click();

    const dialog = page.getByTestId("sheltered-view-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("sheltered-view-name")).toHaveText("Maria Silva");
    await expect(page.getByTestId("sheltered-view-shelter")).toContainText(
      "Abrigo Esperança",
    );
    await expect(page.getByTestId("sheltered-view-guardian-name")).toContainText(
      "Joana Silva",
    );

    // O detalhe busca o registro completo, não reaproveita só a linha da lista.
    expect(api.callsTo("GET", "/sheltered/sheltered-1")).toHaveLength(1);
  });

  test("monta o link do WhatsApp com o telefone do responsável", async ({
    page,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-row-view-sheltered-1").click();

    // Regressão: antes o link era montado com a assinatura errada e saía sempre nulo.
    const whatsapp = page.getByTestId("sheltered-view-whatsapp");
    await expect(whatsapp).toBeVisible();
    await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/92999990000\?text=/);
  });

  test("mostra o endereço com link para o Maps", async ({ page, gotoSheltered }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-row-view-sheltered-1").click();

    await expect(page.getByTestId("sheltered-view-address")).toContainText("Manaus/AM");
    await expect(page.getByTestId("sheltered-view-maps")).toHaveAttribute(
      "href",
      /google\.com\/maps\/search/,
    );
  });

  test("omite o WhatsApp quando não há telefone cadastrado", async ({
    page,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-row-view-sheltered-3").click();

    await expect(page.getByTestId("sheltered-view-dialog")).toBeVisible();
    await expect(page.getByTestId("sheltered-view-whatsapp")).toBeHidden();
    await expect(page.getByTestId("sheltered-view-guardian-name")).toContainText(
      "Sem responsável",
    );
  });

  test("o botão Editar do detalhe abre o formulário preenchido", async ({
    page,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-row-view-sheltered-1").click();

    await page.getByTestId("sheltered-view-edit").click();

    await expect(page.getByTestId("sheltered-view-dialog")).toBeHidden();
    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
    await expect(
      page.getByTestId("sheltered-form-name").locator("input"),
    ).toHaveValue("Maria Silva");
  });

  test("fecha o detalhe", async ({ page, gotoSheltered }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-row-view-sheltered-1").click();

    await page.getByTestId("sheltered-view-close").click();

    await expect(page.getByTestId("sheltered-view-dialog")).toBeHidden();
  });
});
