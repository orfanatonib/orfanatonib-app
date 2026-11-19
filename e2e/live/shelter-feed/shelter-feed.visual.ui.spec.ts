import type { Locator, Page } from "@playwright/test";

import { SHELTER_FEED_PATH } from "../../../src/features/shelter-feed/routes";
import { RUN_TAG } from "../support/factory";
import { closeDb, countRows, queryOne } from "../support/db";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  IMAGE_LINK,
  IMAGE_LINK_2,
  createVideoSection,
  createEmptyGallery,
  createFeedSection,
  createGallery,
  removeGallery,
  removeSection,
} from "./feed-fixtures";

/**
 * Feed visual (plano 36, fases 5/6/11): modos, busca, lightbox, compartilhar,
 * deep link, estados e mobile. Galeria própria criada pela API; tudo é apagado no fim.
 * Ordem de criação (a mais nova aparece primeiro): legada, FOTOS, VIDEO, PRIVADA, 4 de enchimento.
 */
test.describe.serial("Feed visual — tela", () => {
  test.describe.configure({ timeout: 240_000 });
  let admin: string;
  let member: Awaited<ReturnType<typeof loginAs>>;
  let pageId: string;
  let emptyPageId: string;
  let legacyId: string;
  let photosId: string;
  let videoId: string;
  let privateId: string;
  const fillerIds: string[] = [];
  const tag = `${RUN_TAG} visual`;

  const sectionBox = (page: Page, id: string): Locator =>
    page.locator(`[data-testid="shelter-feed-section"][data-section-id="${id}"]`);
  const feedUrl = (id = pageId) => `${SHELTER_FEED_PATH}?galeria=${id}`;
  const openFeed = async (page: Page, id = pageId) => {
    await page.goto(feedUrl(id));
    await expect(page.getByTestId("shelter-feed-content")).toBeVisible({ timeout: 60_000 });
  };
  /** Remove a Web Share do navegador para exercitar o fallback "copiar link". */
  const forceCopyFallback = async (page: Page) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
  };
  const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = await loginAs(request, "member");
    const gallery = await createGallery(request, admin, `${tag} galeria`, `${tag} legada`);
    pageId = gallery.pageId;
    legacyId = gallery.legacySectionId;
    photosId = await createFeedSection(request, member.accessToken, admin, pageId, `${tag} fotos`, true, [IMAGE_LINK, IMAGE_LINK_2]);
    videoId = await createVideoSection(request, member.accessToken, admin, pageId, `${tag} video`);
    privateId = await createFeedSection(request, member.accessToken, admin, pageId, `${tag} privada`, false);
    for (let n = 1; n <= 4; n += 1) {
      fillerIds.push(await createFeedSection(request, member.accessToken, admin, pageId, `${tag} enchimento ${n}`, true));
    }
    emptyPageId = await createEmptyGallery(request, admin, `${tag} vazia`);
  });

  test.afterAll(async ({ request }) => {
    for (const id of [photosId, videoId, privateId, ...fillerIds]) if (id) await removeSection(request, admin, id);
    await removeGallery(request, admin, pageId);
    await removeGallery(request, admin, emptyPageId);
    expect(await countRows("image_sections", { id: photosId })).toBe(0);
    expect(await countRows("image_sections", { id: privateId })).toBe(0);
    expect(await countRows("image_pages", { id: pageId })).toBe(0);
    expect(await countRows("image_pages", { id: emptyPageId })).toBe(0);
    await closeDb();
  });

  test("[shelter-feed.visual#modos] trocar entre Publicações, Momentos e Fotos e vídeos", async ({ page }) => {
    await openFeed(page);
    await expect(page.getByTestId("shelter-feed-timeline-stream")).toBeVisible();
    await expect(sectionBox(page, photosId)).toBeAttached();

    await page.getByTestId("shelter-feed-view-mode-bento").click();
    await expect(page.getByTestId("shelter-feed-bento-mural")).toBeVisible();
    await expect(page.getByTestId(`shelter-feed-bento-tile-${videoId}`)).toBeVisible();
    await expect(page.getByTestId("shelter-feed-timeline-stream")).toHaveCount(0);

    await page.getByTestId("shelter-feed-view-mode-gallery").click();
    await expect(page.getByTestId("shelter-feed-photo-wall")).toBeVisible();
    await expect(page.locator('[data-testid^="shelter-feed-photo-wall-item-"]').first()).toBeVisible();

    await page.getByTestId("shelter-feed-view-mode-timeline").click();
    await expect(page.getByTestId("shelter-feed-timeline-stream")).toBeVisible();
    await expect(page.getByTestId("shelter-feed-view-mode-timeline")).toHaveAttribute("aria-pressed", "true");
  });

  test("[shelter-feed.visual#busca] busca sem acento, limpar e estado de busca vazia", async ({ page }) => {
    await openFeed(page);
    await page.getByTestId("shelter-feed-search-input").fill(`${tag} FOTOS`.toUpperCase());
    await expect(sectionBox(page, photosId)).toBeVisible();
    await expect(sectionBox(page, videoId)).toHaveCount(0);
    await expect(page.getByTestId("shelter-feed-search-status")).toContainText("1 de");

    await page.getByTestId("shelter-feed-search-input").fill("zzz-nao-existe-zzz");
    await expect(page.getByTestId("shelter-feed-filter-empty-state")).toBeVisible();
    await page.getByTestId("shelter-feed-filter-empty-clear").click();
    await expect(page.getByTestId("shelter-feed-filter-empty-state")).toHaveCount(0);
    await expect(sectionBox(page, videoId)).toBeVisible();

    await page.getByTestId("shelter-feed-search-input").fill("fotos");
    await page.getByTestId("shelter-feed-search-clear").click();
    await expect(page.getByTestId("shelter-feed-search-input")).toHaveValue("");
  });

  test("[shelter-feed.visual#lightbox] abre pela foto, navega por teclado, botões e miniaturas, fecha com Esc", async ({ page }) => {
    await openFeed(page);
    await page.getByTestId(`shelter-feed-media-frame-${photosId}-0`).click();
    const dialog = page.getByTestId("shelter-feed-lightbox-dialog");
    await expect(dialog).toBeVisible();
    const counter = dialog.getByTestId("shelter-feed-lightbox-counter");
    await expect(counter).toHaveText("1 / 2");
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText("2 / 2");
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText("1 / 2");
    await page.keyboard.press("ArrowLeft");
    await expect(counter).toHaveText("2 / 2");
    await dialog.getByTestId("shelter-feed-lightbox-prev").click();
    await expect(counter).toHaveText("1 / 2");
    await dialog.getByTestId("shelter-feed-lightbox-next").click();
    await expect(counter).toHaveText("2 / 2");
    await dialog.locator('[data-testid^="shelter-feed-lightbox-thumb-"]').first().click();
    await expect(counter).toHaveText("1 / 2");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("[shelter-feed.visual#compartilhar] botão do cartão e do lightbox copiam o link da publicação e da mídia", async ({ page }) => {
    await forceCopyFallback(page);
    await openFeed(page);
    const base = new URL(feedUrl(), page.url());
    await page.getByTestId(`shelter-feed-post-share-${photosId}`).click();
    await expect(page.getByTestId(`shelter-feed-post-share-${photosId}`)).toContainText("Link copiado");
    expect(await clipboard(page)).toBe(`${base.origin}${SHELTER_FEED_PATH}?galeria=${pageId}&midia=0#publicacao-feed-${photosId}`);

    await page.getByTestId(`shelter-feed-media-frame-${photosId}-1`).click();
    await page.getByTestId("shelter-feed-lightbox-share").click();
    expect(await clipboard(page)).toBe(`${base.origin}${SHELTER_FEED_PATH}?galeria=${pageId}&midia=1#publicacao-feed-${photosId}`);
  });

  test("[shelter-feed.visual#compartilhar-nativo] com Web Share, o link vai para o compartilhamento do sistema", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __shared: unknown[] }).__shared = [];
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: unknown) => {
          (window as unknown as { __shared: unknown[] }).__shared.push(data);
        },
      });
    });
    await openFeed(page);
    await page.getByTestId(`shelter-feed-post-share-${videoId}`).click();
    const shared = await page.evaluate(() => (window as unknown as { __shared: Array<{ url: string }> }).__shared);
    expect(shared).toHaveLength(1);
    expect(shared[0].url).toContain(`midia=0#publicacao-feed-${videoId}`);
  });

  test("[shelter-feed.visual#deep-link-foto] visitante em contexto novo: link da foto abre o lightbox na mídia certa; fechar mantém a posição", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(`${feedUrl()}&midia=1#publicacao-feed-${photosId}`);
      const dialog = page.getByTestId("shelter-feed-lightbox-dialog");
      await expect(dialog).toBeVisible({ timeout: 60_000 });
      await expect(dialog.getByTestId("shelter-feed-lightbox-counter")).toHaveText("2 / 2");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(sectionBox(page, photosId)).toBeInViewport();
      expect(page.url()).not.toContain("midia=");
      expect(page.url()).toContain(`#publicacao-feed-${photosId}`);
    } finally {
      await context.close();
    }
  });

  test("[shelter-feed.visual#deep-link-video] link do vídeo abre o lightbox com o player pronto", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(`${feedUrl()}&midia=0#publicacao-feed-${videoId}`);
      const dialog = page.getByTestId("shelter-feed-lightbox-dialog");
      await expect(dialog).toBeVisible({ timeout: 60_000 });
      await expect(dialog.getByTestId("shelter-feed-video-player")).toBeVisible();
      await expect(dialog.locator("video")).toHaveAttribute("controls", "");
    } finally {
      await context.close();
    }
  });

  test("[shelter-feed.visual#deep-link-pagina-2] link para publicação fora do primeiro lote busca as páginas e rola até ela", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(`${feedUrl()}#publicacao-feed-${legacyId}`);
      await expect(sectionBox(page, legacyId)).toBeInViewport({ timeout: 60_000 });
      await expect(page.getByTestId("shelter-feed-lightbox-dialog")).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("[shelter-feed.visual#visibilidade] logado vê a privada; visitante só as públicas; autor aparece para todos", async ({ page, browser }) => {
    await openFeed(page);
    await page.getByTestId("shelter-feed-load-more-button").click();
    await expect(sectionBox(page, legacyId)).toBeAttached();
    await expect(sectionBox(page, privateId)).toHaveCount(0);
    await expect(sectionBox(page, photosId).getByTestId("shelter-feed-author")).toHaveText(/^Por \S+/);

    const context = await browser.newContext();
    try {
      const logged = await context.newPage();
      await seedBrowserSession(logged, member);
      await openFeed(logged);
      await expect(sectionBox(logged, privateId)).toBeAttached();
      await expect(sectionBox(logged, privateId)).toContainText("Equipe");
      await expect(sectionBox(logged, privateId).getByTestId("shelter-feed-author")).toHaveText(/^Por \S+/);
    } finally {
      await context.close();
    }
  });

  test("[shelter-feed.visual#paginacao-fim] carregar mais mostra o fim do feed e a rolagem infinita busca a 2ª página", async ({ page }) => {
    await openFeed(page);
    await expect(page.getByTestId("shelter-feed-end")).toHaveCount(0);
    await page.getByTestId("shelter-feed-load-more-button").click();
    await expect(page.getByTestId("shelter-feed-end")).toBeVisible();
    await expect(page.getByTestId("shelter-feed-load-more-button")).toHaveCount(0);
    await expect(page.locator('[data-testid="shelter-feed-section"]')).toHaveCount(7);
  });

  test("[shelter-feed.visual#erro-proxima-pagina] falha ao carregar a 2ª página mostra aviso com tentar de novo", async ({ page }) => {
    await openFeed(page);
    // Injeção de falha (HTTP 400, sem retentativa do cliente) só na 2ª página (não há como provocá-la de verdade na API local).
    await page.route("**/image-pages/*/sections*page=2*", (route) =>
      route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "falha injetada" }) }),
    );
    // A rolagem até o fim dispara o carregamento automático (sentinela); o botão é o plano B manual.
    await page.getByTestId("shelter-feed-sentinel").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("shelter-feed-next-page-error")).toBeVisible({ timeout: 60_000 });
    await page.unroute("**/image-pages/*/sections*page=2*");
    await page.getByTestId("shelter-feed-next-page-retry").click();
    await expect(page.getByTestId("shelter-feed-end")).toBeVisible();
    await expect(page.getByTestId("shelter-feed-next-page-error")).toHaveCount(0);
  });

  test("[shelter-feed.visual#vazio] galeria sem publicações mostra o estado vazio", async ({ page }) => {
    await page.goto(feedUrl(emptyPageId));
    await expect(page.getByTestId("shelter-feed-empty-state")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("shelter-feed-view-mode-bento")).toHaveCount(0);
  });

  test("[shelter-feed.visual#erro-inicial] galeria inexistente mostra erro com tentar de novo", async ({ page }) => {
    await page.goto(feedUrl("00000000-0000-4000-8000-000000000000"));
    await expect(page.getByTestId("shelter-feed-error-state")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("shelter-feed-error-retry")).toBeVisible();
    await expect(page.getByTestId("shelter-feed-error-home")).toBeVisible();
  });

  test("[shelter-feed.visual#celebrar-no-lightbox] celebra e comenta dentro do cartão e do lightbox, sincronizados", async ({ page }) => {
    const targetId = fillerIds[fillerIds.length - 1]; // a mais nova: cai no 1º lote também para o logado
    await seedBrowserSession(page, member);
    await openFeed(page);
    await page.getByTestId(`shelter-feed-media-frame-${targetId}-0`).click();
    const panel = page.getByTestId("shelter-feed-lightbox-side-panel");
    await panel.getByTestId("shelter-feed-celebrate-button").click();
    await expect(panel.getByTestId("shelter-feed-celebration-count")).toHaveText("1");
    await expect.poll(() => countRows("image_section_celebrations", { sectionId: targetId })).toBe(1);

    await panel.getByTestId("shelter-feed-comments-toggle").click();
    await panel.getByTestId("shelter-feed-comment-input").fill(`${tag} comentário`);
    await panel.getByTestId("shelter-feed-comment-submit").click();
    // Comentário entra como "aguardando aprovação": aparece só para o autor, em "Seus comentários".
    await expect(panel.getByTestId("feed-comments-mine-item")).toHaveCount(1);
    await expect.poll(() => countRows("image_section_comments", { sectionId: targetId })).toBe(1);

    await page.keyboard.press("Escape");
    const card = sectionBox(page, targetId);
    await expect(card.getByTestId("shelter-feed-celebration-count")).toHaveText("1");

    await card.getByTestId("shelter-feed-celebrate-button").click();
    await expect.poll(() => countRows("image_section_celebrations", { sectionId: targetId })).toBe(0);
    await card.getByTestId("shelter-feed-comments-toggle").click();
    await card.getByTestId("feed-comments-mine-delete").click();
    await expect.poll(() => countRows("image_section_comments", { sectionId: targetId })).toBe(0);
    expect(await queryOne("SELECT 1 FROM image_sections WHERE id = ?", [targetId])).not.toBeNull();
  });

  test("[shelter-feed.visual#mobile] @mobile 375×812: sem rolagem horizontal em nenhum modo, alvos ≥ 44px, lightbox por toque e deep link", async ({ page, browser }) => {
    await forceCopyFallback(page);
    await openFeed(page);
    const noOverflow = async (label: string) => {
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, label).toBeLessThanOrEqual(375);
    };
    await noOverflow("publicações");
    for (const testId of [
      "shelter-feed-view-mode-timeline",
      "shelter-feed-view-mode-bento",
      "shelter-feed-view-mode-gallery",
      "shelter-feed-search-input",
      "shelter-feed-hero-refresh-button",
      `shelter-feed-post-share-${photosId}`,
      `shelter-feed-media-frame-${photosId}-0`,
      "shelter-feed-highlights-prev",
      "shelter-feed-highlights-next",
    ]) {
      const box = await page.getByTestId(testId).first().boundingBox();
      expect(box, testId).not.toBeNull();
      expect(box!.height, testId).toBeGreaterThanOrEqual(43.9);
      expect(box!.width, testId).toBeGreaterThanOrEqual(43.9);
    }
    await page.getByTestId("shelter-feed-view-mode-bento").click();
    await expect(page.getByTestId("shelter-feed-bento-mural")).toBeVisible();
    await noOverflow("momentos");
    await page.getByTestId("shelter-feed-view-mode-gallery").click();
    await expect(page.getByTestId("shelter-feed-photo-wall")).toBeVisible();
    await noOverflow("fotos e vídeos");
    await page.getByTestId("shelter-feed-view-mode-timeline").click();

    await page.getByTestId(`shelter-feed-media-frame-${photosId}-0`).tap();
    const dialog = page.getByTestId("shelter-feed-lightbox-dialog");
    const counter = dialog.getByTestId("shelter-feed-lightbox-counter");
    await expect(counter).toHaveText("1 / 2");
    const swipe = async (fromX: number, toX: number) => {
      await dialog.getByTestId("shelter-feed-lightbox-prev").evaluate(
        (button, [from, to]) => {
          const stageEl = button.parentElement as HTMLElement;
          const mk = (type: string, x: number) =>
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches: type === "touchend" ? [] : [new Touch({ identifier: 1, target: stageEl, clientX: x, clientY: 300 })],
              changedTouches: [new Touch({ identifier: 1, target: stageEl, clientX: x, clientY: 300 })],
            });
          stageEl.dispatchEvent(mk("touchstart", from));
          stageEl.dispatchEvent(mk("touchend", to));
        },
        [fromX, toX],
      );
    };
    await swipe(300, 100);
    await expect(counter).toHaveText("2 / 2");
    await swipe(100, 300);
    await expect(counter).toHaveText("1 / 2");
    const closeBox = await dialog.getByTestId("shelter-feed-lightbox-close").boundingBox();
    expect(closeBox!.width).toBeGreaterThanOrEqual(43.9);
    await dialog.getByTestId("shelter-feed-lightbox-close").tap();
    await expect(dialog).toHaveCount(0);

    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
    try {
      const visitor = await context.newPage();
      await visitor.goto(`${feedUrl()}&midia=1#publicacao-feed-${photosId}`);
      await expect(visitor.getByTestId("shelter-feed-lightbox-counter")).toHaveText("2 / 2", { timeout: 60_000 });
    } finally {
      await context.close();
    }
  });
});
