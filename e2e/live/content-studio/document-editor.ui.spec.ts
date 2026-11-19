import { API_URL } from "../../../playwright.live.config";
import { closeDb, expectRow, queryOne } from "../support/db";
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
