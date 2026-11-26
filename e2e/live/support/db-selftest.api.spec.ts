import { expect, test } from "@playwright/test";

import { closeDb, countRows, expectNoRow, expectRow, queryAll } from "./db";
import { Cleaner, RUN_TAG, tagged } from "./factory";
import { CLEANUP_ENABLED } from "./keep-data";

/** Auto-teste dos helpers de banco contra o MySQL local (somente leitura). */
test.describe("helpers de banco dos E2E", () => {
  test.afterAll(async () => {
    await closeDb();
  });

  test("[e2e.db.select-basico] conecta e executa SELECT", async () => {
    const rows = await queryAll<{ one: number }>("SELECT 1 AS one");
    expect(Number(rows[0].one)).toBe(1);
  });

  test("[e2e.db.contagem] countRows/expectNoRow numa tabela real", async () => {
    expect(await countRows("feature_flags")).toBeGreaterThan(0);
    await expectNoRow("feature_flags", { key: `inexistente-${RUN_TAG}` });
    await expect(expectRow("feature_flags", { key: `inexistente-${RUN_TAG}` })).rejects.toThrow("Esperava exatamente 1 linha");
  });

  test("[e2e.db.somente-leitura] recusa escrita mesmo com SQL embutido", async () => {
    await expect(queryAll("DELETE FROM feature_flags")).rejects.toThrow("único SELECT");
    await expect(queryAll("SELECT 1; DROP TABLE feature_flags")).rejects.toThrow("único SELECT");
    await expect(countRows("feature_flags; DROP TABLE x")).rejects.toThrow("Identificador SQL inválido");
  });

  test("[e2e.db.outbox] tabela de e-mail acessível para as asserções de envio", async () => {
    expect(await countRows("email_outbox", { templateKey: `nenhum-${RUN_TAG}` })).toBe(0);
  });
});

test.describe("Cleaner", () => {
  test("[e2e.cleaner.ordem-inversa] desfaz em ordem inversa e reporta falhas sem parar", async () => {
    const order: string[] = [];
    const cleaner = new Cleaner();
    cleaner.track("a", async () => { order.push("a"); });
    cleaner.track("falha", async () => { throw new Error("boom"); });
    cleaner.track("c", async () => { order.push("c"); });
    if (CLEANUP_ENABLED) {
      await expect(cleaner.run()).rejects.toThrow("falha: boom");
      expect(order).toEqual(["c", "a"]);
    } else {
      // Padrão: a massa fica, então nada registrado é executado.
      await cleaner.run();
      expect(order).toEqual([]);
    }
    expect(tagged("x")).toContain(RUN_TAG);
  });
});
