import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Casca do app (planos 09/11): rota inexistente é 404 de verdade (não a Home) e o
 * menu público respeita as flags — flag desligada ⇒ o item some.
 */
test.describe.serial("App shell — UI", () => {
  let admin: string;

  const setFlag = async (request: import("@playwright/test").APIRequestContext, key: string, enabled: boolean) => {
    const res = await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled } });
    expect(res.ok()).toBeTruthy();
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    await setFlag(request, "about_page", true);
  });

  test("[app-shell.get.rota-inexistente#nao-encontrado] rota que não existe mostra a página 404, não a Home", async ({
    page,
  }) => {
    await page.goto("/pagina-que-nao-existe-123");
    await expect(page.getByTestId("not-found-page")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("not-found-home").click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });

  test("[app-shell.get.menu-publico#flag-desligada] com about_page desligada o item Sobre some do menu; ligada, volta", async ({
    page,
    request,
  }) => {
    await setFlag(request, "about_page", true);
    await page.goto("/");
    const nav = page.getByRole("banner");
    await expect(nav.getByRole("button", { name: "Sobre" }).first()).toBeVisible({ timeout: 20_000 });

    await setFlag(request, "about_page", false);
    await page.goto("/");
    await expect(nav.getByRole("button", { name: "Início" }).first()).toBeVisible({ timeout: 20_000 });
    await expect(nav.getByRole("button", { name: "Sobre" })).toHaveCount(0);
  });

  test("[app-shell.get.menu-publico#mobile] @mobile no celular o menu abre sem rolagem horizontal", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible({ timeout: 20_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
