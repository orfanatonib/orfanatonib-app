import { expect, test } from "../../support/test";

test.describe("navegação administrativa no celular", () => {
  test("filtra os grupos e navega pelo drawer", async ({ page, api }) => {
    void api;
    await page.goto("/adm");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();

    await page.getByTestId("admin-sidebar-open").click();
    const sidebar = page.getByTestId("admin-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByTestId("admin-sidebar-overview")).toHaveText(
      "Visão geral",
    );

    await sidebar
      .getByTestId("admin-sidebar-filter-materials-and-ideas")
      .click();
    const groups = sidebar.locator(
      '[data-testid^="admin-sidebar-group-"]:not([data-testid^="admin-sidebar-group-toggle-"])',
    );
    await expect(groups).toHaveCount(1);
    await expect(groups).toHaveAttribute(
      "data-testid",
      "admin-sidebar-group-materials-and-ideas",
    );

    await sidebar
      .getByTestId("admin-sidebar-group-toggle-materials-and-ideas")
      .click();
    await expect(
      sidebar.getByTestId("admin-sidebar-item-visit-materials"),
    ).toBeVisible();
    await expect(
      sidebar.getByTestId("admin-sidebar-item-ideas-pages"),
    ).toBeVisible();
    await expect(
      sidebar.getByTestId("admin-sidebar-item-shared-ideas"),
    ).toBeVisible();

    await sidebar.getByTestId("admin-sidebar-item-visit-materials").click();
    await expect(page).toHaveURL(/\/adm\/paginas-materiais-visita$/);
  });
});
