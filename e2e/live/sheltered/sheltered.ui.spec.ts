import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { fillDatePickerGroup } from "../support/date-field";
import { RUN_TAG } from "../support/factory";
import { cleanupData, massCount } from "../support/keep-data";
import { flagEnabled } from "../support/flags";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  expectSameShell,
  hasHorizontalOverflow,
  measureShell,
  openFiltersIfMobile,
  pickFilter,
  resetSkeletonCount,
  sameSet,
  skeletonCount,
  summaryOf,
  totalFromSummary,
  visibleIds,
  watchSkeleton,
  widthRatio,
} from "../support/people-list-ui";
import { createShelter, deleteShelterApi, label, sheltersWithTag } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";
import { buildMassPlans, createMassThroughUi, ensureMassShelter, finishMassViaApi, MASS_PREFIX, MASS_SHELTER_NAMES } from "./sheltered-mass";
import { fillDate } from "../support/date-field";

/**
 * /adm/acolhidos na casca única (`AdminPageShell` + `AdminListToolbar` + `AdminPagination`): tabela no
 * desktop, cartões no mobile. Pilha real (API + MySQL); cada cenário cria os próprios dados pela API e apaga
 * tudo no fim. Todo resultado de filtro/ordenação/página é conferido contra o banco.
 *
 * Massa (14 acolhidos, `RUN_TAG` no nome): par/ímpar = M/F; 0–7 no abrigo A, 8–11 no abrigo B, 12–13 sem abrigo;
 * nascimento 2015-03-(10+i); "no abrigo desde" 2024-06-(10+i); 0–2 moram numa cidade própria.
 */
const P = "sheltered";
const COUNT = 14;
const SHELTERED_FLAGS = ["sheltered_area", "sheltered_management"] as const;
const DAY = (base: string, i: number): string => `${base}${String(10 + i).padStart(2, "0")}`;
const PHONE_BASE = String(Date.now()).slice(-7);
const nameOf = (i: number): string => `${RUN_TAG}-acolhido-${String(i).padStart(2, "0")}`;
const guardianOf = (i: number): string => `Resp ${RUN_TAG} ${String(i).padStart(2, "0")}`;
const phoneOf = (i: number): string => `92${PHONE_BASE}${String(i).padStart(2, "0")}`;

type Made = { id: string; name: string; i: number };

