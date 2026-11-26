import { queryAll } from "../support/db";
import { massCount } from "../support/keep-data";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { buildFlowCast, dayOffset, type FlowCast } from "../attendance/flow-support";
import { fillSchedule, openNewSchedule } from "../attendance/flow-ui";

/**
 * Massa de agendamentos (regra de massa do E2E): toda execução cria de 5 a 10 agendamentos pela tela, num abrigo
 * novo com RUN_TAG, e eles ficam no banco e acumulam. Sem limpeza por padrão (`E2E_CLEANUP=1` não é tratado aqui:
 * o abrigo da massa é o que o fluxo de presença também reaproveita).
 */
test.describe.serial("Agendamentos: massa da execução pela UI", () => {
  const count = massCount();
  let cast: FlowCast;

  test.beforeAll(async ({ request }) => {
    cast = await buildFlowCast(request, "massa-agenda");
  });

  test("cria os agendamentos da massa pela tela e cada um chega ao banco e à lista", async ({ page, request }) => {
    test.setTimeout(120_000 + count * 30_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/agendamentos");
    await expect(page.getByTestId("shelter-schedule-manager")).toBeVisible({ timeout: 20_000 });
    for (let n = 1; n <= count; n += 1) {
      const visit = dayOffset(-(n + 2));
      const meeting = dayOffset(-(n + 1));
      await openNewSchedule(page, false);
      await fillSchedule(page, {
        teamLabel: new RegExp(`Equipe 1 - ${cast.shelterName}`),
        visitNumber: n,
        lesson: `Lição de massa ${n} ${cast.shelterName}`,
        visitBr: visit.br,
        meetingBr: meeting.br,
      });
    }
    const rows = await queryAll<{ id: string }>("SELECT id FROM shelter_schedules WHERE team_id = ?", [cast.teamIds.one]);
    expect(rows).toHaveLength(count);

    await page.getByTestId("shelter-schedule-toolbar-search").fill(cast.shelterName);
    await expect(page.getByTestId("shelter-schedule-pagination-summary")).toHaveText(
      count > 12 ? `1–12 de ${count}` : `1–${count} de ${count}`,
      { timeout: 20_000 },
    );
    for (const row of rows.slice(0, 12)) await expect(page.getByTestId(`shelter-schedule-card-${row.id}`)).toBeVisible();
  });
});
