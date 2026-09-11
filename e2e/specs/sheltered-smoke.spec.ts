import { expect, test } from "../support/test";

test.describe("Acolhidos — esqueleto", () => {
  test("abre a tela de gestão com a sessão restaurada", async ({
    page,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await expect(page.getByTestId("sheltered-manager")).toBeVisible();
    await expect(page.getByTestId("sheltered-toolbar")).toBeVisible();
  });
});
