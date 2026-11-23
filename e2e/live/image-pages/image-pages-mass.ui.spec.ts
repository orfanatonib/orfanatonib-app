import { closeDb } from "../support/db";
import { tagged } from "../support/factory";
import { massCount } from "../support/keep-data";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { captureFormData, openCreator } from "../page-creator/support";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import { mediaRows, pageRow, png, sectionRows, type ImagePageBody } from "./support";

/**
 * Massa (regra do E2E): toda execução cria de 5 a 10 galerias de fotos PELA TELA do criador, cada uma com uma seção e
 * um arquivo enviado (linha + objeto no S3 consistentes). Ficam no banco e acumulam; a prova é o SELECT e a invariante
 * global do S3 (sem órfão, sem referência quebrada).
 */
test.describe.serial("Galerias de imagens — massa por execução (UI ao vivo)", () => {
  test.afterAll(async () => {
    await closeDb();
  });

  test("cria de 5 a 10 galerias pelo criador, com foto enviada, e elas aparecem na lista", async ({ page, request }) => {
    const total = massCount();
    test.setTimeout(60_000 + total * 40_000);
    const made: Array<{ id: string; title: string }> = [];

    for (let n = 1; n <= total; n += 1) {
      // O app rotaciona o refresh token; cada volta semeia uma sessão nova (o init script reaplica as chaves a cada navegação).
      await seedBrowserSession(page, await loginAs(request, "admin"));
      const title = tagged(`massa-fotos-${String(n).padStart(2, "0")}`);
      await captureFormData(page);
      await openCreator(page, "page-template-card-gallery");
      const input = (id: string) => page.getByTestId(id).locator("input:not([aria-hidden]), textarea:not([aria-hidden])");
      await input("image-page-creator-title").fill(title);
      await input("image-page-creator-description").fill(`Galeria de massa ${n} de ${total}`);
      await page.getByTestId("image-page-creator-add-section").click();
      await page.getByTestId("image-section-editor-caption").fill(`${title}-secao`);
      await page.getByTestId("image-section-editor-description").fill("Seção de massa");
      await page.getByTestId("image-section-editor-add-media").click();
      await page.getByTestId("add-image-file-input").setInputFiles(png(`massa-${n}.png`));
      await page.getByTestId("add-image-submit").click();
      await expect(page.getByTestId("image-item-preview")).toHaveCount(1);

      const posted = page.waitForResponse((r) => r.url().endsWith("/image-pages") && r.request().method() === "POST");
      await page.getByTestId("image-page-creator-save").click();
      const response = await posted;
      expect(response.status(), await response.text()).toBe(201);
      const body = (await response.json()) as ImagePageBody;
      made.push({ id: body.id, title });
      expect((await pageRow(body.id))?.name).toBe(title);
      expect(await sectionRows(body.id)).toHaveLength(1);
      const [row] = await mediaRows(body.id);
      expect(row.isLocalFile).toBe(1);
    }

    expect(made).toHaveLength(total);
    await page.goto("/adm/paginas-fotos");
    await expect(page.getByTestId("image-pages-manager")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("image-pages-toolbar-search").fill(tagged("massa-fotos"));
    await expect(page.getByTestId("image-pages-pagination-summary")).toHaveText(
      new RegExp(`^1–${Math.min(12, total)} de ${total}$`),
    );
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
