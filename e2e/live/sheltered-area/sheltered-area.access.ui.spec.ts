import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { withFlagsOff } from "../support/flags";
import { buildAreaWorld, cardIds, disposeAreaWorld, openAs, P, type AreaWorld } from "./support";

/** Acesso à Área dos Acolhidos: visitante, sem vínculo, flag desligada, admin, e o que NÃO existe mais. */
test.describe.serial("Área dos Acolhidos — acesso (UI real)", () => {
  let w: AreaWorld;

  test.beforeAll(async ({ request }) => {
    w = await buildAreaWorld(request);
  });
  test.afterAll(async ({ request }) => {
    await disposeAreaWorld(request, w);
  });

  test("visitante é levado ao login", async ({ page }) => {
    await page.goto("/area-dos-acolhidos");
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await expect(page.getByTestId(`${P}-page`)).toHaveCount(0);
  });

  test("membro sem equipe vê a página 'sem abrigo vinculado' e nenhuma lista", async ({ page }) => {
    await openAs(page, w.idleMember);
    await expect(page.getByTestId("sheltered-area-no-shelter")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("sheltered-area-no-shelter-title")).toContainText("não está vinculado");
    await expect(page.getByTestId(`${P}-search`)).toHaveCount(0);
    expect(await cardIds(page)).toEqual([]);
  });

  test("líder sem equipe vê a página 'sem abrigo vinculado'", async ({ page }) => {
    await openAs(page, w.idleLeader);
    await expect(page.getByTestId("sheltered-area-no-shelter")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`${P}-create`)).toHaveCount(0);
  });

  test("líder e membro vinculados veem a tela com o nome do abrigo", async ({ page }) => {
    for (const actor of [w.leader, w.member]) {
      await openAs(page, actor);
      await expect(page.getByTestId(`${P}-heading`)).toHaveText("Área dos acolhidos", { timeout: 20_000 });
      await expect(page.getByTestId(`${P}-shelter-name`)).toContainText(w.shelterA.name);
      await expect(page.getByTestId("sheltered-area-no-shelter")).toHaveCount(0);
    }
  });

  test("admin abre a área sem vínculo (não há seletor de abrigo: a lista cobre todos os abrigos)", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/area-dos-acolhidos");
    await expect(page.getByTestId(`${P}-heading`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("sheltered-area-no-shelter")).toHaveCount(0);
    await page.getByTestId(`${P}-search`).fill(w.shelterB.name);
    await expect(page.getByTestId(`${P}-card-${w.foreign[0].id}`)).toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => (await cardIds(page)).sort()).toEqual(w.foreign.map((f) => f.id).sort());
  });

  test("com sheltered_area desligada a tela some (a rota redireciona) e volta ao religar", async ({ page, request }) => {
    await withFlagsOff(request, w.admin, ["sheltered_area"], async () => {
      await openAs(page, w.leader);
      await expect(page.getByTestId(`${P}-page`)).toHaveCount(0, { timeout: 20_000 });
      await expect(page).not.toHaveURL(/\/area-dos-acolhidos/);
    });
    await openAs(page, w.leader);
    await expect(page.getByTestId(`${P}-heading`)).toBeVisible({ timeout: 20_000 });
  });

  test("o cartão não tem botão de integração e /integracao é 404", async ({ page }) => {
    await openAs(page, w.leader);
    const first = w.made[0].id;
    await expect(page.getByTestId(`${P}-card-${first}`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`${P}-card-${first}`).getByText(/Integra/i)).toHaveCount(0);
    await page.goto("/integracao");
    await expect(page.getByTestId("not-found-page")).toBeVisible({ timeout: 20_000 });
  });
});
