import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { countRows, closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createShelter, deleteShelterApi, label } from "../shelters/support";
import { createRaw, deleteRaw, payload, type ReportBody } from "./support";
import { cleanupData } from "../support/keep-data";
import { localShift } from "../support/local-day";

/**
 * Filtros de `GET /visit-reports` aplicados no banco: search, scheduleId/teamId/shelterId, visitFrom/To, createdFrom/To,
 * sortBy/order, page/limit e o escopo do líder. Sem `page` continua o array legado.
 */
interface Row extends ReportBody {
  shelter: { id: string; name: string };
  team: { id: string; numberTeam: number };
  schedule: { id: string; visitNumber: number; visitDate?: string };
  createdAt: string;
}
interface Paged {
  data: Row[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string };
}

const utcShift = (days: number): string => localShift(days);

test.describe.serial("Relatórios de visita — filtros da listagem no servidor", () => {
  let admin = "";
  let leader = "";
  let member = "";
  let leaderProfileId = "";
  const shelters: string[] = [];
  const schedules: string[] = [];
  const reports: string[] = [];
  let shelterA = "";
  let shelterB = "";
  let teamA = "";
  let teamB = "";
  const byKey: Record<string, string> = {};

  const teamOf = async (shelterId: string): Promise<string> =>
    (await queryOne<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? ORDER BY numberTeam LIMIT 1", [shelterId]))?.id ?? "";
  const list = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/visit-reports${query}`, { headers: token ? authHeaders(token) : {} });
  const scoped = (extra = ""): string => `search=${encodeURIComponent(RUN_TAG)}${extra ? `&${extra}` : ""}`;
  const paged = async (request: APIRequestContext, query: string, token: string | null = admin): Promise<Paged> => {
    const res = await list(request, `?${query}`, token);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const idsOf = async (request: APIRequestContext, query: string, token: string | null = admin): Promise<string[]> =>
    (await paged(request, `${query}&page=1&limit=100`, token)).data.map((d) => d.id);

  const make = async (request: APIRequestContext, key: string, teamId: string, visitNumber: number, visitDate: string, observation: string) => {
    const sched = await request.post(`${API_URL}/shelter-schedules`, {
      headers: authHeaders(admin),
      data: { visitNumber, lessonContent: label(`licao-${key}`), teamId, visitDate, meetingDate: visitDate },
    });
    expect(sched.status(), await sched.text()).toBe(201);
    const scheduleId = ((await sched.json()) as { id: string }).id;
    schedules.push(scheduleId);
    const res = await createRaw(request, admin, payload({ scheduleId, observation }));
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as ReportBody;
    reports.push(body.id);
    byKey[key] = body.id;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    leaderProfileId =
      (await queryOne<{ id: string }>("SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = 'e2e.leader@orfanatonib.test'"))?.id ?? "";
    for (const name of ["rel-filtro-a", "rel-filtro-b"]) shelters.push((await createShelter(request, admin, { name: label(name), teamsQuantity: 1 })).id);
    [shelterA, shelterB] = shelters;
    [teamA, teamB] = [await teamOf(shelterA), await teamOf(shelterB)];
    const lead = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId: shelterA, teams: [1] }] });
    expect(lead.status()).toBe(200);
    await make(request, "a1", teamA, 601, "2026-09-01", `alfa cozinha 50%_x ${RUN_TAG}`);
    await make(request, "a2", teamA, 602, "2026-09-10", `beta ${RUN_TAG}`);
    await make(request, "b1", teamB, 603, "2026-09-20", `gama ${RUN_TAG}`);
  });

  test.afterAll(async ({ request }) => {
    // Vínculo do líder (sempre): não pode vazar para outros specs.
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    await cleanupData(async () => {
      for (const id of reports) await deleteRaw(request, admin, id);
      for (const id of schedules) await request.delete(`${API_URL}/shelter-schedules/${id}`, { headers: authHeaders(admin) });
      for (const id of shelters) await deleteShelterApi(request, admin, id);
      // Só os do cenário: o RUN_TAG é do processo e cobre a massa que outros arquivos mantêm.
      for (const id of shelters) expect(await countRows("shelters", { id }), "a limpeza deixou um abrigo do cenário").toBe(0);
    });
    await closeDb();
  });

  test("sem page: array legado (createdAt DESC) e sem envelope; ids de escopo seguem valendo", async ({ request }) => {
    const res = await list(request, `?${scoped()}`);
    const body = (await res.json()) as Array<{ id: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.map((r) => r.id)).toEqual([...reports].reverse());
    expect((await (await list(request, `?scheduleId=${schedules[0]}`)).json()) as unknown[]).toHaveLength(1);
    expect(((await (await list(request, `?teamId=${teamB}`)).json()) as Array<{ id: string }>).map((r) => r.id)).toEqual([byKey.b1]);
    expect(((await (await list(request, `?shelterId=${shelterA}`)).json()) as unknown[]).length).toBe(2);
  });

  test("com page: envelope com total filtrado e orderBy padrão createdAt", async ({ request }) => {
    const page = await paged(request, scoped("page=1&limit=100"));
    expect(page.meta).toMatchObject({ page: 1, limit: 100, totalItems: 3, totalPages: 1, orderBy: "createdAt" });
  });

  test("search isolado: abrigo, lição, observação, número da visita e curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(label("rel-filtro-b"))}`)).toEqual([byKey.b1]);
    expect(await idsOf(request, `search=${encodeURIComponent(label("licao-a2"))}`)).toEqual([byKey.a2]);
    expect(await idsOf(request, `search=${encodeURIComponent(`cozinha 50%_x ${RUN_TAG}`)}`)).toEqual([byKey.a1]);
    expect(await idsOf(request, `search=${encodeURIComponent(`cozinha 50%_y ${RUN_TAG}`)}`)).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent("603")}`)).toContain(byKey.b1);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
  });

  test("shelterId, teamId e scheduleId isolados batem com o banco", async ({ request }) => {
    expect((await idsOf(request, `shelterId=${shelterA}`)).sort()).toEqual([byKey.a1, byKey.a2].sort());
    expect(await idsOf(request, `teamId=${teamB}`)).toEqual([byKey.b1]);
    expect(await idsOf(request, `scheduleId=${schedules[1]}`)).toEqual([byKey.a2]);
    const dbA = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM visit_reports r JOIN shelter_schedules s ON s.id = r.schedule_id JOIN teams t ON t.id = s.team_id WHERE t.shelter_id = ?", [shelterA]))?.n);
    expect((await paged(request, `shelterId=${shelterA}&page=1`)).meta.totalItems).toBe(dbA);
  });

  test("visitFrom/visitTo e createdFrom/createdTo: limites inclusivos", async ({ request }) => {
    expect((await idsOf(request, scoped("visitFrom=2026-09-10"))).sort()).toEqual([byKey.a2, byKey.b1].sort());
    expect(await idsOf(request, scoped("visitTo=2026-09-10"))).toEqual(expect.arrayContaining([byKey.a1, byKey.a2]));
    expect(await idsOf(request, scoped("visitFrom=2026-09-10&visitTo=2026-09-10"))).toEqual([byKey.a2]);
    const today = utcShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1`))).meta.totalItems).toBe(3);
    expect((await paged(request, scoped(`createdFrom=${utcShift(2)}&page=1`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${utcShift(-2)}&page=1`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: search + shelterId + visitFrom", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(RUN_TAG)}&shelterId=${shelterA}&visitFrom=2026-09-05`)).toEqual([byKey.a2]);
  });

  test("sortBy visitDate, visitNumber, shelter, team e createdAt, nas duas ordens", async ({ request }) => {
    const order = async (query: string) => (await paged(request, scoped(`${query}&page=1&limit=100`))).data.map((r) => r.id);
    expect(await order("sortBy=visitDate&order=ASC")).toEqual([byKey.a1, byKey.a2, byKey.b1]);
    expect(await order("sortBy=visitDate&order=DESC")).toEqual([byKey.b1, byKey.a2, byKey.a1]);
    expect(await order("sortBy=visitNumber&order=DESC")).toEqual([byKey.b1, byKey.a2, byKey.a1]);
    const byShelter = await order("sortBy=shelter&order=ASC");
    expect(byShelter[2]).toBe(byKey.b1);
    expect(await order("sortBy=createdAt&order=ASC")).toEqual(reports);
    expect((await paged(request, scoped("sortBy=team&page=1"))).meta.orderBy).toBe("team");
  });

  test("paginação: página 1 e 2 sem repetição; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("sortBy=visitDate&order=ASC&page=1&limit=2"));
    const p2 = await paged(request, scoped("sortBy=visitDate&order=ASC&page=2&limit=2"));
    expect(p1.meta).toMatchObject({ totalItems: 3, totalPages: 2, limit: 2 });
    expect(p1.data).toHaveLength(2);
    expect(p2.data).toHaveLength(1);
    expect(p1.data.map((r) => r.id)).not.toContain(p2.data[0].id);
    const beyond = await paged(request, scoped("page=9&limit=2"));
    expect(beyond.data).toEqual([]);
    expect(beyond.meta.totalItems).toBe(3);
  });

  test("validação: sortBy/datas inválidos, page=0, limit=101, order e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["sortBy=observation", "visitFrom=ontem", "visitTo=2026-13-01", "createdFrom=x", "page=0", "limit=101", "order=UP", "foo=bar"]) {
      expect((await list(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização: visitante 401, membro 403; líder vê só o que lidera, mesmo com filtro de outro abrigo", async ({ request }) => {
    expect((await list(request, `?${scoped()}`, null)).status()).toBe(401);
    expect((await list(request, `?${scoped()}`, member)).status()).toBe(403);
    expect((await idsOf(request, scoped(), leader)).sort()).toEqual([byKey.a1, byKey.a2].sort());
    expect(await idsOf(request, `shelterId=${shelterB}`, leader)).toEqual([]);
    expect(await idsOf(request, `teamId=${teamB}`, leader)).toEqual([]);
    expect((await paged(request, scoped("page=1"), leader)).meta.totalItems).toBe(2);
    expect(await idsOf(request, scoped("sortBy=visitDate&order=DESC"), leader)).toEqual([byKey.a2, byKey.a1]);
  });
});
