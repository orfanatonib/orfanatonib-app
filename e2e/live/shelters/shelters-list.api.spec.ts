import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { cleanupData } from "../support/keep-data";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createShelter, deleteShelterApi, get, label, sheltersWithTag, type ShelterBody } from "./support";
import { localAddDays, localShift } from "../support/local-day";

/**
 * GET /shelters (lista paginada da tela /adm/abrigos): busca, cidade, UF, período de criação,
 * ordenação por whitelist e paginação, tudo aplicado no banco. Cada resultado é conferido contra o MySQL.
 *
 * Massa (12 abrigos com RUN_TAG): 0–2 numa cidade própria (UF "PA"), 3–11 em "Manaus" (UF "AM").
 */
const COUNT = 12;
const TAG_LIKE = `%${RUN_TAG}-lista-%`;
const nameOf = (i: number): string => label(`lista-${String(i).padStart(2, "0")}`);

type Req = Parameters<typeof deleteShelterApi>[0];

type Page = {
  items: ShelterBody[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

test.describe.serial("GET /shelters — filtros, ordenação e paginação no servidor", () => {
  let admin = "";
  let leader = "";
  let member = "";
  let cityName = "";
  const created: string[] = [];

  const list = async (request: Req, query: string, token: string | null = admin) => get(request, token ?? undefined, `/shelters?${query}`);

  const page = async (request: Req, query: string): Promise<Page> => {
    const res = await list(request, query);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Page;
  };

  const ids = (body: Page): string[] => body.items.map((item) => item.id);
  // Só os desta lista: o RUN_TAG é do processo e também marca abrigos de outros arquivos.
  const scoped = `searchString=${encodeURIComponent(`${RUN_TAG}-lista-`)}`;

  const dbIds = async (where: string, params: Array<string | number> = [], order = "s.name ASC, s.id ASC"): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT s.id AS id FROM shelters s LEFT JOIN addresses a ON a.id = s.address_id WHERE ${where} ORDER BY ${order}`,
        params,
      )
    ).map((row) => row.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    cityName = label("cidade");
    for (let i = 0; i < COUNT; i += 1) {
      const shelter = await createShelter(request, admin, {
        name: nameOf(i),
        teamsQuantity: 1,
        city: i < 3 ? cityName : "Manaus",
        state: i < 3 ? "PA" : "AM",
      });
      created.push(shelter.id);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of created) await deleteShelterApi(request, admin, id);
      expect(await sheltersWithTag(RUN_TAG), "sobrou abrigo do E2E").toBe(0);
    });
    await closeDb();
  });

  test("sem filtros: envelope items/total/page/limit/pageCount coerente com o banco", async ({ request }) => {
    const body = await page(request, "page=1&limit=5");
    const total = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM shelters"))?.n);
    expect(body.total).toBe(total);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(5);
    expect(body.pageCount).toBe(Math.ceil(total / 5));
    expect(body.items).toHaveLength(Math.min(5, total));
  });

  test("busca isolada acha pelo nome e total bate com o banco", async ({ request }) => {
    const body = await page(request, `${scoped}&page=1&limit=100`);
    expect(body.total).toBe(COUNT);
    expect(ids(body).sort()).toEqual([...created].sort());
    const one = await page(request, `searchString=${encodeURIComponent(nameOf(7))}&page=1&limit=12`);
    expect(ids(one)).toEqual([created[7]]);
  });

  test("busca por cidade livre (searchString) acha os abrigos da cidade", async ({ request }) => {
    const body = await page(request, `searchString=${encodeURIComponent(cityName)}&page=1&limit=100`);
    expect(ids(body).sort()).toEqual(created.slice(0, 3).sort());
  });

  test("filtro isolado por cidade bate com o banco", async ({ request }) => {
    const body = await page(request, `city=${encodeURIComponent(cityName)}&page=1&limit=100`);
    const expected = await dbIds("a.city LIKE ?", [`%${cityName}%`]);
    expect(body.total).toBe(expected.length);
    expect(ids(body).sort()).toEqual(expected.sort());
    expect(expected).toHaveLength(3);
  });

  test("filtro isolado por estado bate com o banco", async ({ request }) => {
    const body = await page(request, "state=PA&page=1&limit=100");
    const expected = await dbIds("a.state LIKE ?", ["%PA%"]);
    expect(body.total).toBe(expected.length);
    for (const id of created.slice(0, 3)) expect(ids(body)).toContain(id);
    for (const id of created.slice(3)) expect(ids(body)).not.toContain(id);
  });

  test("cidade com % e _ é literal (não vira curinga)", async ({ request }) => {
    const wild = await page(request, "city=%25&page=1&limit=100");
    const literal = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM addresses WHERE city LIKE '%\\%%'"))?.n);
    expect(wild.total, "% casa só cidade que contém % de verdade").toBeLessThanOrEqual(literal + 0);
    expect(ids(wild)).not.toContain(created[0]);
    const underscore = await page(request, "city=_&page=1&limit=100");
    expect(ids(underscore)).not.toContain(created[0]);
  });

  test("período de criação: a partir de hoje, até hoje, intervalo e futuro vazio batem com o banco", async ({ request }) => {
    const today = localShift(0);
    const tomorrow = localAddDays(today, 1);
    const yesterday = localAddDays(today, -1);

    const from = await page(request, `${scoped}&createdFrom=${today}&page=1&limit=100`);
    expect(from.total).toBe((await dbIds("s.name LIKE ? AND s.createdAt >= ?", [TAG_LIKE, `${today} 00:00:00`])).length);
    expect(from.total).toBe(COUNT);

    const to = await page(request, `${scoped}&createdTo=${today}&page=1&limit=100`);
    expect(to.total).toBe((await dbIds("s.name LIKE ? AND s.createdAt <= ?", [TAG_LIKE, `${today} 23:59:59.999`])).length);
    expect(to.total).toBe(COUNT);

    const range = await page(request, `${scoped}&createdFrom=${yesterday}&createdTo=${tomorrow}&page=1&limit=100`);
    expect(range.total).toBe(COUNT);

    const future = await page(request, `${scoped}&createdFrom=${tomorrow}&page=1&limit=100`);
    expect(future.total).toBe(0);
    expect(future.items).toEqual([]);
    const past = await page(request, `${scoped}&createdTo=${yesterday}&page=1&limit=100`);
    expect(past.total).toBe(0);
  });

  test("filtros combinados (busca + cidade + UF + período) devolvem exatamente o conjunto do banco", async ({ request }) => {
    const today = localShift(0);
    const body = await page(
      request,
      `${scoped}&city=${encodeURIComponent(cityName)}&state=PA&createdFrom=${today}&page=1&limit=100`,
    );
    const expected = await dbIds("s.name LIKE ? AND a.city LIKE ? AND a.state LIKE ? AND s.createdAt >= ?", [
      TAG_LIKE,
      `%${cityName}%`,
      "%PA%",
      `${today} 00:00:00`,
    ]);
    expect(expected).toHaveLength(3);
    expect(ids(body).sort()).toEqual(expected.sort());
    expect(body.total).toBe(3);

    const none = await page(request, `${scoped}&city=${encodeURIComponent(cityName)}&state=AM&page=1&limit=100`);
    expect(none.total).toBe(0);
  });

  test.describe("ordenação (whitelist) igual à do banco", () => {
    const cases: Array<[string, string, string]> = [
      ["name", "ASC", "s.name ASC, s.id ASC"],
      ["name", "DESC", "s.name DESC, s.id ASC"],
      ["city", "ASC", "a.city ASC, s.id ASC"],
      ["city", "DESC", "a.city DESC, s.id ASC"],
      ["state", "ASC", "a.state ASC, s.id ASC"],
      ["createdAt", "DESC", "s.createdAt DESC, s.id ASC"],
      ["updatedAt", "ASC", "s.updatedAt ASC, s.id ASC"],
    ];
    for (const [sort, order, sql] of cases) {
      test(`sort=${sort} order=${order}`, async ({ request }) => {
        const body = await page(request, `${scoped}&sort=${sort}&order=${order}&page=1&limit=100`);
        const expected = await dbIds("s.name LIKE ?", [TAG_LIKE], sql);
        expect(ids(body)).toEqual(expected);
      });
    }
  });

  test("paginação: página 2, última página e fora do alcance cobrem todos sem repetir", async ({ request }) => {
    const first = await page(request, `${scoped}&sort=city&order=ASC&page=1&limit=5`);
    const second = await page(request, `${scoped}&sort=city&order=ASC&page=2&limit=5`);
    const third = await page(request, `${scoped}&sort=city&order=ASC&page=3&limit=5`);
    expect(first.total).toBe(COUNT);
    expect(first.pageCount).toBe(3);
    expect([first.items.length, second.items.length, third.items.length]).toEqual([5, 5, 2]);
    const all = [...ids(first), ...ids(second), ...ids(third)];
    expect(new Set(all).size).toBe(COUNT);
    expect(all).toEqual(await dbIds("s.name LIKE ?", [TAG_LIKE], "a.city ASC, s.id ASC"));

    const beyond = await page(request, `${scoped}&page=9&limit=5`);
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(COUNT);
  });

  test("parâmetros inválidos: sort, order, page=0, limit=101 e datas ruins devolvem 400", async ({ request }) => {
    for (const query of [
      "sort=teamsQuantity&page=1",
      "order=SIDEWAYS&page=1",
      "page=0",
      "limit=101",
      "limit=0",
      "createdFrom=01/02/2026&page=1",
      "createdTo=2026-13-45&page=1",
      "inexistente=1&page=1",
      `searchString=${"x".repeat(121)}&page=1`,
    ]) {
      const res = await list(request, query);
      expect(res.status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro 403 e líder só enxerga o que lidera", async ({ request }) => {
    expect((await list(request, `${scoped}&page=1&limit=100`, null)).status()).toBe(401);
    expect((await list(request, `${scoped}&page=1&limit=100`, member)).status()).toBe(403);
    const asLeader = await list(request, `${scoped}&page=1&limit=100`, leader);
    expect(asLeader.status()).toBe(200);
    const body = (await asLeader.json()) as Page;
    for (const id of created) expect(ids(body)).not.toContain(id);
    expect(body.total).toBe(0);
  });

  test("a rota de leitura continua devolvendo o contrato da tela (items com líderes e membros)", async ({ request }) => {
    const body = await page(request, `${scoped}&page=1&limit=1`);
    const [item] = body.items;
    expect(item).toBeTruthy();
    const raw = item as unknown as Record<string, unknown>;
    for (const key of ["id", "name", "address", "leaders", "members", "createdAt", "updatedAt"]) {
      expect(raw, `campo ${key}`).toHaveProperty(key);
    }
    const res = await request.get(`${API_URL}/shelters?page=1&limit=1`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
  });
});
