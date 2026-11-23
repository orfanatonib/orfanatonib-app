import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { massCount } from "../support/keep-data";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { expectNoBrokenRefs, expectNoOrphans, objectExists } from "../support/s3";
import { keyFromUrl } from "../support/s3-invariants";
import { s3Config } from "../support/env";
import { makePng } from "../shelter-feed/png";
import { SECTION_FLAGS } from "./support";

/**
 * MASSA (regra do usuário): toda execução deixa de 5 a 10 publicações de fotos dos abrigos, enviadas por um membro
 * PELA TELA (`/area-do-membro/imagens-abrigo`), com mídia consistente (linha + objeto no S3). Ficam no banco e
 * acumulam a cada rodada (sem limpeza por padrão). Cada uma entra como pendente, na fila de `/adm/fotos-abrigos`.
 */
const MEMBER_PATH = "/area-do-membro/imagens-abrigo";

test.describe.serial("Fotos dos abrigos — massa da execução (UI real)", () => {
  test("o membro envia de 5 a 10 publicações com fotos pela tela e a fila do admin as mostra, com linha e objeto no S3", async ({ page, request }) => {
    test.setTimeout(600_000);
    const admin = await loginAs(request, "admin");
    const member = await loginAs(request, "member");
    const before: Record<string, boolean> = {};
    for (const key of SECTION_FLAGS) {
      before[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled: true } });
    }
    const total = massCount();
    const prefix = `MASSA E2E Foto ${RUN_TAG}`;
    try {
      await seedBrowserSession(page, member);
      for (let index = 1; index <= total; index += 1) {
        const caption = `${prefix} ${String(index).padStart(2, "0")}`;
        await page.goto(MEMBER_PATH);
        await expect(page.getByTestId("shelter-upload-editor")).toBeVisible({ timeout: 20_000 });
        await page.getByTestId("shelter-upload-caption").fill(caption);
        await page.getByTestId("shelter-upload-description").fill(`Massa de teste ${index}: visita ao abrigo`);
        const photos = 1 + (index % 3);
        await page.getByTestId("shelter-upload-photos-input").setInputFiles(
          Array.from({ length: photos }, (_, n) => ({ name: `massa-${index}-${n}.png`, mimeType: "image/png", buffer: makePng(640, 480, index * 10 + n) })),
        );
        await expect(page.getByTestId("shelter-upload-preview-photo")).toHaveCount(photos);
        await page.getByTestId("member-photos-submit").click();
        await expect(page.getByTestId("shelter-upload-success")).toBeVisible({ timeout: 60_000 });
      }

      const rows = await queryAll<{ id: string; reviewStatus: string; authorId: string | null }>(
        "SELECT id, reviewStatus, authorId FROM image_sections WHERE caption LIKE ? ORDER BY caption",
        [`${prefix}%`],
      );
      expect(rows).toHaveLength(total);
      for (const row of rows) {
        expect(row).toMatchObject({ reviewStatus: "pending", authorId: member.userId });
        const media = await queryAll<{ url: string }>("SELECT url FROM media_items WHERE targetType = 'ImagesPage' AND targetId = ?", [row.id]);
        expect(media.length).toBeGreaterThan(0);
        for (const item of media) expect(await objectExists(keyFromUrl(item.url, s3Config().bucket) as string)).toBe(true);
      }
      await expectNoOrphans();
      await expectNoBrokenRefs();

      // A massa aparece na fila do admin (servidor): busca pelo prefixo desta execução.
      await seedBrowserSession(page, admin);
      await page.goto("/adm/fotos-abrigos");
      await page.getByTestId("image-sections-toolbar-search").fill(prefix);
      await expect(page.getByTestId("image-sections-pagination-summary")).toHaveText(new RegExp(`de ${total}$`), { timeout: 20_000 });
    } finally {
      for (const key of SECTION_FLAGS) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin.accessToken), data: { enabled: before[key] } });
      }
      await closeDb();
    }
  });
});
