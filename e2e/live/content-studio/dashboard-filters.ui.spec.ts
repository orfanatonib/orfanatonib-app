import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Filtros do painel do Estúdio: datas em português (dd/mm/aaaa, calendário), validação de período
 * invertido, atalhos e "Limpar filtros". As flags do estúdio são ligadas durante o teste e restauradas.
 */
const FLAGS = ["content_studio", "content_studio_review", "content_studio_provider_admin"] as const;
const before: Record<string, number> = {};
let adminToken = "";

test.beforeAll(async ({ request }) => {
  adminToken = (await loginAs(request, "admin")).accessToken;
  for (const key of FLAGS) {
    before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(adminToken), data: { enabled: true } });
  }
});

test.afterAll(async ({ request }) => {
  for (const key of FLAGS) {
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(adminToken), data: { enabled: before[key] === 1 } });
  }
  await closeDb();
});

test("datas em português, período invertido avisa, atalho preenche e limpar zera", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/estudio");

  const start = page.getByTestId("content-studio-dashboard-start-date");
  const end = page.getByTestId("content-studio-dashboard-end-date");
  await expect(start).toBeVisible({ timeout: 20_000 });
  await expect(start).toHaveAttribute("placeholder", "DD/MM/AAAA");

  await start.fill("10/12/2026");
  await end.fill("01/12/2026");
  await expect(page.getByText("A data final deve ser igual ou posterior à inicial.")).toBeVisible();

  await page
    .getByRole("button", { name: /escolha uma data/i })
    .last()
    .click();
  await expect(page.getByText(/dezembro 2026/i)).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByText("Últimos 7 dias").click();
  await expect(end).not.toHaveValue("");
  await expect(page.getByTestId("content-studio-dashboard-clear-filters")).toBeVisible();

  await page.getByTestId("content-studio-dashboard-clear-filters").click();
  await expect(start).toHaveValue("");
  await expect(end).toHaveValue("");
});
