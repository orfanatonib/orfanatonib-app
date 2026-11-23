import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { massCount } from "../support/keep-data";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { createShelter, label } from "../shelters/support";
import { createActor } from "../users/support";

/**
 * Massa acumulada: toda execução deixa de 5 a 10 pagelas no banco (`massCount()`): um abrigo novo, um acolhido e um
 * membro autor, com anos, visitas, presenças e notas variados. A tela de Pagelas do painel só lista (a pagela é criada
 * na área do membro), então a massa entra pela API real e o spec confere pela UI, descendo abrigo → acolhido → pagelas.
 * Nada é apagado (limpeza só com E2E_CLEANUP=1).
 */
test.describe.serial("Pagelas: massa acumulada", () => {
  test("cria 5 a 10 pagelas novas e elas aparecem na tela, iguais ao banco", async ({ page, request }) => {
    const admin = (await loginAs(request, "admin")).accessToken;
    const count = massCount();
    const author = await createActor(request, admin, "member", "massa-pagela");
    const authorProfileId = (await queryOne<{ id: string }>("SELECT p.id AS id FROM member_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?", [author.email]))?.id ?? "";
    expect(authorProfileId).not.toBe("");
    const shelter = await createShelter(request, admin, { name: label("massa-pagelas"), teamsQuantity: 1 });
    const sheltered = await request.post(`${API_URL}/sheltered`, {
      headers: authHeaders(admin),
      data: { name: label("massa-acolhido"), gender: "M", shelterId: shelter.id },
    });
    expect(sheltered.status(), await sheltered.text()).toBe(201);
    const shelteredId = ((await sheltered.json()) as { id: string }).id;

    const ids: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const res = await request.post(`${API_URL}/pagelas`, {
        headers: authHeaders(admin),
        data: {
          shelteredId,
          memberProfileId: authorProfileId,
          referenceDate: `2026-06-${String(i + 1).padStart(2, "0")}`,
          year: 2026,
          visit: i + 1,
          present: i % 4 !== 3,
          notes: `MASSA E2E pagela ${RUN_TAG} #${i + 1}`,
        },
      });
      expect(res.status(), await res.text()).toBe(201);
      ids.push(((await res.json()) as { id: string }).id);
    }
    const db = await queryAll<{ id: string }>("SELECT id FROM pagelas WHERE sheltered_id = ? ORDER BY year DESC, visit DESC", [shelteredId]);
    expect(db.map((r) => r.id)).toEqual([...ids].reverse());

    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/pagelas");
    await page.getByTestId("pagelas-toolbar-search").fill(label("massa-pagelas"));
    await page.getByTestId(`pagelas-card-open-${shelter.id}`).click();
    await page.getByTestId(`pagelas-card-open-${shelteredId}`).click();
    await expect(page.getByTestId("pagelas-pagination-summary")).toHaveText(`1–${count} de ${count}`);
    for (const id of ids) await expect(page.getByTestId(`pagelas-card-${id}`)).toBeVisible();
    await closeDb();
  });
});
