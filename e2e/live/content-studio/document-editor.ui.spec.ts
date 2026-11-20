import { API_URL } from "../../../playwright.live.config";
import { closeDb, expectRow, queryOne } from "../support/db";
import type { APIRequestContext, Page } from "@playwright/test";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";

/**
 * Editor de documento do Estúdio na tela: escrever no editor rico, salvar (nova versão com `contentDocument`),
 * ver o PDF real e baixar DOCX/PDF. O material criado é arquivado ao final.
 */
const FLAGS = ["content_studio"] as const;
const before: Record<string, number> = {};
let admin = "";
let packageId = "";
let stageId = "";

type Pkg = { id: string; tracks: Array<{ audience: string; stages: Array<{ id: string; stageType: string }> }> };

test.beforeAll(async ({ request }) => {
  admin = (await loginAs(request, "admin")).accessToken;
  for (const key of FLAGS) {
    before[key] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0;
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: true } });
  }
  const res = await request.post(`${API_URL}/content-studio/packages`, {
    headers: authHeaders(admin),
    data: { theme: `e2e-editor ${Date.now()}`, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" },
  });
  const pkg = (await res.json()) as Pkg;
  packageId = pkg.id;
  const child = pkg.tracks.find((t) => t.audience === "CHILD")!;
  stageId = child.stages.find((s) => s.stageType === "LESSON")!.id;
  await request.patch(`${API_URL}/content-studio/packages/${packageId}/stages/${stageId}/content`, {
    headers: authHeaders(admin),
    data: { structuredContent: { title: "Deus cuida de nós", biblicalReference: "Salmos 23", opening: "Bem-vindos!" } },
  });
});

test.afterAll(async ({ request }) => {
  if (packageId) await request.post(`${API_URL}/content-studio/packages/${packageId}/archive`, { headers: authHeaders(admin) });
  for (const key of FLAGS) {
    await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before[key] === 1 } });
  }
  await closeDb();
});

test("escrever no documento, salvar, ver o PDF e baixar", async ({ page, request }) => {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto(`/adm/estudio/pacotes/${packageId}?audience=CHILD&stage=LESSON`);

  // O documento começa montado dos campos.
  await expect(page.getByTestId("content-studio-doc-origin")).toHaveText("Montado a partir dos campos", { timeout: 20_000 });
  const editor = page.locator(".ProseMirror").first();
  await expect(editor).toContainText("Deus cuida de nós");

  // Escreve à mão: aparece "não salvas" e o botão habilita.
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type(" Texto escrito no editor rico.");
  await expect(page.getByTestId("content-studio-doc-dirty")).toBeVisible();
  await page.getByTestId("content-studio-doc-save").click();

  await expect(page.getByTestId("content-studio-feedback")).toContainText("Documento salvo");
  await expect(page.getByTestId("content-studio-doc-origin")).toHaveText("Documento editado à mão");
  const saved = await expectRow<{ contentDocument: string }>("content_versions", { stage_id: stageId, versionNumber: 2 });
  expect(JSON.stringify(saved.contentDocument)).toContain("Texto escrito no editor rico");

  // PDF real na aba PDF.
  await page.getByTestId("content-studio-pdf-tab-button").click();
  // Com visualizador de PDF no navegador a prévia entra na página; sem ele (Chromium de teste) aparece "Abrir PDF".
  await expect(page.getByTestId("content-studio-pdf-frame").or(page.getByTestId("content-studio-pdf-open"))).toBeVisible({ timeout: 60_000 });

  // Downloads.
  const [docx] = await Promise.all([page.waitForEvent("download"), page.getByTestId("content-studio-download-docx").click()]);
  expect(docx.suggestedFilename()).toMatch(/\.docx$/);
  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByTestId("content-studio-download-pdf").click()]);
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);

  // Exportação da faixa pelo menu do cabeçalho.
  await page.getByTestId("content-studio-export-menu").click();
  const [track] = await Promise.all([page.waitForEvent("download"), page.getByTestId("content-studio-export-track-pdf").click()]);
  expect(track.suggestedFilename()).toMatch(/criancas\.pdf$/);
});

