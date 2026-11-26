import { closeDb } from "../support/db";
import { tagged } from "../support/factory";
import { massCount } from "../support/keep-data";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { openCreator } from "../page-creator/support";
import { mediaRows, pageRow } from "./support";

/**
 * Massa (regra do E2E): toda execução cria de 5 a 10 páginas de vídeos PELA TELA do criador, cada uma com um vídeo
 * por link. Ficam no banco e acumulam; a prova é o SELECT (página + mídia ligada) e a listagem filtrada pela tag.
 */
test.describe.serial("Páginas de vídeos — massa por execução (UI ao vivo)", () => {
  test.afterAll(async () => {
    await closeDb();
  });

  test("cria de 5 a 10 páginas pelo criador e elas aparecem na lista", async ({ page, request }) => {
    const total = massCount();
    test.setTimeout(60_000 + total * 40_000);

    for (let n = 1; n <= total; n += 1) {
      // O app rotaciona o refresh token; cada volta semeia uma sessão nova (o init script reaplica as chaves a cada navegação).
      await seedBrowserSession(page, await loginAs(request, "admin"));
      const title = tagged(`massa-videos-${String(n).padStart(2, "0")}`);
      await openCreator(page, "page-template-card-videos");
      const input = (id: string) => page.getByTestId(id).locator("input:not([aria-hidden]), textarea:not([aria-hidden])");
      await input("video-page-creator-title").fill(title);
      await input("video-page-creator-description").fill(`Página de massa ${n} de ${total}`);
      await page.getByTestId("video-form-title").fill(`Vídeo de ${title}`);
      await page.getByTestId("video-form-description").fill(`Descrição do vídeo ${n}`);
      await page.getByTestId("video-form-url").fill("https://youtu.be/abc123");
      await expect(async () => {
        await page.getByTestId("video-form-submit").click();
        await expect(page.getByTestId("video-list-item")).toHaveCount(1, { timeout: 1500 });
      }).toPass();

      const posted = page.waitForResponse((r) => r.url().endsWith("/video-pages") && r.request().method() === "POST");
      await page.getByTestId("video-page-creator-save").click();
      const response = await posted;
      expect(response.status(), await response.text()).toBe(201);
      const body = (await response.json()) as { id: string };
      expect((await pageRow(body.id))?.name).toBe(title);
      expect(await mediaRows(body.id)).toHaveLength(1);
    }

    await page.goto("/adm/paginas-videos");
    await expect(page.getByTestId("video-pages-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("video-pages-toolbar-search").fill(tagged("massa-videos"));
    await expect(page.getByTestId("video-pages-pagination-summary")).toHaveText(new RegExp(`^1–${Math.min(12, total)} de ${total}$`));
  });
});
