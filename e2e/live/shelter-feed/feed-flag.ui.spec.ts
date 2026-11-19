import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { setFlag } from "./feed-fixtures";

/**
 * O feed está atrás da flag `shelter_feed`: com ela DESLIGADA o botão "Feed" some do menu (desktop e celular), a rota
 * (e o endereço antigo) não abre a tela e a API recusa; com ela LIGADA tudo aparece. A flag é restaurada ao final.
 */
const FEED_PATH = "/feed-ministerio-orfanatos-nib";
let admin = "";
let flagBefore = 0;
let galleryId = "";

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  flagBefore = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = 'shelter_feed'"))?.enabled ?? 0;
  galleryId = (await queryOne<{ id: string }>("SELECT id FROM image_pages ORDER BY createdAt LIMIT 1"))?.id ?? "";
});
test.afterAll(async ({ request }) => {
  await setFlag(request, admin, "shelter_feed", flagBefore === 1);
  await closeDb();
});

const feedButton = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Feed", exact: true });

test("flag ligada: o botão Feed aparece no menu e a rota abre a tela", async ({ page, request }) => {
  await setFlag(request, admin, "shelter_feed", true);
  await page.goto("/");
  await expect(feedButton(page)).toBeVisible({ timeout: 20_000 });
  await feedButton(page).click();
  await expect(page).toHaveURL(new RegExp(`${FEED_PATH}$`));
  await expect(page.getByTestId("feature-flag-route-loading")).toHaveCount(0);
  // O endereço antigo continua levando ao feed (mantendo a query).
  await page.goto(`/feed-abrigos?galeria=${galleryId}`);
  await expect(page).toHaveURL(new RegExp(`${FEED_PATH}\\?galeria=${galleryId}$`));
});

test("flag desligada: botão Feed some (desktop e celular), a rota e o endereço antigo voltam para a Home e a API recusa", async ({ page, request }) => {
  await setFlag(request, admin, "shelter_feed", false);

  // Desktop.
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sobre", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(feedButton(page)).toHaveCount(0);

  // Celular: o botão também não está no menu.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("button", { name: "Sobre", exact: true })).toBeVisible();
  await expect(feedButton(page)).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 800 });

  // Endereço digitado à mão (rota nova e antiga): não abre o feed.
  for (const path of [FEED_PATH, "/feed-abrigos", `${FEED_PATH}#publicacao-feed-qualquer`]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
  }

  // API: visitante e logado recebem recusa e nenhuma seção.
  if (galleryId) {
    const visitor = await request.get(`${API_URL}/image-pages/${galleryId}/sections?page=1&limit=6`);
    expect([403, 404]).toContain(visitor.status());
    const logged = await request.get(`${API_URL}/image-pages/${galleryId}/sections?page=1&limit=6`, { headers: authHeaders(admin) });
    expect([403, 404]).toContain(logged.status());
  }
});

test("flag desligada com sessão: quem já está logado também não vê o botão nem abre a rota", async ({ page, request }) => {
  await setFlag(request, admin, "shelter_feed", false);
  await seedBrowserSession(page, await loginAs(request, "member"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sobre", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(feedButton(page)).toHaveCount(0);
  await page.goto(FEED_PATH, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
});
