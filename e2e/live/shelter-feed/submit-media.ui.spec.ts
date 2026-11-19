import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, ftruncateSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import { readFeed, setFlag } from "./feed-fixtures";
import { makePng } from "./png";

/**
 * Envio de fotos e vídeo pela TELA (membro) e aprovação pela TELA (admin), com ARQUIVOS REAIS.
 * Cada teste cria os próprios posts (legenda com RUN_TAG) e o `afterAll` os apaga pela API,
 * conferindo 0 linhas em image_sections / media_items.
 */
const VIDEO = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "assets", "visita.mp4"));
const FLAGS = ["shelter_photo_upload", "photo_moderation"] as const;
const PHOTOS_PATH = "/area-do-membro/imagens-abrigo";
const MB = 1024 * 1024;

let admin: LoginResult;
let member: LoginResult;
const flagsBefore: Record<string, boolean> = {};

/** Arquivo esparso (o Playwright não aceita buffer > 50 MB): só o tamanho importa para a validação. */
function sparseFile(dir: string, name: string, bytes: number): string {
  const path = join(dir, name);
  const fd = openSync(path, "w");
  ftruncateSync(fd, bytes);
  closeSync(fd);
  return path;
}

const photo = (name: string, seed: number) => ({ name, mimeType: "image/png", buffer: makePng(640, 480, seed) });
const video = (name = "visita.mp4") => ({ name, mimeType: "video/mp4", buffer: VIDEO });

const sectionsOf = (tag: string) =>
  queryAll<{ id: string; authorId: string | null; public: number; pageId: string | null }>(
    "SELECT id, authorId, public, pageId FROM image_sections WHERE caption LIKE ?",
    [`${tag}%`],
  );

async function openUpload(page: Page, tokens: LoginResult) {
  await seedBrowserSession(page, tokens);
  await page.goto(PHOTOS_PATH);
  await expect(page.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 20_000 });
}

async function fillText(page: Page, caption: string, description: string) {
  await page.getByTestId("shelter-upload-caption").fill(caption);
  await page.getByTestId("shelter-upload-description").fill(description);
}

