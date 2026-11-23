import type { APIRequestContext, APIResponse } from "@playwright/test";
import { cleanupData } from "../support/keep-data";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { profileSeeds, removeProfiles, seedProfile, usersWithTag, type SeededProfile } from "./support";
import { localShift } from "../support/local-day";

/**
 * Filtros de `GET /profiles` aplicados no banco: search/q (nome e e-mail), role, gender, birthMonth, preferências,
 * createdFrom/To, sortBy/order, page/limit. Cria as próprias contas (RUN_TAG) e apaga no afterAll. O envelope da rota é
 * `{ items, meta: { currentPage, itemsPerPage, totalItems, totalPages, ... } }`.
 */
interface Item {
  id: string;
  name: string;
  role: string;
  createdAt?: string;
  personalData?: { gender?: string; birthDate?: string };
}
interface Paged {
  items: Item[];
  meta: { currentPage: number; itemsPerPage: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

const JOIN = "FROM users u LEFT JOIN personal_data pd ON pd.userId = u.id LEFT JOIN user_preferences up ON up.userId = u.id";

test.describe.serial("Perfis — filtros da listagem no servidor", () => {
  let admin: string;
  let member: string;
  let leader: string;
  let people: SeededProfile[] = [];

  const list = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/profiles${query}`, { headers: token ? authHeaders(token) : {} });
  // Nome com espaço depois do RUN_TAG: contas de outros specs (e-mail com o RUN_TAG, sem esse nome) ficam de fora.
  const scoped = (extra = ""): string => `search=${encodeURIComponent(`${RUN_TAG} `)}${extra ? `&${extra}` : ""}`;
  const paged = async (request: APIRequestContext, query: string): Promise<Paged> => {
    const res = await list(request, `?${query}`);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const idsOf = async (request: APIRequestContext, query: string): Promise<string[]> =>
    (await paged(request, `${query}&page=1&limit=100`)).items.map((item) => item.id);
  const dbIds = async (extra = "", params: Array<string | number> = [], order = "u.name ASC"): Promise<string[]> =>
    (await queryAll<{ id: string }>(`SELECT u.id AS id ${JOIN} WHERE u.name LIKE ? ${extra} ORDER BY ${order}`, [`${RUN_TAG} %`, ...params])).map((row) => row.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    for (const seed of profileSeeds(RUN_TAG)) people.push(await seedProfile(request, admin, seed));
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await removeProfiles(request, admin, people.map((person) => person.id));
      expect(await usersWithTag(RUN_TAG), "a limpeza deixou contas do E2E").toBe(0);
    });
    await closeDb();
  });

  test("com page: envelope items/meta com total filtrado e ordem padrão por nome", async ({ request }) => {
    const body = await paged(request, scoped("page=1&limit=12"));
    expect(body.meta).toMatchObject({ currentPage: 1, itemsPerPage: 12, totalItems: 14, totalPages: 2, hasNextPage: true, hasPreviousPage: false });
    expect(body.items.map((item) => item.id)).toEqual((await dbIds()).slice(0, 12));
  });

  test("search é o mesmo que q: nome e e-mail, com curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} C`)}`)).toEqual([people[2].id]);
    expect(await idsOf(request, `q=${encodeURIComponent(`${RUN_TAG} C`)}`)).toEqual([people[2].id]);
    expect(await idsOf(request, `search=${encodeURIComponent(`g.${RUN_TAG}@`)}`)).toEqual([people[6].id]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} %`)}`)).toEqual([]);
  });

  test("role isolado: líder e membro batem com o banco", async ({ request }) => {
    expect((await idsOf(request, scoped("role=leader"))).sort()).toEqual((await dbIds("AND u.role = 'leader'")).sort());
    expect(await idsOf(request, scoped("role=leader"))).toHaveLength(2);
    expect((await paged(request, scoped("role=member&page=1"))).meta.totalItems).toBe(12);
  });

  test("gender, birthMonth e preferências isolados batem com o banco", async ({ request }) => {
    expect((await paged(request, scoped("gender=Feminino&page=1"))).meta.totalItems).toBe((await dbIds("AND pd.gender = 'Feminino'")).length);
    for (const month of [1, 6, 12]) {
      expect((await idsOf(request, scoped(`birthMonth=${month}`))).sort()).toEqual((await dbIds("AND MONTH(pd.birthDate) = ?", [month])).sort());
    }
    expect((await idsOf(request, scoped("temperaments=Colérico"))).sort()).toEqual((await dbIds("AND up.temperaments LIKE ?", ["%Colérico%"])).sort());
    expect((await idsOf(request, scoped("loveLanguages=Toque"))).sort()).toEqual((await dbIds("AND up.loveLanguages LIKE ?", ["%Toque%"])).sort());
    expect((await idsOf(request, scoped("favoriteColor=Verde"))).sort()).toEqual((await dbIds("AND up.favoriteColor LIKE ?", ["%Verde%"])).sort());
  });

  test("createdFrom/createdTo: hoje inclui tudo; amanhã ou ontem excluem; a resposta traz createdAt", async ({ request }) => {
    const today = localShift(0);
    const all = await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1&limit=100`));
    expect(all.meta.totalItems).toBe(14);
    expect(all.items.every((item) => typeof item.createdAt === "string")).toBe(true);
    expect((await paged(request, scoped(`createdFrom=${localShift(2)}&page=1`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${localShift(-2)}&page=1`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: role + gender + birthMonth + preferência", async ({ request }) => {
    const expected = await dbIds("AND u.role = 'member' AND pd.gender = 'Feminino' AND MONTH(pd.birthDate) = 5");
    expect(expected.length).toBeGreaterThan(0);
    expect((await idsOf(request, scoped("role=member&gender=Feminino&birthMonth=5"))).sort()).toEqual(expected.sort());
    expect(await idsOf(request, scoped("role=leader&gender=Feminino&birthMonth=5"))).toEqual([]);
  });

  test("sortBy name, email, createdAt e birthDate nas duas direções", async ({ request }) => {
    const cases: Array<[string, string, string]> = [
      ["name", "DESC", "u.name DESC"],
      ["email", "ASC", "u.email ASC"],
      ["email", "DESC", "u.email DESC"],
      ["createdAt", "ASC", "u.createdAt ASC"],
      ["birthDate", "ASC", "pd.birthDate ASC"],
      ["birthDate", "DESC", "pd.birthDate DESC"],
    ];
    for (const [sortBy, order, sql] of cases) {
      const body = await paged(request, scoped(`sortBy=${sortBy}&order=${order}&page=1&limit=100`));
      expect(body.items.map((item) => item.id), `${sortBy} ${order}`).toEqual(await dbIds("", [], sql));
    }
  });

  test("paginação: página 1 e 2 sem repetição; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("page=1&limit=5"));
    const p2 = await paged(request, scoped("page=3&limit=5"));
    expect(p1.meta).toMatchObject({ totalItems: 14, totalPages: 3, itemsPerPage: 5 });
    expect(p1.items).toHaveLength(5);
    expect(p2.items).toHaveLength(4);
    expect(p1.items.map((item) => item.id)).not.toEqual(expect.arrayContaining([p2.items[0].id]));
    const beyond = await paged(request, scoped("page=9&limit=5"));
    expect(beyond.items).toEqual([]);
    expect(beyond.meta.totalItems).toBe(14);
  });

  test("validação: birthMonth, role, sortBy, datas e page inválidos, e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["birthMonth=0", "birthMonth=13", "role=visitante", "sortBy=phone", "createdFrom=ontem", "createdTo=2026-02-30", "order=UP", "page=0", "limit=0", "foo=bar"]) {
      expect((await list(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro 403, líder sem equipe 200 e vazio, flags desligadas 403", async ({ request }) => {
    expect((await list(request, `?${scoped("role=leader")}`, null)).status()).toBe(401);
    expect((await list(request, `?${scoped("role=leader")}`, member)).status()).toBe(403);
    const asLeader = await list(request, `?${scoped("role=leader&page=1")}`, leader);
    expect(asLeader.status()).toBe(200);
    expect(((await asLeader.json()) as Paged).meta.totalItems).toBe(0);
    // O líder também aceita os filtros novos na contagem (a consulta dele ganhou os joins de dados pessoais).
    const leaderFiltered = await list(request, `?${scoped("temperaments=Colérico&birthMonth=3&page=1")}`, leader);
    expect(leaderFiltered.status()).toBe(200);
    await withFlagsOff(request, admin, ["user_management", "profile_management", "leader_management"], async () => {
      await expectFeatureDisabled(await list(request, `?${scoped("role=leader&page=1")}`));
    });
    expect((await list(request, `?${scoped("page=1")}`)).status()).toBe(200);
  });
});
