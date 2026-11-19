import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/** Listagem de materiais (`/adm/estudio/producao`): cartões, busca/filtros na URL, ordenação, arquivar e PDF. */
const FLAGS = ["content_studio"] as const;
const before: Record<string, number> = {};
let admin = "";
const stamp = Date.now();
const themeA = `e2e-lista Alfa ${stamp}`;
const themeB = `e2e-lista Beta ${stamp}`;
let idA = "";
let idB = "";

type Pkg = { id: string; tracks: Array<{ stages: Array<{ id: string }> }> };

async function create(request: import("@playwright/test").APIRequestContext, theme: string, audience: string): Promise<Pkg> {
  const res = await request.post(`${API_URL}/content-studio/packages`, {
    headers: authHeaders(admin),
    data: { audience, theme, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" },
  });
  return (await res.json()) as Pkg;
}

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  for (const key of FLAGS) {
    before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
  }
  const a = await create(request, themeA, "CHILD");
  const b = await create(request, themeB, "TEEN");
  idA = a.id;
  idB = b.id;
  // A ganha conteúdo (libera o PDF no cartão).
  await request.patch(`${API_URL}/content-studio/packages/${idA}/stages/${a.tracks[0].stages[0].id}/content`, {
    headers: authHeaders(admin),
    data: { structuredContent: { title: "Deus cuida de nós" } },
  });
});

test.afterAll(async ({ request }) => {
  for (const id of [idA, idB]) {
    if (!id) continue;
    const full = (await (await request.get(`${API_URL}/content-studio/packages/${id}`, { headers: authHeaders(admin) })).json()) as Pkg;
    await request.patch(`${API_URL}/content-studio/packages/${id}/stages/${full.tracks[0].stages[0].id}/content`, {
      headers: authHeaders(admin),
      data: { structuredContent: { title: "a" } },
    });
    await request.post(`${API_URL}/content-studio/packages/${id}/archive`, { headers: authHeaders(admin) });
  }
  for (const key of FLAGS) {
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
  }
  await closeDb();
});

test("cartões, busca e filtros ficam na URL; arquivar tira da lista principal e aparece em Arquivado", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto(`/adm/estudio/producao?busca=${encodeURIComponent(`e2e-lista`)}`);

  // Cartão com próximo passo, barra de etapas e progresso.
  const cardA = page.getByTestId(`content-studio-package-card-${idA}`);
  await expect(cardA).toBeVisible({ timeout: 20_000 });
  await expect(cardA.getByTestId("content-studio-stage-segments")).toBeVisible();
  await expect(page.getByTestId(`content-studio-package-progress-${idA}`)).toContainText("de 5 etapas");
  await expect(page.getByTestId(`content-studio-package-${idA}`)).toContainText("Continuar produção");
  await expect(page.getByTestId(`content-studio-package-${idB}`)).toContainText("Começar produção");
  // PDF só no material com conteúdo.
  await expect(page.getByTestId(`content-studio-package-download-${idA}`)).toBeVisible();
  await expect(page.getByTestId(`content-studio-package-download-${idB}`)).toHaveCount(0);

  // Busca por tema: a URL guarda o termo e só o Beta sobra.
  await page.getByPlaceholder("Buscar por tema ou referência bíblica...").fill(`Beta ${stamp}`);
  await expect(page).toHaveURL(new RegExp(`busca=.*Beta`), { timeout: 10_000 });
  await expect(page.getByTestId(`content-studio-package-card-${idB}`)).toBeVisible();
  await expect(page.getByTestId(`content-studio-package-card-${idA}`)).toHaveCount(0);

  // Arquivar o Beta: confirma, some da lista principal.
  await page.getByTestId(`content-studio-package-archive-${idB}`).click();
  await page.getByTestId("content-studio-archive-confirm").click();
  // Sem conteúdo salvo a API recusa e o motivo aparece no diálogo.
  await expect(page.getByTestId("content-studio-archive-error")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByTestId(`content-studio-package-card-${idB}`)).toBeVisible();

  // Arquivar o Alfa (tem conteúdo) funciona e ele passa a existir só em "Arquivado".
  await page.getByPlaceholder("Buscar por tema ou referência bíblica...").fill(`Alfa ${stamp}`);
  await expect(page.getByTestId(`content-studio-package-card-${idA}`)).toBeVisible({ timeout: 10_000 });
  await page.getByTestId(`content-studio-package-archive-${idA}`).click();
  await page.getByTestId("content-studio-archive-confirm").click();
  await expect(page.getByTestId(`content-studio-package-card-${idA}`)).toHaveCount(0, { timeout: 10_000 });

  await page.goto(`/adm/estudio/producao?busca=${encodeURIComponent(`Alfa ${stamp}`)}&situacao=ARCHIVED`);
  const archived = page.getByTestId(`content-studio-package-card-${idA}`);
  await expect(archived).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(`content-studio-package-${idA}`)).toContainText("Ver material");
  await expect(page.getByTestId(`content-studio-package-archive-${idA}`)).toHaveCount(0);
});

test("baixar o PDF do material pelo cartão", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto(`/adm/estudio/producao?busca=${encodeURIComponent(`Alfa ${stamp}`)}&situacao=ARCHIVED`);
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60_000 }),
    page.getByTestId(`content-studio-package-download-${idA}`).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});

test("ordenação e URL inválida: a lista volta ao padrão sem quebrar", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/estudio/producao?ordem=lixo&faixa=XYZ&situacao=NADA&pagina=-3");
  await expect(page.getByTestId("content-studio-packages-list")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("content-studio-package-" + idB).or(page.getByText("Nenhum material encontrado"))).toBeVisible();
});

test("celular 375px: sem rolagem horizontal e botão de novo material visível", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/adm/estudio/producao");
  await expect(page.getByTestId("content-studio-new-material")).toBeVisible({ timeout: 20_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
