import type { Page } from "@playwright/test";

import { SHELTER_FEED_PATH } from "../../../src/features/shelter-feed/routes";
import { queryAll, queryOne, closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { massCount } from "../support/keep-data";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { approveComment, rejectComment } from "../shelter-feed/comments-moderation-helpers";
import { createFeedSection, createGallery, setFlag } from "../shelter-feed/feed-fixtures";

/**
 * MASSA (regra do usuário): toda execução deixa de 5 a 10 comentários do feed, escritos por membro e líder PELA
 * TELA do feed numa galeria/publicação `MASSA E2E` (que também ficam). Parte fica pendente, parte é aprovada e
 * parte reprovada (com motivo) pela API de moderação, para a fila de `/adm/comentarios-feed` ficar variada.
 */
const FLAGS = ["shelter_feed", "shelter_feed_comments"] as const;
/** O envio é limitado a 5 por autor por minuto: dois autores cobrem os 10. */
const PER_AUTHOR = 5;

test.describe.serial("Comentários do feed — massa da execução (UI real)", () => {
  test("membro e líder comentam de 5 a 10 vezes pela tela do feed e a fila do admin fica variada (pendente, aprovado, reprovado)", async ({ page, request }) => {
    test.setTimeout(600_000);
    const admin = await loginAs(request, "admin");
    const member = await loginAs(request, "member");
    const leader = await loginAs(request, "leader");
    const before: Record<string, boolean> = {};
    for (const key of FLAGS) {
      before[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await setFlag(request, admin.accessToken, key, true);
    }
    const total = massCount();
    const prefix = `MASSA E2E Comentário ${RUN_TAG}`;
    try {
      const gallery = await createGallery(request, admin.accessToken, `MASSA E2E Galeria ${RUN_TAG}`, `MASSA E2E legada ${RUN_TAG}`);
      const sectionId = await createFeedSection(request, member.accessToken, admin.accessToken, gallery.pageId, `MASSA E2E Visita ${RUN_TAG}`, true);

      const card = (target: Page) => target.locator(`[data-testid="shelter-feed-section"][data-section-id="${sectionId}"]`);
      let written = 0;
      for (const who of [member, leader]) {
        if (written >= total) break;
        await seedBrowserSession(page, who);
        await page.goto(`${SHELTER_FEED_PATH}?galeria=${gallery.pageId}`);
        await expect(card(page)).toBeVisible({ timeout: 20_000 });
        await card(page).getByTestId("shelter-feed-comments-toggle").click();
        await expect(card(page).getByTestId("shelter-feed-comments-panel")).toBeVisible();
        for (let i = 0; i < PER_AUTHOR && written < total; i += 1) {
          written += 1;
          await card(page).getByTestId("shelter-feed-comment-input").fill(`${prefix} ${String(written).padStart(2, "0")}`);
          await card(page).getByTestId("shelter-feed-comment-submit").click();
          await expect(card(page).getByTestId("feed-comments-pending-notice")).toContainText("aguarda aprovação");
          await expect(card(page).getByTestId("shelter-feed-comment-input")).toHaveValue("");
        }
      }

      const rows = await queryAll<{ id: string }>(
        "SELECT id FROM image_section_comments WHERE sectionId = ? AND content LIKE ? ORDER BY content",
        [sectionId, `${prefix}%`],
      );
      expect(rows).toHaveLength(total);
      for (const [position, row] of rows.entries()) {
        if (position % 3 === 1) expect((await approveComment(request, admin.accessToken, row.id)).ok()).toBe(true);
        if (position % 3 === 2) expect((await rejectComment(request, admin.accessToken, row.id, `${prefix} fora do tema`)).ok()).toBe(true);
      }
      const statuses = await queryAll<{ status: string }>("SELECT status FROM image_section_comments WHERE sectionId = ? AND content LIKE ?", [sectionId, `${prefix}%`]);
      expect(statuses.filter((row) => row.status === "pending").length).toBe(Math.ceil(total / 3));

      await seedBrowserSession(page, admin);
      await page.goto("/adm/comentarios-feed");
      await page.getByTestId("feed-comments-tab-all").click();
      await page.getByTestId("feed-comments-toolbar-search").fill(prefix);
      await expect(page.getByTestId("feed-comments-pagination-summary")).toHaveText(new RegExp(`de ${total}$`), { timeout: 20_000 });
    } finally {
      for (const key of FLAGS) await setFlag(request, admin.accessToken, key, before[key]);
      await closeDb();
    }
  });
});
