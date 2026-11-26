import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import { readFeed, setFlag } from "./feed-fixtures";
import { makePng } from "./png";

/**
 * Reprovar e reenviar, pela TELA: membro envia → admin reprova com motivo (obrigatório) → o membro vê o
 * motivo em "Minhas publicações" → a publicação não aparece no feed → o membro reenvia → o admin aprova →
 * aparece no feed. Os posts são do cenário e saem no `afterAll` (0 linhas conferidas).
 */
const VIDEO = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "assets", "visita.mp4"));
const FLAGS = ["shelter_photo_upload", "photo_moderation"] as const;
const PHOTOS_PATH = "/area-do-membro/imagens-abrigo";
const REASON = "A foto 1 mostra o rosto de uma criança. Envie sem rostos, por favor.";

let admin: LoginResult;
let member: LoginResult;
const flagsBefore: Record<string, boolean> = {};

const idsOf = (tag: string) => queryAll<{ id: string; reviewStatus: string; pageId: string | null }>("SELECT id, reviewStatus, pageId FROM image_sections WHERE caption LIKE ?", [`${tag}%`]);

async function sendFromScreen(page: Page, caption: string) {
  await page.getByTestId("shelter-upload-caption").fill(caption);
  await page.getByTestId("shelter-upload-description").fill("enviado pelo cenário de reprovação");
  await page.getByTestId("shelter-upload-photos-input").setInputFiles({ name: "um.png", mimeType: "image/png", buffer: makePng(640, 480, 11) });
  await page.getByTestId("shelter-upload-video-input").setInputFiles({ name: "visita.mp4", mimeType: "video/mp4", buffer: VIDEO });
  await page.getByTestId("member-photos-submit").click();
  await expect(page.getByTestId("shelter-upload-success")).toBeVisible({ timeout: 60_000 });
}