test.describe.serial("Acolhidos — tela /adm/acolhidos (UI real)", () => {
  let admin = "";
  let shelterA = { id: "", name: "" };
  let shelterB = { id: "", name: "" };
  let cityName = "";
  const made: Made[] = [];
  const extras: string[] = [];
  const shelters: string[] = [];
  let leader: Actor | null = null;
  let member: Actor | null = null;

  const post = async (request: APIRequestContext, body: Record<string, unknown>): Promise<string> => {
    const res = await request.post(`${API_URL}/sheltered`, { headers: authHeaders(admin), data: body });
    expect(res.status(), await res.text()).toBe(201);
    return ((await res.json()) as { id: string }).id;
  };

  const idsWhere = async (where: string, params: Array<string | number> = []): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT s.id AS id FROM sheltered s LEFT JOIN addresses a ON a.id = s.address_id LEFT JOIN shelters sh ON sh.id = s.shelter_id WHERE ${where}`,
        params,
      )
    ).map((row) => row.id);

  const countWhere = async (where: string, params: Array<string | number> = []): Promise<number> =>
    Number(
      (
        await queryOne<{ n: number }>(
          `SELECT COUNT(*) AS n FROM sheltered s LEFT JOIN addresses a ON a.id = s.address_id LEFT JOIN shelters sh ON sh.id = s.shelter_id WHERE ${where}`,
          params,
        )
      )?.n ?? 0,
    );

  const orderedIds = async (order: string, limit = 12, offset = 0): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT id FROM sheltered WHERE name LIKE ? ORDER BY ${order}, id LIMIT ${limit} OFFSET ${offset}`,
        [`%${RUN_TAG}-acolhido-%`],
      )
    ).map((row) => row.id);

  const tagIds = (): string[] => made.map((item) => item.id);

  const open = async (page: Page, request: APIRequestContext, role: "admin" | "leader" | "member" = "admin"): Promise<void> => {
    await seedBrowserSession(page, await loginAs(request, role));
    await page.goto("/adm/acolhidos");
  };

  const openReady = async (page: Page, request: APIRequestContext): Promise<void> => {
    await open(page, request);
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`${P}-loading`)).toHaveCount(0, { timeout: 20_000 });
  };

  const kindOf = (page: Page): "row" | "card" => (page.viewportSize()!.width < 600 ? "card" : "row");
  const ids = (page: Page): Promise<string[]> => visibleIds(page, kindOf(page), P);

  /** Filtra a lista só pelos acolhidos desta execução (busca pelo `RUN_TAG`) e espera o total. */
  const scope = async (page: Page): Promise<void> => {
    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-acolhido-`);
    await expect.poll(() => totalFromSummary(page, P), { timeout: 15_000 }).toBe(COUNT);
  };

  const expectIds = async (page: Page, expected: string[], ordered = false): Promise<void> => {
    await expect
      .poll(async () => (ordered ? (await ids(page)).join("|") : [...(await ids(page))].sort().join("|")), { timeout: 15_000 })
      .toBe(ordered ? expected.join("|") : [...expected].sort().join("|"));
  };

  /** Resultado de um filtro isolado: total do resumo e linhas visíveis batem com o banco. */
  const expectMatchesDb = async (page: Page, where: string, params: Array<string | number> = []): Promise<number> => {
    const expected = await idsWhere(where, params);
    await expect.poll(() => totalFromSummary(page, P), { timeout: 15_000 }).toBe(expected.length);
    await expect.poll(async () => (await ids(page)).length, { timeout: 15_000 }).toBe(Math.min(12, expected.length));
    const shown = await ids(page);
    for (const id of shown) expect(expected, `a linha ${id} deveria satisfazer o filtro`).toContain(id);
    return expected.length;
  };

  const dateField = (page: Page, key: string, value: string) => fillDate(page.getByTestId(`${P}-filter-${key}`), value);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    cityName = label("cidade");
    const unique = Math.random().toString(36).slice(2, 6); // nome único mesmo se outro spec do worker usar o mesmo RUN_TAG
    for (const [slot, name] of [["A", label(`abrigoA-${unique}`)], ["B", label(`abrigoB-${unique}`)]] as const) {
      const shelter = await createShelter(request, admin, { name, teamsQuantity: 1 });
      shelters.push(shelter.id);
      if (slot === "A") shelterA = { id: shelter.id, name };
      else shelterB = { id: shelter.id, name };
    }
    for (let i = 0; i < COUNT; i += 1) {
      const shelterId = i < 8 ? shelterA.id : i < 12 ? shelterB.id : undefined;
      const id = await post(request, {
        name: nameOf(i),
        gender: i % 2 === 0 ? "M" : "F",
        guardianName: guardianOf(i),
        guardianPhone: phoneOf(i),
        birthDate: DAY("2015-03-", i),
        joinedAt: DAY("2024-06-", i),
        shelterId,
        address: { street: `Rua ${i}`, number: String(i), district: "Centro", city: i < 3 ? cityName : "Manaus", state: "AM" },
      });
      made.push({ id, name: nameOf(i), i });
    }
  });

  // Massa acumulada: só apaga com E2E_CLEANUP=1. Fechar a conexão do banco roda sempre.
  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      const left = await queryAll<{ id: string }>("SELECT id FROM sheltered WHERE name LIKE ?", [`%${RUN_TAG}%`]);
      for (const { id } of left) await request.delete(`${API_URL}/sheltered/${id}`, { headers: authHeaders(admin) });
      for (const id of extras) await request.delete(`${API_URL}/sheltered/${id}`, { headers: authHeaders(admin) });
      for (const id of shelters) await deleteShelterApi(request, admin, id);
      await removeActors(request, admin, [leader?.id, member?.id].filter((id): id is string => Boolean(id)));
      expect(await queryOne("SELECT id FROM sheltered WHERE name LIKE ?", [`%${RUN_TAG}%`]), "sobrou acolhido do E2E").toBeNull();
      expect(await sheltersWithTag(RUN_TAG), "sobrou abrigo do E2E").toBe(0);
    });
    await closeDb();
  });

  // ------------------------------------------------------------------ desktop 1440

  test("desktop: carga inicial mostra o esqueleto uma vez e depois a tabela com a mesma página que a API devolve", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("sheltered-table")).toBeVisible({ timeout: 20_000 });
    expect(await skeletonCount(page), "o esqueleto aparece na primeira carga").toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId(`${P}-loading`)).toHaveCount(0);
    await expect(page.getByTestId("sheltered-cards")).toHaveCount(0);
    await expect(page.getByTestId(`${P}-toolbar-toggle-filters`)).toHaveCount(0);

    const total = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered"))?.n);
    expect(await totalFromSummary(page, P)).toBe(total);
    const api = (await (await request.get(`${API_URL}/sheltered?page=1&limit=12&orderBy=updatedAt&order=DESC`, { headers: authHeaders(admin) })).json()) as {
      data: Array<{ id: string }>;
      meta: { totalItems: number };
    };
    expect(api.meta.totalItems).toBe(total);
    expect(sameSet(await ids(page), api.data.map((item) => item.id))).toBe(true);
    await expect(page.getByTestId(`${P}-toolbar-search`)).toBeVisible();
    for (const key of ["gender", "shelterSearchingString", "addressFilter", "birthDateFrom", "birthDateTo", "joinedFrom", "joinedTo"]) {
      await expect(page.getByTestId(`${P}-filter-${key}`)).toBeAttached();
    }
  });

  test("desktop 1440px: a tela ocupa 95% da área útil, sem rolagem lateral", async ({ page, request }) => {
    await openReady(page, request);
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
  });

  test("desktop: busca com debounce manda poucas requisições e acha por nome, responsável e telefone", async ({ page, request }) => {
    await openReady(page, request);
    const searches: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (req.method() === "GET" && url.pathname === "/sheltered" && url.searchParams.has("searchString")) searches.push(url.searchParams.get("searchString") ?? "");
    });
    const target = made[7];
    const term = nameOf(7);
    await page.getByTestId(`${P}-toolbar-search`).pressSequentially(term, { delay: 25 });
    await expectIds(page, [target.id]);
    expect(searches.length, `requisições de busca: ${searches.join(" | ")}`).toBeLessThanOrEqual(3);
    expect(searches.at(-1)).toBe(term);

    await page.getByTestId(`${P}-toolbar-search`).fill(guardianOf(5));
    await expectIds(page, [made[5].id]);
    await page.getByTestId(`${P}-toolbar-search`).fill(phoneOf(9));
    await expectIds(page, [made[9].id]);
    await expect(page.getByTestId(`${P}-toolbar-clear`)).toBeEnabled();
    await page.getByTestId(`${P}-toolbar-clear`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
    await expect.poll(() => totalFromSummary(page, P)).toBe(Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered"))?.n));
  });

  test("desktop: filtro isolado de gênero bate com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await pickFilter(page, P, "gender", "F");
    const n = await expectMatchesDb(page, "s.gender = ?", ["F"]);
    expect(n).toBeGreaterThanOrEqual(COUNT / 2);
    await pickFilter(page, P, "gender", "M");
    await expectMatchesDb(page, "s.gender = ?", ["M"]);
    await pickFilter(page, P, "gender", "");
    await expect.poll(() => totalFromSummary(page, P)).toBe(Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered"))?.n));
  });

  test("desktop: filtro isolado por abrigo (nome do abrigo) bate com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId(`${P}-filter-shelterSearchingString`).fill(shelterA.name);
    expect(await expectMatchesDb(page, "sh.name LIKE ?", [`%${shelterA.name}%`])).toBe(8);
    await page.getByTestId(`${P}-filter-shelterSearchingString`).fill(shelterB.name);
    expect(await expectMatchesDb(page, "sh.name LIKE ?", [`%${shelterB.name}%`])).toBe(4);
  });

  test("desktop: filtro isolado por endereço bate com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId(`${P}-filter-addressFilter`).fill(cityName);
    expect(await expectMatchesDb(page, "a.city LIKE ?", [`%${cityName}%`])).toBe(3);
  });

  test("desktop: filtros de nascimento (a partir de, até e intervalo) batem com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await dateField(page, "birthDateFrom", "2015-03-20");
    await expectMatchesDb(page, "s.birthDate >= ?", ["2015-03-20"]);
    await dateField(page, "birthDateFrom", "");
    await dateField(page, "birthDateTo", "2015-03-11");
    await expectMatchesDb(page, "s.birthDate <= ?", ["2015-03-11"]);
    await dateField(page, "birthDateFrom", "2015-03-12");
    await dateField(page, "birthDateTo", "2015-03-15");
    expect(await expectMatchesDb(page, "s.birthDate BETWEEN ? AND ?", ["2015-03-12", "2015-03-15"])).toBeGreaterThanOrEqual(4);
  });

  test("desktop: filtros de 'no abrigo desde' (a partir de, até e intervalo) batem com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await dateField(page, "joinedFrom", "2024-06-20");
    await expectMatchesDb(page, "s.joinedAt >= ?", ["2024-06-20"]);
    await dateField(page, "joinedFrom", "");
    await dateField(page, "joinedTo", "2024-06-11");
    await expectMatchesDb(page, "s.joinedAt <= ?", ["2024-06-11"]);
    await dateField(page, "joinedFrom", "2024-06-13");
    await dateField(page, "joinedTo", "2024-06-16");
    expect(await expectMatchesDb(page, "s.joinedAt BETWEEN ? AND ?", ["2024-06-13", "2024-06-16"])).toBeGreaterThanOrEqual(4);
  });

  test("desktop: filtros combinados (busca + gênero + abrigo + período) devolvem exatamente o conjunto do banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await pickFilter(page, P, "gender", "F");
    await page.getByTestId(`${P}-filter-shelterSearchingString`).fill(shelterA.name);
    await dateField(page, "joinedFrom", "2024-06-11");
    await dateField(page, "joinedTo", "2024-06-17");
    const expected = await idsWhere(
      "s.name LIKE ? AND s.gender = 'F' AND sh.name LIKE ? AND s.joinedAt BETWEEN ? AND ?",
      [`%${RUN_TAG}-acolhido-%`, `%${shelterA.name}%`, "2024-06-11", "2024-06-17"],
    );
    expect(expected.length).toBeGreaterThan(0);
    await expectIds(page, expected);
    await expect.poll(() => totalFromSummary(page, P)).toBe(expected.length);
    expect(await page.getByTestId(`${P}-toolbar-clear-filters`).isEnabled()).toBe(true);

    await pickFilter(page, P, "gender", "M");
    const male = await idsWhere(
      "s.name LIKE ? AND s.gender = 'M' AND sh.name LIKE ? AND s.joinedAt BETWEEN ? AND ?",
      [`%${RUN_TAG}-acolhido-%`, `%${shelterA.name}%`, "2024-06-11", "2024-06-17"],
    );
    await expectIds(page, male);
  });

  test("desktop: ordenação pelos cabeçalhos segue a ordem do banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    // No desktop a ordenação é só pelo cabeçalho (o seletor existe apenas no mobile).
    await expect(page.getByTestId(`${P}-filter-sort`)).toHaveCount(0);
    await page.getByTestId("sheltered-sort-name").click();
    await expectIds(page, await orderedIds("name ASC"), true);
    await page.getByTestId("sheltered-sort-name").click();
    await expectIds(page, await orderedIds("name DESC"), true);

    await page.getByTestId("sheltered-sort-birthDate").click();
    await expectIds(page, await orderedIds("birthDate ASC"), true);
    await page.getByTestId("sheltered-sort-birthDate").click();
    await expectIds(page, await orderedIds("birthDate DESC"), true);
    await page.getByTestId("sheltered-sort-joinedAt").click();
    await expectIds(page, await orderedIds("joinedAt ASC"), true);
    await page.getByTestId("sheltered-sort-name").click();
    await expectIds(page, await orderedIds("name ASC"), true);
    await page.getByTestId("sheltered-sort-name").click();
    await expectIds(page, await orderedIds("name DESC"), true);
  });

  test("desktop: paginação (próxima, anterior, ir para a 2ª, primeira, última) cobre todos os acolhidos sem repetir", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await page.getByTestId("sheltered-sort-name").click();
    const pager = page.getByTestId(`${P}-pagination`);
    await expectIds(page, await orderedIds("name ASC", 12, 0), true);
    await expect(summaryOf(page, P)).toHaveText(`1–12 de ${COUNT}`);
    const first = await ids(page);

    await pager.getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await orderedIds("name ASC", 12, 12), true);
    await expect(summaryOf(page, P)).toHaveText(`13–14 de ${COUNT}`);
    const second = await ids(page);
    expect(second).toHaveLength(2);
    expect(sameSet([...first, ...second], tagIds())).toBe(true);

    await pager.getByRole("button", { name: "Página anterior" }).click();
    await expectIds(page, first, true);
    await pager.getByRole("button", { name: "Ir para a página 2" }).click();
    await expectIds(page, second, true);
    await pager.getByRole("button", { name: "Primeira página" }).click();
    await expectIds(page, first, true);
    await pager.getByRole("button", { name: "Última página" }).click();
    await expectIds(page, second, true);
  });

  test("desktop: sem resultado por filtro mostra o vazio, e limpar os filtros restaura a lista", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-nao-existe`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`${P}-empty`)).toContainText("limpar os filtros");
    await expect(page.getByTestId("sheltered-table")).toHaveCount(0);
    await expect(summaryOf(page, P)).toHaveText("0 itens");

    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-empty`)).toHaveCount(0);
    await expect(page.getByTestId("sheltered-table")).toBeVisible();

    await scope(page);
    await pickFilter(page, P, "gender", "F");
    await page.getByTestId(`${P}-filter-shelterSearchingString`).fill(shelterB.name);
    await dateField(page, "joinedTo", "2024-06-10");
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    expect(await idsWhere("s.name LIKE ? AND s.gender='F' AND sh.name LIKE ? AND s.joinedAt <= ?", [`%${RUN_TAG}-acolhido-%`, `%${shelterB.name}%`, "2024-06-10"])).toHaveLength(0);
  });

  test("desktop: limpar filtros zera busca e campos e volta ao total", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId("sheltered-sort-name").click();
    await scope(page);
    await pickFilter(page, P, "gender", "F");
    await page.getByTestId(`${P}-filter-addressFilter`).fill("Manaus");
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeEnabled();
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-filter-addressFilter`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-filter-gender`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeDisabled();
    await expect.poll(() => totalFromSummary(page, P)).toBe(Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered"))?.n));
  });

  test("desktop: a casca não dança entre carregamento, lista, vazio e página 2 (tolerância 1px) e o esqueleto só vem na 1ª carga", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-toolbar`)).toBeVisible({ timeout: 20_000 });
    const loading = await measureShell(page, P);
    await expect(page.getByTestId("sheltered-table")).toBeVisible({ timeout: 20_000 });
    const list = await measureShell(page, P);
    expectSameShell(list, loading, "lista × carga");
    await resetSkeletonCount(page);

    await scope(page);
    await page.getByTestId("sheltered-sort-name").click();
    await expectIds(page, await orderedIds("name ASC", 12, 0), true);
    expectSameShell(await measureShell(page, P), loading, "busca");
    await page.getByTestId(`${P}-pagination`).getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await orderedIds("name ASC", 12, 12), true);
    expectSameShell(await measureShell(page, P), loading, "página 2");

    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-nao-existe`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    expectSameShell(await measureShell(page, P), loading, "vazio");
    expect(await skeletonCount(page), "trocar filtro/página não volta ao esqueleto").toBe(0);

    const contentHeight = (await page.getByTestId(`${P}-content`).boundingBox())!.height;
    expect(contentHeight, "a área de conteúdo mantém altura mínima mesmo vazia").toBeGreaterThanOrEqual(500);
  });

  test("desktop: erro real da API (flags desligadas) mostra o alerta e 'Tentar novamente' recupera a lista", async ({ page, request }) => {
    await openReady(page, request);
    const before = new Map<string, boolean>();
    for (const key of SHELTERED_FLAGS) before.set(key, await flagEnabled(key));
    try {
      for (const key of SHELTERED_FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
      await page.getByTestId(`${P}-toolbar-refresh`).click();
      await expect(page.getByTestId(`${P}-error`)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("sheltered-table")).toHaveCount(0);
    } finally {
      for (const key of SHELTERED_FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before.get(key) ?? true } });
    }
    await page.getByTestId(`${P}-error`).getByRole("button", { name: "Tentar novamente" }).click();
    await expect(page.getByTestId(`${P}-error`)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId("sheltered-table")).toBeVisible();
  });

  test("RBAC: membro e visitante não acessam; líder vê só o que a API lhe devolve", async ({ page, request, browser }) => {
    member = await createActor(request, admin, "member", "acolhidos-ui");
    await open(page, request, "member");
    await expect(page.getByTestId(`${P}-manager`)).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 15_000 }).not.toBe("/adm/acolhidos");

    const guest = await browser.newPage();
    await guest.goto("http://localhost:5173/adm/acolhidos");
    await guest.waitForLoadState("networkidle");
    await expect(guest.getByTestId(`${P}-manager`)).toHaveCount(0);
    await guest.close();

    const leaderPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await seedBrowserSession(leaderPage, await loginAs(request, "leader"));
    await leaderPage.goto("http://localhost:5173/adm/acolhidos");
    await expect(leaderPage.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    const token = (await loginAs(request, "leader")).accessToken;
    const api = (await (await request.get(`${API_URL}/sheltered?page=1&limit=12`, { headers: authHeaders(token) })).json()) as {
      data: Array<{ id: string }>;
      meta: { totalItems: number };
    };
    await expect.poll(() => totalFromSummary(leaderPage, P), { timeout: 15_000 }).toBe(api.meta.totalItems);
    expect(sameSet(await visibleIds(leaderPage, "row", P), api.data.map((item) => item.id))).toBe(true);
    await leaderPage.close();
  });

  test("flag sheltered_management desligada: a rota redireciona e a API devolve 403 FEATURE_DISABLED", async ({ page, request }) => {
    const before = new Map<string, boolean>();
    for (const key of SHELTERED_FLAGS) before.set(key, await flagEnabled(key));
    try {
      for (const key of SHELTERED_FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
      await open(page, request);
      // a rota desligada redireciona (sem showMessage): a tela some e a URL sai de /adm/acolhidos
      await expect(page).not.toHaveURL(/\/adm\/acolhidos/, { timeout: 20_000 });
      await expect(page.getByTestId(`${P}-manager`)).toHaveCount(0);
      const res = await request.get(`${API_URL}/sheltered?page=1&limit=12`, { headers: authHeaders(admin) });
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    } finally {
      for (const key of SHELTERED_FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before.get(key) ?? true } });
    }
  });

  test("criar: o diálogo valida, cancelar não grava e salvar grava no banco e aparece na lista", async ({ page, request }) => {
    await openReady(page, request);
    const name = `${RUN_TAG}-ui-criado`;
    const before = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE name LIKE ?", [`%${RUN_TAG}%`]))?.n);

    await page.getByTestId("sheltered-create").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog").getByText("Informe o nome")).toBeVisible();
    await page.getByTestId("sheltered-form-cancel").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0);
    expect(Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE name LIKE ?", [`%${RUN_TAG}%`]))?.n)).toBe(before);

    await page.getByTestId("sheltered-create").click();
    await page.getByTestId("sheltered-form-name").locator("input").fill(name);
    await page.getByTestId("sheltered-form-guardian-name").locator("input").fill("Responsável UI");
    await page.getByTestId("sheltered-form-shelter-autocomplete").getByRole("combobox").fill(shelterA.name);
    await page.getByRole("option", { name: shelterA.name }).click();
    await fillDatePickerGroup(page.getByTestId("sheltered-form-birth-date"), "2016-05-20");
    await page.getByTestId("sheltered-form-city").locator("input").fill("Manaus");
    await page.getByTestId("sheltered-form-state").locator("input").fill("AM");
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 15_000 });

    const row = await queryOne<{ id: string; guardianName: string; shelter_id: string }>("SELECT id, guardianName, shelter_id FROM sheltered WHERE name = ?", [name]);
    expect(row, "o acolhido criado pela tela está no banco").toBeTruthy();
    extras.push(row!.id);
    expect(row!.shelter_id).toBe(shelterA.id);
    expect(row!.guardianName).toBe("Responsável UI");

    await page.getByTestId(`${P}-toolbar-search`).fill(name);
    await expect(page.getByTestId(`sheltered-row-${row!.id}`)).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => totalFromSummary(page, P)).toBe(1);
  });

  test("ver, editar (pelo diálogo de detalhes e pela linha) e excluir gravam no banco e atualizam a lista", async ({ page, request }) => {
    const name = `${RUN_TAG}-ui-acao`;
    const id = await post(request, { name, gender: "F", birthDate: "2016-05-20", shelterId: shelterA.id, guardianName: "Resp Ação", birthDate: "2016-05-10", guardianPhone: "92988887777", address: { city: "Manaus", state: "AM" } });
    extras.push(id);
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(name);
    await expect(page.getByTestId(`sheltered-row-${id}`)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId(`sheltered-row-view-${id}`).click();
    await expect(page.getByTestId("sheltered-view-dialog")).toBeVisible();
    await expect(page.getByTestId("sheltered-view-name")).toContainText(name);
    await page.getByTestId("sheltered-view-edit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
    await page.getByTestId("sheltered-form-guardian-name").locator("input").fill("Resp Editado");
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 15_000 });
    expect((await queryOne<{ guardianName: string }>("SELECT guardianName FROM sheltered WHERE id = ?", [id]))?.guardianName).toBe("Resp Editado");
    await expect(page.getByTestId(`sheltered-row-${id}`)).toContainText("Resp Editado", { timeout: 15_000 });

    await page.getByTestId(`sheltered-row-edit-${id}`).click();
    await page.getByTestId("sheltered-form-name").locator("input").fill(`${name}-novo`);
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 15_000 });
    expect((await queryOne<{ name: string }>("SELECT name FROM sheltered WHERE id = ?", [id]))?.name).toBe(`${name}-novo`);

    await page.getByTestId(`sheltered-row-delete-${id}`).click();
    await expect(page.getByTestId("sheltered-delete-dialog")).toContainText(`${name}-novo`);
    await page.getByTestId("sheltered-delete-dialog-cancel").click();
    expect(await queryOne("SELECT id FROM sheltered WHERE id = ?", [id])).toBeTruthy();
    await page.getByTestId(`sheltered-row-delete-${id}`).click();
    await page.getByTestId("sheltered-delete-dialog-confirm").click();
    await expect(page.getByTestId(`sheltered-row-${id}`)).toHaveCount(0, { timeout: 15_000 });
    expect(await queryOne("SELECT id FROM sheltered WHERE id = ?", [id]), "excluído do banco").toBeNull();
  });

  test("massa: cria 5 a 10 acolhidos novos pela UI e deixa no banco (acumula a cada execução)", async ({ page, request }) => {
    for (const name of MASS_SHELTER_NAMES) await ensureMassShelter(request, admin, name);
    const count = massCount();
    await openReady(page, request);
    const before = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE name LIKE ?", [`${MASS_PREFIX} Acolhido %`]))?.n ?? 0);
    for (const plan of buildMassPlans(RUN_TAG, count, before)) {
      const id = await createMassThroughUi(page, plan);
      await finishMassViaApi(request, admin, id, plan);
    }
    const after = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE name LIKE ?", [`${MASS_PREFIX} Acolhido %`]))?.n ?? 0);
    expect(after - before).toBe(count);
    await page.getByTestId(`${P}-toolbar-search`).fill(`${MASS_PREFIX} Acolhido ${RUN_TAG}`);
    await expect.poll(() => totalFromSummary(page, P), { timeout: 15_000 }).toBe(count);
  });

  // ------------------------------------------------------------------ mobile 375

  test("@mobile cartões em vez de tabela, filtros atrás do botão, 98% da tela e sem rolagem lateral", async ({ page, request }) => {
    await openReady(page, request);
    await expect(page.getByTestId("sheltered-cards")).toBeVisible();
    await expect(page.getByTestId("sheltered-table")).toHaveCount(0);
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).not.toBeVisible();
    await page.getByTestId(`${P}-toolbar-toggle-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeVisible();
    await expect(page.getByTestId(`${P}-filter-gender`)).toBeAttached();
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);
  });

  test("@mobile busca e filtros pelos cartões batem com o banco e o botão Filtros mostra o contador", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await openFiltersIfMobile(page, P);
    await pickFilter(page, P, "gender", "F");
    await page.getByTestId(`${P}-filter-shelterSearchingString`).fill(shelterA.name);
    const expected = await idsWhere("s.name LIKE ? AND s.gender='F' AND sh.name LIKE ?", [`%${RUN_TAG}-acolhido-%`, `%${shelterA.name}%`]);
    await expectIds(page, expected);
    await expect(page.getByTestId(`${P}-toolbar-toggle-filters`)).toContainText("Filtros");
    await expect(page.getByTestId(`${P}-toolbar`).locator(".MuiBadge-badge")).toHaveText("3");
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
  });

  test("@mobile paginação e ordenação nos cartões cobrem os 14 acolhidos", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await openFiltersIfMobile(page, P);
    await pickFilter(page, P, "sort", "name:ASC");
    await expectIds(page, await orderedIds("name ASC", 12, 0), true);
    await page.getByTestId(`${P}-pagination`).getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await orderedIds("name ASC", 12, 12), true);
    await expect(summaryOf(page, P)).toHaveText(`13–14 de ${COUNT}`);
  });

  test("@mobile cartão mostra nome, abrigo e responsável, com ações de 44px alinhadas e sem sobrepor", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    const item = made[2];
    await page.getByTestId(`${P}-toolbar-search`).fill(nameOf(2));
    await expect(page.getByTestId(`sheltered-card-${item.id}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`sheltered-card-title-${item.id}`)).toHaveText(nameOf(2));
    await expect(page.getByTestId(`sheltered-card-shelter-${item.id}`)).toContainText(shelterA.name);
    await expect(page.getByTestId(`sheltered-card-guardian-${item.id}`)).toHaveText(guardianOf(2));
    const boxes = [];
    for (const action of ["delete", "view", "edit"]) {
      const box = await page.getByTestId(`sheltered-card-${action}-${item.id}`).boundingBox();
      expect(box!.height, `${action} >= 44px`).toBeGreaterThanOrEqual(44);
      boxes.push(box!);
    }
    const card = (await page.getByTestId(`sheltered-card-${item.id}`).boundingBox())!;
    for (const box of boxes) {
      expect(box.x, "ação dentro do cartão").toBeGreaterThanOrEqual(card.x - 1);
      expect(box.x + box.width, "ação dentro do cartão").toBeLessThanOrEqual(card.x + card.width + 1);
    }
    // Ver e Editar empilham em coluna no mobile, sem sobreposição vertical.
    expect(boxes[2].y, "Editar abaixo de Ver").toBeGreaterThanOrEqual(boxes[1].y + boxes[1].height - 1);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("@mobile a casca não dança entre carga, lista, vazio e página 2", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-toolbar`)).toBeVisible({ timeout: 20_000 });
    const loading = await measureShell(page, P);
    await expect(page.getByTestId("sheltered-cards")).toBeVisible({ timeout: 20_000 });
    expectSameShell(await measureShell(page, P), loading, "lista × carga");
    await resetSkeletonCount(page);
    await scope(page);
    await page.getByTestId(`${P}-pagination`).getByRole("button", { name: "Próxima página" }).click();
    await expect(summaryOf(page, P)).toHaveText(`13–14 de ${COUNT}`);
    expectSameShell(await measureShell(page, P), loading, "página 2");
    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-nao-existe`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    expectSameShell(await measureShell(page, P), loading, "vazio");
    expect(await skeletonCount(page)).toBe(0);
  });

  test("@mobile ver, editar e excluir pelos cartões gravam no banco", async ({ page, request }) => {
    const name = `${RUN_TAG}-mob-acao`;
    const id = await post(request, { name, gender: "M", shelterId: shelterB.id, guardianName: "Resp Mobile", birthDate: "2016-05-10", address: { city: "Manaus", state: "AM" } });
    extras.push(id);
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(name);
    await expect(page.getByTestId(`sheltered-card-${id}`)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId(`sheltered-card-view-${id}`).click();
    await expect(page.getByTestId("sheltered-view-dialog")).toBeVisible();
    await expect(page.getByTestId("sheltered-view-name")).toContainText(name);
    await page.getByTestId("sheltered-view-close").click();
    await expect(page.getByTestId("sheltered-view-dialog")).toHaveCount(0);

    await page.getByTestId(`sheltered-card-edit-${id}`).click();
    await page.getByTestId("sheltered-form-guardian-name").locator("input").fill("Resp Mobile 2");
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 15_000 });
    expect((await queryOne<{ guardianName: string }>("SELECT guardianName FROM sheltered WHERE id = ?", [id]))?.guardianName).toBe("Resp Mobile 2");
    await expect(page.getByTestId(`sheltered-card-guardian-${id}`)).toHaveText("Resp Mobile 2", { timeout: 15_000 });

    await page.getByTestId(`sheltered-card-delete-${id}`).click();
    await page.getByTestId("sheltered-delete-dialog-confirm").click();
    await expect(page.getByTestId(`sheltered-card-${id}`)).toHaveCount(0, { timeout: 15_000 });
    expect(await queryOne("SELECT id FROM sheltered WHERE id = ?", [id])).toBeNull();
  });

  test("@mobile criar pelo botão da toolbar grava no banco", async ({ page, request }) => {
    await openReady(page, request);
    const name = `${RUN_TAG}-mob-criado`;
    await page.getByTestId("sheltered-create").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toBeVisible();
    await page.getByTestId("sheltered-form-name").locator("input").fill(name);
    await page.getByTestId("sheltered-form-shelter-autocomplete").getByRole("combobox").fill(shelterB.name);
    await page.getByRole("option", { name: shelterB.name }).click();
    await fillDatePickerGroup(page.getByTestId("sheltered-form-birth-date"), "2016-05-20");
    await page.getByTestId("sheltered-form-city").locator("input").fill("Manaus");
    await page.getByTestId("sheltered-form-state").locator("input").fill("AM");
    await page.getByTestId("sheltered-form-submit").click();
    await expect(page.getByTestId("sheltered-form-dialog")).toHaveCount(0, { timeout: 15_000 });
    const row = await queryOne<{ id: string }>("SELECT id FROM sheltered WHERE name = ?", [name]);
    expect(row).toBeTruthy();
    extras.push(row!.id);
  });
});
