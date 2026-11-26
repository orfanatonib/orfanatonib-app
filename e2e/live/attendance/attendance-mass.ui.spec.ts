import { queryOne } from "../support/db";
import { massCount } from "../support/keep-data";
import { expect, loginAs, seedBrowserSession, test } from "../support/live";
import { buildFlowCast, createSchedule, dayOffset, type FlowCast } from "./flow-support";

/**
 * Massa de presença (regra de massa do E2E): toda execução cria de 5 a 10 agendamentos de visita passados num abrigo
 * novo (RUN_TAG) e lança a presença de cada um PELA TELA, para a equipe de 2 membros. Tudo fica e acumula.
 */
test.describe.serial("Presença: massa da execução pela UI", () => {
  const count = massCount();
  let cast: FlowCast;
  const scheduleIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    cast = await buildFlowCast(request, "massa-presenca");
    for (let n = 1; n <= count; n += 1) {
      scheduleIds.push(
        await createSchedule(request, cast.adminToken, {
          teamId: cast.teamIds.one,
          visitNumber: n,
          visitDate: dayOffset(-(n + 1)).iso,
          lesson: `Massa de presença ${n} ${cast.shelterName}`,
        }),
      );
    }
  });

  test("lança a presença das visitas da massa pela tela e grava uma linha por membro e visita", async ({ page, request }) => {
    test.setTimeout(120_000 + count * 40_000);
    await seedBrowserSession(page, await loginAs(request, "admin"));
    for (const id of scheduleIds) {
      await page.goto(`/adm/presenca/equipes/${cast.teamIds.one}?evento=${id}&tipo=visit`);
      await expect(page.getByTestId("team-attendance-page")).toBeVisible({ timeout: 20_000 });
      await page.getByRole("button", { name: "Marcar pendentes como presentes" }).click();
      await page.getByTestId("team-attendance-submit").click();
      await expect(page.getByTestId("team-attendance-feedback")).toBeVisible({ timeout: 20_000 });
    }
    const row = await queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM attendance_records a JOIN shelter_schedules s ON s.id = a.shelter_schedule_id WHERE s.team_id = ? AND a.type = 'present'",
      [cast.teamIds.one],
    );
    expect(Number(row?.n)).toBe(count * 2);
  });
});
