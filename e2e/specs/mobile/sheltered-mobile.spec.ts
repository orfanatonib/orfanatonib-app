import { expect, test } from "../../support/test";

test.describe("Acolhidos — celular", () => {
  test("troca a tabela por cards", async ({ page, gotoSheltered }) => {
    await gotoSheltered();

    await expect(page.getByTestId("sheltered-cards")).toBeVisible();
    await expect(page.getByTestId("sheltered-table")).toBeHidden();
    await expect(page.getByTestId("sheltered-card-sheltered-1")).toContainText(
      "Maria Silva",
    );
  });

  test("usa FABs no lugar das ações de desktop", async ({ page, gotoSheltered }) => {
    await gotoSheltered();

    await expect(page.getByTestId("sheltered-create-fab")).toBeVisible();
    await expect(page.getByTestId("sheltered-refresh-fab")).toBeVisible();
    await expect(page.getByTestId("sheltered-create")).toBeHidden();
  });

  test("respeita o alvo mínimo de toque nas ações do card", async ({
    page,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    for (const testId of [
      "sheltered-card-view-sheltered-1",
      "sheltered-card-edit-sheltered-1",
      "sheltered-card-delete-sheltered-1",
    ]) {
      const box = await page.getByTestId(testId).boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test("expande e recolhe o card", async ({ page, gotoSheltered }) => {
    await gotoSheltered();

    const toggle = page.getByTestId("sheltered-card-toggle-sheltered-1");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("sheltered-card-details-sheltered-1")).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("ordena pelos controles próprios dos cards", async ({
    page,
    api,
    gotoSheltered,
  }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-cards-sort-field").click();
    await page.getByTestId("sheltered-cards-sort-name").click();

    await expect.poll(() => api.lastListQuery()?.get("orderBy")).toBe("name");
  });

  test("abre o detalhe a partir do card", async ({ page, gotoSheltered }) => {
    await gotoSheltered();

    await page.getByTestId("sheltered-card-view-sheltered-1").click();

    await expect(page.getByTestId("sheltered-view-dialog")).toBeVisible();
    await expect(page.getByTestId("sheltered-view-name")).toHaveText("Maria Silva");
  });
});
