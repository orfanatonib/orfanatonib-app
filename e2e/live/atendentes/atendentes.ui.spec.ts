import { expect, test } from "../support/live";

test.describe.serial("Antecedentes Criminais — Interface ao vivo", () => {
  test("carrega a tela de gestão de antecedentes criminais para administrador", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/adm/antecedentes");
    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2, h3, h4, h5, h6").first();
    await expect(heading).toBeVisible();
  });
});
