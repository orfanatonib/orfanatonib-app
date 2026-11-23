import { closeDb } from "../support/db";
import { massCount } from "../support/keep-data";
import { test } from "../support/live";
import { createMassViaUi, ensureMassWorld, printMass } from "./mass";

/** Massa que TODA execução deixa (5 a 10 acolhidos, pela UI, com pagelas e decisões). Roda na suíte normal. */
test.describe.serial("Área dos Acolhidos — massa acumulada (UI real)", () => {
  test.afterAll(async () => {
    await closeDb();
  });

  test("cria 5 a 10 acolhidos pela UI (líder e membro) com pagelas semanais e decisões", async ({ browser, request }) => {
    test.setTimeout(480_000);
    const world = await ensureMassWorld(request);
    const result = await createMassViaUi(browser, world, massCount());
    printMass(world, result);
  });
});
