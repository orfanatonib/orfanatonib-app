import type { Page } from "@playwright/test";

import { SHELTER_FEED_PATH } from "../../../src/features/shelter-feed/routes";
import { FEED_COMMENTS_ADMIN_ROUTE } from "../../../src/features/feed-comments/constants";

import { RUN_TAG } from "../support/factory";
import { closeDb, countRows, queryOne } from "../support/db";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { createFeedSection, createGallery, removeGallery, removeSection, setFlag } from "./feed-fixtures";
import { postComment } from "./comments-moderation-helpers";

/**
 * Moderação de comentários do feed na tela (plano 36): o membro comenta e vê o aviso de pendente, o admin
 * aprova um e reprova outro (com motivo) no painel, o autor vê o estado e outro usuário só vê o aprovado.
 * Galeria e publicação próprias, criadas pela API e removidas no fim (0 linhas).
 */
const FLAGS = ["shelter_feed", "shelter_feed_comments"] as const;
const ID = (testId: string, id: string) => `[data-testid="${testId}-${id}"]`;

test.describe.serial("Feed — moderação de comentários (tela)", () => {
  let adminTokens: Awaited<ReturnType<typeof loginAs>>;
  let memberTokens: Awaited<ReturnType<typeof loginAs>>;
  let leaderTokens: Awaited<ReturnType<typeof loginAs>>;
  let pageId: string;
  let sectionId: string;
  const flagBefore: Record<string, boolean> = {};
  const approvedText = `${RUN_TAG} aprovado pela equipe`;
  const rejectedText = `${RUN_TAG} reprovado pela equipe`;
  const rejectionReason = `${RUN_TAG} fale da atividade da visita`;
  let approvedId = "";
  let rejectedId = "";

  const card = (page: Page) => page.locator(`[data-testid="shelter-feed-section"][data-section-id="${sectionId}"]`);
  const openFeedComments = async (page: Page) => {
    await page.goto(`${SHELTER_FEED_PATH}?galeria=${pageId}`);
    await expect(card(page)).toBeVisible({ timeout: 20_000 });
    await card(page).getByTestId("shelter-feed-comments-toggle").click();
    await expect(card(page).getByTestId("shelter-feed-comments-panel")).toBeVisible();
  };
  const openPanel = async (page: Page) => {
    await page.goto(FEED_COMMENTS_ADMIN_ROUTE);
    await expect(page.getByTestId("feed-comments-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder(/Buscar por autor/).fill(RUN_TAG);
  };
  const status = (id: string) =>
    queryOne<{ status: string; moderationReason: string | null }>("SELECT status, moderationReason FROM image_section_comments WHERE id = ?", [id]);

  test.beforeAll(async ({ request }) => {
    adminTokens = await loginAs(request, "admin");
    memberTokens = await loginAs(request, "member");
    leaderTokens = await loginAs(request, "leader");
    for (const key of FLAGS) {
      flagBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await setFlag(request, adminTokens.accessToken, key, true);
    }
    const gallery = await createGallery(request, adminTokens.accessToken, `${RUN_TAG} galeria moderação ui`, `${RUN_TAG} legada`);
    pageId = gallery.pageId;
    sectionId = await createFeedSection(request, memberTokens.accessToken, adminTokens.accessToken, pageId, `${RUN_TAG} visita`, true);
  });

  test.afterAll(async ({ request }) => {
    for (const key of FLAGS) await setFlag(request, adminTokens.accessToken, key, flagBefore[key]);
    await removeSection(request, adminTokens.accessToken, sectionId);
    await removeGallery(request, adminTokens.accessToken, pageId);
    expect(await countRows("image_pages", { id: pageId })).toBe(0);
    expect(await countRows("image_section_comments", { sectionId })).toBe(0);
    await closeDb();
  });

  test("[comments-moderation.ui#comentar] o membro comenta: aviso de aguardando aprovação, só ele vê o pendente", async ({ page }) => {
    await seedBrowserSession(page, memberTokens);
    await openFeedComments(page);
    for (const text of [approvedText, rejectedText]) {
      await card(page).getByTestId("shelter-feed-comment-input").fill(text);
      await card(page).getByTestId("shelter-feed-comment-submit").click();
      await expect(card(page).getByTestId("feed-comments-pending-notice")).toContainText("aguarda aprovação");
      await expect(card(page).getByTestId("shelter-feed-comment-input")).toHaveValue("");
    }
    const mine = card(page).getByTestId("feed-comments-mine-item");
    await expect(mine).toHaveCount(2);
    for (const item of await mine.all()) await expect(item.getByTestId("feed-comments-mine-status")).toHaveAttribute("data-status", "pending");
    await expect(card(page).getByTestId("shelter-feed-comment-item")).toHaveCount(0);
    await expect(card(page).getByTestId("shelter-feed-comments-toggle")).toContainText("(0)");

    approvedId = (await queryOne<{ id: string }>("SELECT id FROM image_section_comments WHERE sectionId = ? AND content = ?", [sectionId, approvedText]))!.id;
    rejectedId = (await queryOne<{ id: string }>("SELECT id FROM image_section_comments WHERE sectionId = ? AND content = ?", [sectionId, rejectedText]))!.id;
    expect(await countRows("image_section_comments", { sectionId, authorId: memberTokens.userId, status: "pending" })).toBe(2);
  });

  test("[comments-moderation.ui#painel] o admin vê a fila pendente com contagens e o selo, abre o comentário com a publicação e aprova um", async ({ page }) => {
    await seedBrowserSession(page, adminTokens);
    await openPanel(page);
    await expect(page.getByTestId("feed-comments-tab-pending")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId(`feed-comments-card-${approvedId}`)).toBeVisible();
    await expect(page.getByTestId(`feed-comments-card-${rejectedId}`)).toBeVisible();
    await expect(page.getByTestId(`feed-comments-card-status-${approvedId}`)).toHaveAttribute("data-status", "pending");
    const pending = await countRows("image_section_comments", { status: "pending" });
    await expect(page.getByTestId("feed-comments-tab-count-pending")).toHaveText(String(pending));
    // Selo de pendentes no menu lateral.
    await expect(page.locator('[data-testid="feed-comments-pending-badge"]').first()).toHaveAttribute("data-count", String(pending));

    await page.locator(ID("feed-comments-review", approvedId)).click();
    const dialog = page.getByTestId("feed-comments-review-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("feed-comments-review-text")).toHaveText(approvedText);
    await expect(dialog.getByTestId("feed-comments-review-post")).toContainText(`${RUN_TAG} visita`);
    await dialog.getByTestId("feed-comments-approve").click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId(`feed-comments-card-${approvedId}`)).toHaveCount(0); // saiu da aba de pendentes
    expect(await status(approvedId)).toMatchObject({ status: "approved" });

    await page.getByTestId("feed-comments-tab-approved").click();
    await expect(page.getByTestId(`feed-comments-card-${approvedId}`)).toBeVisible();
    await expect(page.getByTestId(`feed-comments-card-status-${approvedId}`)).toHaveAttribute("data-status", "approved");
  });

  test("[comments-moderation.ui#reprovar] reprovar exige o motivo; com motivo reprova e o autor o recebe", async ({ page }) => {
    await seedBrowserSession(page, adminTokens);
    await openPanel(page);
    await page.locator(ID("feed-comments-review", rejectedId)).click();
    const dialog = page.getByTestId("feed-comments-review-dialog");
    await dialog.getByTestId("feed-comments-reject").click();
    await expect(dialog.getByText("Informe o motivo antes de reprovar.")).toBeVisible();
    expect((await status(rejectedId))?.status).toBe("pending");

    await dialog.getByTestId("feed-comments-review-reason").fill(rejectionReason);
    await dialog.getByTestId("feed-comments-reject").click();
    await expect(dialog).toBeHidden();
    expect(await status(rejectedId)).toMatchObject({ status: "rejected", moderationReason: rejectionReason });
    await page.getByTestId("feed-comments-tab-rejected").click();
    await expect(page.getByTestId(`feed-comments-card-status-${rejectedId}`)).toHaveAttribute("data-status", "rejected");
  });

  test("[comments-moderation.ui#autor] o autor vê o publicado na lista e o reprovado com o motivo; sem o aviso de pendente", async ({ page }) => {
    await seedBrowserSession(page, memberTokens);
    await openFeedComments(page);
    const items = card(page).getByTestId("shelter-feed-comment-item");
    await expect(items).toHaveCount(1);
    await expect(items.getByTestId("shelter-feed-comment-content")).toHaveText(approvedText);
    const mine = card(page).getByTestId("feed-comments-mine-item");
    await expect(mine).toHaveCount(1);
    await expect(mine.getByTestId("feed-comments-mine-status")).toHaveAttribute("data-status", "rejected");
    await expect(mine.getByTestId("feed-comments-mine-reason")).toContainText(rejectionReason);
    await expect(card(page).getByTestId("feed-comments-pending-notice")).toHaveCount(0);
    await expect(card(page).getByTestId("shelter-feed-comments-toggle")).toContainText("(1)");
  });

  test("[comments-moderation.ui#outro-usuario] outro usuário vê só o aprovado: nem o reprovado, nem o motivo", async ({ page }) => {
    await seedBrowserSession(page, leaderTokens);
    await openFeedComments(page);
    const items = card(page).getByTestId("shelter-feed-comment-item");
    await expect(items).toHaveCount(1);
    await expect(items.getByTestId("shelter-feed-comment-content")).toHaveText(approvedText);
    await expect(card(page).getByTestId("feed-comments-mine-item")).toHaveCount(0);
    await expect(card(page)).not.toContainText(rejectedText);
    await expect(card(page)).not.toContainText(rejectionReason);
  });

  test("[comments-moderation.ui#excluir] o admin exclui um comentário pelo painel, com confirmação", async ({ page, request }) => {
    const extra = await postComment(request, leaderTokens.accessToken, sectionId, `${RUN_TAG} para excluir`);
    await seedBrowserSession(page, adminTokens);
    await openPanel(page);
    await page.locator(ID("feed-comments-review", extra)).click();
    await page.getByTestId("feed-comments-delete").click();
    await page.getByTestId("feed-comments-delete-confirm").getByRole("button", { name: /excluir/i }).last().click();
    await expect(page.getByTestId(`feed-comments-card-${extra}`)).toHaveCount(0);
    await expect.poll(() => countRows("image_section_comments", { id: extra })).toBe(0);
  });

  test("[comments-moderation.ui#mobile] @mobile 375×812: painel sem rolagem horizontal, alvos ≥ 44px e diálogo em tela cheia", async ({ page, request }) => {
    const extra = await postComment(request, leaderTokens.accessToken, sectionId, `${RUN_TAG} no celular`);
    await seedBrowserSession(page, adminTokens);
    await openPanel(page);
    await expect(page.getByTestId(`feed-comments-card-${extra}`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

    for (const testId of ["feed-comments-tab-pending", "feed-comments-tab-approved", "feed-comments-tab-rejected", `feed-comments-review-${extra}`]) {
      const box = await page.getByTestId(testId).boundingBox();
      expect(box, testId).not.toBeNull();
      expect(box!.height, testId).toBeGreaterThanOrEqual(43.9);
    }
    await page.getByTestId(`feed-comments-review-${extra}`).click();
    const dialog = page.getByTestId("feed-comments-review-dialog");
    await expect(dialog).toBeVisible();
    for (const testId of ["feed-comments-approve", "feed-comments-reject", "feed-comments-delete", "feed-comments-review-close"]) {
      const box = await dialog.getByTestId(testId).boundingBox();
      expect(box, testId).not.toBeNull();
      expect(box!.height, testId).toBeGreaterThanOrEqual(43.9);
      expect(box!.x + box!.width, testId).toBeLessThanOrEqual(375);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await dialog.getByTestId("feed-comments-review-close").click();

    // O autor, no celular: aviso e lista pessoal cabem sem rolagem lateral.
    await seedBrowserSession(page, memberTokens);
    await openFeedComments(page);
    await card(page).getByTestId("shelter-feed-comment-input").fill(`${RUN_TAG} pelo celular`);
    await card(page).getByTestId("shelter-feed-comment-submit").click();
    await expect(card(page).getByTestId("feed-comments-pending-notice")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    const del = await card(page).getByTestId("feed-comments-mine-delete").first().boundingBox();
    expect(del!.height).toBeGreaterThanOrEqual(43.9);
    expect(del!.width).toBeGreaterThanOrEqual(43.9);
  });
});
