import { closeDb } from "../support/db";
import { test } from "../support/live";
import { createMassViaUi, ensureMassWorld, printMass } from "./mass";

const SEED_COUNT = 12;

/**
 * @seed Massa para olhar a tela à mão: +12 acolhidos novos por execução, criados pela UI de
 * /area-dos-acolhidos (líder e membro), cada um com 4+ semanas de pagela e parte com decisão/inativos.
 * Nunca apaga nada; `npm run seed:acolhidos`.
 */
test.describe.serial("@seed Área dos Acolhidos — massa dedicada", () => {
  test.afterAll(async () => {
    await closeDb();
  });

  test("@seed cria 12 acolhidos com pagelas e decisões pela UI e imprime o login", async ({ browser, request }) => {
    test.setTimeout(600_000);
    const world = await ensureMassWorld(request);
    const result = await createMassViaUi(browser, world, SEED_COUNT);
    printMass(world, result);
  });
});
