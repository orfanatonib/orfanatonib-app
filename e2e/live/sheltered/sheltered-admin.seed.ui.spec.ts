import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { massCount } from "../support/keep-data";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  buildMassPlans,
  createMassThroughUi,
  ensureMassShelter,
  finishMassViaApi,
  MASS_PREFIX,
  MASS_SHELTER_NAMES,
} from "./sheltered-mass";

/**
 * @seed — massa dedicada de acolhidos, criada PELA UI do admin (/adm/acolhidos) e deixada no banco.
 * Não é cenário e não apaga nada. Rode com `npm run seed:acolhidos` (projeto `live-seed`, `E2E_SEED=1`).
 *
 * A cada execução cria `massCount()` (5 a 10) acolhidos NOVOS (`MASSA E2E Acolhido <RUN_TAG> NN ...`), que
 * acumulam. Na primeira vez completa até 20 para filtros, ordenação e paginação (>12) terem o que mostrar.
 * Os 3 abrigos `MASSA E2E Abrigo ...` são idempotentes (criados pela API só se faltarem).
 * Limite: `createdAt` é do servidor (não há campo na UI): a data de cadastro é a do dia da rodada.
 */
const MIN_TOTAL = 20;

test.describe("@seed Massa de acolhidos pela UI do admin", () => {
  test("cria massa nova de acolhidos pela UI e deixa tudo no banco", async ({ page, request }) => {
    const tokens = await loginAs(request, "admin");
    for (const name of MASS_SHELTER_NAMES) await ensureMassShelter(request, tokens.accessToken, name);

    const existing = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE name LIKE ?", [`${MASS_PREFIX} Acolhido %`]))?.n ?? 0);
    const count = Math.max(massCount(), MIN_TOTAL - existing);

    await seedBrowserSession(page, tokens);
    await page.goto("/adm/acolhidos");
    await expect(page.getByTestId("sheltered-manager")).toBeVisible({ timeout: 20_000 });

    for (const plan of buildMassPlans(RUN_TAG, count, existing)) {
      const id = await createMassThroughUi(page, plan);
      await finishMassViaApi(request, tokens.accessToken, id, plan);
    }

    const total = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE name LIKE ?", [`${MASS_PREFIX} Acolhido %`]))?.n);
    expect(total).toBe(existing + count);
    expect(total).toBeGreaterThanOrEqual(MIN_TOTAL);

    await page.getByTestId("sheltered-toolbar-search").fill(`${MASS_PREFIX} Acolhido`);
    await expect(page.getByTestId("sheltered-pagination-summary")).toHaveText(new RegExp(`1–12 de ${total}`), { timeout: 15_000 });
    await closeDb();
  });
});
