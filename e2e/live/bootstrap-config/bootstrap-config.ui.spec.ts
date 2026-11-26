import type { Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";

/**
 * Bootstrap do front (plano 01, T5.1): tela de entrada sem `forceReady`, rotas
 * carregadas sob demanda (`React.lazy` + esqueleto) com guardas de perfil e de flag
 * preservadas. Tudo contra a pilha real (front → API → MySQL), sem `page.route`.
 * A tela de timeout do boot (`app-boot-timeout`) só aparece com a API indisponível:
 * derrubá-la não cabe num cenário que roda em paralelo com os demais (ver plano 01).
 */
const horizontalOverflow = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const FLAG_KEY = "about_page";

test.describe("Bootstrap/config — UI", () => {
  let admin: LoginResult;
  let member: LoginResult;
  let flagInitiallyOn = true;

  const flagEnabled = async (): Promise<boolean> =>
    ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [FLAG_KEY]))?.enabled ?? 1) === 1;

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    member = await loginAs(request, "member");
    flagInitiallyOn = await flagEnabled();
  });

  test.afterAll(async ({ request }) => {
    await request.patch(`${API_URL}/feature-flags/${FLAG_KEY}`, {
      headers: authHeaders(admin.accessToken),
      data: { enabled: flagInitiallyOn },
    });
    expect(await flagEnabled()).toBe(flagInitiallyOn);
    await closeDb();
  });

  test("[bootstrap-config.ui.boot#feliz] boot com API de pé: a tela de verificação some e o app abre, sem tela de falha", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("app-root")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("app-auth-loading")).toHaveCount(0);
    await expect(page.getByTestId("app-boot-timeout")).toHaveCount(0);
    await expect(page.getByTestId("app-boot-retry")).toHaveCount(0);
  });

  test("[bootstrap-config.ui.rota-lazy#publica] rota pública carregada sob demanda abre e o esqueleto não fica preso na tela", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("route-fallback")).toHaveCount(0);
  });

  test("[bootstrap-config.ui.rota-lazy#nao-encontrada] rota inexistente cai no 404 (rota coringa preservada)", async ({
    page,
  }) => {
    await page.goto("/rota-que-nao-existe-bootstrap");
    await expect(page.getByTestId("not-found-page")).toBeVisible({ timeout: 20_000 });
  });

  test("[bootstrap-config.ui.rota-lazy#guarda-anonimo] visitante em /adm é levado ao login e o painel não é montado", async ({
    page,
  }) => {
    await page.goto("/adm/feature-flags");
    await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
    await expect(page.getByTestId("admin-layout")).toHaveCount(0);
    await expect(page.getByTestId("feature-flags-page")).toHaveCount(0);
  });

  test("[bootstrap-config.ui.rota-lazy#guarda-membro] membro em /adm é barrado (volta para a Home) e o painel não é montado", async ({
    page,
  }) => {
    await seedBrowserSession(page, member);
    await page.goto("/adm");
    await expect(page.getByTestId("app-root")).toBeVisible({ timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/adm/, { timeout: 20_000 });
    await expect(page.getByTestId("admin-layout")).toHaveCount(0);
  });

  test("[bootstrap-config.ui.rota-lazy#admin] admin abre o painel e uma página aninhada de admin, ambos carregados sob demanda", async ({
    page,
  }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm");
    await expect(page.getByTestId("admin-layout")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();

    await page.goto("/adm/feature-flags");
    await expect(page.getByTestId("feature-flags-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("route-fallback")).toHaveCount(0);
  });

  test("[bootstrap-config.ui.rota-lazy#flag-desligada] guarda de flag preservada: com about_page desligada /sobre volta para a Home; ligada, abre", async ({
    page,
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/${FLAG_KEY}`, {
      headers: authHeaders(admin.accessToken),
      data: { enabled: false },
    });
    expect(await flagEnabled()).toBe(false);
    await page.goto("/sobre");
    await expect(page).toHaveURL(/localhost:\d+\/$/, { timeout: 20_000 });

    await request.patch(`${API_URL}/feature-flags/${FLAG_KEY}`, {
      headers: authHeaders(admin.accessToken),
      data: { enabled: true },
    });
    expect(await flagEnabled()).toBe(true);
    await page.goto("/sobre");
    await expect(page).toHaveURL(/\/sobre$/, { timeout: 20_000 });
    await expect(page.getByTestId("app-root")).toBeVisible();
  });

  test("[bootstrap-config.ui.boot#mobile] @mobile boot em 375×812: app abre sem rolagem horizontal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("app-root")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("app-auth-loading")).toHaveCount(0);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test("[bootstrap-config.ui.rota-lazy#mobile] @mobile rota pública e painel carregados sob demanda em 375×812, sem rolagem horizontal e com alvo de toque", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-page")).toBeVisible({ timeout: 20_000 });
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    const submit = await page.getByTestId("login-submit").boundingBox();
    expect(submit?.height ?? 0).toBeGreaterThanOrEqual(36);

    await seedBrowserSession(page, admin);
    await page.goto("/adm");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible({ timeout: 20_000 });
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});
