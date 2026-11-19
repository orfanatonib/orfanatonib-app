import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Flag desligada = rota inexistente no front (FeatureFlagRoute) e 403 na API.
 * O estado original da flag é restaurado no afterEach.
 */
const ABOUT = "about_page";
const MANUAL = "member_manual";

test.describe.serial("Feature flags — rotas no front", () => {
  let admin: string;

  const setFlag = async (request: import("@playwright/test").APIRequestContext, key: string, enabled: boolean) => {
    const res = await request.patch(`${API_URL}/feature-flags/${key}`, {
      headers: authHeaders(admin),
      data: { enabled },
    });
    expect(res.ok()).toBeTruthy();
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterEach(async ({ request }) => {
    await setFlag(request, ABOUT, true);
    await setFlag(request, MANUAL, true);
  });

  test("flag ligada: visitante abre /sobre", async ({ page }) => {
    await page.goto("/sobre");
    await expect(page).toHaveURL(/\/sobre$/);
  });

  test("flag desligada: /sobre redireciona para a home", async ({ page, request }) => {
    await setFlag(request, ABOUT, false);
    await page.goto("/sobre");
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });

  test("flag de membro desligada: o membro logado não abre o Manual", async ({ page, request }) => {
    await setFlag(request, MANUAL, false);
    await seedBrowserSession(page, await loginAs(request, "member"));
    await page.goto("/area-do-membro/manual");
    await expect(page).not.toHaveURL(/\/manual$/);
  });
});
