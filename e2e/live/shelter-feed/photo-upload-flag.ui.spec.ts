import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { setFlag } from "./feed-fixtures";

/**
 * Enviar fotos/vídeo está atrás da flag `shelter_photo_upload`: DESLIGADA, o item "Fotos do Abrigo" some do menu do
 * membro (desktop e celular), o atalho da Home some, a rota volta para a Home e a API recusa; LIGADA, tudo aparece.
 * A flag é restaurada ao final.
 */
const KEY = "shelter_photo_upload";
const PHOTOS_PATH = "/area-do-membro/imagens-abrigo";
let admin = "";
let flagBefore = 0;

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  flagBefore = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [KEY]))?.enabled ?? 1;
});
test.afterAll(async ({ request }) => {
  await setFlag(request, admin, KEY, flagBefore === 1);
  await closeDb();
});

const menuItem = (page: import("@playwright/test").Page) => page.getByTestId("member-nav-photos");

test("flag ligada: o item aparece no menu do membro e a rota abre o envio", async ({ page, request }) => {
  await setFlag(request, admin, KEY, true);
  await seedBrowserSession(page, await loginAs(request, "member"));
  await page.goto("/area-do-membro");
  await expect(menuItem(page).first()).toBeAttached({ timeout: 20_000 });
  await page.goto(PHOTOS_PATH);
  await expect(page).toHaveURL(new RegExp(`${PHOTOS_PATH}$`));
  await expect(page.getByTestId("feature-flag-route-loading")).toHaveCount(0);
});

test("flag desligada: item some do menu (desktop e celular), atalho da Home some, rota volta e a API recusa", async ({ page, request }) => {
  await setFlag(request, admin, KEY, false);
  const member = await loginAs(request, "member");
  await seedBrowserSession(page, member);

  await page.goto("/area-do-membro");
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
  await expect(menuItem(page)).toHaveCount(0);
  await expect(page.getByTestId("member-area-action-photos")).toHaveCount(0);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/area-do-membro");
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("member-area-action-photos")).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto(PHOTOS_PATH);
  await expect(page).not.toHaveURL(new RegExp(`${PHOTOS_PATH}$`), { timeout: 20_000 });

  const mine = await request.get(`${API_URL}/image-sections/mine`, { headers: authHeaders(member.accessToken) });
  expect([403, 404]).toContain(mine.status());
});