test.describe.serial("Reprovar, ver o motivo, reenviar e aprovar (tela)", () => {
  const tag = `${RUN_TAG}-revisao`;
  let firstId = "";
  let secondId = "";

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    member = await loginAs(request, "member");
    for (const key of FLAGS) {
      flagsBefore[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0) === 1;
      await setFlag(request, admin.accessToken, key, true);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const row of await idsOf(RUN_TAG)) {
      await request.delete(`${API_URL}/image-sections/${row.id}`, { headers: authHeaders(admin.accessToken) });
      expect(await countRows("image_sections", { id: row.id })).toBe(0);
      expect(await countRows("media_items", { targetId: row.id })).toBe(0);
    }
    expect((await idsOf(RUN_TAG)).length).toBe(0);
    for (const key of FLAGS) await setFlag(request, admin.accessToken, key, flagsBefore[key]);
    await closeDb();
  });

  test("[review#1] o membro envia e vê a publicação como 'Aguardando aprovação'", async ({ page }) => {
    await seedBrowserSession(page, member);
    await page.goto(PHOTOS_PATH);
    await expect(page.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 20_000 });
    await sendFromScreen(page, `${tag} primeira`);
    const rows = await idsOf(`${tag} primeira`);
    expect(rows).toHaveLength(1);
    firstId = rows[0].id;
    const item = page.locator(`[data-testid="my-image-section"][data-section-id="${firstId}"]`);
    await expect(item).toBeVisible();
    await expect(item.getByTestId("my-image-section-status")).toHaveText("Aguardando aprovação");
    await expect(item.getByTestId("my-image-section-reason")).toHaveCount(0);
  });

  test("[review#2] o admin exige o motivo e reprova pela tela; a publicação sai da fila de pendentes com o motivo", async ({ page }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm/fotos-abrigos");
    const card = page.getByTestId("image-section-card").filter({ hasText: `${tag} primeira` });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.getByTestId("image-section-reject").click();
    const dialog = page.getByTestId("reject-image-section-dialog");
    await expect(dialog).toBeVisible();

    // Sem motivo: bloqueia, mostra o erro e nada é gravado.
    await dialog.getByTestId("reject-image-section-confirm").click();
    await expect(dialog).toContainText("Informe o motivo da reprovação.");
    expect((await idsOf(`${tag} primeira`))[0].reviewStatus).toBe("pending");
    // Contador e alvos de toque de 44px.
    await dialog.getByTestId("reject-image-section-reason").fill(REASON);
    await expect(dialog).toContainText(`${REASON.length}/500`);
    for (const id of ["reject-image-section-confirm", "reject-image-section-cancel"]) {
      expect((await dialog.getByTestId(id).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await dialog.getByTestId("reject-image-section-confirm").click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });

    const row = await queryOne<{ reviewStatus: string; rejectionReason: string; reviewedById: string }>("SELECT reviewStatus, rejectionReason, reviewedById FROM image_sections WHERE id = ?", [firstId]);
    expect(row).toMatchObject({ reviewStatus: "rejected", rejectionReason: REASON, reviewedById: admin.userId });
    // Na fila do admin ela aparece como reprovada, com o motivo e sem o botão de reprovar de novo.
    const rejected = page.getByTestId("image-section-card").filter({ hasText: `${tag} primeira` });
    await expect(rejected.getByTestId("image-section-status")).toHaveText("Reprovada");
    await expect(rejected.getByTestId("image-section-rejection-reason")).toContainText(REASON);
    await expect(rejected.getByTestId("image-section-reject")).toHaveCount(0);
  });

  test("[review#3] o membro vê o motivo na área dele e a publicação não está em nenhum feed", async ({ page, request }) => {
    await seedBrowserSession(page, member);
    await page.goto(PHOTOS_PATH);
    const item = page.locator(`[data-testid="my-image-section"][data-section-id="${firstId}"]`);
    await expect(item).toBeVisible({ timeout: 20_000 });
    await expect(item.getByTestId("my-image-section-status")).toHaveText("Reprovada");
    await expect(item.getByTestId("my-image-section-reason")).toContainText(REASON);
    expect((await idsOf(`${tag} primeira`))[0].pageId).toBeNull();
    const galleries = await queryAll<{ id: string }>("SELECT id FROM image_pages");
    for (const gallery of galleries) {
      for (const token of [undefined, member.accessToken, admin.accessToken]) {
        expect((await readFeed(request, gallery.id, token, 100)).map((s) => s.id)).not.toContain(firstId);
      }
    }
    // Reenvia (nova publicação) pelo mesmo formulário.
    await expect(page.getByTestId("shelter-upload-editor")).toBeVisible();
    await sendFromScreen(page, `${tag} segunda`);
    const rows = await idsOf(`${tag} segunda`);
    expect(rows).toHaveLength(1);
    secondId = rows[0].id;
    await expect(page.locator(`[data-testid="my-image-section"][data-section-id="${firstId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="my-image-section"][data-section-id="${secondId}"]`).getByTestId("my-image-section-status")).toHaveText("Aguardando aprovação");
  });

  test("[review#4] o admin aprova a nova: aparece no feed e o membro vê 'Aprovada'", async ({ page, request }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm/fotos-abrigos");
    const card = page.getByTestId("image-section-card").filter({ hasText: `${tag} segunda` });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.getByTestId("image-section-edit").click();
    await expect(page.getByTestId("image-section-admin-reject")).toBeVisible();
    await page.getByTestId("image-section-admin-approve").click();
    await expect(page).toHaveURL(/\/adm\/fotos-abrigos$/, { timeout: 30_000 });

    const row = (await idsOf(`${tag} segunda`))[0];
    expect(row).toMatchObject({ id: secondId, reviewStatus: "approved" });
    expect(row.pageId).toBeTruthy();
    expect((await readFeed(request, row.pageId!, undefined, 100)).map((s) => s.id)).toContain(secondId);
    expect((await readFeed(request, row.pageId!, member.accessToken, 100)).map((s) => s.id)).not.toContain(firstId);

    await seedBrowserSession(page, member);
    await page.goto(PHOTOS_PATH);
    await expect(page.locator(`[data-testid="my-image-section"][data-section-id="${secondId}"]`).getByTestId("my-image-section-status")).toHaveText("Aprovada", { timeout: 20_000 });
  });

  test("[review#mobile] @mobile 375x812: 'Minhas publicações' e o diálogo de reprovação sem rolagem horizontal, com alvos >= 44px", async ({ page, request }) => {
    // Autossuficiente (o projeto mobile roda só este teste): uma publicação reprovada criada pela API.
    const created = await request.post(`${API_URL}/image-sections`, {
      headers: authHeaders(member.accessToken),
      multipart: {
        sectionData: JSON.stringify({
          caption: `${tag} mobile-reprovada com um título bem comprido para testar a quebra de linha no celular`,
          description: "d",
          public: false,
          mediaItems: [{ title: "f", description: "", uploadType: "upload", mediaType: "image", isLocalFile: true, fieldKey: "a", originalName: "a.png" }],
        }),
        a: { name: "a.png", mimeType: "image/png", buffer: makePng(320, 240, 13) },
      },
    });
    expect(created.status()).toBe(201);
    firstId = ((await created.json()) as { id: string }).id;
    const rejected = await request.patch(`${API_URL}/image-sections/${firstId}/reject`, { headers: authHeaders(admin.accessToken), data: { reason: REASON } });
    expect(rejected.status()).toBe(200);

    await seedBrowserSession(page, member);
    await page.goto(PHOTOS_PATH);
    await expect(page.getByTestId("my-image-sections")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(`[data-testid="my-image-section"][data-section-id="${firstId}"]`).getByTestId("my-image-section-reason")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    // Uma pendente nova para abrir o diálogo do admin no celular.
    const caption = `${tag} celular`;
    await page.getByTestId("shelter-upload-caption").fill(caption);
    await page.getByTestId("shelter-upload-description").fill("celular");
    await page.getByTestId("shelter-upload-photos-input").setInputFiles({ name: "c.png", mimeType: "image/png", buffer: makePng(640, 480, 12) });
    await page.getByTestId("member-photos-submit").tap();
    await expect(page.getByTestId("shelter-upload-success")).toBeVisible({ timeout: 60_000 });

    await seedBrowserSession(page, admin);
    await page.goto("/adm/fotos-abrigos");
    const card = page.getByTestId("image-section-card").filter({ hasText: caption });
    await expect(card).toBeVisible({ timeout: 20_000 });
    expect((await card.getByTestId("image-section-reject").boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await card.getByTestId("image-section-reject").tap();
    const dialog = page.getByTestId("reject-image-section-dialog");
    await expect(dialog).toBeVisible();
    const box = (await dialog.locator(".MuiDialog-paper").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    await dialog.getByTestId("reject-image-section-reason").fill("Muito escura");
    await dialog.getByTestId("reject-image-section-confirm").tap();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
    expect((await idsOf(caption))[0].reviewStatus).toBe("rejected");
  });
});
