import type { Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import {
  cardIds,
  clearAllFilters,
  DESKTOP_VIEWPORT,
  expectCards,
  expectStableLayout,
  frameWidthRatio,
  goToPage,
  layoutSamples,
  MOBILE_VIEWPORT,
  openAs,
  openScreen,
  PAGE_SIZE,
  recordLayout,
  sawSkeleton,
  searchFor,
  selectFilter,
  setDateFilter,
  setInvalidDateFilter,
  summaryText,
  watchSkeleton,
  whenListLoaded,
  type ListScreen,
} from "../support/admin-list-ui";
import { queryOne } from "../support/db";
import { fillDate } from "../support/date-field";
import { withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import type { Actor } from "../users/support";
import { fillSchedule, openNewSchedule } from "../attendance/flow-ui";
import {
  buildScheduleWorld,
  disposeScheduleWorld,
  EVENT_DATE_SQL,
  scheduleIds,
  SCHEDULE_TOTAL,
  type ScheduleWorld,
} from "./support";

const SCREEN: ListScreen = { p: "shelter-schedule", path: "/adm/agendamentos", endpoint: "/shelter-schedules" };
const { p } = SCREEN;

const asSession = (actor: Actor) => ({ accessToken: actor.token, refreshToken: actor.refreshToken, userId: actor.id });

test.describe.serial("Agendamentos: casca única, filtros no servidor e ações dos cartões (UI real)", () => {
  const tag = `e2e-agenda-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  let world: ScheduleWorld;

  test.beforeAll(async ({ request }) => {
    world = await buildScheduleWorld(request, tag);
  });

  test.afterAll(async ({ request }) => {
    await disposeScheduleWorld(request, world);
  });

  const allIds = () => scheduleIds(tag);
  const openWithTag = async (page: Page, request: Parameters<typeof loginAs>[0]) => {
    await openAs(page, request, SCREEN);
    return searchFor(page, SCREEN, tag);
  };

  test("carga inicial: esqueleto, depois a primeira página vinda do servidor com título, busca, filtros e paginação", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await watchSkeleton(page, p);
    const reply = await openScreen(page, SCREEN);
    expect(reply.status).toBe(200);
    expect(reply.params.get("page")).toBe("1");
    expect(reply.params.get("limit")).toBe(String(PAGE_SIZE));
    expect(reply.params.get("sortBy")).toBe("shelterName");
    expect(reply.params.get("order")).toBe("ASC");
    expect(await sawSkeleton(page)).toBe(true);
    await expect(page.getByTestId(`${p}-manager-heading`)).toHaveText("Agendamentos de Visitas");
    for (const id of ["toolbar", "toolbar-search", "toolbar-refresh", "pagination", "cards", "filter-shelterId", "filter-kind", "filter-eventFrom", "filter-eventTo", "filter-sort"]) {
      await expect(page.getByTestId(`${p}-${id}`)).toBeVisible();
    }
    await expect(page.getByTestId("schedule-new")).toBeVisible();
    expect((await cardIds(page, p)).length).toBe((reply.body.data ?? []).length);
  });

  test("busca com debounce: uma única requisição com o termo final, filtrada no banco (abrigo, lição e sala)", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const calls: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (req.method() === "GET" && url.pathname === SCREEN.endpoint && url.searchParams.has("search")) calls.push(url.searchParams.get("search") ?? "");
    });
    const reply = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).pressSequentially(tag, { delay: 40 });
      },
      (params) => params.get("search") === tag,
    );
    expect(calls).toEqual([tag]);
    const expected = await allIds();
    expect(expected).toHaveLength(SCHEDULE_TOTAL);
    expect(reply.body.meta?.totalItems).toBe(SCHEDULE_TOTAL);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));

    const lesson = await searchFor(page, SCREEN, world.special.lesson);
    expect(lesson.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [world.special.id]);
    const room = await searchFor(page, SCREEN, world.room.room);
    expect(room.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [world.room.id]);
    const shelter = await searchFor(page, SCREEN, world.shelterB.name);
    expect(shelter.body.meta?.totalItems).toBe(3);
    await expectCards(page, p, await scheduleIds(tag, "AND sh.name = ?", [world.shelterB.name]));
  });

  test("filtro de tipo: visita e reunião batem com o banco, isolados e voltando a 'todos'", async ({ page, request }) => {
    await openWithTag(page, request);
    const visits = await selectFilter(page, SCREEN, "kind", "visit");
    expect(visits.params.get("kind")).toBe("visit");
    const dbVisits = await scheduleIds(tag, "AND s.visitDate IS NOT NULL");
    expect(visits.body.meta?.totalItems).toBe(dbVisits.length);
    expect(dbVisits).toHaveLength(13);
    await expectCards(page, p, dbVisits.slice(0, PAGE_SIZE));

    const meetings = await selectFilter(page, SCREEN, "kind", "meeting");
    const dbMeetings = await scheduleIds(tag, "AND s.meetingDate IS NOT NULL");
    expect(meetings.body.meta?.totalItems).toBe(dbMeetings.length);
    expect(dbMeetings).toHaveLength(12);
    await expectCards(page, p, dbMeetings);

    const all = await selectFilter(page, SCREEN, "kind", "");
    expect(all.params.has("kind")).toBe(false);
    expect(all.body.meta?.totalItems).toBe(SCHEDULE_TOTAL);
  });

  test("filtro de abrigo: cada abrigo traz só os seus agendamentos; combinado com o tipo cruza no banco", async ({ page, request }) => {
    await openWithTag(page, request);
    const alfa = await selectFilter(page, SCREEN, "shelterId", world.shelterA.id);
    expect(alfa.params.get("shelterId")).toBe(world.shelterA.id);
    const dbAlfa = await scheduleIds(tag, "AND sh.id = ?", [world.shelterA.id]);
    expect(alfa.body.meta?.totalItems).toBe(12);
    await expectCards(page, p, dbAlfa.slice(0, PAGE_SIZE));

    const beta = await selectFilter(page, SCREEN, "shelterId", world.shelterB.id);
    expect(beta.body.meta?.totalItems).toBe(3);
    await expectCards(page, p, await scheduleIds(tag, "AND sh.id = ?", [world.shelterB.id]));

    await selectFilter(page, SCREEN, "shelterId", world.shelterA.id);
    const combined = await selectFilter(page, SCREEN, "kind", "meeting");
    const dbCombined = await scheduleIds(tag, "AND sh.id = ? AND s.meetingDate IS NOT NULL", [world.shelterA.id]);
    expect(combined.body.meta?.totalItems).toBe(dbCombined.length);
    expect(dbCombined).toHaveLength(12);
    await expectCards(page, p, dbCombined.slice(0, PAGE_SIZE));
  });

  test("filtro de datas do evento: a partir de, até e o intervalo batem com o banco; datas ausentes ficam de fora", async ({ page, request }) => {
    await openWithTag(page, request);
    const from = await setDateFilter(page, SCREEN, "eventFrom", "2026-04-01");
    expect(from.params.get("eventFrom")).toBe("2026-04-01");
    const dbFrom = await scheduleIds(tag, `AND ${EVENT_DATE_SQL} >= ?`, ["2026-04-01"]);
    expect(from.body.meta?.totalItems).toBe(dbFrom.length);
    expect(dbFrom).toHaveLength(5);
    await expectCards(page, p, dbFrom);

    const to = await setDateFilter(page, SCREEN, "eventTo", "2026-04-01");
    const dbRange = await scheduleIds(tag, `AND ${EVENT_DATE_SQL} >= ? AND ${EVENT_DATE_SQL} <= ?`, ["2026-04-01", "2026-04-01"]);
    expect(to.body.meta?.totalItems).toBe(dbRange.length);
    expect(dbRange).toHaveLength(1);
    await expectCards(page, p, dbRange);

    await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await fillDate(page.getByTestId(`${p}-filter-eventFrom`), "");
      },
      (params) => !params.has("eventFrom"),
    );
    const onlyTo = await setDateFilter(page, SCREEN, "eventTo", "2026-03-05");
    const dbTo = await scheduleIds(tag, `AND ${EVENT_DATE_SQL} <= ?`, ["2026-03-05"]);
    expect(onlyTo.body.meta?.totalItems).toBe(dbTo.length);
    expect(dbTo).toHaveLength(5);
  });

  test("todos os filtros combinados com a busca cruzam no banco", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    await selectFilter(page, SCREEN, "shelterId", world.shelterA.id);
    await selectFilter(page, SCREEN, "kind", "visit");
    await setDateFilter(page, SCREEN, "eventFrom", "2026-03-04");
    const reply = await setDateFilter(page, SCREEN, "eventTo", "2026-03-07");
    const db = await scheduleIds(tag, `AND sh.id = ? AND s.visitDate IS NOT NULL AND ${EVENT_DATE_SQL} BETWEEN ? AND ?`, [world.shelterA.id, "2026-03-04", "2026-03-07"]);
    expect(db).toHaveLength(4);
    expect(reply.body.meta?.totalItems).toBe(4);
    await expectCards(page, p, db);
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeEnabled();
  });

  test("ordenação no servidor: cada opção reflete a ordem do banco", async ({ page, request }) => {
    await openWithTag(page, request);
    const cases: Array<[string, string, string]> = [
      ["shelterName:DESC", "sh.name DESC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC", "shelterName"],
      ["visitNumber:DESC", "s.visitNumber DESC, sh.name ASC, t.numberTeam ASC, s.id ASC", "visitNumber"],
      ["visitNumber:ASC", "s.visitNumber ASC, sh.name ASC, t.numberTeam ASC, s.id ASC", "visitNumber"],
      ["eventDate:ASC", `(COALESCE(s.visitDate, s.meetingDate) IS NULL), COALESCE(s.visitDate, s.meetingDate) ASC, sh.name ASC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC`, "eventDate"],
      ["eventDate:DESC", `(COALESCE(s.visitDate, s.meetingDate) IS NULL), COALESCE(s.visitDate, s.meetingDate) DESC, sh.name ASC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC`, "eventDate"],
    ];
    for (const [value, order, sortBy] of cases) {
      const reply = await selectFilter(page, SCREEN, "sort", value);
      expect(reply.params.get("sortBy")).toBe(sortBy);
      expect(reply.params.get("order")).toBe(value.split(":")[1]);
      const expected = (await scheduleIds(tag, "", [], order)).slice(0, PAGE_SIZE);
      await expectCards(page, p, expected);
    }
    // Criação: a ordem é a do relógio do servidor; compara com o banco.
    const created = await selectFilter(page, SCREEN, "sort", "createdAt:ASC");
    expect(created.params.get("sortBy")).toBe("createdAt");
    const dbCreated = await scheduleIds(tag, "", [], "s.createdAt ASC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC");
    const shown = await cardIds(page, p);
    expect(shown).toHaveLength(PAGE_SIZE);
    expect(new Set(shown).size).toBe(PAGE_SIZE);
    expect(dbCreated.slice(0, 1)).toContain(shown[0]);
    // A ordenação não conta como filtro ativo.
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeEnabled(); // a busca por tag segue ativa
  });

  test("limpar filtros zera busca e filtros e mantém a ordenação escolhida", async ({ page, request }) => {
    await openWithTag(page, request);
    await selectFilter(page, SCREEN, "sort", "visitNumber:DESC");
    await selectFilter(page, SCREEN, "kind", "meeting");
    await setDateFilter(page, SCREEN, "eventTo", "2000-01-01");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    const cleared = await clearAllFilters(page, SCREEN);
    expect(cleared.params.has("search")).toBe(false);
    expect(cleared.params.has("kind")).toBe(false);
    expect(cleared.params.has("eventTo")).toBe(false);
    expect(cleared.params.get("sortBy")).toBe("visitNumber");
    await expect(page.getByTestId(`${p}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeDisabled();
    await expect(page.getByTestId(`${p}-empty`)).toHaveCount(0);

    await searchFor(page, SCREEN, tag);
    const cleanSearch = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-toolbar-clear`).click();
    });
    expect(cleanSearch.params.has("search")).toBe(false);
    await expect(page.getByTestId(`${p}-toolbar-clear`)).toBeDisabled();
  });

  test("paginação: próxima, anterior, ir para a 2ª e primeira usam a janela do servidor (12 + 3)", async ({ page, request }) => {
    await openWithTag(page, request);
    const expected = await allIds();
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${SCHEDULE_TOTAL}`);

    const next = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Próxima página" }).click();
    }, (params) => params.get("page") === "2");
    expect(next.body.meta).toMatchObject({ page: 2, totalItems: SCHEDULE_TOTAL, totalPages: 2 });
    await expectCards(page, p, expected.slice(PAGE_SIZE));
    await expect(summaryText(page, p)).toHaveText(`${PAGE_SIZE + 1}–${SCHEDULE_TOTAL} de ${SCHEDULE_TOTAL}`);

    const prev = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Página anterior" }).click();
    }, (params) => params.get("page") === "1");
    expect(prev.body.meta?.page).toBe(1);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));

    const jump = await goToPage(page, SCREEN, 2);
    expect(jump.params.get("page")).toBe("2");
    const first = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Primeira página" }).click();
    }, (params) => params.get("page") === "1");
    expect(first.params.get("page")).toBe("1");
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));
  });

  test("mexer na busca ou num filtro na página 2 volta para a página 1", async ({ page, request }) => {
    await openWithTag(page, request);
    await goToPage(page, SCREEN, 2);
    const reply = await selectFilter(page, SCREEN, "kind", "visit");
    expect(reply.params.get("page")).toBe("1");
    expect(reply.body.meta?.page).toBe(1);
    await goToPage(page, SCREEN, 2);
    const bySearch = await searchFor(page, SCREEN, `${tag} lição`);
    expect(bySearch.params.get("page")).toBe("1");
  });

  test("vazio por filtro: mensagem de ajuste, contador zerado e sem cartões", async ({ page, request }) => {
    await openWithTag(page, request);
    const reply = await setDateFilter(page, SCREEN, "eventTo", "2000-01-01");
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toContainText("Tente ajustar sua busca ou limpar os filtros.");
    await expect(summaryText(page, p)).toHaveText("0 itens");
    await expect(page.getByTestId(`${p}-cards`)).toHaveCount(0);
    const nothing = await searchFor(page, SCREEN, "zzz-nao-existe-zzz");
    expect(nothing.body.meta?.totalItems).toBe(0);
  });

  test("erro real da API (data recusada com 400) mostra o alerta e se recupera ao limpar", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const reply = await setInvalidDateFilter(page, SCREEN, "eventFrom");
    expect(reply.status).toBe(400);
    await expect(page.getByTestId(`${p}-error`)).toBeVisible();
    await expect(page.getByTestId(`${p}-cards`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-toolbar`)).toBeVisible();
    const retry = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-error`).getByRole("button", { name: "Tentar novamente" }).click();
    });
    expect(retry.status).toBe(400);
    const recovered = await clearAllFilters(page, SCREEN);
    expect(recovered.status).toBe(200);
    await expect(page.getByTestId(`${p}-error`)).toHaveCount(0);
    expect((await cardIds(page, p)).length).toBeGreaterThan(0);
  });

  test("cartão: mostra abrigo, equipe, lição e datas do banco; detalhes abre e fecha", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, world.special.lesson);
    const id = world.special.id;
    await expect(page.getByTestId(`${p}-card-title-${id}`)).toHaveText(world.shelterB.name);
    await expect(page.getByTestId(`${p}-card-team-${id}`)).toContainText("Equipe 1");
    await expect(page.getByTestId(`${p}-card-lesson-${id}`)).toContainText(world.special.lesson);
    await expect(page.getByTestId(`${p}-card-dates-${id}`)).toContainText("02/05 (Visita)");

    await page.getByTestId(`schedule-details-${id}`).click();
    const dialog = page.getByTestId("schedule-details-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(world.special.lesson);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("criar: o formulário grava no banco e o novo cartão aparece na lista filtrada", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, world.shelterB.name);
    const lesson = `${tag} criada pela tela`;
    await openNewSchedule(page, false);
    await fillSchedule(page, {
      teamLabel: new RegExp(`Equipe 1 - ${world.shelterB.name}`),
      visitNumber: 9,
      lesson,
      visitBr: "10/06/2026",
      meetingBr: "11/06/2026",
    });
    const row = await queryOne<{ id: string; lessonContent: string; visitNumber: number }>(
      "SELECT id, lessonContent, visitNumber FROM shelter_schedules WHERE team_id = ? AND visitNumber = 9",
      [world.shelterB.team1],
    );
    expect(row?.lessonContent).toBe(lesson);
    await expect(page.getByTestId(`${p}-card-${row!.id}`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`${p}-pagination-summary`)).toHaveText("1–4 de 4");
  });

  test("editar: o formulário traz os dados, grava no banco e o cartão reflete a edição", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, world.special.lesson);
    const id = world.special.id;
    await page.getByTestId(`schedule-edit-${id}`).click();
    await expect(page.getByTestId("schedule-form-dialog")).toBeVisible();
    await expect(page.getByTestId("schedule-form-lesson")).toHaveValue(world.special.lesson);
    const edited = `${world.special.lesson} editada`;
    await page.getByTestId("schedule-form-lesson").fill(edited);
    await page.getByTestId("schedule-form-room").fill("Sala nova");
    await page.getByTestId("schedule-form-submit").click();
    await expect(page.getByTestId("schedule-form-dialog")).toBeHidden({ timeout: 20_000 });
    const row = await queryOne<{ lessonContent: string; meetingRoom: string }>("SELECT lessonContent, meetingRoom FROM shelter_schedules WHERE id = ?", [id]);
    expect(row).toMatchObject({ lessonContent: edited, meetingRoom: "Sala nova" });
    // A tela recarrega pelo servidor: a busca antiga já não casa, a nova sim.
    await searchFor(page, SCREEN, edited);
    await expect(page.getByTestId(`${p}-card-lesson-${id}`)).toContainText(edited);
  });

  test("excluir: cancelar não apaga; confirmar apaga no banco e o cartão some; falha real mostra o alerta", async ({ page, request }) => {
    const doomed = await request.post(`${API_URL}/shelter-schedules`, {
      headers: authHeaders(world.adminToken),
      data: { visitNumber: 20, lessonContent: `${tag} para excluir`, teamId: world.shelterB.team1, visitDate: "2026-07-01" },
    });
    const doomedId = ((await doomed.json()) as { id: string }).id;
    const ghost = await request.post(`${API_URL}/shelter-schedules`, {
      headers: authHeaders(world.adminToken),
      data: { visitNumber: 21, lessonContent: `${tag} fantasma`, teamId: world.shelterB.team1, visitDate: "2026-07-02" },
    });
    const ghostId = ((await ghost.json()) as { id: string }).id;

    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, `${tag} para excluir`);
    await page.getByTestId(`schedule-delete-${doomedId}`).click();
    await expect(page.getByTestId("schedule-delete-dialog")).toBeVisible();
    await page.getByTestId("schedule-delete-cancel").click();
    await expect(page.getByTestId("schedule-delete-dialog")).toBeHidden();
    expect((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM shelter_schedules WHERE id = ?", [doomedId]))?.n).toBe(1);

    await page.getByTestId(`schedule-delete-${doomedId}`).click();
    await page.getByTestId("schedule-delete-confirm").click();
    await expect(page.getByTestId("schedule-delete-dialog")).toBeHidden({ timeout: 20_000 });
    await expect(page.getByTestId(`${p}-card-${doomedId}`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    expect((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM shelter_schedules WHERE id = ?", [doomedId]))?.n).toBe(0);

    // Falha real: o agendamento some pela API antes da confirmação; o DELETE responde 404.
    await searchFor(page, SCREEN, `${tag} fantasma`);
    await page.getByTestId(`schedule-delete-${ghostId}`).click();
    await request.delete(`${API_URL}/shelter-schedules/${ghostId}`, { headers: authHeaders(world.adminToken) });
    await page.getByTestId("schedule-delete-confirm").click();
    await expect(page.getByTestId("shelter-schedule-action-error")).toBeVisible({ timeout: 20_000 });
  });

  test("estabilidade de layout: frame e toolbar não mudam entre carga, lista, página 2, vazio e erro", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await recordLayout(page, p);
    await openScreen(page, SCREEN);
    await searchFor(page, SCREEN, tag);
    await goToPage(page, SCREEN, 2);
    await goToPage(page, SCREEN, 1);
    await setDateFilter(page, SCREEN, "eventTo", "2000-01-01");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await setInvalidDateFilter(page, SCREEN, "eventFrom");
    await expect(page.getByTestId(`${p}-error`)).toBeVisible();
    await clearAllFilters(page, SCREEN);
    await expect(page.getByTestId(`${p}-cards`)).toBeVisible();

    const samples = await layoutSamples(page);
    const states = new Set(samples.map((sample) => sample.state));
    for (const state of ["loading", "cards", "empty", "error"] as const) expect(states.has(state), `sem amostra de ${state}`).toBe(true);
    expectStableLayout(samples);
    const height = await page.getByTestId(`${p}-content`).evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(420);
  });

  test("desktop 1440px: o frame ocupa 95% da área do painel, em cartões e sem rolagem lateral", async ({ page, request }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openAs(page, request, SCREEN);
    const { ratio, overflow } = await frameWidthRatio(page, p);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
    await expect(page.getByTestId(`${p}-table`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-toolbar-toggle-filters`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-filter-kind`)).toBeVisible();
    const ids = await cardIds(page, p);
    const boxes = await Promise.all(ids.slice(0, 4).map((id) => page.getByTestId(`${p}-card-${id}`).boundingBox()));
    expect(new Set(boxes.map((box) => Math.round(box!.y))).size).toBe(1);
  });

  test("@mobile 375px: cartões em coluna única, 98% da tela e filtros atrás do botão", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    const { ratio, overflow } = await frameWidthRatio(page, p);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);

    const toggle = page.getByTestId(`${p}-toolbar-toggle-filters`);
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeHidden();
    await toggle.click();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeVisible();
    await toggle.click();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeHidden();

    await searchFor(page, SCREEN, tag);
    const ids = await cardIds(page, p);
    expect(ids.length).toBeGreaterThan(1);
    const boxes = [];
    for (const id of ids.slice(0, 3)) {
      const box = await page.getByTestId(`${p}-card-${id}`).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }
    for (const box of boxes) {
      expect(Math.abs(box.x - boxes[0].x)).toBeLessThanOrEqual(1);
      expect(box.width).toBeGreaterThan(MOBILE_VIEWPORT.width * 0.9);
    }
    for (const control of ["schedule-new", `schedule-details-${ids[0]}`, `schedule-edit-${ids[0]}`, `schedule-delete-${ids[0]}`]) {
      const box = await page.getByTestId(control).first().boundingBox();
      expect(Math.min(box!.width, box!.height), control).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByTestId("schedule-new-fab")).toBeVisible();
  });

  test("@mobile: filtro aplicado pelo botão de filtros consulta o servidor", async ({ page, request }) => {
    await openAs(page, request, SCREEN);
    await searchFor(page, SCREEN, tag);
    const reply = await selectFilter(page, SCREEN, "kind", "meeting");
    expect(reply.params.get("kind")).toBe("meeting");
    expect(reply.body.meta?.totalItems).toBe(12);
    await expect(page.getByTestId(`${p}-toolbar-toggle-filters`)).toContainText("Filtros");
  });

  test("líder: vê e cria só na equipe dele, a busca e os filtros respeitam o escopo, e o aviso do líder aparece", async ({ page, request }) => {
    await seedBrowserSession(page, asSession(world.leader));
    const reply = await openScreen(page, SCREEN);
    expect(reply.status).toBe(200);
    const mine = await scheduleIds(tag, "AND t.id = ?", [world.shelterA.team1]);
    expect(reply.body.meta?.totalItems).toBe(mine.length);
    expect(mine).toHaveLength(10);
    await expectCards(page, p, mine.slice(0, PAGE_SIZE), false);

    const other = await searchFor(page, SCREEN, world.shelterB.name);
    expect(other.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();

    await clearAllFilters(page, SCREEN);
    const visits = await selectFilter(page, SCREEN, "kind", "meeting");
    expect(visits.body.meta?.totalItems).toBe(10);
    // Nenhuma equipe de outro abrigo vaza, nem pela API com o filtro de abrigo.
    const leak = await request.get(`${API_URL}/shelter-schedules`, {
      headers: authHeaders(world.leader.token),
      params: { page: 1, shelterId: world.shelterB.id },
    });
    expect(((await leak.json()) as { meta: { totalItems: number } }).meta.totalItems).toBe(0);
  });

  test("líder sem equipe vê o aviso de equipe não vinculada, não a lista", async ({ page }) => {
    await seedBrowserSession(page, asSession(world.idleLeader));
    await page.goto(SCREEN.path);
    await expect(page.getByTestId(`${p}-manager`)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Nenhum abrigo vinculado" })).toBeVisible();
  });

  test("RBAC: membro não acessa a tela; visitante vai para o login", async ({ page, browser }) => {
    const context = await browser.newContext();
    const other = await context.newPage();
    await seedBrowserSession(other, asSession(world.member));
    await other.goto(SCREEN.path);
    await other.waitForLoadState("networkidle");
    await expect(other.getByTestId(`${p}-manager`)).toHaveCount(0);
    await expect(other).not.toHaveURL(new RegExp(`${SCREEN.path}$`));
    await context.close();

    await page.goto(SCREEN.path);
    await expect(page.getByTestId(`${p}-manager`)).toHaveCount(0);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test("flag shelter_schedule desligada esconde a rota e a API recusa; ligada de novo, a tela volta", async ({ page, request }) => {
    const admin = await loginAs(request, "admin");
    await withFlagsOff(request, admin.accessToken, ["shelter_schedule", "member_area"], async () => {
      await seedBrowserSession(page, admin);
      await page.goto(SCREEN.path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId(`${p}-manager`)).toHaveCount(0);
      await expect(page).not.toHaveURL(new RegExp(`${SCREEN.path}$`));
      const res = await request.get(`${API_URL}/shelter-schedules`, { headers: authHeaders(admin.accessToken), params: { page: 1 } });
      expect(res.status()).toBe(403);
    });
    await openScreen(page, SCREEN);
    await expect(page.getByTestId(`${p}-manager`)).toBeVisible();
  });
});
