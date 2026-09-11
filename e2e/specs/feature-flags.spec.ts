import { expect, test } from "../support/test";
import { LEADER_USER } from "../fixtures/sheltered.fixtures";

test.describe("gerenciamento de feature flags", () => {
  test("administrador consulta, filtra e alterna uma flag", async ({
    page,
    api,
  }) => {
    await page.goto("/adm/feature-flags");

    await expect(page.getByTestId("feature-flags-page")).toBeVisible();
    await expect(page.getByTestId("feature-flags-card-flag-shelter-management")).toBeVisible();

    await page.getByTestId("feature-flags-search").fill("acolhidos");
    await expect.poll(() =>
      api
        .callsTo("GET", "/feature-flags")
        .some((call) => call.query.get("searchString") === "acolhidos"),
    ).toBe(true);

    await page.getByTestId("feature-flags-card-toggle-flag-shelter-management").click();
    await expect.poll(() =>
      api.callsTo(
        "PATCH",
        "/feature-flags/shelter-management/toggle",
      ).length,
    ).toBe(1);
  });

  test("criação envia o público escolhido como targetRoles", async ({
    page,
    api,
  }) => {
    await page.goto("/adm/feature-flags");
    await page.getByTestId("feature-flags-create").click();

    await page.getByTestId("feature-flags-form-key").fill("nova-feature");
    await page.getByTestId("feature-flags-form-name").fill("Nova feature");
    await page.getByTestId("feature-flags-form-audience-leader_member").click();
    await page.getByTestId("feature-flags-form-submit").click();

    await expect.poll(() => api.callsTo("POST", "/feature-flags").at(-1)?.body).toMatchObject({
      key: "nova-feature",
      name: "Nova feature",
      targetRoles: ["leader", "member"],
    });
    await expect(page.getByTestId("feature-flags-success")).toBeVisible();
  });

});

test.describe("permissão do painel de feature flags", () => {
  test.use({ apiMockOptions: { user: LEADER_USER } });

  test("líder não acessa o painel administrativo", async ({ page, api }) => {
    void api;
    await page.goto("/adm/feature-flags");
    await expect(page).toHaveURL(/\/adm$/);
    await expect(page.getByTestId("feature-flags-page")).toHaveCount(0);
  });
});
