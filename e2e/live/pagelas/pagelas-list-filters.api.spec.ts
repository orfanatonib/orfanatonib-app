import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createShelter, deleteShelterApi, label, sheltersWithTag } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";
import { cleanupData } from "../support/keep-data";

/**
 * Filtros e ordenação aditivos de `GET /pagelas/paginated`: referenceFrom/To, sortBy (period|referenceDate|member) e order,
 * além dos filtros que já existiam (year, visit, present, searchString). O envelope `{ items, total, page, limit }` não muda.
 */
interface Paged {
  items: Array<{ id: string; visit: number; year: number; referenceDate: string }>;
  total: number;
  page: number;
  limit: number;
}

test.describe.serial("Pagelas — filtros e ordenação da listagem paginada", () => {
  let admin = "";
  let leader = "";
  let leaderProfileId = "";
  let author: Actor;
  let shelterA = "";
  let shelterB = "";
  let shelteredA = "";
  let shelteredB = "";
  const shelters: string[] = [];
  const shelteredIds: string[] = [];
  const created: string[] = [];

  const get = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/pagelas/paginated${query}`, { headers: token ? authHeaders(token) : {} });
  const paged = async (request: APIRequestContext, query: string, token: string | null = admin): Promise<Paged> => {
    const res = await get(request, `?${query}`, token);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const forA = (extra = ""): string => `shelteredId=${shelteredA}${extra ? `&${extra}` : ""}`;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    leaderProfileId =
      (await queryOne<{ id: string }>("SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = 'e2e.leader@orfanatonib.test'"))?.id ?? "";
    author = await createActor(request, admin, "member", "autor-pagela-filtros");
    const authorProfileId = (await queryOne<{ id: string }>("SELECT p.id AS id FROM member_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?", [author.email]))?.id ?? "";
    for (const name of ["pagela-filtro-a", "pagela-filtro-b"]) shelters.push((await createShelter(request, admin, { name: label(name), teamsQuantity: 1 })).id);
    [shelterA, shelterB] = shelters;
    expect((await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId: shelterA, teams: [1] }] })).status()).toBe(200);
    const sheltered = async (name: string, shelterId: string) => {
      const res = await request.post(`${API_URL}/sheltered`, { headers: authHeaders(admin), data: { name: label(name), gender: "F", shelterId } });
      const id = ((await res.json()) as { id: string }).id;
      shelteredIds.push(id);
      return id;
    };
    shelteredA = await sheltered("filtro-a", shelterA);
    shelteredB = await sheltered("filtro-b", shelterB);
    const make = async (shelteredId: string, visit: number, referenceDate: string, present: boolean, notes: string) => {
      const res = await request.post(`${API_URL}/pagelas`, {
        headers: authHeaders(admin),
        data: { shelteredId, memberProfileId: authorProfileId, referenceDate, year: 2026, visit, present, notes },
      });
      expect(res.status(), await res.text()).toBe(201);
      created.push(((await res.json()) as { id: string }).id);
    };
    await make(shelteredA, 1, "2026-03-01", true, "primeira");
    await make(shelteredA, 2, "2026-03-15", false, "segunda 50%_x");
    await make(shelteredA, 3, "2026-04-01", true, "terceira");
    await make(shelteredB, 1, "2026-03-01", true, "outro abrigo");
  });

  test.afterAll(async ({ request }) => {
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    await cleanupData(async () => {
      for (const id of created) await request.delete(`${API_URL}/pagelas/${id}`, { headers: authHeaders(admin) });
      for (const id of shelteredIds) await request.delete(`${API_URL}/sheltered/${id}`, { headers: authHeaders(admin) });
      for (const id of shelters) await deleteShelterApi(request, admin, id);
      await removeActors(request, admin, [author.id]);
      expect(await sheltersWithTag(RUN_TAG), "a limpeza deixou abrigos do E2E").toBe(0);
    });
    await closeDb();
  });

  test("padrão: ano e visita do mais novo ao mais antigo; envelope inalterado", async ({ request }) => {
    const page = await paged(request, forA("page=1&limit=10"));
    expect(page).toMatchObject({ total: 3, page: 1, limit: 10 });
    expect(page.items.map((p) => p.visit)).toEqual([3, 2, 1]);
    expect(page.items.map((p) => p.visit)).toEqual([3, 2, 1]);
  });

  test("referenceFrom/referenceTo: limites inclusivos e combinação", async ({ request }) => {
    expect((await paged(request, forA("referenceFrom=2026-03-15&page=1"))).items.map((p) => p.visit)).toEqual([3, 2]);
    expect((await paged(request, forA("referenceTo=2026-03-15&page=1"))).items.map((p) => p.visit)).toEqual([2, 1]);
    expect((await paged(request, forA("referenceFrom=2026-03-15&referenceTo=2026-03-15&page=1"))).total).toBe(1);
    expect((await paged(request, forA("referenceFrom=2027-01-01&page=1"))).total).toBe(0);
    const db = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM pagelas WHERE sheltered_id = ? AND referenceDate >= '2026-03-15'", [shelteredA]))?.n);
    expect((await paged(request, forA("referenceFrom=2026-03-15&page=1"))).total).toBe(db);
  });

  test("sortBy period/referenceDate nas duas ordens", async ({ request }) => {
    const visits = async (q: string) => (await paged(request, forA(`${q}&page=1`))).items.map((p) => p.visit);
    expect(await visits("sortBy=period&order=ASC")).toEqual([1, 2, 3]);
    expect(await visits("sortBy=period&order=DESC")).toEqual([3, 2, 1]);
    expect(await visits("sortBy=referenceDate&order=ASC")).toEqual([1, 2, 3]);
    expect(await visits("sortBy=referenceDate&order=DESC")).toEqual([3, 2, 1]);
    expect((await get(request, `?${forA("sortBy=member&order=ASC&page=1")}`)).status()).toBe(200);
  });

  test("filtros que já existiam continuam: present, year, visit e searchString (combinados com datas)", async ({ request }) => {
    expect((await paged(request, forA("present=false&page=1"))).items.map((p) => p.visit)).toEqual([2]);
    expect((await paged(request, forA("year=2026&visit=3&page=1"))).items.map((p) => p.visit)).toEqual([3]);
    expect((await paged(request, forA("searchString=terceira&page=1"))).items.map((p) => p.visit)).toEqual([3]);
    expect((await paged(request, forA("present=true&referenceFrom=2026-03-10&page=1"))).items.map((p) => p.visit)).toEqual([3]);
  });

  test("paginação: página 1 e 2 sem repetição; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, forA("limit=2&page=1"));
    const p2 = await paged(request, forA("limit=2&page=2"));
    expect(p1.items).toHaveLength(2);
    expect(p2.items).toHaveLength(1);
    expect(p1.items.map((p) => p.id)).not.toContain(p2.items[0].id);
    const beyond = await paged(request, forA("limit=2&page=9"));
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(3);
  });

  test("validação: sortBy/order/datas inválidos e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["sortBy=notes", "order=UP", "referenceFrom=ontem", "referenceTo=2026-13-01", "foo=bar"]) {
      expect((await get(request, `?${forA(query)}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401; líder só vê o abrigo que lidera", async ({ request }) => {
    expect((await get(request, `?${forA("page=1")}`, null)).status()).toBe(401);
    expect((await paged(request, forA("page=1"), leader)).total).toBe(3);
    const foreign = await get(request, `?shelteredId=${shelteredB}&page=1`, leader);
    expect([403, 404]).toContain(foreign.status());
  });
});
