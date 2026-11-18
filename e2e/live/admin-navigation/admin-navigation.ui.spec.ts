import { expect, loginAs, seedBrowserSession, test } from "../support/live";

test.describe("Navegação administrativa — UI ao vivo", () => {
  test("admin navega pelo menu real até comentários e criação de página", async ({
    page,
    request,
  }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto("/adm");
    await expect(page.getByTestId("admin-layout")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();

    await page
      .getByTestId("admin-dashboard-card-comments")
      .getByRole("button", { name: /acessar comentários/i })
      .click();
    await expect(page).toHaveURL(/\/adm\/comentarios$/);
    await expect(page.getByTestId("comments-manager")).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/adm");
    await page
      .getByTestId("admin-dashboard-card-create-page")
      .getByRole("button", { name: /acessar criar página/i })
      .click();
    await expect(page).toHaveURL(/\/adm\/criar-pagina$/);
    await expect(page.getByTestId("page-creator-select-template-container")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("page-creator-select-template-header")).toHaveText(
      /modelos de página/i,
    );
  });
});
