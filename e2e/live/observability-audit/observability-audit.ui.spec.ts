import { API_URL } from "../../../playwright.live.config";
import { queryOne, closeDb } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Painel `/adm/observabilidade-auditoria` (plano 12): só admin e só com a flag
 * `observability_audit` ligada. No ambiente local o storage é o DynamoDB Local
 * (tabela própria do Orfanato) e o painel lista os registros. A flag volta ao
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

  test("[observability-audit.get.adm-observabilidade-auditoria#feliz] admin com a flag ligada abre o painel e consulta as duas abas no DynamoDB (sem o aviso de storage em arquivo)", async ({
    page,
    request,
  }) => {
    await setFlag(request, true);
    await seedBrowserSession(page, await loginAs(request, "admin"));

    await page.goto(ROUTE);
    await expect(page.getByTestId("observability-audit-page")).toBeVisible({ timeout: 20_000 });
    // A consulta terminou: tabela com linhas ou estado vazio — nunca o aviso de storage em arquivo.
    await expect(
      page.getByTestId("observability-records-table").or(page.getByTestId("observability-records-empty")),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("observability-records-unavailable")).toHaveCount(0);

    await page.getByTestId("observability-audit-tab-audit").click();
    await expect(page.getByTestId("audit-records-table").or(page.getByTestId("audit-records-empty"))).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("audit-records-unavailable")).toHaveCount(0);
  });

  test("[observability-audit.get.adm-observabilidade-auditoria#rodape] o link no rodapé aparece só para o admin com a flag ligada e abre o painel", async ({
    page,
    request,
  }) => {
    await setFlag(request, true);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/");
    const link = page.getByTestId("footer-observability-audit-link");
    await expect(link).toBeVisible({ timeout: 20_000 });
    await link.click();
    await expect(page).toHaveURL(/\/adm\/observabilidade-auditoria$/);
    await expect(page.getByTestId("observability-audit-page")).toBeVisible({ timeout: 20_000 });

    await setFlag(request, false);
    await page.goto("/");
    await expect(page.getByTestId("footer-feature-flags-link")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("footer-observability-audit-link")).toHaveCount(0);
  });

  test("[observability-audit.get.adm-observabilidade-auditoria#rodape-membro] membro não vê o link no rodapé", async ({
    page,
    request,
  }) => {
    await setFlag(request, true);
    await seedBrowserSession(page, await loginAs(request, "member"));
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("footer-observability-audit-link")).toHaveCount(0);
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
    await expect(
      page.getByTestId("observability-records-table").or(page.getByTestId("observability-records-empty")),
    ).toBeVisible({ timeout: 15_000 });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