test("identidade visual das lições: cabeçalho com logo e etiqueta, tabela amarela, e fecho em página nova", async ({ page, request }) => {
  // Material próprio (o documento do outro teste foi editado à mão e perdeu blocos).
  const created = (await (
    await request.post(`${API_URL}/content-studio/packages`, {
      headers: authHeaders(admin),
      data: { theme: `e2e-identidade ${Date.now()}`, biblicalReferences: "Salmos 23", canonicalObjective: "Confiar em Deus" },
    })
  ).json()) as Pkg;
  try {
    const child = created.tracks.find((t) => t.audience === "CHILD")!;
    const lesson = child.stages.find((s) => s.stageType === "LESSON")!.id;
    await request.patch(`${API_URL}/content-studio/packages/${created.id}/stages/${lesson}/content`, {
      headers: authHeaders(admin),
      data: { structuredContent: { title: "Deus cuida de nós", biblicalReference: "Salmos 23", visitObjectives: "Mostrar que Deus cuida." } },
    });
    await checkIdentity(page, request, created.id);
  } finally {
    await request.post(`${API_URL}/content-studio/packages/${created.id}/archive`, { headers: authHeaders(admin) });
  }
});

async function checkIdentity(page: Page, request: APIRequestContext, id: string): Promise<void> {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto(`/adm/estudio/pacotes/${id}?audience=CHILD&stage=LESSON`);
  await expect(page.locator(".ProseMirror").first()).toContainText("Deus cuida de nós", { timeout: 20_000 });

  // Cabeçalho da folha: logo do ministério e etiqueta da categoria (azul), como nas lições SAICA/Pequeno Nazareno.
  const header = page.getByTestId("content-studio-doc-sheet-header");
  await expect(header.getByRole("img", { name: "Ministério de Orfanato" })).toBeVisible();
  await expect(page.getByTestId("content-studio-doc-sheet-tag")).toHaveText("Crianças");
  await expect(page.getByTestId("content-studio-doc-sheet-tag")).toHaveCSS("background-color", "rgb(0, 71, 171)");

  // Título grande à esquerda com a linha vermelha; tabela de dados com cabeçalho amarelo e borda preta.
  await expect(page.locator(".ProseMirror h1").first()).toHaveCSS("border-bottom-color", "rgb(227, 6, 19)");
  const yellow = page.locator(".ProseMirror th").first();
  await expect(yellow).toHaveCSS("background-color", "rgb(255, 212, 0)");
  await expect(yellow).toHaveCSS("border-top-color", "rgb(0, 0, 0)");

  // Fecho de toda lição: começa em página nova com o logo "Foi por você", a chamada à oração, as faixas e a arte dos 7 passos.
  await expect(page.locator("[data-page-break]")).toHaveCount(1);
  await expect(page.locator('[data-brand-logo="foi-por-voce"] img')).toBeVisible();
  await expect(page.locator(".ProseMirror")).toContainText("Após a leitura, ore! Peça para que Deus fale contigo!");
  await expect(page.locator(".ProseMirror")).toContainText("Agora é hora de pôr as mãos a serviço do Senhor!!!");
  await expect(page.locator("[data-color-bars]")).toHaveCount(2);
  await expect(page.locator(".ProseMirror h2", { hasText: "MEDITANDO E ORGANIZANDO" })).toBeVisible();
  await expect(page.locator('[data-brand-logo="sete-passos"] img')).toBeVisible();
  // O versículo e as brincadeiras têm etapa própria: não entram no fecho.
  await expect(page.locator(".ProseMirror")).not.toContainText("BRINCADEIRAS");
  // A ordem é a pedida: quebra de página -> logo -> chamada -> faixa -> título da meditação.
  const order = await page.locator(".ProseMirror").evaluate((editor) =>
    Array.from(editor.children)
      .map((child) =>
        child.hasAttribute("data-page-break") ? "pageBreak" : child.hasAttribute("data-brand-logo") ? `logo:${child.getAttribute("data-brand-logo")}` : child.hasAttribute("data-color-bars") ? "bars" : child.tagName === "H2" ? `h2:${child.textContent}` : "",
      )
      .filter(Boolean),
  );
  const at = order.indexOf("pageBreak");
  expect(order.slice(at, at + 5)).toEqual(["pageBreak", "logo:foi-por-voce", "bars", "h2:MEDITANDO E ORGANIZANDO", "bars"]);
}
