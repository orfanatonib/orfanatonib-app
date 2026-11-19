import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Browser, BrowserContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { LIVE_ACCOUNTS } from "../support/credentials";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test, type LoginResult } from "../support/live";
import { setFlag } from "./feed-fixtures";
import { makePng } from "./png";

/**
 * JORNADA COMPLETA do feed v2, só pela tela e com arquivos reais: envio (2 fotos + vídeo) → pendente →
 * reprovação com motivo (+ e-mail no outbox) → reenvio → aprovação → feed do visitante e do logado →
 * lightbox/compartilhar/destaques → celebrar (líder, membro, admin) → comentários moderados →
 * celular → despublicar → excluir (0 linhas).
 *
 * NOTA de isolamento: "Aprovar e publicar" no painel não deixa escolher a galeria (a API usa a galeria
 * oficial do feed, FEED_ORFANATO_PAGE_ID). Por isso a publicação cai na galeria real do feed; o cenário só
 * mexe nos próprios posts (legenda com RUN_TAG) e os apaga no `afterAll`.
 * O painel não tem botão de despublicar: o passo "despublicar" usa o PATCH da API (comentado no teste).
 */
const VIDEO = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "assets", "visita.mp4"));
const FEED_PATH = "/feed-ministerio-orfanatos-nib";
const PHOTOS_PATH = "/area-do-membro/imagens-abrigo";
const COMMENTS_ADMIN_PATH = "/adm/comentarios-feed";
const FLAGS = [
  "shelter_photo_upload",
  "photo_moderation",
  "shelter_feed",
  "shelter_feed_celebrations",
  "shelter_feed_comments",
  "email_delivery",
  "email_image_rejected_notification",
] as const;
const REASON = `${RUN_TAG} A foto 1 mostra o rosto de uma criança. Envie sem rostos, por favor.`;
const COMMENT_REASON = `${RUN_TAG} fale da atividade da visita`;
const tag = `${RUN_TAG}-jornada`;
const CAPTION_1 = `${tag} primeira`;
const CAPTION_2 = `${tag} segunda`;
const CAPTION_MOBILE = `${tag} celular`;
const LEADER_COMMENT = `${RUN_TAG} comentário do líder`;
const MEMBER_COMMENT = `${RUN_TAG} comentário do membro`;

let admin: LoginResult;
let member: LoginResult;
let leader: LoginResult;
const flagsBefore: Record<string, boolean> = {};

const photo = (name: string, seed: number) => ({ name, mimeType: "image/png", buffer: makePng(640, 480, seed) });
const video = () => ({ name: "visita.mp4", mimeType: "video/mp4", buffer: VIDEO });
const sectionsOf = (caption: string) =>
  queryAll<{ id: string; reviewStatus: string; pageId: string | null; public: number; authorId: string | null }>(
    "SELECT id, reviewStatus, pageId, public, authorId FROM image_sections WHERE caption LIKE ?",
    [`${caption}%`],
  );
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Contexto limpo (visitante) ou com a sessão real do perfil; `mobile` = 375x812 com toque. */
async function openAs(browser: Browser, tokens?: LoginResult, mobile = false): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext(mobile ? { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true } : {});
  const page = await context.newPage();
  if (tokens) await seedBrowserSession(page, tokens);
  return { context, page };
}

