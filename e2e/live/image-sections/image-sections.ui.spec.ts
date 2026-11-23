import type { Locator, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, listObjects, snapshotBucket } from "../support/s3";
import { keyFromUrl } from "../support/s3-invariants";
import { s3Config } from "../support/env";
import { makePng } from "../shelter-feed/png";
import {
  SECTION_FLAGS,
  deleteRaw,
  getRaw,
  mediaRows,
  mediaWithTag,
  pendingCount,
  png,
  sectionRow,
  sectionsWithTag,
  snapshotDb,
  submit,
  type SectionBody,
} from "./support";

/**
 * Plano 32 — as TELAS de fotos dos abrigos contra a pilha real (nenhum `page.route`): o membro envia em
 * `/area-do-membro/imagens-abrigo`, o admin revê em `/adm/fotos-abrigos`. Cada cenário prova o efeito por SELECT, os
 * negativos provam banco e bucket inalterados e o `afterAll` confere 0 linhas e 0 órfãos.
 */
const MEMBER_PATH = "/area-do-membro/imagens-abrigo";
const ADMIN_PATH = "/adm/fotos-abrigos";
const BADGE = '[data-testid="image-sections-pending-badge"]';
const MIN_TOUCH_PX = 44;

test.describe.serial("Fotos dos abrigos — telas (front → API → banco)", () => {
  const tag = tagged("ui");
  let admin: LoginResult;
  let leader: LoginResult;
  let member: LoginResult;
  const flagsBefore: Record<string, boolean> = {};
  const created = new Set<string>();
  let counter = 0;
  const label = (name: string): string => `${tag}-${name}-${(counter += 1)}`;

  const setFlag = (request: import("@playwright/test").APIRequestContext, key: string, enabled: boolean) =>
    request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled } });

  /** Publicação pendente do usuário, criada pela API (a tela de revisão precisa de dados reais). */
  const seed = async (request: import("@playwright/test").APIRequestContext, who: LoginResult, caption: string): Promise<SectionBody> => {
    const body = await submit(request, who.accessToken, { caption, media: [{ file: png("seed.png") }] });
    created.add(body.id);
    return body;
  };

  const card = (page: Page, caption: string): Locator => page.getByTestId("image-section-card").filter({ hasText: caption });

  const openAdmin = async (page: Page): Promise<void> => {
    await seedBrowserSession(page, admin);
    await page.goto(ADMIN_PATH);
    await expect(page.getByTestId("image-sections-manager")).toBeVisible({ timeout: 20_000 });
  };

  const searchFor = async (page: Page, text: string): Promise<void> => {
    await page.getByTestId("image-sections-toolbar-search").fill(text);
  };

  const noHorizontalScroll = async (page: Page): Promise<void> => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "rolagem horizontal no mobile").toBeLessThanOrEqual(1);
  };

  const expectTouchTarget = async (locator: Locator, name: string): Promise<void> => {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    expect(box, `${name} sem caixa`).not.toBeNull();
    expect(box!.height, `${name} abaixo de ${MIN_TOUCH_PX}px`).toBeGreaterThanOrEqual(MIN_TOUCH_PX);
  };

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    leader = await loginAs(request, "leader");
    member = await loginAs(request, "member");
    for (const key of SECTION_FLAGS) {
      flagsBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0) === 1;
      await setFlag(request, key, true);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deleteRaw(request, admin.accessToken, id);
    for (const key of SECTION_FLAGS) await setFlag(request, key, flagsBefore[key]);
    expect(await sectionsWithTag(RUN_TAG), "a limpeza deixou publicações do E2E").toBe(0);
    expect(await mediaWithTag(RUN_TAG), "a limpeza deixou mídias do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  test("[ui#envio] o membro envia 2 fotos pela tela: o banco grava pendente, sem galeria, com o autor e as mídias; recarregar mostra o mesmo em 'Minhas publicações'", async ({ page }) => {
    const caption = label("envio");
    await seedBrowserSession(page, member);
    await page.goto(MEMBER_PATH);
    await expect(page.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("shelter-upload-caption").fill(caption);
    await page.getByTestId("shelter-upload-description").fill("Visita enviada pelo cenário de UI");
    await page.getByTestId("shelter-upload-photos-input").setInputFiles([
      { name: "um.png", mimeType: "image/png", buffer: makePng(640, 480, 1) },
      { name: "dois.png", mimeType: "image/png", buffer: makePng(640, 480, 2) },
    ]);
    await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(2);
    await page.getByTestId("member-photos-submit").click();
    await expect(page.getByTestId("shelter-upload-success")).toBeVisible({ timeout: 60_000 });

    const row = await queryOne<{ id: string }>("SELECT id FROM image_sections WHERE caption = ?", [caption]);
    expect(row).not.toBeNull();
    created.add(row!.id);
    expect(await sectionRow(row!.id)).toMatchObject({ authorId: member.userId, public: 0, pageId: null, reviewStatus: "pending" });
    const media = await mediaRows(row!.id);
    expect(media).toHaveLength(2);
    const keys = await listObjects();
    for (const item of media) expect(keys).toContain(keyFromUrl(item.url, s3Config().bucket));

    await page.reload();
    await expect(page.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 20_000 });
    const mine = page.locator(`[data-testid="my-image-section"][data-section-id="${row!.id}"]`);
    await expect(mine).toBeVisible();
    await expect(mine).toHaveAttribute("data-status", "pending");
    await expect(mine.getByTestId("my-image-section-status")).toHaveText("Aguardando aprovação");
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[ui#erro-api] a API recusa o envio (vídeo falso): a mensagem vem da API, os arquivos continuam na tela e NADA é gravado nem sobe ao bucket", async ({ page }) => {
    const caption = label("erro");
    await seedBrowserSession(page, member);
    await page.goto(MEMBER_PATH);
    await expect(page.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("shelter-upload-caption").fill(caption);
    await page.getByTestId("shelter-upload-description").fill("o arquivo tem nome de vídeo, mas não é vídeo");
    await page.getByTestId("shelter-upload-video-input").setInputFiles({ name: "falso.mp4", mimeType: "video/mp4", buffer: Buffer.alloc(2048) });
    await page.getByTestId("shelter-upload-photos-input").setInputFiles({ name: "ok.png", mimeType: "image/png", buffer: makePng(320, 240, 4) });

    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    await page.getByTestId("member-photos-submit").click();
    await expect(page.getByTestId("shelter-upload-error")).toContainText(/MP4, WebM ou MOV/);
    await expect(page.getByTestId("shelter-upload-success")).toHaveCount(0);
    await expect(page.getByTestId("shelter-upload-preview-video")).toHaveCount(1);
    await expect(page.getByTestId("member-photos-submit")).toBeEnabled();
    expect(await snapshotDb()).toEqual(before);
    expect(await sectionsWithTag(caption)).toBe(0);
    await expectBucketUnchanged(bucket);
  });

  test("[ui#vazio] sem publicações do autor a lista mostra o vazio; no painel, uma busca sem resultado mostra o vazio e limpar a busca devolve a fila", async ({ page }) => {
    // Quem ainda não enviou nada vê o estado vazio (a conferência vem do SELECT, não de suposição).
    const ownRows = await countRows("image_sections", { authorId: leader.userId });
    await seedBrowserSession(page, leader);
    await page.goto(MEMBER_PATH);
    await expect(page.getByTestId("my-image-sections")).toBeVisible({ timeout: 20_000 });
    if (ownRows === 0) await expect(page.getByTestId("my-image-sections-empty")).toBeVisible();
    else await expect(page.getByTestId("my-image-section").first()).toBeVisible();

    const caption = label("vazio");
    await seed(page.request, member, caption);
    await openAdmin(page);
    await searchFor(page, `${tag}-nada-com-este-texto`);
    await expect(page.getByTestId("image-sections-empty")).toBeVisible();
    await expect(page.getByTestId("image-section-card")).toHaveCount(0);
    await page.getByTestId("image-sections-toolbar-clear").click();
    await expect(page.getByTestId("image-sections-empty")).toHaveCount(0);
    await searchFor(page, caption);
    await expect(card(page, caption)).toHaveCount(1);
  });

  test("[ui#fila] o painel lista as pendentes como o SELECT, a busca filtra e o selo do menu mostra a mesma contagem", async ({ page, request }) => {
    const first = await seed(request, member, label("fila-membro"));
    const second = await seed(request, leader, label("fila-lider"));
    await openAdmin(page);
    await searchFor(page, `${tag}-fila`);
    await expect(page.getByTestId("image-section-card")).toHaveCount(2);
    for (const body of [first, second]) {
      const item = card(page, body.caption);
      await expect(item).toHaveCount(1);
      await expect(item.getByTestId("image-section-status")).toHaveText("Aguardando aprovação");
      await expect(item.getByTestId("image-section-media-summary")).toHaveText("1 foto");
    }
    const expected = await pendingCount();
    await expect(page.locator(BADGE).first()).toHaveAttribute("data-count", String(expected), { timeout: 20_000 });
    // O mesmo número que a API entrega (e o que o SELECT conta).
    const api = await getRaw(request, admin.accessToken, "/pending-count");
    expect(((await api.json()) as { pending: number }).pending).toBe(expected);
  });

  test("[ui#aprovar] o admin edita e aprova pela tela: vai à galeria do feed, fica pública, o revisor é gravado e o selo cai em 1", async ({ page, request }) => {
    const pending = await seed(request, member, label("aprovar"));
    await openAdmin(page);
    await searchFor(page, pending.caption);
    const before = await pendingCount();
    await card(page, pending.caption).getByTestId("image-section-edit").click();
    await expect(page.getByTestId("image-sections-image-section-editor-admin")).toBeVisible();
    await expect(page.getByTestId("image-section-admin-status")).toHaveText("Aguardando aprovação");
    await expect(page.getByTestId("image-section-admin-author")).toContainText("Enviado por:");
    await page.getByTestId("shelter-upload-caption").fill(`${pending.caption} (revisada)`);
    await page.getByTestId("image-section-admin-approve").click();
    await expect(page).toHaveURL(/\/adm\/fotos-abrigos$/, { timeout: 30_000 });

    const row = await sectionRow(pending.id);
    expect(row).toMatchObject({
      caption: `${pending.caption} (revisada)`,
      public: 1,
      authorId: member.userId,
      reviewStatus: "approved",
      reviewedById: admin.userId,
    });
    expect(row?.pageId).toBeTruthy();
    expect(await mediaRows(pending.id)).toHaveLength(1);
    expect(await pendingCount()).toBe(before - 1);
    await searchFor(page, pending.caption);
    await expect(card(page, pending.caption)).toHaveCount(0); // já saiu da fila
    await expect(page.locator(BADGE).first()).toHaveAttribute("data-count", String(before - 1), { timeout: 20_000 });
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[ui#reprovar] o admin reprova pela tela: motivo obrigatório; o banco guarda reprovada, motivo e revisor e o selo cai; o autor vê o motivo", async ({ page, request }) => {
    const pending = await seed(request, member, label("reprovar"));
    await openAdmin(page);
    await searchFor(page, pending.caption);
    const before = await pendingCount();
    await card(page, pending.caption).getByTestId("image-section-reject").click();
    const dialog = page.getByTestId("reject-image-section-dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByTestId("reject-image-section-confirm").click(); // sem motivo: não envia
    await expect(dialog).toBeVisible();
    expect(await sectionRow(pending.id)).toMatchObject({ reviewStatus: "pending", rejectionReason: null });

    const reason = `Sem rostos, por favor ${RUN_TAG}`;
    await dialog.getByTestId("reject-image-section-reason").fill(reason);
    await dialog.getByTestId("reject-image-section-confirm").click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });

    expect(await sectionRow(pending.id)).toMatchObject({
      reviewStatus: "rejected",
      rejectionReason: reason,
      reviewedById: admin.userId,
      pageId: null,
    });
    expect(await pendingCount()).toBe(before - 1);
    await expect(card(page, pending.caption).getByTestId("image-section-status")).toHaveText("Reprovada");
    await expect(card(page, pending.caption).getByTestId("image-section-rejection-reason")).toContainText(reason);
    await expect(card(page, pending.caption).getByTestId("image-section-reject")).toHaveCount(0);
    await expect(page.locator(BADGE).first()).toHaveAttribute("data-count", String(before - 1), { timeout: 20_000 });

    await seedBrowserSession(page, member);
    await page.goto(MEMBER_PATH);
    const mine = page.locator(`[data-testid="my-image-section"][data-section-id="${pending.id}"]`);
    await expect(mine).toHaveAttribute("data-status", "rejected", { timeout: 20_000 });
    await expect(mine.getByTestId("my-image-section-reason")).toContainText(reason);
  });

  test("[ui#excluir] o admin exclui pela tela com confirmação: some a publicação, as linhas de mídia e os objetos; cancelar não muda nada", async ({ page, request }) => {
    const pending = await seed(request, member, label("excluir"));
    const [media] = await mediaRows(pending.id);
    await openAdmin(page);
    await searchFor(page, pending.caption);

    const before = await snapshotDb();
    await card(page, pending.caption).getByTestId("image-section-delete").click();
    await page.getByTestId("image-section-delete-dialog-cancel").click();
    await expect(card(page, pending.caption)).toHaveCount(1);
    expect(await snapshotDb()).toEqual(before);

    await card(page, pending.caption).getByTestId("image-section-delete").click();
    await page.getByTestId("image-section-delete-dialog-confirm").click();
    await expect(card(page, pending.caption)).toHaveCount(0, { timeout: 20_000 });
    created.delete(pending.id);
    expect(await sectionRow(pending.id)).toBeNull();
    expect(await mediaRows(pending.id)).toHaveLength(0);
    expect(await listObjects()).not.toContain(keyFromUrl(media.url, s3Config().bucket));
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[ui#perfil-indevido] membro, líder e visitante não abrem o painel de revisão: a tela não carrega, a API recusa e o banco não muda", async ({ browser, request }) => {
    const target = await seed(request, member, label("indevido"));
    const before = await snapshotDb();
    for (const who of [member, leader, undefined] as const) {
      const context = await browser.newContext();
      const page = await context.newPage();
      if (who) await seedBrowserSession(page, who);
      await page.goto(ADMIN_PATH);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("image-sections-manager")).toHaveCount(0);
      await expect(page.getByTestId("image-section-card")).toHaveCount(0);
      await context.close();
      const list = await getRaw(request, who?.accessToken, "");
      expect([401, 403]).toContain(list.status());
    }
    expect(await snapshotDb()).toEqual(before);
    expect(await sectionRow(target.id)).toMatchObject({ reviewStatus: "pending", pageId: null });
  });

  test("[ui#flag-desligada] com a moderação desligada a rota do painel não abre e a API devolve 403 FEATURE_DISABLED sem mudar o banco; ligada de novo, volta", async ({ page, request }) => {
    const target = await seed(request, member, label("flag"));
    await seedBrowserSession(page, admin);
    await setFlag(request, "photo_moderation", false);
    try {
      const before = await snapshotDb();
      await page.goto(ADMIN_PATH);
      await expect(page).not.toHaveURL(/\/adm\/fotos-abrigos$/, { timeout: 20_000 });
      await expect(page.getByTestId("image-sections-manager")).toHaveCount(0);
      const list = await getRaw(request, admin.accessToken, "");
      expect(list.status()).toBe(403);
      expect(JSON.stringify(await list.json())).toContain("FEATURE_DISABLED");
      expect((await getRaw(request, admin.accessToken, "/pending-count")).status()).toBe(403);
      expect(await snapshotDb()).toEqual(before);
    } finally {
      await setFlag(request, "photo_moderation", true);
    }
    await page.goto(ADMIN_PATH);
    await expect(page.getByTestId("image-sections-manager")).toBeVisible({ timeout: 20_000 });
    await searchFor(page, target.caption);
    await expect(card(page, target.caption)).toHaveCount(1);
  });

  test("[ui#envio-desligado] com o envio e a moderação desligados a API recusa o membro (403 FEATURE_DISABLED) e a rota de envio não abre; nada é gravado", async ({ page, request }) => {
    await setFlag(request, "shelter_photo_upload", false);
    await setFlag(request, "photo_moderation", false);
    try {
      const before = await snapshotDb();
      const bucket = await snapshotBucket();
      await seedBrowserSession(page, member);
      await page.goto(MEMBER_PATH);
      await expect(page).not.toHaveURL(new RegExp(`${MEMBER_PATH}$`), { timeout: 20_000 });
      const res = await request.post(`${API_URL}/image-sections`, {
        headers: authHeaders(member.accessToken),
        multipart: { sectionData: JSON.stringify({ caption: label("sem-flag"), description: "d", public: false, mediaItems: [] }) },
      });
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
      expect(await snapshotDb()).toEqual(before);
      await expectBucketUnchanged(bucket);
    } finally {
      await setFlag(request, "shelter_photo_upload", true);
      await setFlag(request, "photo_moderation", true);
    }
  });

  test("[ui#mobile] @mobile o membro envia pela tela em 375px: sem rolagem horizontal, alvos de toque >= 44px, grava e confirma", async ({ page }) => {
    const caption = label("mobile");
    await seedBrowserSession(page, member);
    await page.goto(MEMBER_PATH);
    await expect(page.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 20_000 });
    await noHorizontalScroll(page);
    await expectTouchTarget(page.getByTestId("shelter-upload-photos-button"), "botão de fotos");
    await expectTouchTarget(page.getByTestId("shelter-upload-video-button"), "botão de vídeo");
    await expectTouchTarget(page.getByTestId("member-photos-submit"), "enviar");
    await expectTouchTarget(page.getByTestId("member-photos-cancel"), "cancelar");

    await page.getByTestId("shelter-upload-caption").fill(caption);
    await page.getByTestId("shelter-upload-description").fill("Envio pelo celular");
    await page.getByTestId("shelter-upload-photos-input").setInputFiles({ name: "cel.png", mimeType: "image/png", buffer: makePng(640, 480, 9) });
    await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(1);
    await noHorizontalScroll(page);
    await page.getByTestId("member-photos-submit").click();
    await expect(page.getByTestId("shelter-upload-success")).toBeVisible({ timeout: 60_000 });
    await expectTouchTarget(page.getByTestId("shelter-upload-go-feed"), "ir para o feed");
    await noHorizontalScroll(page);

    const row = await queryOne<{ id: string }>("SELECT id FROM image_sections WHERE caption = ?", [caption]);
    expect(row).not.toBeNull();
    created.add(row!.id);
    expect(await sectionRow(row!.id)).toMatchObject({ authorId: member.userId, reviewStatus: "pending", pageId: null });
    expect(await mediaRows(row!.id)).toHaveLength(1);
  });

  test("[ui#mobile-admin] @mobile o painel em 375px: cartão sem rolagem horizontal, ações empilhadas com alvo >= 44px", async ({ page, request }) => {
    const pending = await seed(request, member, label("mobile-admin"));
    await openAdmin(page);
    await searchFor(page, pending.caption);
    const item = card(page, pending.caption);
    await expect(item).toHaveCount(1);
    await noHorizontalScroll(page);
    for (const id of ["image-section-view", "image-section-edit", "image-section-reject", "image-section-delete"]) {
      await expectTouchTarget(item.getByTestId(id), id);
    }
    const view = await item.getByTestId("image-section-view").boundingBox();
    const edit = await item.getByTestId("image-section-edit").boundingBox();
    expect(Math.abs(view!.x - edit!.x), "ações empilhadas devem ter o mesmo x").toBeLessThanOrEqual(1);
    expect(Math.abs(view!.width - edit!.width)).toBeLessThanOrEqual(1);
  });
});
