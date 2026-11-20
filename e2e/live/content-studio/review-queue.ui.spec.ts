import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/** Fila de revisão (`/adm/estudio/revisao`): recortes com contagem, busca/faixa na URL, cartão com andamento e abertura do material. */
const FLAGS = ["content_studio", "content_studio_review"] as const;
const before: Record<string, number> = {};
let admin = "";
const stamp = Date.now();
const themeReview = `e2e-revisao Alfa ${stamp}`;
const themeProd = `e2e-revisao Beta ${stamp}`;
let idReview = "";
let idProd = "";

type Stage = { id: string; position: number };
type Pkg = { id: string; tracks: Array<{ stages: Stage[] }> };
const CS = `${API_URL}/content-studio`;

async function create(request: import("@playwright/test").APIRequestContext, theme: string): Promise<Pkg> {
  const res = await request.post(`${CS}/packages`, { headers: authHeaders(admin), data: { theme, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" } });
  return (await res.json()) as Pkg;
}
async function archive(request: import("@playwright/test").APIRequestContext, id: string) {
  const full = (await (await request.get(`${CS}/packages/${id}`, { headers: authHeaders(admin) })).json()) as Pkg;
  await request.patch(`${CS}/packages/${id}/stages/${full.tracks[0].stages[0].id}/content`, { headers: authHeaders(admin), data: { structuredContent: { title: "a" } } });
  await request.post(`${CS}/packages/${id}/archive`, { headers: authHeaders(admin) });
}

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  for (const key of FLAGS) {
    before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
  }
  // Alfa tem a primeira categoria concluída e enviada para revisão; Beta fica em produção.
  const review = await create(request, themeReview);
  idReview = review.id;
  for (const stage of [...review.tracks[0].stages].sort((a, b) => a.position - b.position)) {
    await request.patch(`${CS}/packages/${idReview}/stages/${stage.id}/content`, { headers: authHeaders(admin), data: { structuredContent: { title: `Etapa ${stage.position}` } } });
    await request.post(`${CS}/packages/${idReview}/stages/${stage.id}/complete-production`, { headers: authHeaders(admin) });
  }
  expect((await request.post(`${CS}/packages/${idReview}/submit-review`, { headers: authHeaders(admin), data: { audiences: [review.tracks[0].audience] } })).status()).toBe(201);
  idProd = (await create(request, themeProd)).id;
});

test.afterAll(async ({ request }) => {
  for (const id of [idReview, idProd]) if (id) await archive(request, id);
  for (const key of FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
  await closeDb();
});

test("recortes com contagem, filtros na URL e abertura do material", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto(`/adm/estudio/revisao?busca=${encodeURIComponent(`e2e-revisao`)}`);

  // Padrão: "Para revisar", com o material enviado e sem o que ainda está em produção.
  const card = page.getByTestId(`content-studio-review-card-${idReview}`);
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(`content-studio-review-card-${idProd}`)).toHaveCount(0);
  await expect(page.getByTestId("content-studio-review-view-TO_REVIEW")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("content-studio-review-view-TO_REVIEW")).toContainText(/Para revisar · \d+/);
  // Só a categoria liberada entra na conta: "0 de 5", não "0 de 20".
  await expect(page.getByTestId(`content-studio-review-card-progress-${idReview}`)).toContainText("0 de 5 itens aprovados");
  await expect(card.getByTestId("content-studio-stage-segments")).toBeVisible();
  // Enviado e sem nenhuma decisão ainda: é o começo da revisão.
  await expect(page.getByTestId(`content-studio-review-open-${idReview}`)).toContainText("Iniciar revisão");

  // Trocar de recorte vai para a URL; em "Publicados" o material não está.
  await page.getByTestId("content-studio-review-view-PUBLISHED").click();
  await expect(page).toHaveURL(/recorte=PUBLISHED/);
  await expect(page.getByTestId(`content-studio-review-card-${idReview}`)).toHaveCount(0);
  await page.getByTestId("content-studio-review-view-ALL").click();
  await expect(page.getByTestId(`content-studio-review-card-${idReview}`)).toBeVisible();

  // Todo material tem as quatro categorias: o filtro por faixa continua achando o material.
  for (const faixa of ["TEEN", "CHILD"]) {
    await page.goto(`/adm/estudio/revisao?recorte=ALL&faixa=${faixa}&busca=${encodeURIComponent("e2e-revisao")}`);
    await expect(page.getByTestId(`content-studio-review-card-${idReview}`)).toBeVisible({ timeout: 20_000 });
  }

  // Abrir leva à tela de REVISÃO do material (nunca à produção), só com a categoria liberada.
  await page.getByTestId(`content-studio-review-open-${idReview}`).click();
  await expect(page).toHaveURL(new RegExp(`/adm/estudio/revisao/${idReview}`));
  await expect(page.getByTestId("content-studio-review-workspace")).toBeVisible({ timeout: 20_000 });
});

test("link antigo com situação e URL inválida: caem num recorte válido sem quebrar; celular sem rolagem lateral", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/estudio/revisao?situacao=IN_REVIEW");
  await expect(page.getByTestId("content-studio-review-view-TO_REVIEW")).toHaveAttribute("aria-selected", "true", { timeout: 20_000 });
  await page.goto("/adm/estudio/revisao?recorte=LIXO&faixa=XYZ&pagina=-9");
  await expect(page.getByTestId("content-studio-review-queue")).toBeVisible({ timeout: 20_000 });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/adm/estudio/revisao");
  await expect(page.getByTestId("content-studio-review-views")).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