test.describe.serial("Envio de fotos e vídeo — membro e admin (tela)", () => {
  const tag = `${RUN_TAG}-envio`;
  let sectionId = "";
  let publishedPageId = "";
  let bigDir = "";

  test.beforeAll(async ({ request }) => {
    bigDir = mkdtempSync(join(tmpdir(), "e2e-video-"));
    admin = await loginAs(request, "admin");
    member = await loginAs(request, "member");
    for (const key of FLAGS) {
      flagsBefore[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0) === 1;
      await setFlag(request, admin.accessToken, key, true);
    }
  });

  test.afterAll(async ({ request }) => {
    rmSync(bigDir, { recursive: true, force: true });
    for (const row of await sectionsOf(RUN_TAG)) {
      await request.delete(`${API_URL}/image-sections/${row.id}`, { headers: authHeaders(admin.accessToken) });
      expect(await countRows("image_sections", { id: row.id })).toBe(0);
      expect(await countRows("media_items", { targetId: row.id })).toBe(0);
    }
    expect((await sectionsOf(RUN_TAG)).length).toBe(0);
    for (const key of FLAGS) await setFlag(request, admin.accessToken, key, flagsBefore[key]);
    await closeDb();
  });

  test("[submit#validacoes] sem título, sem descrição, sem mídia, arquivo inválido, vídeo grande, 2º vídeo e 11ª foto: nada é gravado", async ({ page }) => {
    await openUpload(page, member);
    const submit = page.getByTestId("member-photos-submit");
    const error = page.getByTestId("shelter-upload-error");
    const hint = page.getByTestId("shelter-upload-validation");

    await submit.click();
    await expect(error).toHaveText("Preencha o título da publicação.");
    await page.getByTestId("shelter-upload-caption").fill(`${tag} validação`);
    await submit.click();
    await expect(error).toHaveText("Conte um pouco sobre essa visita na descrição.");
    await page.getByTestId("shelter-upload-description").fill("descrição de teste");
    await submit.click();
    await expect(error).toHaveText("Adicione fotos ou um vídeo para compartilhar.");

    // Arquivo que não é foto (PDF) pelo campo de fotos.
    await page.getByTestId("shelter-upload-photos-input").setInputFiles({ name: "doc.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    await expect(hint).toHaveText("Escolha fotos JPG, PNG, WebP ou GIF.");
    await expect(page.getByTestId("shelter-upload-previews")).toHaveCount(0);
    // Foto grande demais (> 10 MB).
    await page.getByTestId("shelter-upload-photos-input").setInputFiles({ name: "enorme.png", mimeType: "image/png", buffer: Buffer.alloc(10 * MB + 1) });
    await expect(hint).toHaveText("Cada foto deve ter até 10 MB e não pode estar vazia.");
    // Vídeo em formato errado e vídeo grande demais (> 100 MB).
    await page.getByTestId("shelter-upload-video-input").setInputFiles({ name: "filme.avi", mimeType: "video/x-msvideo", buffer: Buffer.alloc(32) });
    await expect(hint).toHaveText("Escolha um vídeo MP4, WebM ou MOV.");
    await page.getByTestId("shelter-upload-video-input").setInputFiles(sparseFile(bigDir, "grande.mp4", 100 * MB + 1));
    await expect(hint).toHaveText("O vídeo deve ter até 100 MB e não pode estar vazio.");
    await expect(page.getByTestId("shelter-upload-previews")).toHaveCount(0);

    // Cota: 1 vídeo e 10 fotos por post.
    await page.getByTestId("shelter-upload-video-input").setInputFiles(video());
    await expect(page.getByTestId("shelter-upload-preview-video")).toHaveCount(1);
    await expect(page.getByTestId("shelter-upload-video-button")).toBeDisabled();
    await page.getByTestId("shelter-upload-photos-input").setInputFiles(Array.from({ length: 10 }, (_, i) => photo(`f${i}.png`, i + 1)));
    await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(10);
    await expect(page.getByTestId("shelter-upload-photos-button")).toBeDisabled();
    await expect(page.getByTestId("shelter-upload-photos-count")).toHaveText("10/10 fotos");
    // Remover uma foto libera a cota; a 11ª foto escolhida de uma vez é recusada.
    await page.getByTestId("shelter-upload-preview-photo").first().getByTestId("shelter-upload-remove").click();
    await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(9);
    await page.getByTestId("shelter-upload-photos-input").setInputFiles([photo("a.png", 21), photo("b.png", 22)]);
    await expect(hint).toHaveText("Selecione no máximo 10 fotos por publicação.");
    await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(9);

    // Só os posts deste cenário (outros testes escrevem em paralelo no mesmo banco).
    expect((await sectionsOf(RUN_TAG)).length).toBe(0);
  });

  test("[submit#erro-servidor] a API recusa (vídeo falso): mensagem clara e os arquivos continuam na tela", async ({ page }) => {
    await openUpload(page, member);
    await fillText(page, `${tag} falso`, "o arquivo tem nome de vídeo, mas não é vídeo");
    await page.getByTestId("shelter-upload-video-input").setInputFiles({ name: "falso.mp4", mimeType: "video/mp4", buffer: Buffer.alloc(2048) });
    await page.getByTestId("shelter-upload-photos-input").setInputFiles(photo("ok.png", 5));
    await page.getByTestId("member-photos-submit").click();
    await expect(page.getByTestId("shelter-upload-error")).toContainText(/MP4, WebM ou MOV/);
    await expect(page.getByTestId("shelter-upload-success")).toHaveCount(0);
    await expect(page.getByTestId("shelter-upload-preview-video")).toHaveCount(1);
    await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(1);
    await expect(page.getByTestId("shelter-upload-caption")).toHaveValue(`${tag} falso`);
    await expect(page.getByTestId("member-photos-submit")).toBeEnabled();
    expect((await sectionsOf(RUN_TAG)).length).toBe(0);
  });

  test("[submit#envio] o membro envia 2 fotos + 1 vídeo pela tela: sucesso, post pendente com autor e 3 mídias", async ({ page }) => {
    await openUpload(page, member);
    await fillText(page, `${tag} visita`, "Visita ao abrigo com 2 fotos e 1 vídeo");
    await page.getByTestId("shelter-upload-photos-input").setInputFiles([photo("um.png", 1), photo("dois.png", 2)]);
    await page.getByTestId("shelter-upload-video-input").setInputFiles(video());
    await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(2);
    await expect(page.getByTestId("shelter-upload-preview-video")).toHaveCount(1);
    await expect(page.getByTestId("shelter-upload-videos-count")).toHaveText("1/1 vídeo");

    await page.getByTestId("member-photos-submit").click();
    await expect(page.getByTestId("shelter-upload-success")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Seu momento foi enviado!")).toBeVisible();
    await expect(page.getByTestId("shelter-upload-go-feed")).toBeVisible();

    const rows = await sectionsOf(tag);
    expect(rows).toHaveLength(1);
    sectionId = rows[0].id;
    expect(rows[0]).toMatchObject({ authorId: member.userId, public: 0, pageId: null });
    const media = await queryAll<{ mediaType: string }>("SELECT mediaType FROM media_items WHERE targetId = ?", [sectionId]);
    expect(media.map((m) => m.mediaType).sort()).toEqual(["image", "image", "video"]);

    // "Enviar outro momento" volta ao formulário limpo.
    await page.getByTestId("shelter-upload-send-another").click();
    await expect(page.getByTestId("shelter-upload-caption")).toHaveValue("");
    await expect(page.getByTestId("shelter-upload-previews")).toHaveCount(0);
  });

  test("[submit#admin] o admin vê o pendente com vídeo na fila, confere os detalhes e aprova pela tela", async ({ page }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm/fotos-abrigos");
    const card = page.getByTestId("image-section-card").filter({ hasText: `${tag} visita` });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.getByTestId("image-section-media-summary")).toHaveText("2 fotos + 1 vídeo");

    await card.getByTestId("image-section-view").click();
    const details = page.getByTestId("image-section-details");
    await expect(details.getByTestId("image-section-details-author")).toContainText(/Enviado por: E2E/);
    await expect(details.getByTestId("shelter-video")).toHaveCount(1);
    await expect(details.getByTestId("shelter-video")).toHaveAttribute("src", /^https?:\/\//);
    await expect(details.locator("img")).toHaveCount(2);
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();

    await card.getByTestId("image-section-edit").click();
    await expect(page.getByTestId("image-sections-image-section-editor-admin")).toBeVisible();
    await expect(page.getByTestId("shelter-video")).toHaveCount(1);
    await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(2);
    await expect(page.getByTestId("image-section-admin-media-summary")).toHaveText("2 fotos + 1 vídeo");
    // O admin ajusta a legenda antes de publicar.
    await page.getByTestId("shelter-upload-caption").fill(`${tag} visita (revisada)`);
    await page.getByTestId("image-section-admin-approve").click();
    await expect(page).toHaveURL(/\/adm\/fotos-abrigos$/, { timeout: 30_000 });

    const row = await queryOne<{ public: number; pageId: string | null; caption: string; authorId: string }>(
      "SELECT public, pageId, caption, authorId FROM image_sections WHERE id = ?",
      [sectionId],
    );
    expect(row).toMatchObject({ public: 1, caption: `${tag} visita (revisada)`, authorId: member.userId });
    expect(row!.pageId).toBeTruthy();
    publishedPageId = row!.pageId!;
    // Os tipos sobreviveram à edição (antes o admin regravava tudo como imagem).
    const media = await queryAll<{ mediaType: string }>("SELECT mediaType FROM media_items WHERE targetId = ?", [sectionId]);
    expect(media.map((m) => m.mediaType).sort()).toEqual(["image", "image", "video"]);
    // Já não está na fila de revisão.
    await expect(page.getByTestId("image-section-card").filter({ hasText: `${tag} visita` })).toHaveCount(0);
  });

  test("[submit#feed-api] publicado: o visitante e o membro leem o post no feed da galeria, com as 3 mídias", async ({ request }: { request: APIRequestContext }) => {
    for (const token of [undefined, member.accessToken]) {
      const feed = await readFeed(request, publishedPageId, token, 100);
      expect(feed.map((s) => s.id)).toContain(sectionId);
    }
    const res = await request.get(`${API_URL}/image-pages/${publishedPageId}/sections?page=1&limit=100`);
    const body = (await res.json()) as { sections: Array<{ id: string; mediaItems: Array<{ mediaType: string }> }> };
    const post = body.sections.find((s) => s.id === sectionId)!;
    expect(post.mediaItems.map((m) => m.mediaType).sort()).toEqual(["image", "image", "video"]);
  });

  test("[submit#feed-ui] o post aparece no feed (tela) para o visitante", async ({ page }) => {
    await page.goto(`/feed-abrigos?galeria=${publishedPageId}`);
    await expect(page.locator(`[data-section-id="${sectionId}"]`).first()).toBeVisible({ timeout: 25_000 });
  });

  test("[submit#mobile] @mobile celular 375x812: sem rolagem horizontal, alvos >= 44px e envio por toque de foto + vídeo", async ({ page }) => {
    await openUpload(page, member);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);

    for (const id of ["shelter-upload-photos-button", "shelter-upload-video-button", "member-photos-submit", "member-photos-cancel"]) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box!.height, id).toBeGreaterThanOrEqual(44);
    }
    await fillText(page, `${tag} celular`, "enviado do celular");
    await page.getByTestId("shelter-upload-photos-input").setInputFiles([photo("c1.png", 7), photo("c2.png", 8)]);
    await page.getByTestId("shelter-upload-video-input").setInputFiles(video());
    await expect(page.getByTestId("shelter-upload-preview-video")).toBeVisible();
    for (const remove of await page.getByTestId("shelter-upload-remove").all()) {
      const box = await remove.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await overflow()).toBeLessThanOrEqual(0);

    await page.getByTestId("member-photos-submit").tap();
    await expect(page.getByTestId("shelter-upload-success")).toBeVisible({ timeout: 60_000 });
    expect(await overflow()).toBeLessThanOrEqual(0);
    const rows = await sectionsOf(`${tag} celular`);
    expect(rows).toHaveLength(1);
    expect(await countRows("media_items", { targetId: rows[0].id })).toBe(3);
  });
});
