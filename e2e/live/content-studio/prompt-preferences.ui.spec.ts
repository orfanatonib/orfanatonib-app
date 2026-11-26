import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/** Tela de orientações de criação (`/adm/estudio/orientacoes`): escrever, salvar, voltar ao padrão, rascunho e conflito. */
const BASE = `${API_URL}/content-studio/prompt-preferences/me`;
const TEXT = "Use exemplos do cotidiano de um abrigo e frases curtas para a faixa etária.";
let admin = "";
let flagBefore = 0;

type Item = { stage: string; customPrompt: string | null; lockVersion: number | null };

const current = async (request: import("@playwright/test").APIRequestContext, stage = "LESSON"): Promise<Item> =>
  ((await (await request.get(`${BASE}?audience=TEEN`, { headers: authHeaders(admin) })).json()) as Item[]).find((item) => item.stage === stage)!;

async function resetStage(request: import("@playwright/test").APIRequestContext, stage = "LESSON") {
  const item = await current(request, stage);
  if (item.customPrompt) await request.post(`${BASE}/reset`, { headers: authHeaders(admin), data: { audience: "TEEN", stage, lockVersion: item.lockVersion } });
}

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  flagBefore = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = 'content_studio'"))?.enabled ?? 0;
  await request.patch(`${API_URL}/feature-flags/content_studio`, { headers: authHeaders(admin), data: { enabled: true } });
  await resetStage(request);
});
test.afterAll(async ({ request }) => {
  await resetStage(request);
  await request.patch(`${API_URL}/feature-flags/content_studio`, { headers: authHeaders(admin), data: { enabled: flagBefore === 1 } });
  await closeDb();
});

