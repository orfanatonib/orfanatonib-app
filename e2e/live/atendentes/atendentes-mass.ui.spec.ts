import { queryAll, queryOne } from "../support/db";
import { massCount } from "../support/keep-data";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import { mediaCount } from "./support";

/** Identificador próprio da massa: não contém o RUN_TAG da execução, então não entra nas contagens dos specs de filtro. */
const MASS_TAG = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * MASSA (regra do E2E): toda execução deixa de 5 a 10 antecedentes NOVOS, criados pelo formulário real de
 * `/adm/antecedentes`, com PDF estadual (todos) e federal (os de índice ímpar). Ficam no banco e no S3 e acumulam
 * a cada rodada; a prova de S3 é a invariante global (sem objeto órfão, sem referência quebrada).
 */
const nameOf = (index: number): string => `MASSA E2E Antecedente ${MASS_TAG} ${String(index).padStart(2, "0")}`;

test.describe.serial("Massa de antecedentes: 5 a 10 novos por execução, pela UI", () => {
  test("cria a massa (antecedentes com PDFs reais pelo formulário e prova banco e S3)", async ({ page, request }) => {
    const COUNT = massCount();
    test.setTimeout(60_000 + COUNT * 25_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/antecedentes");
    await expect(page.getByTestId("atendentes-manager")).toBeVisible({ timeout: 20_000 });

    for (let index = 1; index <= COUNT; index += 1) {
      await page.getByTestId("atendentes-create").click();
      await expect(page.getByTestId("atendentes-form-dialog")).toBeVisible();
      await page.getByTestId("atendentes-form-name").fill(nameOf(index));
      await page.getByTestId("atendentes-form-file-estadual").setInputFiles({
        name: `massa-${index}-estadual.pdf`,
        mimeType: "application/pdf",
        buffer: Buffer.from(`%PDF-1.4 massa ${MASS_TAG} ${index} estadual`),
      });
      if (index % 2 === 1) {
        await page.getByTestId("atendentes-form-file-federal").setInputFiles({
          name: `massa-${index}-federal.pdf`,
          mimeType: "application/pdf",
          buffer: Buffer.from(`%PDF-1.4 massa ${MASS_TAG} ${index} federal`),
        });
      }
      await page.getByTestId("atendentes-form-submit").click();
      await expect(page.getByTestId("atendentes-form-dialog")).toBeHidden({ timeout: 20_000 });
      // O aviso some e reaparece a cada cadastro seguido; a prova estável é a linha nova no banco.
      await expect
        .poll(async () => (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM atendentes WHERE name LIKE ?", [`MASSA E2E Antecedente ${MASS_TAG} %`]))?.n, { timeout: 20_000 })
        .toBe(index);
    }

    const rows = await queryAll<{ id: string; name: string }>("SELECT id, name FROM atendentes WHERE name LIKE ? ORDER BY name", [`MASSA E2E Antecedente ${MASS_TAG} %`]);
    expect(rows).toHaveLength(COUNT);
    for (const [position, row] of rows.entries()) {
      const index = position + 1;
      expect(row.name).toBe(nameOf(index));
      expect(await mediaCount(row.id), `PDFs de ${row.name}`).toBe(index % 2 === 1 ? 2 : 1);
      const estadual = await queryOne<{ url: string }>("SELECT url FROM media_items WHERE targetId = ? AND targetType = 'AtendenteEstadual'", [row.id]);
      expect(estadual?.url).toContain("/private/AtendenteEstadual/");
    }
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
