import { expect, test } from "../support/test";

test.describe("Acolhidos — exclusão", () => {
  test("pede confirmação nomeando o acolhido antes de excluir", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-row-delete-sheltered-1").click();

    const dialog = page.getByTestId("sheltered-delete-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Maria Silva");
    expect(api.callsTo("DELETE", "/sheltered/sheltered-1")).toHaveLength(0);
  });

  test("cancelar fecha o diálogo sem chamar a API", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await page.getByTestId("sheltered-row-delete-sheltered-1").click();

    await page.getByTestId("sheltered-delete-dialog-cancel").click();

    await expect(page.getByTestId("sheltered-delete-dialog")).toBeHidden();
    expect(api.callsTo("DELETE", "/sheltered/sheltered-1")).toHaveLength(0);
  });

  test("confirmar exclui, recarrega a lista e some com a linha", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();
    await expect(page.getByTestId("sheltered-row-sheltered-1")).toBeVisible();
    const listCallsBefore = api.callsTo("GET", "/sheltered").length;

    await page.getByTestId("sheltered-row-delete-sheltered-1").click();
    await page.getByTestId("sheltered-delete-dialog-confirm").click();

    await expect(page.getByTestId("sheltered-delete-dialog")).toBeHidden();
    expect(api.callsTo("DELETE", "/sheltered/sheltered-1")).toHaveLength(1);
    // A lista é refeita no servidor, não remendada no cliente.
    expect(api.callsTo("GET", "/sheltered").length).toBeGreaterThan(listCallsBefore);
    await expect(page.getByTestId("sheltered-row-sheltered-1")).toBeHidden();
    await expect(page.getByTestId("sheltered-row-sheltered-2")).toBeVisible();
  });

  test("mantém o diálogo aberto quando a exclusão falha", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    api.failNext(
      "DELETE",
      "/sheltered/sheltered-1",
      404,
      "Acolhido não encontrado ou fora do seu acesso.",
    );
    await page.getByTestId("sheltered-row-delete-sheltered-1").click();
    await page.getByTestId("sheltered-delete-dialog-confirm").click();

    await expect(page.getByTestId("sheltered-delete-dialog")).toBeVisible();
    await expect(page.getByTestId("sheltered-row-sheltered-1")).toBeVisible();
  });
});