async function sendFromScreen(page: Page, caption: string, photos: ReturnType<typeof photo>[], tap = false) {
  await page.goto(PHOTOS_PATH);
  await expect(page.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("shelter-upload-caption").fill(caption);
  await page.getByTestId("shelter-upload-description").fill("Jornada completa do feed, enviada pela tela");
  await page.getByTestId("shelter-upload-photos-input").setInputFiles(photos);
  await page.getByTestId("shelter-upload-video-input").setInputFiles(video());
  await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(photos.length);
  await expect(page.getByTestId("shelter-upload-preview-video")).toHaveCount(1);
  if (tap) await page.getByTestId("member-photos-submit").tap();
  else await page.getByTestId("member-photos-submit").click();
  await expect(page.getByTestId("shelter-upload-success")).toBeVisible({ timeout: 90_000 });
}

test.describe.serial("Jornada completa do feed v2 (tela, arquivos reais)", () => {
  test.describe.configure({ timeout: 240_000 });
  test.use({ actionTimeout: 20_000 }); // sem isto um clique em elemento ausente espera o teste inteiro

  let firstId = "";
  let secondId = "";
  let mobileId = "";
  let galleryId = "";
  let authorName = "";
  let sharedLink = "";
  let photoLink = "";
  let videoIndex = 0;
  let leaderCommentId = "";
  let memberCommentId = "";
  const allSectionIds: string[] = [];

  const feedUrl = () => `${FEED_PATH}?galeria=${galleryId}`;
  const sectionBox = (page: Page, id = secondId) => page.locator(`[data-testid="shelter-feed-section"][data-section-id="${id}"]`);
  const myItem = (page: Page, id: string) => page.locator(`[data-testid="my-image-section"][data-section-id="${id}"]`);
  const openFeed = async (page: Page, path = feedUrl()) => {
    await page.goto(path);
    await expect(page.getByTestId("shelter-feed-content")).toBeVisible({ timeout: 60_000 });
  };
  const openComments = async (page: Page) => {
    await openFeed(page);
    await expect(sectionBox(page)).toBeVisible({ timeout: 30_000 });
    await sectionBox(page).getByTestId("shelter-feed-comments-toggle").click();
    await expect(sectionBox(page).getByTestId("shelter-feed-comments-panel")).toBeVisible();
  };
  const outboxFor = (templateKey: string, recipient: string, text: string) =>
    queryAll<{ status: string; text: string }>("SELECT status, text FROM email_outbox WHERE templateKey = ? AND recipient = ? AND text LIKE ?", [
      templateKey,
      recipient,
      `%${text}%`,
    ]);

  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    member = await loginAs(request, "member");
    leader = await loginAs(request, "leader");
    for (const key of FLAGS) {
      flagsBefore[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0) === 1;
      await setFlag(request, admin.accessToken, key, true);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const row of await sectionsOf(RUN_TAG)) {
      if (!allSectionIds.includes(row.id)) allSectionIds.push(row.id);
    }
    for (const id of allSectionIds) await request.delete(`${API_URL}/image-sections/${id}`, { headers: authHeaders(admin.accessToken) });
    for (const id of allSectionIds) {
      expect(await countRows("image_sections", { id })).toBe(0);
      expect(await countRows("media_items", { targetId: id })).toBe(0);
      expect(await countRows("image_section_celebrations", { sectionId: id })).toBe(0);
      expect(await countRows("image_section_comments", { sectionId: id })).toBe(0);
    }
    expect((await sectionsOf(RUN_TAG)).length).toBe(0);
    for (const key of FLAGS) await setFlag(request, admin.accessToken, key, flagsBefore[key]);
    await closeDb();
  });

  test("[1 envio] o membro envia 2 fotos + 1 vídeo pela tela; vê 'Seu momento foi enviado!' e PENDENTE; visitante e líder não veem no feed", async ({ page, browser }) => {
    await seedBrowserSession(page, member);
    await sendFromScreen(page, CAPTION_1, [photo("um.png", 1), photo("dois.png", 2)]);
    await expect(page.getByText("Seu momento foi enviado!")).toBeVisible();
    const rows = await sectionsOf(CAPTION_1);
    expect(rows).toHaveLength(1);
    firstId = rows[0].id;
    allSectionIds.push(firstId);
    expect(rows[0]).toMatchObject({ reviewStatus: "pending", pageId: null, public: 0, authorId: member.userId });
    const media = await queryAll<{ mediaType: string }>("SELECT mediaType FROM media_items WHERE targetId = ?", [firstId]);
    expect(media.map((m) => m.mediaType).sort()).toEqual(["image", "image", "video"]);

    await expect(myItem(page, firstId).getByTestId("my-image-section-status")).toHaveText("Aguardando aprovação");

    for (const tokens of [undefined, leader]) {
      const viewer = await openAs(browser, tokens);
      try {
        await openFeed(viewer.page, FEED_PATH);
        await expect(sectionBox(viewer.page, firstId)).toHaveCount(0);
        await expect(viewer.page.getByText(CAPTION_1)).toHaveCount(0);
      } finally {
        await viewer.context.close();
      }
    }
  });

  test("[2 reprovar] o admin vê o vídeo reproduzível e reprova com motivo; o membro vê o motivo; fora do feed; e-mail no outbox", async ({ page, browser }) => {
    await seedBrowserSession(page, admin);
    await page.goto("/adm/fotos-abrigos");
    const card = page.getByTestId("image-section-card").filter({ hasText: CAPTION_1 });
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card.getByTestId("image-section-media-summary")).toHaveText("2 fotos + 1 vídeo");
    await card.getByTestId("image-section-view").click();
    const details = page.getByTestId("image-section-details");
    const player = details.getByTestId("shelter-video");
    await expect(player).toHaveAttribute("src", /^https?:\/\//);
    // Reproduzível de verdade: o navegador leu os metadados (duração e dimensões do MP4 real).
    await expect
      .poll(() => player.evaluate((el: HTMLVideoElement) => (el.readyState >= 1 && el.duration > 0 && el.videoWidth > 0 ? "ok" : `rs=${el.readyState}`)), { timeout: 60_000 })
      .toBe("ok");
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();

    await card.getByTestId("image-section-reject").click();
    const dialog = page.getByTestId("reject-image-section-dialog");
    await dialog.getByTestId("reject-image-section-confirm").click();
    await expect(dialog).toContainText("Informe o motivo da reprovação.");
    await dialog.getByTestId("reject-image-section-reason").fill(REASON);
    await dialog.getByTestId("reject-image-section-confirm").click();
    await expect(dialog).toBeHidden({ timeout: 30_000 });
    expect(await queryOne("SELECT reviewStatus, rejectionReason FROM image_sections WHERE id = ?", [firstId])).toMatchObject({
      reviewStatus: "rejected",
      rejectionReason: REASON,
    });

    // E-mail ao autor (flags religadas no beforeAll; só o outbox é conferido).
    await expect.poll(async () => (await outboxFor("image-rejected-notification", LIVE_ACCOUNTS.member.email, REASON)).length, { timeout: 30_000 }).toBe(1);
    const [mail] = await outboxFor("image-rejected-notification", LIVE_ACCOUNTS.member.email, REASON);
    expect(mail.text).toContain(CAPTION_1);

    const memberView = await openAs(browser, member);
    try {
      await memberView.page.goto(PHOTOS_PATH);
      const item = myItem(memberView.page, firstId);
      await expect(item).toBeVisible({ timeout: 30_000 });
      await expect(item.getByTestId("my-image-section-status")).toHaveText("Reprovada");
      await expect(item.getByTestId("my-image-section-reason")).toContainText(REASON);
    } finally {
      await memberView.context.close();
    }
    const visitor = await openAs(browser);
    try {
      await openFeed(visitor.page, FEED_PATH);
      await expect(sectionBox(visitor.page, firstId)).toHaveCount(0);
    } finally {
      await visitor.context.close();
    }
  });

  test("[3 reenviar e aprovar] o membro reenvia foto + vídeo; o admin aprova; aparece no feed do visitante com o NOME COMPLETO e no do logado", async ({ page, browser }) => {
    await seedBrowserSession(page, member);
    await sendFromScreen(page, CAPTION_2, [photo("nova.png", 3)]);
    const rows = await sectionsOf(CAPTION_2);
    expect(rows).toHaveLength(1);
    secondId = rows[0].id;
    allSectionIds.push(secondId);
    await expect(myItem(page, secondId).getByTestId("my-image-section-status")).toHaveText("Aguardando aprovação");

    const adminView = await openAs(browser, admin);
    try {
      const a = adminView.page;
      await a.goto("/adm/fotos-abrigos");
      const card = a.getByTestId("image-section-card").filter({ hasText: CAPTION_2 });
      await expect(card).toBeVisible({ timeout: 30_000 });
      await expect(card.getByTestId("image-section-media-summary")).toHaveText("1 foto + 1 vídeo");
      await card.getByTestId("image-section-edit").click();
      await expect(a.getByTestId("shelter-video")).toHaveCount(1);
      await a.getByTestId("image-section-admin-approve").click();
      await expect(a).toHaveURL(/\/adm\/fotos-abrigos$/, { timeout: 60_000 });
    } finally {
      await adminView.context.close();
    }
    const row = (await sectionsOf(CAPTION_2))[0];
    expect(row).toMatchObject({ reviewStatus: "approved", public: 1 });
    expect(row.pageId).toBeTruthy();
    galleryId = row.pageId!;

    const feedRes = await page.request.get(`${API_URL}/image-pages/${galleryId}/sections?page=1&limit=50`);
    const feed = (await feedRes.json()) as { sections: Array<{ id: string; author: { displayName: string } | null; mediaItems: Array<{ mediaType: string }> }> };
    videoIndex = feed.sections.find((s) => s.id === secondId)!.mediaItems.findIndex((m) => m.mediaType === "video");
    expect(videoIndex).toBeGreaterThanOrEqual(0);
    authorName = feed.sections.find((s) => s.id === secondId)?.author?.displayName ?? "";
    expect(authorName).toMatch(/^\S+( \S{2,})+$/); // nome completo, não "Fulano S."

    for (const tokens of [undefined, member]) {
      const viewer = await openAs(browser, tokens);
      try {
        await openFeed(viewer.page);
        await expect(sectionBox(viewer.page)).toBeVisible({ timeout: 30_000 });
        await expect(sectionBox(viewer.page).getByTestId("shelter-feed-author")).toHaveText(`Por ${authorName}`);
      } finally {
        await viewer.context.close();
      }
    }
  });

  test("[4 feed visual] visitante abre a publicação; lightbox na foto e no vídeo (teclado e botões); compartilhar com `midia`; link em contexto novo cai na mídia certa; destaques do mês", async ({ browser }) => {
    const { context, page } = await openAs(browser);
    try {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      // Em contexto novo a página pode estar sem foco, e `clipboard.readText` fica pendurado sem foco.
      const readClipboard = async () => {
        await page.bringToFront();
        return page.evaluate(() => navigator.clipboard.readText());
      };
      await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
      await openFeed(page);
      await expect(sectionBox(page)).toBeVisible({ timeout: 30_000 });

      // Destaques do mês: o post recém-criado está no carrossel.
      const label = await page.evaluate(() => `${new Date().toLocaleString("pt-BR", { month: "long" })} de ${new Date().getFullYear()}`);
      await expect(page.getByTestId("shelter-feed-highlights-title")).toHaveText(`Momentos em destaque — ${label}`);
      await expect(page.getByTestId("shelter-feed-highlights-track").locator(`[data-section-id="${secondId}"]`).first()).toBeAttached();

      // Cartão de publicação com vídeo: o vídeo toca no cartão e o botão abre a visualização (lightbox).
      await expect(sectionBox(page).getByTestId("shelter-feed-video-player")).toBeVisible();
      await page.getByTestId(`shelter-feed-post-photos-${secondId}`).click();
      const dialog = page.getByTestId("shelter-feed-lightbox-dialog");
      const counter = dialog.getByTestId("shelter-feed-lightbox-counter");
      const isVideoAt = async (index: number) => {
        await expect(counter).toHaveText(`${index + 1} / 2`);
        if (index === videoIndex) await expect(dialog.getByTestId("shelter-feed-video-player")).toBeVisible();
        else await expect(dialog.getByTestId("shelter-feed-video-player")).toHaveCount(0);
      };
      await isVideoAt(0);
      await page.keyboard.press("ArrowRight");
      await isVideoAt(1);
      await page.keyboard.press("ArrowLeft");
      await isVideoAt(0);
      await dialog.getByTestId("shelter-feed-lightbox-next").click();
      await isVideoAt(1);
      await dialog.getByTestId("shelter-feed-lightbox-prev").click();
      await isVideoAt(0);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);

      // Compartilhar: o cartão copia o link da publicação (midia=0); o lightbox copia o da mídia aberta.
      const origin = new URL(page.url()).origin;
      const linkFor = (index: number) => `${origin}${FEED_PATH}?galeria=${galleryId}&midia=${index}#publicacao-feed-${secondId}`;
      await page.getByTestId(`shelter-feed-post-share-${secondId}`).click();
      await expect(page.getByTestId(`shelter-feed-post-share-${secondId}`)).toContainText("Link copiado");
      expect(await readClipboard()).toBe(linkFor(0));
      for (const index of [0, 1]) {
        await page.getByTestId(`shelter-feed-post-photos-${secondId}`).click();
        if (index === 1) await dialog.getByTestId("shelter-feed-lightbox-next").click();
        await isVideoAt(index);
        await dialog.getByTestId("shelter-feed-lightbox-share").click();
        expect(await readClipboard()).toBe(linkFor(index));
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
      }
      sharedLink = linkFor(videoIndex);
      photoLink = linkFor(1 - videoIndex);
    } finally {
      await context.close();
    }

    // Contexto novo: cada link cai exatamente no lightbox da mídia certa.
    for (const [link, index] of [[sharedLink, videoIndex], [photoLink, 1 - videoIndex]] as const) {
      const fresh = await openAs(browser);
      try {
        await fresh.page.goto(link);
        const dialog = fresh.page.getByTestId("shelter-feed-lightbox-dialog");
        await expect(dialog).toBeVisible({ timeout: 60_000 });
        await expect(dialog.getByTestId("shelter-feed-lightbox-counter")).toHaveText(`${index + 1} / 2`);
        if (index === videoIndex) {
          await expect(dialog.getByTestId("shelter-feed-video-player")).toBeVisible();
          await expect(dialog.locator("video")).toHaveAttribute("controls", "");
        } else {
          await expect(dialog.getByTestId("shelter-feed-video-player")).toHaveCount(0);
        }
      } finally {
        await fresh.context.close();
      }
    }
  });

  test("[5 celebrar] líder, membro e admin celebram (3); clicar de novo desfaz; o visitante vê a contagem e é convidado a entrar", async ({ browser }) => {
    const celebrations = () => countRows("image_section_celebrations", { sectionId: secondId });
    let expected = 0;
    for (const tokens of [leader, member, admin]) {
      const { context, page } = await openAs(browser, tokens);
      try {
        await openFeed(page);
        const card = sectionBox(page);
        await expect(card).toBeVisible({ timeout: 30_000 });
        const button = card.getByTestId("shelter-feed-celebrate-button");
        await expect(card.getByTestId("shelter-feed-celebration-count")).toHaveText(String(expected));
        await button.click();
        expected += 1;
        await expect(button).toHaveAttribute("aria-pressed", "true");
        await expect(card.getByTestId("shelter-feed-celebration-count")).toHaveText(String(expected));
        await expect.poll(celebrations).toBe(expected);
        if (tokens === admin) {
          await button.click(); // desfaz
          await expect(button).toHaveAttribute("aria-pressed", "false");
          await expect(card.getByTestId("shelter-feed-celebration-count")).toHaveText("2");
          await expect.poll(celebrations).toBe(2);
          await button.click(); // celebra de novo
          await expect(card.getByTestId("shelter-feed-celebration-count")).toHaveText("3");
          await expect.poll(celebrations).toBe(3);
        }
      } finally {
        await context.close();
      }
    }
    const visitor = await openAs(browser);
    try {
      await openFeed(visitor.page);
      const card = sectionBox(visitor.page);
      await expect(card.getByTestId("shelter-feed-celebration-readonly")).toContainText("3");
      await expect(card.getByTestId("shelter-feed-celebration-readonly")).toContainText("Entre na sua conta para celebrar.");
      await expect(card.getByTestId("shelter-feed-celebrate-button")).toHaveCount(0);
    } finally {
      await visitor.context.close();
    }
  });

  test("[6 comentar e moderar] líder e membro comentam (pendente); só o admin aprova o do líder e reprova o do membro (com motivo); visibilidade e contador", async ({ browser }) => {
    for (const [tokens, text] of [[leader, LEADER_COMMENT], [member, MEMBER_COMMENT]] as const) {
      const { context, page } = await openAs(browser, tokens);
      try {
        await openComments(page);
        const card = sectionBox(page);
        await card.getByTestId("shelter-feed-comment-input").fill(text);
        await card.getByTestId("shelter-feed-comment-submit").click();
        await expect(card.getByTestId("feed-comments-pending-notice")).toContainText("aguarda aprovação");
        await expect(card.getByTestId("feed-comments-mine-item")).toHaveCount(1);
        await expect(card.getByTestId("shelter-feed-comment-item")).toHaveCount(0);
      } finally {
        await context.close();
      }
    }
    leaderCommentId = (await queryOne<{ id: string }>("SELECT id FROM image_section_comments WHERE sectionId = ? AND content = ?", [secondId, LEADER_COMMENT]))!.id;
    memberCommentId = (await queryOne<{ id: string }>("SELECT id FROM image_section_comments WHERE sectionId = ? AND content = ?", [secondId, MEMBER_COMMENT]))!.id;
    expect(await countRows("image_section_comments", { sectionId: secondId, status: "pending" })).toBe(2);

    // Visitante não vê comentários (nem o botão); nenhum comentário de outro usuário aparece enquanto pendente.
    const visitor = await openAs(browser);
    try {
      await openFeed(visitor.page);
      await expect(sectionBox(visitor.page)).toBeVisible({ timeout: 30_000 });
      await expect(sectionBox(visitor.page).getByTestId("shelter-feed-comments-toggle")).toHaveCount(0);
      await expect(visitor.page.getByText(LEADER_COMMENT)).toHaveCount(0);
      await expect(visitor.page.getByText(MEMBER_COMMENT)).toHaveCount(0);
    } finally {
      await visitor.context.close();
    }
    const other = await openAs(browser, admin);
    try {
      await openComments(other.page);
      await expect(other.page.getByText(LEADER_COMMENT)).toHaveCount(0);
      await expect(sectionBox(other.page).getByTestId("shelter-feed-comments-toggle")).toContainText("(0)");
    } finally {
      await other.context.close();
    }

    // Admin: aprova o do líder, reprova o do membro (motivo obrigatório).
    const panel = await openAs(browser, admin);
    try {
      const p = panel.page;
      await p.goto(COMMENTS_ADMIN_PATH);
      await expect(p.getByTestId("feed-comments-manager")).toBeVisible({ timeout: 30_000 });
      await p.getByPlaceholder(/Buscar por autor/).fill(RUN_TAG);
      const dialog = p.getByTestId("feed-comments-review-dialog");

      await p.getByTestId(`feed-comments-review-${leaderCommentId}`).click();
      await expect(dialog.getByTestId("feed-comments-review-text")).toHaveText(LEADER_COMMENT);
      await dialog.getByTestId("feed-comments-approve").click();
      await expect(dialog).toBeHidden();

      await p.getByTestId(`feed-comments-review-${memberCommentId}`).click();
      await dialog.getByTestId("feed-comments-reject").click();
      await expect(dialog.getByText("Informe o motivo antes de reprovar.")).toBeVisible();
      await dialog.getByTestId("feed-comments-review-reason").fill(COMMENT_REASON);
      await dialog.getByTestId("feed-comments-reject").click();
      await expect(dialog).toBeHidden();
    } finally {
      await panel.context.close();
    }
    expect(await queryOne("SELECT status FROM image_section_comments WHERE id = ?", [leaderCommentId])).toMatchObject({ status: "approved" });
    expect(await queryOne("SELECT status, moderationReason FROM image_section_comments WHERE id = ?", [memberCommentId])).toMatchObject({
      status: "rejected",
      moderationReason: COMMENT_REASON,
    });

    // Líder (autor do aprovado): vê o dele; admin (terceiro): só o aprovado e contador (1); membro (autor do reprovado): o motivo.
    const asAdmin = await openAs(browser, admin);
    try {
      await openComments(asAdmin.page);
      const card = sectionBox(asAdmin.page);
      await expect(card.getByTestId("shelter-feed-comment-item")).toHaveCount(1);
      await expect(card.getByTestId("shelter-feed-comment-content")).toHaveText(LEADER_COMMENT);
      await expect(card).not.toContainText(MEMBER_COMMENT);
      await expect(card).not.toContainText(COMMENT_REASON);
      await expect(card.getByTestId("shelter-feed-comments-toggle")).toContainText("(1)"); // só aprovados
    } finally {
      await asAdmin.context.close();
    }
    const asMember = await openAs(browser, member);
    try {
      await openComments(asMember.page);
      const card = sectionBox(asMember.page);
      await expect(card.getByTestId("shelter-feed-comment-content")).toHaveText(LEADER_COMMENT);
      const mine = card.getByTestId("feed-comments-mine-item");
      await expect(mine).toHaveCount(1);
      await expect(mine.getByTestId("feed-comments-mine-status")).toHaveAttribute("data-status", "rejected");
      await expect(mine.getByTestId("feed-comments-mine-reason")).toContainText(COMMENT_REASON);
      await expect(card.getByTestId("shelter-feed-comments-toggle")).toContainText("(1)");
    } finally {
      await asMember.context.close();
    }
    const asVisitor = await openAs(browser);
    try {
      await openFeed(asVisitor.page);
      await expect(sectionBox(asVisitor.page)).toBeVisible({ timeout: 30_000 });
      await expect(asVisitor.page.getByText(MEMBER_COMMENT)).toHaveCount(0);
      await expect(asVisitor.page.getByText(COMMENT_REASON)).toHaveCount(0);
    } finally {
      await asVisitor.context.close();
    }
  });

  test("[8 celular] @mobile 375x812: envio e link compartilhado (lightbox) sem rolagem horizontal e com alvos >= 44px", async ({ browser }) => {
    const sender = await openAs(browser, member, true);
    try {
      const p = sender.page;
      await p.goto(PHOTOS_PATH);
      await expect(p.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 30_000 });
      expect(await overflow(p)).toBeLessThanOrEqual(0);
      for (const id of ["shelter-upload-photos-button", "shelter-upload-video-button", "member-photos-submit", "member-photos-cancel"]) {
        const box = await p.getByTestId(id).boundingBox();
        expect(box!.height, id).toBeGreaterThanOrEqual(43.9);
      }
      await sendFromScreen(p, CAPTION_MOBILE, [photo("c1.png", 7), photo("c2.png", 8)], true);
      expect(await overflow(p)).toBeLessThanOrEqual(0);
      mobileId = (await sectionsOf(CAPTION_MOBILE))[0].id;
      allSectionIds.push(mobileId);
      expect(await countRows("media_items", { targetId: mobileId })).toBe(3);
    } finally {
      await sender.context.close();
    }

    const visitor = await openAs(browser, undefined, true);
    try {
      const p = visitor.page;
      await p.goto(sharedLink);
      const dialog = p.getByTestId("shelter-feed-lightbox-dialog");
      await expect(dialog.getByTestId("shelter-feed-lightbox-counter")).toHaveText(`${videoIndex + 1} / 2`, { timeout: 60_000 });
      await expect(dialog.getByTestId("shelter-feed-video-player")).toBeVisible();
      expect(await overflow(p)).toBeLessThanOrEqual(0);
      for (const id of ["shelter-feed-lightbox-close", "shelter-feed-lightbox-prev", "shelter-feed-lightbox-next", "shelter-feed-lightbox-share"]) {
        const box = await dialog.getByTestId(id).boundingBox();
        expect(box, id).not.toBeNull();
        expect(box!.width, id).toBeGreaterThanOrEqual(43.9);
        expect(box!.height, id).toBeGreaterThanOrEqual(43.9);
      }
      await dialog.getByTestId("shelter-feed-lightbox-close").tap();
      await expect(dialog).toHaveCount(0);
      expect(await overflow(p)).toBeLessThanOrEqual(0);
    } finally {
      await visitor.context.close();
    }
  });

  test("[7 visibilidade] despublicar: visitante deixa de ver e o logado continua; excluir (API): some de todos e não restam linhas", async ({ browser, request }) => {
    // O painel não tem botão de despublicar: usa-se o PATCH da API (mesmo que o painel envia ao aprovar, com public:false).
    const detail = await request.get(`${API_URL}/image-sections/${secondId}`, { headers: authHeaders(admin.accessToken) });
    expect(detail.ok()).toBe(true);
    const body = (await detail.json()) as { caption: string; description: string; mediaItems: unknown[] };
    const patched = await request.patch(`${API_URL}/image-sections/${secondId}`, {
      headers: authHeaders(admin.accessToken),
      multipart: {
        sectionData: JSON.stringify({ caption: body.caption, description: body.description, public: false, pageId: galleryId, mediaItems: body.mediaItems }),
      },
    });
    expect(patched.ok(), await patched.text()).toBe(true);
    expect(await queryOne("SELECT public, pageId FROM image_sections WHERE id = ?", [secondId])).toMatchObject({ public: 0, pageId: galleryId });

    const visitor = await openAs(browser);
    try {
      await openFeed(visitor.page);
      await expect(sectionBox(visitor.page)).toHaveCount(0);
    } finally {
      await visitor.context.close();
    }
    for (const tokens of [member, leader]) {
      const logged = await openAs(browser, tokens);
      try {
        await openFeed(logged.page);
        await expect(sectionBox(logged.page)).toBeAttached({ timeout: 30_000 });
      } finally {
        await logged.context.close();
      }
    }

    // Excluir: a fila /adm/fotos-abrigos só lista pendentes/reprovadas (publicadas saem dela) e não há outra tela
    // com botão de excluir publicação aprovada do feed; por isso a exclusão usa o DELETE da API (admin).
    const adminView = await openAs(browser, admin);
    try {
      await adminView.page.goto("/adm/fotos-abrigos");
      await expect(adminView.page.getByTestId("image-sections-manager")).toBeVisible({ timeout: 30_000 });
      await expect(adminView.page.getByTestId("image-section-card").filter({ hasText: CAPTION_2 })).toHaveCount(0);
    } finally {
      await adminView.context.close();
    }
    const removed = await request.delete(`${API_URL}/image-sections/${secondId}`, { headers: authHeaders(admin.accessToken) });
    expect(removed.ok()).toBe(true);
    await expect.poll(() => countRows("image_sections", { id: secondId })).toBe(0);
    expect(await countRows("media_items", { targetId: secondId })).toBe(0);
    expect(await countRows("image_section_celebrations", { sectionId: secondId })).toBe(0);
    expect(await countRows("image_section_comments", { sectionId: secondId })).toBe(0);

    for (const tokens of [undefined, member, admin]) {
      const viewer = await openAs(browser, tokens);
      try {
        await openFeed(viewer.page);
        await expect(sectionBox(viewer.page)).toHaveCount(0);
        await expect(viewer.page.getByText(CAPTION_2)).toHaveCount(0);
      } finally {
        await viewer.context.close();
      }
    }
  });
});
