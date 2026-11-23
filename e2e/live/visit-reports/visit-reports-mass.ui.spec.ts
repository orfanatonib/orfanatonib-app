import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { massCount } from "../support/keep-data";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { createShelter, label } from "../shelters/support";

/**
 * Massa acumulada: toda execução deixa de 5 a 10 relatórios de visita no banco (`massCount()`), criados PELA TELA
 * (formulário abrigo → equipe → agenda). O abrigo e as agendas entram pela API real (a tela de relatórios não cria
 * agenda). Nada é apagado (limpeza só com E2E_CLEANUP=1).
 */
test.describe.serial("Relatórios de visita: massa acumulada", () => {
  test("cria 5 a 10 relatórios novos pelo formulário e eles aparecem na lista, iguais ao banco", async ({ page, request }) => {
    test.setTimeout(240_000);
    const admin = (await loginAs(request, "admin")).accessToken;
    const count = massCount();
    const shelterName = label("massa-relatorios");
    const shelter = await createShelter(request, admin, { name: shelterName, teamsQuantity: 1 });
    const teamId = (await queryOne<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? ORDER BY numberTeam LIMIT 1", [shelter.id]))?.id ?? "";
    expect(teamId).not.toBe("");
    for (let i = 0; i < count; i += 1) {
      const date = new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10);
      const res = await request.post(`${API_URL}/shelter-schedules`, {
        headers: authHeaders(admin),
        data: { visitNumber: 700 + i, lessonContent: `MASSA E2E lição ${RUN_TAG} ${i + 1}`, teamId, visitDate: date, meetingDate: date },
      });
      expect(res.status(), await res.text()).toBe(201);
    }

    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/relatorios-visita");
    await expect(page.getByTestId("visit-reports-manager")).toBeVisible({ timeout: 20_000 });
    for (let i = 0; i < count; i += 1) {
      await page.getByTestId("visit-reports-create").click();
      await expect(page.getByTestId("visit-reports-form-dialog")).toBeVisible();
      await page.getByRole("combobox", { name: "Abrigo" }).click();
      await page.getByRole("option", { name: shelterName }).click();
      await page.getByRole("combobox", { name: "Equipe" }).click();
      await page.getByRole("option", { name: /Equipe 1/ }).click();
      await page.getByRole("combobox", { name: /Agendamento/ }).click();
      await page.getByRole("option", { name: new RegExp(`${700 + i}ª Visita`) }).click();
      await page.getByTestId("visit-reports-form-team-members").fill(String(3 + i));
      await page.getByTestId("visit-reports-form-sheltered-heard").fill(String(5 + i));
      await page.getByTestId("visit-reports-form-caretakers-heard").fill("2");
      await page.getByTestId("visit-reports-form-sheltered-decisions").fill(String(i % 3));
      await page.getByTestId("visit-reports-form-caretakers-decisions").fill("1");
      await page.getByTestId("visit-reports-form-observation").fill(`MASSA E2E relatório ${RUN_TAG} #${i + 1}`);
      await page.getByTestId("visit-reports-form-submit").click();
      await expect(page.getByTestId("visit-reports-form-dialog")).toBeHidden({ timeout: 20_000 });
    }

    const db = await queryAll<{ id: string }>(
      "SELECT r.id AS id FROM visit_reports r JOIN shelter_schedules s ON s.id = r.schedule_id JOIN teams t ON t.id = s.team_id WHERE t.shelter_id = ?",
      [shelter.id],
    );
    expect(db).toHaveLength(count);
    await page.getByTestId("visit-reports-toolbar-search").fill(shelterName);
    await expect(page.getByTestId("visit-reports-pagination-summary")).toHaveText(`1–${count} de ${count}`);
    for (const row of db) await expect(page.getByTestId(`visit-reports-card-${row.id}`)).toBeVisible();
    await closeDb();
  });
});
