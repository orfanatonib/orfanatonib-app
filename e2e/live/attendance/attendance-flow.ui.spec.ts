import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { queryOne } from "../support/db";
import { cleanupData } from "../support/keep-data";
import {
  buildFlowCast,
  createSchedule,
  dayOffset,
  disposeFlowCast,
  type FlowCast,
} from "./flow-support";
import { fillSchedule, openNewSchedule } from "./flow-ui";

/**
 * Fluxo completo e real: abrigo com equipes, líderes e membros vinculados → agendamento
 * (criado pela tela) → presença de visita e de reunião → consulta e pendências.
 * Toda a massa nasce pela API e é removida no fim.
 */
const VISIT = dayOffset(-6);
const MEETING = dayOffset(-5);

type Records = {
  data: Array<{ memberId: string; scheduleId: string; category: string; type: string }>;
  meta: { total: number };
};

test.describe.serial("Fluxo abrigo → agendamento → presença (admin)", () => {
  let cast: FlowCast;
  let scheduleId = "";

  test.beforeAll(async ({ request }) => {
    cast = await buildFlowCast(request, "fluxo");
  });
  test.afterAll(async ({ request }) => {
    if (cast) await cleanupData(() => disposeFlowCast(request, cast));
  });

  const records = async (request: import("@playwright/test").APIRequestContext, teamId: string): Promise<Records> =>
    (await (await request.get(`${API_URL}/attendance/records?teamId=${teamId}`, { headers: authHeaders(cast.adminToken) })).json()) as Records;

  test("abrigos: o abrigo mostra os líderes e os membros vinculados", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/abrigos");
    await page.getByTestId("shelters-toolbar-search").fill(cast.shelterName);
    const row = page.getByRole("row", { name: new RegExp(cast.shelterName) });
    await expect(row).toBeVisible({ timeout: 20_000 });
    for (const name of ["lider1", "lider2", "membro1", "membro2", "membro3"]) {
      await expect(row.getByText(new RegExp(`E2E fluxo-${name}`))).toBeVisible();
    }
  });

  test("agendamentos: o admin cria o agendamento pela tela e visita e reunião nascem no banco", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/agendamentos");
    await expect(page.getByTestId("shelter-schedule-manager")).toBeVisible({ timeout: 20_000 });
    await openNewSchedule(page, false);
    await fillSchedule(page, {
      teamLabel: new RegExp(`Equipe 1 - ${cast.shelterName}`),
      visitNumber: 1,
      lesson: `Lição ${cast.shelterName}`,
      visitBr: VISIT.br,
      meetingBr: MEETING.br,
    });
    const row = await queryOne<{ id: string; visitNumber: number; visitDate: string }>(
      "SELECT id, visitNumber, visitDate FROM shelter_schedules WHERE team_id = ? AND visitNumber = 1",
      [cast.teamIds.one],
    );
    expect(row, "o agendamento criado pela tela está no banco").toBeTruthy();
    scheduleId = row!.id;
    const events = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM events WHERE shelter_schedule_id = ?", [scheduleId]);
    expect(Number(events?.n)).toBeGreaterThanOrEqual(2);
    await page.getByTestId("shelter-schedule-toolbar-search").fill(cast.shelterName);
    await expect(page.getByTestId(`shelter-schedule-card-${scheduleId}`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`schedule-details-${scheduleId}`)).toBeVisible();
  });

  test("presença: o admin lança a visita (um presente, um faltou) e a gravação bate com o banco", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto("/adm/presenca/lancar");
    await page.getByTestId("attendance-register-toolbar-search").fill(cast.shelterName);
    await expect(page.getByTestId(`attendance-team-${cast.teamIds.one}`)).toBeVisible({ timeout: 20_000 });
    await page.getByTestId(`attendance-team-${cast.teamIds.one}`).click();
    await expect(page.getByTestId("team-attendance-page")).toBeVisible({ timeout: 20_000 });
    const one = page.getByTestId(`team-attendance-member-${cast.memberOne.id}`);
    const two = page.getByTestId(`team-attendance-member-${cast.memberTwo.id}`);
    await one.getByRole("button", { name: "Presente", exact: true }).click();
    await two.getByRole("button", { name: "Faltou", exact: true }).click();
    await page.getByTestId("team-attendance-submit").click();
    await expect(page.getByTestId("team-attendance-feedback")).toBeVisible({ timeout: 20_000 });
    const saved = await records(request, cast.teamIds.one);
    const visit = saved.data.filter((r) => r.category === "visit");
    expect(visit.find((r) => r.memberId === cast.memberOne.id)?.type).toBe("present");
    expect(visit.find((r) => r.memberId === cast.memberTwo.id)?.type).toBe("absent");
  });

  test("presença: o admin lança a reunião da mesma equipe e visita e reunião ficam separadas", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await page.goto(`/adm/presenca/lancar`);
    await page.getByTestId("attendance-register-toolbar-search").fill(cast.shelterName);
    await page.getByTestId(`attendance-team-${cast.teamIds.one}`).click();
    await page.getByRole("button", { name: "Reuniões", exact: true }).click();
    await page.getByRole("button", { name: "Marcar pendentes como presentes" }).click();
    await page.getByTestId("team-attendance-submit").click();
    await expect(page.getByTestId("team-attendance-feedback")).toBeVisible({ timeout: 20_000 });
    const saved = await records(request, cast.teamIds.one);
    expect(saved.data.filter((r) => r.category === "meeting")).toHaveLength(2);
    expect(saved.data.filter((r) => r.category === "visit")).toHaveLength(2);
  });
});
