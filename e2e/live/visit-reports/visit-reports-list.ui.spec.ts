import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import {
  cardIds,
  clearAllFilters,
  expectCards,
  filtersVisible,
  goToPage,
  openAs,
  openScreen,
  PAGE_SIZE,
  searchFor,
  selectFilter,
  summaryText,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { RUN_TAG } from "../support/factory";
import { localShift } from "../support/local-day";
import { registerShellSuite, setDateFilter } from "../support/shell-suite";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { createShelter, deleteShelterApi, label, sheltersWithTag } from "../shelters/support";
import { createRaw, deleteRaw, payload, reportRow, type ReportBody } from "./support";
import { cleanupData } from "../support/keep-data";

const SCREEN: ListScreen = { p: "visit-reports", path: "/adm/relatorios-visita", endpoint: "/visit-reports" };
const { p } = SCREEN;
const COUNT = 14;
const LED = 8; // relatórios do abrigo A (o líder semeado lidera o A)

/**
 * Relatórios de visita: casca única com busca, filtros, ordenação e paginação no servidor. Dois abrigos criados pelo
 * cenário (o líder lidera o A), 14 agendas e 14 relatórios com o RUN_TAG no abrigo, na lição e na observação.
 */
test.describe.serial("Relatórios de visita: casca única, filtros no servidor e ações dos cartões (UI real)", () => {
  const tag = RUN_TAG;
  let admin = "";
  let leaderProfileId = "";
  let shelterA = "";
  let shelterB = "";
  const shelters: string[] = [];
  const schedules: string[] = [];
  const reports: string[] = [];
  const reportIds: string[] = [];

  const visitDate = (i: number): string => new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);

  const teamOf = async (shelterId: string): Promise<string> =>
    (await queryOne<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? ORDER BY numberTeam LIMIT 1", [shelterId]))?.id ?? "";

  const newSchedule = async (request: APIRequestContext, teamId: string, i: number): Promise<string> => {
    const res = await request.post(`${API_URL}/shelter-schedules`, {
      headers: authHeaders(admin),
      data: { visitNumber: 500 + i, lessonContent: label(`licao-${i}`), teamId, visitDate: visitDate(i), meetingDate: visitDate(i) },
    });
    expect(res.status(), await res.text()).toBe(201);
    const { id } = (await res.json()) as { id: string };
    schedules.push(id);
    return id;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leaderProfileId =
      (await queryOne<{ id: string }>("SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = 'e2e.leader@orfanatonib.test'"))?.id ?? "";
    expect(leaderProfileId, "perfil do líder semeado").not.toBe("");
    for (const name of ["relatorio-lista-a", "relatorio-lista-b"]) shelters.push((await createShelter(request, admin, { name: label(name), teamsQuantity: 1 })).id);
    [shelterA, shelterB] = shelters;
    const lead = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId: shelterA, teams: [1] }] });
    expect(lead.status(), await lead.text()).toBe(200);
    const [teamA, teamB] = [await teamOf(shelterA), await teamOf(shelterB)];
    for (let i = 0; i < COUNT; i += 1) {
      const scheduleId = await newSchedule(request, i < LED ? teamA : teamB, i);
      const res = await createRaw(
        request,
        admin,
        payload({
          scheduleId,
          teamMembersPresent: 3 + i,
          shelteredDecisions: i % 3,
          caretakersDecisions: 1,
          observation: i === 5 ? `obs-unica-${tag}` : `observação ${tag} ${i}`,
        }),
      );
      expect(res.status(), await res.text()).toBe(201);
      const body = (await res.json()) as ReportBody;
      reports.push(body.id);
      reportIds.push(body.id);
    }
  });

  test.afterAll(async ({ request }) => {
    // Vínculo do líder (sempre): não pode vazar para outros specs.
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    await cleanupData(async () => {
      for (const id of reports) await deleteRaw(request, admin, id);
      for (const id of schedules) await request.delete(`${API_URL}/shelter-schedules/${id}`, { headers: authHeaders(admin) });
      for (const id of shelters) await deleteShelterApi(request, admin, id);
      expect(await sheltersWithTag(RUN_TAG), "a limpeza deixou abrigos do E2E").toBe(0);
      expect(Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM shelter_schedules WHERE lessonContent LIKE ?", [`%${RUN_TAG}%`]))?.n)).toBe(0);
    });
    await closeDb();
  });

  const FROM = "FROM visit_reports r JOIN shelter_schedules s ON s.id = r.schedule_id JOIN teams t ON t.id = s.team_id JOIN shelters sh ON sh.id = t.shelter_id";
  const expectedIds = async (extra = "", params: Array<string | number> = [], order = "r.createdAt DESC, r.id ASC"): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT r.id AS id ${FROM} WHERE (sh.name LIKE ? OR s.lessonContent LIKE ? OR r.observation LIKE ?) ${extra} ORDER BY ${order}`,
        [`%${tag}%`, `%${tag}%`, `%${tag}%`, ...params],
      )
    ).map((row) => row.id);

  registerShellSuite({
    screen: SCREEN,
    managementFlag: "visit_reports",
    tag: () => tag,
    expectedDefault: () => expectedIds(),
    dateFromKey: "createdFrom",
    dateToKey: "createdTo",
    hasCreate: true,
    hasDelete: true,
    allowedRoles: ["leader"],
    sampleCardId: () => reportIds[COUNT - 1],
    sorts: [
      { value: "visitDate:DESC", expectedIds: () => expectedIds("", [], "s.visitDate DESC, r.id ASC") },
      { value: "visitDate:ASC", expectedIds: () => expectedIds("", [], "s.visitDate ASC, r.id ASC") },
      { value: "visitNumber:ASC", expectedIds: () => expectedIds("", [], "s.visitNumber ASC, r.id ASC") },
      { value: "shelter:ASC", expectedIds: () => expectedIds("", [], "sh.name ASC, r.id ASC") },
      { value: "team:DESC", expectedIds: () => expectedIds("", [], "t.numberTeam DESC, r.id ASC") },
      { value: "createdAt:ASC", expectedIds: () => expectedIds("", [], "r.createdAt ASC, r.id ASC") },
    ],
  });

  test("busca varre abrigo, observação, conteúdo da lição e número da visita", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const byObservation = await searchFor(page, SCREEN, `obs-unica-${tag}`);
    expect(byObservation.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [reportIds[5]]);

    const byShelter = await searchFor(page, SCREEN, label("relatorio-lista-b"));
    expect(byShelter.body.meta?.totalItems).toBe(COUNT - LED);

    const byLesson = await searchFor(page, SCREEN, label("licao-3"));
    expect(byLesson.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [reportIds[3]]);

    const byNumber = await searchFor(page, SCREEN, "507");
    const dbNumber = await queryAll<{ id: string }>("SELECT r.id AS id FROM visit_reports r JOIN shelter_schedules s ON s.id = r.schedule_id WHERE CAST(s.visitNumber AS CHAR) LIKE '%507%'");
    expect(byNumber.body.meta?.totalItems).toBe(dbNumber.length);
    expect(dbNumber.map((r) => r.id)).toContain(reportIds[7]);

    const byTeam = await searchFor(page, SCREEN, `Equipe 1 ${tag}`);
    expect(byTeam.body.meta?.totalItems).toBe(0);
  });

  test("filtros de data da visita: de/até isolados e combinados batem com o banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);

    const from = await setDateFilter(page, SCREEN, "visitFrom", "2026-10-06");
    expect(from.params.get("visitFrom")).toBe("2026-10-06");
    const dbFrom = await expectedIds("AND s.visitDate >= ?", ["2026-10-06"]);
    expect(from.body.meta?.totalItems).toBe(dbFrom.length);
    expect(dbFrom).toHaveLength(COUNT - 5);

    const both = await setDateFilter(page, SCREEN, "visitTo", "2026-10-09");
    const dbBoth = await expectedIds("AND s.visitDate >= ? AND s.visitDate <= ?", ["2026-10-06", "2026-10-09"]);
    expect(dbBoth).toHaveLength(4);
    expect(both.body.meta?.totalItems).toBe(4);
    await expectCards(page, p, dbBoth);

    await setDateFilter(page, SCREEN, "visitFrom", "");
    const onlyTo = await expectedIds("AND s.visitDate <= ?", ["2026-10-09"]);
    await expectCards(page, p, onlyTo);
  });

  test("filtros de criação e combinados: busca + visita + criação + ordenação", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await setDateFilter(page, SCREEN, "createdFrom", localShift(0));
    await setDateFilter(page, SCREEN, "visitFrom", "2026-10-03");
    const reply = await selectFilter(page, SCREEN, "sort", "visitDate:ASC");
    expect(Object.fromEntries(reply.params)).toMatchObject({
      search: tag, createdFrom: localShift(0), visitFrom: "2026-10-03", sortBy: "visitDate", order: "ASC",
    });
    const expected = await expectedIds("AND r.createdAt >= ? AND s.visitDate >= ?", [localShift(0), "2026-10-03"], "s.visitDate ASC, r.id ASC");
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));

    const empty = await setDateFilter(page, SCREEN, "createdFrom", localShift(1));
    expect(empty.body.meta?.totalItems).toBe(0);
    await clearAllFilters(page, SCREEN);
  });

  test("cartão: abrigo, equipe, visita, data, presença, decisões e as três ações", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = reportIds[4];
    await expect(page.getByTestId(`${p}-card-title-${id}`)).toContainText(label("relatorio-lista-a"));
    await expect(page.getByTestId(`${p}-card-visit-${id}`)).toHaveText("Visita #504");
    await expect(page.getByTestId(`${p}-card-date-${id}`)).toHaveText("05/10/2026");
    await expect(page.getByTestId(`${p}-card-present-${id}`)).toHaveText("Equipe presente: 7");
    await expect(page.getByTestId(`${p}-card-decisions-${id}`)).toHaveText("Decisões: 2");
    for (const action of ["view", "edit", "delete"]) await expect(page.getByTestId(`${p}-card-${action}-${id}`)).toBeVisible();
  });

  test("ação Ver abre os detalhes com estatísticas e fecha", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await page.getByTestId(`${p}-card-view-${reportIds[4]}`).click();
    await expect(page.getByTestId(`${p}-details-dialog`)).toBeVisible();
    await expect(page.getByTestId(`${p}-details-dialog`)).toContainText("Visita #504");
    await expect(page.getByTestId(`${p}-details-dialog`)).toContainText(label("relatorio-lista-a"));
    await page.getByTestId(`${p}-details-close`).click();
    await expect(page.getByTestId(`${p}-details-dialog`)).toBeHidden();
  });

  test("editar pela UI: o formulário vem preenchido e o novo valor chega ao banco e ao cartão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = reportIds[2];
    await page.getByTestId(`${p}-card-edit-${id}`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeVisible();
    await expect(page.getByTestId(`${p}-form-team-members`)).toHaveValue("5");
    await page.getByTestId(`${p}-form-team-members`).fill("21");
    await page.getByTestId(`${p}-form-observation`).fill(`editada ${tag}`);
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-form-submit`).click();
    });
    expect(reply.status).toBe(200);
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });
    expect(await reportRow(id)).toMatchObject({ teamMembersPresent: 21, observation: `editada ${tag}` });
    await expect(page.getByTestId(`${p}-card-present-${id}`)).toHaveText("Equipe presente: 21");
  });

  test("criar pela UI (admin): abrigo → equipe → agenda, o relatório nasce no banco e aparece na lista", async ({ page, request }) => {
    const scheduleId = await newSchedule(request, await teamOf(shelterB), 90);
    await openAs(page, request, SCREEN);
    await page.getByTestId(`${p}-create`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeVisible();
    await page.getByRole("combobox", { name: "Abrigo" }).click();
    await page.getByRole("option", { name: label("relatorio-lista-b") }).click();
    await page.getByRole("combobox", { name: "Equipe" }).click();
    await page.getByRole("option", { name: /Equipe 1/ }).click();
    await page.getByRole("combobox", { name: /Agendamento/ }).click();
    await page.getByRole("option", { name: /590ª Visita|590/ }).first().click();
    await page.getByTestId(`${p}-form-team-members`).fill("4");
    await page.getByTestId(`${p}-form-sheltered-heard`).fill("9");
    await page.getByTestId(`${p}-form-caretakers-heard`).fill("2");
    await page.getByTestId(`${p}-form-sheltered-decisions`).fill("1");
    await page.getByTestId(`${p}-form-caretakers-decisions`).fill("0");
    await page.getByTestId(`${p}-form-observation`).fill(`criado pela UI ${tag}`);
    await page.getByTestId(`${p}-form-submit`).click();
    await expect(page.getByTestId(`${p}-form-dialog`)).toBeHidden({ timeout: 20_000 });

    const row = await queryOne<{ id: string; teamMembersPresent: number }>(
      "SELECT id, teamMembersPresent FROM visit_reports WHERE schedule_id = ?",
      [scheduleId],
    );
    expect(row?.teamMembersPresent).toBe(4);
    reports.push(row!.id);
    await searchFor(page, SCREEN, `criado pela UI ${tag}`);
    await expectCards(page, p, [row!.id]);
  });

  test("criar para agenda que já tem relatório devolve o erro da API e não duplica", async ({ page, request }) => {
    const before = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM visit_reports WHERE schedule_id = ?", [schedules[0]]))?.n);
    expect(before).toBe(1);
    const dup = await createRaw(request, admin, payload({ scheduleId: schedules[0] }));
    expect(dup.status()).toBe(409);
    await openAs(page, request, SCREEN);
    await expect(page.getByTestId(`${p}-action-error`)).toHaveCount(0);
    expect(Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM visit_reports WHERE schedule_id = ?", [schedules[0]]))?.n)).toBe(1);
  });

  test("excluir: cancelar mantém; confirmar apaga do banco, some do cartão e atualiza o total", async ({ page, request }) => {
    const scheduleId = await newSchedule(request, await teamOf(shelterB), 91);
    const res = await createRaw(request, admin, payload({ scheduleId, observation: `apagar ${tag}` }));
    const victim = (await res.json()) as ReportBody;
    reports.push(victim.id);
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `apagar ${tag}`);
    await expectCards(page, p, [victim.id]);

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeVisible();
    await page.getByTestId(`${p}-delete-dialog-cancel`).click();
    await expect(page.getByTestId(`${p}-delete-dialog`)).toBeHidden();
    expect(await reportRow(victim.id)).not.toBeNull();

    await page.getByTestId(`${p}-card-delete-${victim.id}`).click();
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    });
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect(await reportRow(victim.id)).toBeNull();
  });

  test("RBAC: o líder vê só os relatórios das equipes que lidera, filtrados e paginados no servidor", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "leader"));
    const reply = await openScreen(page, SCREEN);
    expect(reply.status).toBe(200);
    const scoped = await searchFor(page, SCREEN, tag);
    const dbLed = await expectedIds("AND sh.id = ?", [shelterA]);
    expect(scoped.body.meta?.totalItems).toBe(dbLed.length);
    expect(dbLed.length).toBeGreaterThanOrEqual(LED);
    const shown = await cardIds(page, p);
    for (const id of shown) expect(dbLed).toContain(id);
    const other = await expectedIds("AND sh.id = ?", [shelterB]);
    for (const id of other) await expect(page.getByTestId(`${p}-card-${id}`)).toHaveCount(0);
  });

  test("excluir o único item da página 2 volta para a página 1", async ({ page, request }) => {
    // 14 itens da execução + os criados nos cenários acima: páginas de 12; filtra por uma busca exclusiva para controlar o total.
    const extraTag = `${tag}-pg`;
    const made: string[] = [];
    for (let i = 0; i < PAGE_SIZE + 1; i += 1) {
      const scheduleId = await newSchedule(request, await teamOf(shelterB), 100 + i);
      const res = await createRaw(request, admin, payload({ scheduleId, observation: `${extraTag} ${i}` }));
      const body = (await res.json()) as ReportBody;
      made.push(body.id);
      reports.push(body.id);
    }
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, extraTag);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE + 1}`);
    await goToPage(page, SCREEN, 2);
    const only = await cardIds(page, p);
    expect(only).toHaveLength(1);
    await page.getByTestId(`${p}-card-delete-${only[0]}`).click();
    await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-delete-dialog-confirm`).click();
    }, (params) => params.get("page") === "1" && params.get("search") === extraTag);
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${PAGE_SIZE}`);
    expect(await reportRow(only[0])).toBeNull();
  });

  test("@mobile cartão no celular: ações com 44px e filtros pelo botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const id = reportIds[3];
    for (const action of ["view", "edit"]) {
      const box = await page.getByTestId(`${p}-card-${action}-${id}`).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await filtersVisible(page, p);
    const reply = await setDateFilter(page, SCREEN, "visitFrom", "2026-10-02");
    expect(reply.params.get("visitFrom")).toBe("2026-10-02");
  });
});
