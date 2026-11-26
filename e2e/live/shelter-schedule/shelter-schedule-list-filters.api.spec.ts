import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { localShift } from "../support/local-day";
import { queryOne } from "../support/db";
import { withFlagsOff } from "../support/flags";
import { authHeaders, expect, test } from "../support/live";
import { buildScheduleWorld, disposeScheduleWorld, EVENT_DATE_SQL, scheduleIds, SCHEDULE_TOTAL, type ScheduleWorld } from "./support";

/**
 * Filtros de `GET /shelter-schedules` aplicados no banco: search (abrigo/lição/observação/sala), shelterId, teamId,
 * kind, eventFrom/eventTo, createdFrom/createdTo, sortBy/order, page/limit. Massa própria (abrigos A e B), limpeza
 * no afterAll. Sem `page` e sem filtros o array legado continua igual; o escopo do papel vale antes de qualquer filtro.
 */
interface Paged {
  data: Array<{ id: string; shelter: { id: string; team: { id: string } } }>;
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string };
}


test.describe.serial("Agendamentos — filtros da listagem no servidor", () => {
  const tag = `e2e-agapi-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  let world: ScheduleWorld;

  test.beforeAll(async ({ request }) => {
    world = await buildScheduleWorld(request, tag);
  });
  test.afterAll(async ({ request }) => {
    await disposeScheduleWorld(request, world);
  });

  const get = (request: APIRequestContext, query: string, token: string | null = world?.adminToken): Promise<APIResponse> =>
    request.get(`${API_URL}/shelter-schedules${query}`, { headers: token ? authHeaders(token) : {} });
  const scoped = (extra = ""): string => `search=${encodeURIComponent(tag)}${extra ? `&${extra}` : ""}`;
  const paged = async (request: APIRequestContext, query: string, token: string | null = world.adminToken): Promise<Paged> => {
    const res = await get(request, `?${query}`, token);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const idsOf = async (request: APIRequestContext, query: string, token: string | null = world.adminToken): Promise<string[]> =>
    (await paged(request, `${query}&page=1&limit=100`, token)).data.map((row) => row.id);

  test("sem page e sem filtros: array legado (visita crescente), sem envelope, com tudo o que criamos", async ({ request }) => {
    const res = await get(request, "");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Array<{ id: string; visitDate?: string | null }>;
    expect(Array.isArray(body)).toBe(true);
    for (const id of world.ids) expect(body.map((row) => row.id)).toContain(id);
    const dated = body.filter((row) => row.visitDate).map((row) => row.visitDate as string);
    expect(dated).toEqual([...dated].sort());
  });

  test("filtro sem page devolve array filtrado; teamId sozinho segue legado", async ({ request }) => {
    const filtered = await get(request, `?${scoped("kind=meeting")}`);
    const rows = (await filtered.json()) as Array<{ id: string }>;
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(12);
    const legacy = (await (await get(request, `?teamId=${world.shelterB.team1}`)).json()) as Array<{ id: string }>;
    expect(legacy).toHaveLength(3);
  });

  test("com page: envelope, total filtrado e orderBy padrão eventDate", async ({ request }) => {
    const page = await paged(request, scoped("page=1&limit=100"));
    expect(page.meta).toMatchObject({ page: 1, limit: 100, totalItems: SCHEDULE_TOTAL, totalPages: 1, orderBy: "eventDate" });
    expect(page.data).toHaveLength(SCHEDULE_TOTAL);
  });

  test("search isolado: abrigo, lição, sala e curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(world.shelterB.name)}`)).toHaveLength(3);
    expect(await idsOf(request, `search=${encodeURIComponent(world.special.lesson)}`)).toEqual([world.special.id]);
    expect(await idsOf(request, `search=${encodeURIComponent(world.room.room)}`)).toEqual([world.room.id]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${tag}%`)}`)).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${tag}_alfa`)}`)).toEqual([]);
  });

  test("kind, shelterId e teamId isolados batem com o banco", async ({ request }) => {
    expect(await idsOf(request, scoped("kind=visit"))).toHaveLength(13);
    expect(await idsOf(request, scoped("kind=meeting"))).toHaveLength(12);
    expect((await idsOf(request, scoped(`shelterId=${world.shelterA.id}`))).sort()).toEqual((await scheduleIds(tag, "AND sh.id = ?", [world.shelterA.id])).sort());
    expect(await idsOf(request, scoped(`teamId=${world.shelterA.team2}`))).toHaveLength(2);
    expect(await idsOf(request, scoped(`shelterId=${world.shelterB.id}&teamId=${world.shelterA.team1}`))).toEqual([]);
  });

  test("eventFrom/eventTo: dia inclusivo, intervalo e combinação com tipo", async ({ request }) => {
    const db = async (from: string, to: string) => (await scheduleIds(tag, `AND ${EVENT_DATE_SQL} BETWEEN ? AND ?`, [from, to])).sort();
    expect((await idsOf(request, scoped("eventFrom=2026-03-03&eventTo=2026-03-05"))).sort()).toEqual(await db("2026-03-03", "2026-03-05"));
    expect(await idsOf(request, scoped("eventFrom=2026-04-01&eventTo=2026-04-01"))).toHaveLength(1);
    expect(await idsOf(request, scoped("eventFrom=2026-04-01"))).toHaveLength(5);
    expect(await idsOf(request, scoped("eventTo=2026-03-05"))).toHaveLength(5);
    expect(await idsOf(request, scoped("eventFrom=2026-04-01&kind=meeting"))).toHaveLength(2);
    expect(await idsOf(request, scoped("eventFrom=2027-01-01"))).toEqual([]);
  });

  test("createdFrom/createdTo: hoje inclui tudo; amanhã ou ontem excluem", async ({ request }) => {
    const today = localShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1`))).meta.totalItems).toBe(SCHEDULE_TOTAL);
    expect((await paged(request, scoped(`createdFrom=${localShift(2)}&page=1`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${localShift(-2)}&page=1`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: search + shelterId + kind + eventFrom/To", async ({ request }) => {
    const out = await idsOf(request, `search=${encodeURIComponent(tag)}&shelterId=${world.shelterA.id}&kind=visit&eventFrom=2026-03-04&eventTo=2026-03-07`);
    expect(out.sort()).toEqual(
      (await scheduleIds(tag, `AND sh.id = ? AND s.visitDate IS NOT NULL AND ${EVENT_DATE_SQL} BETWEEN ? AND ?`, [world.shelterA.id, "2026-03-04", "2026-03-07"])).sort(),
    );
    expect(out).toHaveLength(4);
  });

  test("sortBy: shelterName, visitNumber, eventDate e createdAt, nos dois sentidos, batem com o banco", async ({ request }) => {
    const order = (sql: string) => scheduleIds(tag, "", [], sql);
    const get12 = async (sortBy: string, dir: string) => (await paged(request, scoped(`sortBy=${sortBy}&order=${dir}&page=1&limit=100`))).data.map((row) => row.id);
    expect(await get12("shelterName", "ASC")).toEqual(await order("sh.name ASC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC"));
    expect(await get12("shelterName", "DESC")).toEqual(await order("sh.name DESC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC"));
    expect(await get12("visitNumber", "DESC")).toEqual(await order("s.visitNumber DESC, sh.name ASC, t.numberTeam ASC, s.id ASC"));
    expect(await get12("eventDate", "ASC")).toEqual(await order(`${EVENT_DATE_SQL} ASC, sh.name ASC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC`));
    expect(await get12("eventDate", "DESC")).toEqual(await order(`${EVENT_DATE_SQL} DESC, sh.name ASC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC`));
    const created = await get12("createdAt", "ASC");
    expect(created).toHaveLength(SCHEDULE_TOTAL);
    expect((await paged(request, scoped("sortBy=visitNumber&page=1"))).meta.orderBy).toBe("visitNumber");
  });

  test("paginação: página 1 e 2 sem repetição, total fixo; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("sortBy=shelterName&order=ASC&page=1&limit=12"));
    const p2 = await paged(request, scoped("sortBy=shelterName&order=ASC&page=2&limit=12"));
    expect(p1.meta).toMatchObject({ totalItems: SCHEDULE_TOTAL, totalPages: 2, limit: 12 });
    expect(p1.data).toHaveLength(12);
    expect(p2.data).toHaveLength(3);
    expect(new Set([...p1.data, ...p2.data].map((row) => row.id)).size).toBe(SCHEDULE_TOTAL);
    const beyond = await paged(request, scoped("page=9&limit=12"));
    expect(beyond.data).toEqual([]);
    expect(beyond.meta.totalItems).toBe(SCHEDULE_TOTAL);
  });

  test("validação: sortBy/kind/datas inválidos, page=0, limit=101, order e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["sortBy=lessonContent", "kind=outro", "eventFrom=ontem", "eventTo=2026-13-01", "createdFrom=x", "page=0", "limit=101", "order=UP", "foo=bar"]) {
      expect((await get(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401; líder e membro só enxergam a equipe deles, com filtros", async ({ request }) => {
    expect((await get(request, `?${scoped("page=1")}`, null)).status()).toBe(401);

    const mineIds = (await scheduleIds(tag, "AND t.id = ?", [world.shelterA.team1])).sort();
    for (const actor of [world.leader, world.member]) {
      const all = await paged(request, scoped("page=1&limit=100"), actor.token);
      expect(all.meta.totalItems, actor.role).toBe(10);
      expect(all.data.map((row) => row.id).sort()).toEqual(mineIds);
      expect((await paged(request, scoped(`shelterId=${world.shelterB.id}&page=1`), actor.token)).meta.totalItems).toBe(0);
      expect((await paged(request, scoped(`teamId=${world.shelterB.team1}&page=1`), actor.token)).meta.totalItems).toBe(0);
      expect((await paged(request, scoped("kind=meeting&page=1"), actor.token)).meta.totalItems).toBe(10);
    }
    const idle = await paged(request, scoped("page=1"), world.idleLeader.token);
    expect(idle.meta.totalItems).toBe(0);
  });

  test("flag desligada: shelter_schedule e member_area desligadas dão 403 FEATURE_DISABLED", async ({ request }) => {
    await withFlagsOff(request, world.adminToken, ["shelter_schedule", "member_area"], async () => {
      const res = await get(request, `?${scoped("page=1")}`);
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    });
    expect((await get(request, `?${scoped("page=1")}`)).status()).toBe(200);
  });

  test("a massa do cenário está no banco como esperado", async () => {
    const row = await queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM shelter_schedules s JOIN teams t ON t.id = s.team_id JOIN shelters sh ON sh.id = t.shelter_id WHERE sh.name LIKE ?",
      [`%${tag}%`],
    );
    expect(Number(row?.n)).toBe(SCHEDULE_TOTAL);
  });
});
