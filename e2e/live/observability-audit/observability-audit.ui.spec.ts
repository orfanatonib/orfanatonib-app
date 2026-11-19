import { API_URL } from "../../../playwright.live.config";
import { queryOne, closeDb } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Painel `/adm/observabilidade-auditoria` (plano 12): só admin e só com a flag
 * `observability_audit` ligada. Com storage em arquivo (ambiente local) a API
 * responde `LOG_9101` e o painel explica em vez de listar. A flag volta ao
 * estado original ao final.
 */
const FLAG = "observability_audit";
const ROUTE = "/adm/observabilidade-auditoria";

test.describe.serial("Observabilidade e auditoria — painel", () => {
  let admin: string;
  let originalEnabled = 0;

  const setFlag = async (request: import("@playwright/test").APIRequestContext, enabled: boolean) => {
    const res = await request.patch(`${API_URL}/feature-flags/${FLAG}`, {
      headers: authHeaders(admin),
      data: { enabled },
    });
    expect(res.ok()).toBeTruthy();
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    const row = await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [FLAG]);
    expect(row, `a flag ${FLAG} deve existir`).not.toBeNull();
    originalEnabled = (row as { enabled: number }).enabled;
  });

  test.afterAll(async ({ request }) => {
    await setFlag(request, originalEnabled === 1);
    await closeDb();
  });

  test("[observability-audit.get.adm-observabilidade-auditoria#feliz] admin com a flag ligada abre o painel e vê o aviso de storage em arquivo nas duas abas", async ({
    page,
    request,
  }) => {
    await setFlag(request, true);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto(ROUTE);
    await expect(page.getByTestId("observability-audit-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("observability-records-unavailable")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("observability-audit-tab-audit").click();
    await expect(page.getByTestId("audit-records-unavailable")).toBeVisible({ timeout: 15_000 });
  });

  test("[observability-audit.get.adm-observabilidade-auditoria#flag-desligada] com a flag desligada a rota some e o admin volta para a home", async ({
    page,
    request,
  }) => {
    await setFlag(request, false);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto(ROUTE);
    await expect(page).not.toHaveURL(/observabilidade-auditoria$/);
    await expect(page.getByTestId("observability-audit-page")).toHaveCount(0);
  });

  test("[observability-audit.get.adm-observabilidade-auditoria#perfil-membro] membro logado não abre o painel", async ({
    page,
    request,
  }) => {
    await setFlag(request, true);
    await seedBrowserSession(page, await loginAs(request, "member"));

    await page.goto(ROUTE);
    await expect(page).not.toHaveURL(/observabilidade-auditoria$/);
    await expect(page.getByTestId("observability-audit-page")).toHaveCount(0);
  });

  test("[observability-audit.get.adm-observabilidade-auditoria#mobile] @mobile painel em 375×812 sem rolagem horizontal", async ({
    page,
    request,
  }) => {
    await setFlag(request, true);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto(ROUTE);
    await expect(page.getByTestId("observability-audit-page")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("observability-records-unavailable")).toBeVisible({ timeout: 15_000 });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
