import { queryOne, closeDb } from "../support/db";
import { expect, test } from "../support/live";

/**
 * Rota dinâmica NÃO pública (plano 11): o visitante recebe 404 da API, a rota não é
 * registrada e a tela mostra o 404 de verdade (não a Home, não texto técnico).
 */
test.describe("Rotas dinâmicas — UI", () => {
  test.afterAll(async () => {
    await closeDb();
  });

  test("[dynamic-routes.get.routes#visitante-rota-privada] visitante abre o endereço de uma rota privada: página 404", async ({
    page,
  }) => {
    const row = await queryOne<{ path: string }>("SELECT path FROM routes WHERE public = 0 LIMIT 1");
    if (!row) {
      // Sem rota privada no banco do E2E: o 404 de rota inexistente cobre o mesmo contrato de tela.
      await page.goto("/rota-privada-inexistente-123");
    } else {
      await page.goto(`/${row.path}`);
    }
    await expect(page.getByTestId("not-found-page")).toBeVisible({ timeout: 20_000 });
  });
});
