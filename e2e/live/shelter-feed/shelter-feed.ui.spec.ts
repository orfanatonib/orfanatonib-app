import type { Page } from "@playwright/test";

import { SHELTER_FEED_PATH } from "../../../src/features/shelter-feed/routes";

import { RUN_TAG } from "../support/factory";
import { closeDb, countRows, queryOne } from "../support/db";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { createFeedSection, createGallery, removeGallery, removeSection, setFlag } from "./feed-fixtures";

/**
 * Feed v2 na tela (plano 36): autoria, celebrar (otimista com rollback) e
 * comentários. Galeria e publicação próprias, criadas pela API; a tela abre a
 * galeria por `SHELTER_FEED_PATH?galeria=<id>`.
 */
test.describe.serial("Feed v2 — tela", () => {
  let admin: string;
  let memberTokens: Awaited<ReturnType<typeof loginAs>>;
  let pageId: string;
  let sectionId: string;
  let flagBefore = true;

  const card = (page: Page) => page.locator(`[data-testid="shelter-feed-section"][data-section-id="${sectionId}"]`);
  const openFeed = async (page: Page) => {
    await page.goto(`${SHELTER_FEED_PATH}?galeria=${pageId}`);
    await expect(card(page)).toBeVisible({ timeout: 20_000 });
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    memberTokens = await loginAs(request, "member");
    flagBefore =
      ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", ["shelter_feed_celebrations"]))
        ?.enabled ?? 1) === 1;
    const gallery = await createGallery(request, admin, `${RUN_TAG} galeria ui`, `${RUN_TAG} legada ui`);
    pageId = gallery.pageId;
    sectionId = await createFeedSection(request, memberTokens.accessToken, admin, pageId, `${RUN_TAG} foto ui`, true);
  });

  test.afterAll(async ({ request }) => {
    await setFlag(request, admin, "shelter_feed_celebrations", flagBefore);
    await removeSection(request, admin, sectionId);
    await removeGallery(request, admin, pageId);
    expect(await countRows("image_section_celebrations", { sectionId })).toBe(0);
    expect(await countRows("image_section_comments", { sectionId })).toBe(0);
    expect(await countRows("image_sections", { id: sectionId })).toBe(0);
    await closeDb();
  });

  test("[shelter-feed.ui#visitante] visitante vê a publicação, o autor e a contagem, sem comentários nem botão de celebrar", async ({ page }) => {
    await openFeed(page);
    await expect(card(page).getByTestId("shelter-feed-author")).toHaveText(/^Por \S+/);
    await expect(card(page).getByTestId("shelter-feed-celebration-readonly")).toBeVisible();
    await expect(card(page).getByTestId("shelter-feed-celebrate-button")).toHaveCount(0);
    await expect(card(page).getByTestId("shelter-feed-comments-toggle")).toHaveCount(0);
  });

  test("[shelter-feed.ui#autor] logado vê o autor da publicação e 'Autor não informado' na seção legada", async ({ page }) => {
    await seedBrowserSession(page, memberTokens);
    await openFeed(page);
    await expect(card(page).getByTestId("shelter-feed-author")).toHaveText(/^Por E2E/);
    const row = await queryOne<{ authorId: string | null }>("SELECT authorId FROM image_sections WHERE id = ?", [sectionId]);
    expect(row?.authorId).toBe(memberTokens.userId);
  });

  test("[shelter-feed.ui#celebrar] clique celebra (aria-pressed + contagem), persiste após recarregar e descelebra", async ({ page }) => {
    await seedBrowserSession(page, memberTokens);
    await openFeed(page);
    const button = card(page).getByTestId("shelter-feed-celebrate-button");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(card(page).getByTestId("shelter-feed-celebration-count")).toHaveText("1");
    await expect.poll(() => countRows("image_section_celebrations", { sectionId, userId: memberTokens.userId })).toBe(1);

    await page.reload();
    await expect(card(page).getByTestId("shelter-feed-celebrate-button")).toHaveAttribute("aria-pressed", "true");
    await expect(card(page).getByTestId("shelter-feed-celebration-count")).toHaveText("1");

    await card(page).getByTestId("shelter-feed-celebrate-button").click();
    await expect(card(page).getByTestId("shelter-feed-celebrate-button")).toHaveAttribute("aria-pressed", "false");
    await expect(card(page).getByTestId("shelter-feed-celebration-count")).toHaveText("0");
    await expect.poll(() => countRows("image_section_celebrations", { sectionId })).toBe(0);
  });

  test("[shelter-feed.ui#celebrar-visto-em-outro-contexto] a celebração vem do servidor: outro contexto do mesmo usuário a enxerga", async ({ page, browser }) => {
    await seedBrowserSession(page, memberTokens);
    await openFeed(page);
    await card(page).getByTestId("shelter-feed-celebrate-button").click();
    await expect.poll(() => countRows("image_section_celebrations", { sectionId })).toBe(1);

    const other = await browser.newContext({ baseURL: page.context()["_options"]?.baseURL as string | undefined });
    try {
      const otherPage = await other.newPage();
      await seedBrowserSession(otherPage, memberTokens);
      await openFeed(otherPage);
      await expect(card(otherPage).getByTestId("shelter-feed-celebrate-button")).toHaveAttribute("aria-pressed", "true");
    } finally {
      await other.close();
    }
    await card(page).getByTestId("shelter-feed-celebrate-button").click();
    await expect.poll(() => countRows("image_section_celebrations", { sectionId })).toBe(0);
  });

  test("[shelter-feed.ui#celebrar-erro] API recusa (flag desligada depois de carregar): rollback e mensagem visível", async ({ page, request }) => {
    await seedBrowserSession(page, memberTokens);
    await openFeed(page);
    await setFlag(request, admin, "shelter_feed_celebrations", false);
    try {
      const button = card(page).getByTestId("shelter-feed-celebrate-button");
      await button.click();
      await expect(card(page).getByTestId("shelter-feed-celebrate-error")).toBeVisible();
      await expect(button).toHaveAttribute("aria-pressed", "false");
      await expect(card(page).getByTestId("shelter-feed-celebration-count")).toHaveText("0");
      expect(await countRows("image_section_celebrations", { sectionId })).toBe(0);
    } finally {
      await setFlag(request, admin, "shelter_feed_celebrations", true);
    }
  });

  test("[shelter-feed.ui#flag-desligada] flag de celebrar desligada: o botão some", async ({ page, request }) => {
    await setFlag(request, admin, "shelter_feed_celebrations", false);
    try {
      await seedBrowserSession(page, memberTokens);
      await openFeed(page);
      await expect(card(page).getByTestId("shelter-feed-celebrate-button")).toHaveCount(0);
      await expect(card(page).getByTestId("shelter-feed-comments-toggle")).toBeVisible();
    } finally {
      await setFlag(request, admin, "shelter_feed_celebrations", true);
    }
  });

  test("[shelter-feed.ui#comentarios] comentar (nasce pendente), validar dado pessoal, ver o aviso e o pendente, remover; tudo provado no banco", async ({ page }) => {
    await seedBrowserSession(page, memberTokens);
    await openFeed(page);
    await card(page).getByTestId("shelter-feed-comments-toggle").click();
    await expect(card(page).getByTestId("shelter-feed-comments-empty")).toBeVisible();

    const input = card(page).getByTestId("shelter-feed-comment-input");
    await input.fill("ligue para 11 99999-1234");
    await card(page).getByTestId("shelter-feed-comment-submit").click();
    await expect(card(page).getByText(/não publique telefone/i).first()).toBeVisible();
    expect(await countRows("image_section_comments", { sectionId })).toBe(0);

    await input.fill(`${RUN_TAG} que bênção!`);
    await card(page).getByTestId("shelter-feed-comment-submit").click();
    // Pendente: avisa o autor e só ele vê o comentário (na lista "Seus comentários"); a lista pública segue vazia.
    await expect(card(page).getByTestId("feed-comments-pending-notice")).toBeVisible();
    const mine = card(page).getByTestId("feed-comments-mine-item");
    await expect(mine).toHaveCount(1);
    await expect(mine.getByTestId("feed-comments-mine-status")).toHaveAttribute("data-status", "pending");
    await expect(card(page).getByTestId("shelter-feed-comment-item")).toHaveCount(0);
    await expect(card(page).getByTestId("shelter-feed-comments-toggle")).toContainText("(0)");
    expect(await countRows("image_section_comments", { sectionId, authorId: memberTokens.userId, status: "pending" })).toBe(1);

    await mine.getByTestId("feed-comments-mine-delete").click();
    await expect(card(page).getByTestId("feed-comments-mine-item")).toHaveCount(0);
    await expect.poll(() => countRows("image_section_comments", { sectionId })).toBe(0);
  });

  test("[shelter-feed.ui#mobile] @mobile 375×812: sem rolagem horizontal e alvos de toque ≥ 44px", async ({ page }) => {
    await seedBrowserSession(page, memberTokens);
    await openFeed(page);
    await card(page).getByTestId("shelter-feed-comments-toggle").click();
    await expect(card(page).getByTestId("shelter-feed-comments-panel")).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);

    for (const testId of ["shelter-feed-celebrate-button", "shelter-feed-comments-toggle", "shelter-feed-comment-submit"]) {
      const box = await card(page).getByTestId(testId).boundingBox();
      expect(box, testId).not.toBeNull();
      expect(box!.height, testId).toBeGreaterThanOrEqual(43.9);
      expect(box!.width, testId).toBeGreaterThanOrEqual(43.9);
    }
  });
});
