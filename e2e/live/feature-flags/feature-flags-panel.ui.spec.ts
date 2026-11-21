import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Painel de flags (plano 08, T6.2/T6.4) full-stack: navegador real → API → MySQL.
 * Escreve só em flags do próprio cenário (`e2e-panel-*`) e restaura as de catálogo
 * que precisa alterar. As `email_*` não são tocadas.
 */
const RUN = `e2e-panel-${Date.now()}`;
const OWN = `${RUN}`;
const ADMIN_ONLY = "user_management"; // catálogo: público = admin
const FRONT_ONLY = "about_page"; // catálogo: sem endpoint na API
const ENFORCED = "events_section"; // catálogo: imposta pela API

type Flag = { id: string; key: string; enabled: boolean; version: number; targetRoles: string[] };
type FlagRow = { enabled: number; version: number };

test.describe.serial("Feature flags — painel", () => {
  let admin: string;
  let own: Flag;
  let adminOnlyOriginal: { enabled: boolean; targetRoles: string[] };

  const get = async (request: APIRequestContext, key: string): Promise<Flag> =>
    (await (await request.get(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin) })).json()) as Flag;
  const row = (key: string) =>
    queryOne<FlagRow>("SELECT `enabled`, `version` FROM `feature_flags` WHERE `key` = ?", [key]);

  const openPanel = async (page: import("@playwright/test").Page, request: APIRequestContext) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/feature-flags");
    await expect(page.getByTestId("feature-flags-list")).toBeVisible({ timeout: 15_000 });
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    const created = await request.post(`${API_URL}/feature-flags`, {
      headers: authHeaders(admin),
      data: { key: OWN, name: `Flag ${RUN}`, enabled: false },
    });
    expect(created.status()).toBe(201);
    own = (await created.json()) as Flag;
    const base = await get(request, ADMIN_ONLY);
    adminOnlyOriginal = { enabled: base.enabled, targetRoles: base.targetRoles };
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`${API_URL}/feature-flags/${OWN}`, { headers: authHeaders(admin) });
    await request.patch(`${API_URL}/feature-flags/${ADMIN_ONLY}`, { headers: authHeaders(admin), data: adminOnlyOriginal });
    await request.patch(`${API_URL}/feature-flags/${FRONT_ONLY}`, { headers: authHeaders(admin), data: { enabled: true } });
    await closeDb();
  });

  test("[feature-flags.ui#agrupado-por-area] o painel agrupa por área e as abas filtram a área", async ({ page, request }) => {
    await openPanel(page, request);
    await expect(page.getByTestId("feature-flags-areas")).toBeVisible();

    await page.getByTestId("feature-flags-area-studio").click();
    await expect(page.getByTestId("feature-flags-group-studio")).toBeVisible();
    await expect(page.getByTestId("feature-flags-group-public")).toHaveCount(0);

    await page.getByTestId("feature-flags-area-all").click();
    await expect(page.getByTestId("feature-flags-group-public")).toBeVisible();
  });

  test("[feature-flags.ui#selos] selo 'imposta na API' só onde a API também barra; flag de fábrica mostra 'Protegida' e não pode ser excluída", async ({
    page,
    request,
  }) => {
    await openPanel(page, request);
    const enforced = await get(request, ENFORCED);
    const frontOnly = await get(request, FRONT_ONLY);

    await page.getByTestId("feature-flags-search").fill(ENFORCED);
    await expect(page.getByTestId(`feature-flags-card-${enforced.id}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`feature-flags-card-enforced-${enforced.id}`)).toBeVisible();
    await expect(page.getByTestId(`feature-flags-card-protected-${enforced.id}`)).toBeVisible();
    await expect(page.getByTestId(`feature-flags-card-delete-${enforced.id}`)).toBeDisabled();

    await page.getByTestId("feature-flags-search").fill(FRONT_ONLY);
    await expect(page.getByTestId(`feature-flags-card-${frontOnly.id}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`feature-flags-card-enforced-${frontOnly.id}`)).toHaveCount(0);

    // A flag personalizada não ganha selo e pode ser excluída.
    await page.getByTestId("feature-flags-search").fill(OWN);
    await expect(page.getByTestId(`feature-flags-card-${own.id}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`feature-flags-card-enforced-${own.id}`)).toHaveCount(0);
    await expect(page.getByTestId(`feature-flags-card-protected-${own.id}`)).toHaveCount(0);
    await expect(page.getByTestId(`feature-flags-card-delete-${own.id}`)).toBeEnabled();
  });

  test("[feature-flags.ui#aviso-de-perfil] público mais amplo que o perfil do recurso mostra o aviso no cartão", async ({ page, request }) => {
    const target = await get(request, ADMIN_ONLY);
    const res = await request.patch(`${API_URL}/feature-flags/${ADMIN_ONLY}`, { headers: authHeaders(admin), data: { targetRoles: [] } });
    expect(res.ok()).toBeTruthy();

    await openPanel(page, request);
    await page.getByTestId("feature-flags-search").fill(ADMIN_ONLY);
    const warning = page.getByTestId(`feature-flags-card-warning-${target.id}`);
    await expect(warning).toBeVisible({ timeout: 15_000 });
    await expect(warning).toContainText("mais amplo");

    await request.patch(`${API_URL}/feature-flags/${ADMIN_ONLY}`, { headers: authHeaders(admin), data: { targetRoles: ["admin"] } });
    await page.getByTestId("feature-flags-refresh").click();
    await expect(page.getByTestId(`feature-flags-card-warning-${target.id}`)).toHaveCount(0, { timeout: 15_000 });
  });

  test("[feature-flags.ui#conflito-de-versao] outro admin alterou a flag: o painel mostra o aviso e o banco fica com a decisão do outro", async ({
    page,
    request,
  }) => {
    await openPanel(page, request);
    await page.getByTestId("feature-flags-search").fill(OWN);
    const toggle = page.getByTestId(`feature-flags-card-toggle-${own.id}`);
    await expect(toggle).toBeVisible({ timeout: 15_000 });

    // "Outro admin" liga a flag por fora, depois da leitura do painel.
    const current = await get(request, OWN);
    expect(current.enabled).toBe(false);
    const other = await request.put(`${API_URL}/feature-flags/${OWN}/enabled`, {
      headers: authHeaders(admin),
      data: { enabled: true, expectedVersion: current.version },
    });
    expect(other.status()).toBe(200);
    const afterOther = await row(OWN);

    // O painel ainda mostra "desligada": o clique tenta LIGAR com a versão velha... que já é a decisão do outro.
    // Para provar o 409 de verdade, o outro desliga e religa (versão sobe duas vezes), voltando ao estado do painel.
    const second = await request.put(`${API_URL}/feature-flags/${OWN}/enabled`, {
      headers: authHeaders(admin),
      data: { enabled: false },
    });
    expect(second.status()).toBe(200);
    const stateBeforeClick = await row(OWN);
    expect(Number(stateBeforeClick?.version)).toBeGreaterThan(Number(afterOther?.version));

    await toggle.click();
    await expect(page.getByTestId("feature-flags-error")).toContainText("foi alterada por outra pessoa", { timeout: 15_000 });
    // Nada foi gravado pelo clique obsoleto.
    expect(await row(OWN)).toEqual(stateBeforeClick);

    // O painel recarregou: agora o clique usa a versão nova e funciona.
    await page.getByTestId("feature-flags-error").getByRole("button", { name: /close|fechar/i }).click();
    await expect(page.getByTestId(`feature-flags-card-toggle-${own.id}`)).toBeEnabled();
    await page.getByTestId(`feature-flags-card-toggle-${own.id}`).click();
    await expect.poll(async () => (await row(OWN))?.enabled, { timeout: 15_000 }).toBe(1);
  });

  test("[feature-flags.ui#refetch-no-foco] voltar para a aba relê as flags: flag desligada por fora derruba a rota sem recarregar a página", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/sobre");
    await expect(page).toHaveURL(/\/sobre$/);

    await request.patch(`${API_URL}/feature-flags/${FRONT_ONLY}`, { headers: authHeaders(admin), data: { enabled: false } });

    // Dentro do intervalo mínimo a releitura é ignorada (não martela a API).
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.waitForTimeout(1_000);
    await expect(page).toHaveURL(/\/sobre$/);

    // Passado o intervalo, voltar para a aba relê silenciosamente e a rota some.
    await page.waitForTimeout(15_500);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page).toHaveURL(/localhost:\d+\/$/, { timeout: 15_000 });
  });

  test("[feature-flags.ui#mobile] @mobile painel em 375px: sem rolagem horizontal, abas roláveis e alternar grava no banco", async ({ page, request }) => {
    await openPanel(page, request);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await expect(page.getByTestId("feature-flags-areas")).toBeVisible();
    await page.getByTestId("feature-flags-search").fill(OWN);
    const toggle = page.getByTestId(`feature-flags-card-toggle-${own.id}`);
    await expect(toggle).toBeVisible({ timeout: 15_000 });
    const box = await toggle.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);

    const before = (await row(OWN))?.enabled;
    await toggle.click();
    await expect.poll(async () => (await row(OWN))?.enabled, { timeout: 15_000 }).toBe(before === 1 ? 0 : 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
