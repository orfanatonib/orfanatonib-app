import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/** Painel de provedores de IA na tela: abre para admin, aparece no sidebar e no rodapé; membro não entra. */
const FLAGS = ["content_studio", "content_studio_provider_admin"] as const;
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

test("admin abre o painel: provedor ativo, as duas configurações e os links do sidebar e do rodapé", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/config-provedores-ia");

  await expect(page.getByRole("heading", { name: /Provedores & Modelos IA/i })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Provedor ativo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Configurações da OpenAI" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Configurações do Gemini" })).toBeVisible();
  await expect(page.getByTestId("footer-ai-providers-link")).toBeVisible();
  await expect(page.getByText("Provedores e Modelos IA").first()).toBeVisible();
});

test("a rota antiga /adm/estudio/provedores-ia redireciona para o painel novo", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/estudio/provedores-ia");
  await expect(page).toHaveURL(/\/adm\/config-provedores-ia$/, { timeout: 20_000 });
});

test("membro não vê o painel", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "member"));
  await page.goto("/adm/config-provedores-ia");
  await expect(page.getByText("Configurações da OpenAI")).toHaveCount(0);
  await expect(page).not.toHaveURL(/config-provedores-ia/);
});

test("testar conexão mostra o resultado sem vazar chave, e o uso de IA muda de período", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/config-provedores-ia");
  await expect(page.getByTestId("ai-providers-diagnostics")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("ai-providers-health-button").click();
  const result = page.getByTestId("ai-providers-health-result");
  await expect(result).toBeVisible({ timeout: 30_000 });
  // Sem chave válida salva o teste nunca diz OK; com uma boa, diz.
  await expect(result).toHaveAttribute("data-health-status", /OK|NO_KEY|FAILED|MODEL_MISSING|UNREADABLE_KEY/);
  expect(await result.innerText()).not.toMatch(/sk-/);

  await expect(page.getByTestId("ai-providers-usage-empty").or(page.getByTestId("ai-providers-usage-list"))).toBeVisible();
  await page.getByTestId("ai-providers-diagnostics").getByRole("combobox").click();
  await page.getByRole("option", { name: "Últimos 90 dias" }).click();
  await expect(page.getByTestId("ai-providers-usage-empty").or(page.getByTestId("ai-providers-usage-list"))).toBeVisible();
});
