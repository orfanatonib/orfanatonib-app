import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { massCount } from "../support/keep-data";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { expectNoBrokenRefs, expectNoOrphans, objectExists } from "../support/s3";
import { keyFromUrl } from "../support/s3-invariants";
import { s3Config } from "../support/env";
import { makePng } from "../shelter-feed/png";

/**
 * MASSA (regra do usuário): toda execução deixa de 5 a 10 ideias compartilhadas, enviadas por um membro PELA TELA
 * (`/area-do-membro/compartilhar-ideia`): as pares com vídeo por link, as ímpares com FOTO enviada (linha de mídia +
 * objeto no S3). Ficam na fila de `/adm/ideias-compartilhadas` e acumulam a cada rodada.
 */
const FLAGS = ["idea_submission", "idea_moderation"] as const;

test.describe.serial("Ideias compartilhadas — massa da execução (UI real)", () => {
  test("o membro compartilha de 5 a 10 ideias pela tela (vídeo e foto) e a fila do admin as mostra, com mídia consistente", async ({ page, request }) => {
    test.setTimeout(600_000);
    const admin = await loginAs(request, "admin");
    const member = await loginAs(request, "member");
    const before: Record<string, boolean> = {};
    for (const key of FLAGS) {
      before[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled: true } });
    }
    const total = massCount();
    const prefix = `MASSA E2E Ideia ${RUN_TAG}`;
    try {
      await seedBrowserSession(page, member);
      for (let index = 1; index <= total; index += 1) {
        const title = `${prefix} ${String(index).padStart(2, "0")}`;
        const withImage = index % 2 === 1;
        await page.goto("/area-do-membro/compartilhar-ideia");
        await page.getByTestId("idea-title").fill(title);
        await page.getByTestId("idea-description").fill(`Brincadeira da massa ${index}`);
        if (withImage) {
          await page.getByTestId("idea-tab-images").click();
          await page.getByTestId("idea-image-file").setInputFiles({ name: `ideia-${index}.png`, mimeType: "image/png", buffer: makePng(320, 240, index) });
          await page.getByTestId("idea-image-add").click();
        } else {
          await page.getByTestId("idea-tab-videos").click();
          await page.getByTestId("idea-video-upload-type").getByRole("combobox").click();
          await page.getByRole("option", { name: /Link do YouTube/ }).click();
          await page.getByTestId("idea-video-url").fill(`https://youtu.be/massa${index}`);
          await page.getByTestId("idea-video-add").click();
        }
        await page.getByTestId("idea-share-submit").click();
        await expect
          .poll(async () => (await queryOne<{ id: string }>("SELECT id FROM ideas_sections WHERE title = ?", [title]))?.id ?? null, { timeout: 30_000 })
          .not.toBeNull();
      }

      const rows = await queryAll<{ id: string; title: string; pageId: string | null; user_id: string | null }>(
        "SELECT id, title, pageId, user_id FROM ideas_sections WHERE title LIKE ? ORDER BY title",
        [`${prefix}%`],
      );
      expect(rows).toHaveLength(total);
      for (const [position, row] of rows.entries()) {
        expect(row).toMatchObject({ pageId: null, user_id: member.userId });
        const media = await queryAll<{ url: string; mediaType: string; isLocalFile: number }>(
          "SELECT url, mediaType, isLocalFile FROM media_items WHERE targetType = 'IdeasSection' AND targetId = ?",
          [row.id],
        );
        expect(media).toHaveLength(1);
        if ((position + 1) % 2 === 1) {
          expect(media[0]).toMatchObject({ mediaType: "image", isLocalFile: 1 });
          expect(await objectExists(keyFromUrl(media[0].url, s3Config().bucket) as string)).toBe(true);
        } else {
          expect(media[0]).toMatchObject({ mediaType: "video", isLocalFile: 0 });
        }
      }
      await expectNoOrphans();
      await expectNoBrokenRefs();

      await seedBrowserSession(page, admin);
      await page.goto("/adm/ideias-compartilhadas");
      await page.getByTestId("ideas-sections-toolbar-search").fill(prefix);
      await expect(page.getByTestId("ideas-sections-pagination-summary")).toHaveText(new RegExp(`de ${total}$`), { timeout: 20_000 });
    } finally {
      for (const key of FLAGS) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled: before[key] } });
      }
      await closeDb();
    }
  });
});