async function open(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/estudio/orientacoes");
  await expect(page.getByTestId("admin-prompts-personal-notice")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("admin-prompts-category-teen").click();
  await page.getByTestId("admin-prompts-tab-lesson").click();
}

test("escreve, valida, salva com Ctrl+S, aparece como personalizada e volta ao padrão", async ({ page, request }) => {
  await open(page, request);
  const input = page.getByTestId("admin-prompt-page-input-LESSON").locator("textarea").first();
  await expect(page.getByTestId("admin-prompts-stage-status")).toHaveText("Padrão oficial");
  await expect(page.getByTestId("admin-prompts-summary")).toContainText("padrão oficial");
  await expect(page.getByTestId("admin-prompts-save")).toBeDisabled();

  // Texto curto: avisa e não deixa salvar.
  await input.fill("curto");
  await expect(page.getByText("Escreva pelo menos 10 caracteres.").first()).toBeVisible();
  await expect(page.getByTestId("admin-prompts-save")).toBeDisabled();
  await expect(page.getByTestId("admin-prompts-pending-count")).toContainText("1 etapa com texto não salvo");

  // Sugestão pronta soma ao texto; depois um texto próprio válido.
  await input.fill(TEXT);
  await page.getByRole("button", { name: "Acolhimento" }).click();
  await expect(input).toHaveValue(new RegExp(`${TEXT}\\n• Priorize um tom acolhedor`));
  await input.fill(TEXT);
  await expect(page.getByTestId("admin-prompts-save")).toBeEnabled();
  await page.keyboard.press("Control+s");
  await expect(page.getByTestId("admin-prompts-feedback")).toContainText("Orientação salva");
  await expect(page.getByTestId("admin-prompts-stage-status")).toHaveText("Personalizada");
  await expect(page.getByTestId("admin-prompts-pending-count")).toHaveCount(0);
  expect((await current(request)).customPrompt).toBe(TEXT);

  // A prévia mostra regras oficiais + a orientação.
  await page.getByText("Como a IA vai receber").click();
  await expect(page.getByTestId("admin-prompts-effective-preview").locator("textarea").first()).toHaveValue(new RegExp(`PERSONALIZAÇÃO DO ADMINISTRADOR:\\n${TEXT}`));

  // Recarregar traz a orientação salva; outra faixa continua no padrão.
  await page.reload();
  await page.getByTestId("admin-prompts-category-teen").click();
  await page.getByTestId("admin-prompts-tab-lesson").click();
  await expect(page.getByTestId("admin-prompt-page-input-LESSON").locator("textarea").first()).toHaveValue(TEXT);
  await page.getByTestId("admin-prompts-category-child").click();
  await expect(page.getByTestId("admin-prompts-stage-status")).toHaveText("Padrão oficial");
  await page.getByTestId("admin-prompts-category-teen").click();

  // Voltar ao padrão (com confirmação).
  await page.getByTestId("admin-prompts-reset-open").click();
  await page.getByTestId("admin-prompts-reset-confirm").click();
  await expect(page.getByTestId("admin-prompts-feedback")).toContainText("voltou ao padrão oficial");
  await expect(page.getByTestId("admin-prompts-stage-status")).toHaveText("Padrão oficial");
  expect((await current(request)).customPrompt).toBeNull();
});

test("rascunho não salvo é recuperado ao recarregar a página", async ({ page, request }) => {
  await open(page, request);
  const input = page.getByTestId("admin-prompt-page-input-LESSON").locator("textarea").first();
  await input.fill("Rascunho que ainda não foi salvo, mas não pode se perder.");
  await page.waitForTimeout(700); // espera da gravação no navegador
  await page.reload();
  await page.getByTestId("admin-prompts-category-teen").click();
  await page.getByTestId("admin-prompts-tab-lesson").click();
  await expect(page.getByTestId("admin-prompts-draft-recovered")).toBeVisible();
  await expect(page.getByTestId("admin-prompt-page-input-LESSON").locator("textarea").first()).toHaveValue("Rascunho que ainda não foi salvo, mas não pode se perder.");
  await page.getByTestId("admin-prompts-discard-draft").click();
  await expect(page.getByTestId("admin-prompts-pending-count")).toHaveCount(0);
});

test("alteração em outra aba: salvar mostra o conflito e dá a opção de aplicar sobre a versão atual", async ({ page, request }) => {
  await open(page, request);
  const input = page.getByTestId("admin-prompt-page-input-LESSON").locator("textarea").first();
  await input.fill("Meu texto digitado nesta aba, sobre a versão antiga da orientação.");
  // "Outra aba" salva antes.
  const start = await current(request);
  const other = await request.patch(BASE, {
    headers: authHeaders(admin),
    data: { audience: "TEEN", stage: "LESSON", customPrompt: "Texto salvo por outra aba ou aparelho do mesmo administrador.", lockVersion: start.lockVersion ?? undefined },
  });
  expect(other.status()).toBe(200);
  await page.getByTestId("admin-prompts-save").click();
  await expect(page.getByTestId("admin-prompts-feedback")).toContainText("outra aba ou aparelho");
  await expect(page.getByTestId("admin-prompts-draft-outdated")).toBeVisible();
  await expect(page.getByTestId("admin-prompts-save")).toBeDisabled();
  await page.getByTestId("admin-prompts-draft-rebase").click();
  await expect(page.getByTestId("admin-prompts-save")).toBeEnabled();
  await page.getByTestId("admin-prompts-save").click();
  await expect(page.getByTestId("admin-prompts-feedback")).toContainText("Orientação salva");
  expect((await current(request)).customPrompt).toBe("Meu texto digitado nesta aba, sobre a versão antiga da orientação.");
});

test("celular 375px: sem rolagem horizontal e botão de salvar fixo com texto pendente", async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, request);
  await page.getByTestId("admin-prompt-page-input-LESSON").locator("textarea").first().fill("Texto pendente para ver a barra fixa de salvar no celular.");
  await expect(page.getByTestId("admin-prompts-save-mobile")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await page.getByTestId("admin-prompts-discard-draft").click();
});
