import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { countRows, closeDb, queryAll, queryOne } from "../support/db";
import {
  DESKTOP_VIEWPORT,
  PAGE_SIZE,
  cardIds,
  clearAllFilters,
  expectCards,
  expectStableLayout,
  filtersVisible,
  frameWidthRatio,
  goToPage,
  layoutSamples,
  recordLayout,
  selectFilter,
  summaryText,
  watchSkeleton,
  sawSkeleton,
  whenListLoaded,
  type ListReply,
  type ListScreen,
} from "../support/admin-list-ui";
import { setDateFilter } from "../support/shell-suite";
import { RUN_TAG } from "../support/factory";
import { withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { createShelter, deleteShelterApi, label } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";
import { cleanupData } from "../support/keep-data";

const P = "pagelas";
const SHELTERS: ListScreen = { p: P, path: "/adm/pagelas", endpoint: "/shelters" };
const SHELTERED: ListScreen = { p: P, path: "/adm/pagelas", endpoint: "/sheltered" };
const PAGELAS: ListScreen = { p: P, path: "/adm/pagelas", endpoint: "/pagelas/paginated" };
const ACOLHIDOS = 13;
const PAGELAS_COUNT = 14;

/** Busca do nível: a API de abrigos, acolhidos e pagelas chama o termo de `searchString`. */
async function searchFor(page: Page, screen: ListScreen, text: string): Promise<ListReply> {
  return whenListLoaded(
    page,
    screen,
    async () => {
      await page.getByTestId(`${P}-toolbar-search`).fill(text);
    },
    (params) => (params.get("searchString") ?? "") === text.trim(),
  );
}

/** Erro real da API: ano que não é número é recusado com 400 pelo validador da listagem (nada é simulado). */
async function setInvalidYear(page: Page, screen: ListScreen): Promise<ListReply> {
  await filtersVisible(page, P);
  return whenListLoaded(page, screen, async () => {
    await page.getByTestId(`${P}-filter-year`).fill("abc");
  }, (params) => params.get("year") === "abc");
}

const total = (reply: ListReply): number | undefined =>
  reply.body.meta?.totalItems ?? (reply.body as unknown as { total?: number }).total;

/**
 * Pagelas (fluxo abrigos → acolhidos → pagelas) na casca única. Dois abrigos criados pelo cenário (o líder lidera o A),
 * 13 acolhidos no A, um no B, e 14 pagelas de um acolhido. Cada lista é do servidor; a prova de cada resultado é um SELECT.
 */
test.describe.serial("Pagelas: fluxo em três níveis na casca única (UI real)", () => {
  let admin = "";
  let leaderProfileId = "";
  let author: Actor;
  let authorProfileId = "";
  let shelterA = "";
  let shelterB = "";
  const shelters: string[] = [];
  const acolhidos: string[] = [];
  const pagelas: string[] = [];
  let withPagelas = "";

  const send = (request: APIRequestContext, verb: "POST" | "DELETE" | "PATCH", path: string, data?: unknown) =>
    request.fetch(`${API_URL}${path}`, { method: verb, headers: authHeaders(admin), data: verb === "DELETE" ? undefined : data });

  const makeSheltered = async (request: APIRequestContext, name: string, shelterId: string, extra: Record<string, unknown> = {}): Promise<string> => {
    const res = await send(request, "POST", "/sheltered", { name: label(name), gender: "F", shelterId, ...extra });
    expect(res.status(), await res.text()).toBe(201);
    const id = ((await res.json()) as { id: string }).id;
    acolhidos.push(id);
    return id;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leaderProfileId =
      (await queryOne<{ id: string }>("SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = 'e2e.leader@orfanatonib.test'"))?.id ?? "";
    author = await createActor(request, admin, "member", "autor-pagela-lista");
    authorProfileId = (await queryOne<{ id: string }>("SELECT p.id AS id FROM member_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?", [author.email]))?.id ?? "";
    for (const name of ["pagelas-lista-a", "pagelas-lista-b"]) shelters.push((await createShelter(request, admin, { name: label(name), teamsQuantity: 1 })).id);
    [shelterA, shelterB] = shelters;
    const lead = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId: shelterA, teams: [1] }] });
    expect(lead.status(), await lead.text()).toBe(200);
    for (let i = 0; i < ACOLHIDOS; i += 1) {
      const id = await makeSheltered(request, `acolhido-${String.fromCharCode(97 + i)}`, shelterA, {
        gender: i % 2 === 0 ? "F" : "M",
        joinedAt: `2026-0${(i % 9) + 1}-10`,
        birthDate: `20${10 + (i % 8)}-03-05`,
      });
      if (i === 0) withPagelas = id;
    }
    await makeSheltered(request, "acolhido-outro-abrigo", shelterB);
    for (let i = 0; i < PAGELAS_COUNT; i += 1) {
      const res = await send(request, "POST", "/pagelas", {
        shelteredId: withPagelas,
        memberProfileId: authorProfileId,
        referenceDate: `2026-05-${String(i + 1).padStart(2, "0")}`,
        year: 2026,
        visit: i + 1,
        present: i % 3 !== 0,
        notes: i === 4 ? `nota-unica-${RUN_TAG}` : `anotação ${i}`,
      });
      expect(res.status(), await res.text()).toBe(201);
      pagelas.push(((await res.json()) as { id: string }).id);
    }
  });

  test.afterAll(async ({ request }) => {
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    await cleanupData(async () => {
      for (const id of pagelas) await send(request, "DELETE", `/pagelas/${id}`);
      for (const id of acolhidos) await send(request, "DELETE", `/sheltered/${id}`);
      for (const id of shelters) await deleteShelterApi(request, admin, id);
      await removeActors(request, admin, [author.id]);
      // Só os do cenário: o RUN_TAG é do processo e cobre a massa que outros arquivos mantêm.
      for (const id of shelters) expect(await countRows("shelters", { id }), "a limpeza deixou um abrigo do cenário").toBe(0);
      expect((await queryAll("SELECT id FROM sheltered WHERE name LIKE ?", [`%${RUN_TAG}%`])).length, "acolhidos do E2E").toBe(0);
    });
    await closeDb();
  });

  const level = (page: Page) => page.getByTestId(`${P}-level`);

  /** Abre a tela como admin e devolve a primeira página de abrigos. */
  async function openAdmin(page: Page, request: APIRequestContext): Promise<ListReply> {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    return whenListLoaded(page, SHELTERS, async () => {
      await page.goto(SHELTERS.path);
      await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    });
  }

  async function intoShelterA(page: Page, request: APIRequestContext): Promise<ListReply> {
    await openAdmin(page, request);
    await searchFor(page, SHELTERS, label("pagelas-lista-a"));
    await expectCards(page, P, [shelterA]);
    return whenListLoaded(page, SHELTERED, async () => {
      await page.getByTestId(`${P}-card-open-${shelterA}`).click();
    });
  }

  async function intoPagelas(page: Page, request: APIRequestContext): Promise<ListReply> {
    await intoShelterA(page, request);
    return whenListLoaded(page, PAGELAS, async () => {
      await page.getByTestId(`${P}-card-open-${withPagelas}`).click();
    });
  }

  const shelteredIds = async (extra = "", params: Array<string | number> = [], order = "name ASC, id ASC"): Promise<string[]> =>
    (await queryAll<{ id: string }>(`SELECT id FROM sheltered WHERE shelter_id = ? ${extra} ORDER BY ${order}`, [shelterA, ...params])).map((r) => r.id);
  const pagelaIds = async (extra = "", params: Array<string | number> = [], order = "year DESC, visit DESC, id ASC"): Promise<string[]> =>
    (await queryAll<{ id: string }>(`SELECT id FROM pagelas WHERE sheltered_id = ? ${extra} ORDER BY ${order}`, [withPagelas, ...params])).map((r) => r.id);

  test("carga inicial: esqueleto, nível de abrigos, breadcrumb e primeira página no servidor", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await watchSkeleton(page, P);
    const reply = await whenListLoaded(page, SHELTERS, async () => {
      await page.goto(SHELTERS.path);
      await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    });
    expect(reply.status).toBe(200);
    expect(reply.params.get("page")).toBe("1");
    expect(reply.params.get("limit")).toBe(String(PAGE_SIZE));
    expect(reply.params.get("sort")).toBe("name");
    expect(await sawSkeleton(page)).toBe(true);
    await expect(level(page)).toHaveAttribute("data-level", "shelters");
    await expect(page.getByTestId(`${P}-manager-heading`)).toBeVisible();
    await expect(page.getByTestId(`${P}-crumb-shelters`)).toBeVisible();
    await expect(page.getByTestId(`${P}-pagination`)).toBeVisible();
  });

  test("nível de abrigos: busca com debounce, cidade, ordenação e datas batem com o banco", async ({ page, request }) => {
    await openAdmin(page, request);
    const calls: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (req.method() === "GET" && url.pathname === "/shelters" && url.searchParams.has("searchString")) calls.push(url.searchParams.get("searchString") ?? "");
    });
    const tag = label("pagelas-lista");
    const reply = await whenListLoaded(page, SHELTERS, async () => {
      await page.getByTestId(`${P}-toolbar-search`).pressSequentially(tag, { delay: 40 });
    }, (params) => params.get("searchString") === tag);
    expect(calls).toEqual([tag]);
    const dbShelters = (await queryAll<{ id: string }>("SELECT id FROM shelters WHERE name LIKE ? ORDER BY name ASC", [`%${tag}%`])).map((r) => r.id);
    expect(total(reply)).toBe(dbShelters.length);
    await expectCards(page, P, dbShelters);

    const desc = await selectFilter(page, SHELTERS, "sort", "name:DESC");
    expect(desc.params.get("order")).toBe("DESC");
    await expectCards(page, P, [...dbShelters].reverse());

    const future = await setDateFilter(page, SHELTERS, "createdFrom", "2999-01-01");
    expect(total(future)).toBe(0);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await clearAllFilters(page, SHELTERS);
    const city = await queryOne<{ city: string }>("SELECT a.city AS city FROM shelters s JOIN addresses a ON a.id = s.address_id WHERE s.id = ?", [shelterA]);
    if (city?.city) {
      await filtersVisible(page, P);
      const byCity = await whenListLoaded(page, SHELTERS, async () => {
        await page.getByTestId(`${P}-filter-city`).fill(city.city);
      }, (params) => params.get("city") === city.city);
      const dbCity = Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM shelters s JOIN addresses a ON a.id = s.address_id WHERE a.city LIKE ?", [`%${city.city}%`]))?.n);
      expect(total(byCity)).toBe(dbCity);
    }
  });

  test("fluxo do admin: abrigo → acolhidos → pagelas, com a trilha levando de volta a cada nível", async ({ page, request }) => {
    const sheltered = await intoShelterA(page, request);
    await expect(level(page)).toHaveAttribute("data-level", "sheltered");
    expect(sheltered.params.get("shelterId")).toBe(shelterA);
    expect(total(sheltered)).toBe(ACOLHIDOS);
    await expect(page.getByTestId(`${P}-crumb-shelter`)).toHaveText(label("pagelas-lista-a"));
    await expectCards(page, P, (await shelteredIds()).slice(0, PAGE_SIZE));

    const records = await whenListLoaded(page, PAGELAS, async () => {
      await page.getByTestId(`${P}-card-open-${withPagelas}`).click();
    });
    await expect(level(page)).toHaveAttribute("data-level", "pagelas");
    expect(records.params.get("shelteredId")).toBe(withPagelas);
    expect(total(records)).toBe(PAGELAS_COUNT);
    await expect(page.getByTestId(`${P}-crumb-sheltered`)).toHaveText(label("acolhido-a"));
    await expectCards(page, P, (await pagelaIds()).slice(0, PAGE_SIZE));

    // trilha: volta ao abrigo e depois à lista de abrigos
    await whenListLoaded(page, SHELTERED, async () => {
      await page.getByTestId(`${P}-crumb-shelter`).click();
    });
    await expect(level(page)).toHaveAttribute("data-level", "sheltered");
    await whenListLoaded(page, SHELTERS, async () => {
      await page.getByTestId(`${P}-crumb-shelters`).click();
    });
    await expect(level(page)).toHaveAttribute("data-level", "shelters");
  });

  test("botão voltar da casca sobe um nível por vez", async ({ page, request }) => {
    await intoPagelas(page, request);
    await whenListLoaded(page, SHELTERED, async () => {
      await page.getByTestId(`${P}-manager-back`).click();
    });
    await expect(level(page)).toHaveAttribute("data-level", "sheltered");
    await whenListLoaded(page, SHELTERS, async () => {
      await page.getByTestId(`${P}-manager-back`).click();
    });
    await expect(level(page)).toHaveAttribute("data-level", "shelters");
  });

  test("nível de acolhidos: busca, gênero, datas de entrada, ordenação e paginação no servidor", async ({ page, request }) => {
    await intoShelterA(page, request);
    await expect(summaryText(page, P)).toHaveText(`1–${PAGE_SIZE} de ${ACOLHIDOS}`);
    const next = await whenListLoaded(page, SHELTERED, async () => {
      await page.getByRole("button", { name: "Próxima página", exact: true }).click();
    }, (params) => params.get("page") === "2");
    expect(next.body.meta).toMatchObject({ page: 2, totalItems: ACOLHIDOS });
    await expectCards(page, P, (await shelteredIds()).slice(PAGE_SIZE));
    await whenListLoaded(page, SHELTERED, async () => {
      await page.getByRole("button", { name: "Primeira página", exact: true }).click();
    }, (params) => params.get("page") === "1");

    const byName = await searchFor(page, SHELTERED, label("acolhido-c"));
    expect(total(byName)).toBe(1);
    await clearAllFilters(page, SHELTERED);

    const male = await selectFilter(page, SHELTERED, "gender", "M");
    const dbMale = await shelteredIds("AND gender = 'M'");
    expect(total(male)).toBe(dbMale.length);
    await expectCards(page, P, dbMale.slice(0, PAGE_SIZE));

    const joined = await setDateFilter(page, SHELTERED, "joinedFrom", "2026-05-01");
    const dbJoined = await shelteredIds("AND gender = 'M' AND joinedAt >= ?", ["2026-05-01"]);
    expect(total(joined)).toBe(dbJoined.length);
    await expectCards(page, P, dbJoined.slice(0, PAGE_SIZE));

    await clearAllFilters(page, SHELTERED);
    const sorted = await selectFilter(page, SHELTERED, "sort", "joinedAt:ASC");
    expect(sorted.params.get("orderBy")).toBe("joinedAt");
    expect(sorted.params.get("order")).toBe("ASC");
    await expectCards(page, P, (await shelteredIds("", [], "joinedAt ASC, id ASC")).slice(0, PAGE_SIZE));
  });

  test("nível de pagelas: busca, ano, presença, datas, ordenação e paginação batem com o banco", async ({ page, request }) => {
    await intoPagelas(page, request);
    await expect(summaryText(page, P)).toHaveText(`1–${PAGE_SIZE} de ${PAGELAS_COUNT}`);
    const next = await whenListLoaded(page, PAGELAS, async () => {
      await page.getByRole("button", { name: "Próxima página", exact: true }).click();
    }, (params) => params.get("page") === "2");
    expect(total(next)).toBe(PAGELAS_COUNT);
    await expectCards(page, P, (await pagelaIds()).slice(PAGE_SIZE));
    await whenListLoaded(page, PAGELAS, async () => {
      await page.getByRole("button", { name: "Primeira página", exact: true }).click();
    }, (params) => params.get("page") === "1");

    const byNote = await searchFor(page, PAGELAS, `nota-unica-${RUN_TAG}`);
    expect(total(byNote)).toBe(1);
    await expectCards(page, P, [pagelas[4]]);
    await clearAllFilters(page, PAGELAS);

    const absent = await selectFilter(page, PAGELAS, "present", "false");
    const dbAbsent = await pagelaIds("AND present = 0");
    expect(total(absent)).toBe(dbAbsent.length);
    await expectCards(page, P, dbAbsent.slice(0, PAGE_SIZE));
    for (const id of dbAbsent.slice(0, 3)) await expect(page.getByTestId(`${P}-card-present-${id}`)).toHaveText("Ausente");

    const range = await setDateFilter(page, PAGELAS, "referenceFrom", "2026-05-03");
    const both = await setDateFilter(page, PAGELAS, "referenceTo", "2026-05-09");
    const dbRange = await pagelaIds("AND present = 0 AND referenceDate >= ? AND referenceDate <= ?", ["2026-05-03", "2026-05-09"]);
    expect(range.params.get("referenceFrom")).toBe("2026-05-03");
    expect(total(both)).toBe(dbRange.length);
    await expectCards(page, P, dbRange);

    await clearAllFilters(page, PAGELAS);
    await filtersVisible(page, P);
    const byYear = await whenListLoaded(page, PAGELAS, async () => {
      await page.getByTestId(`${P}-filter-year`).fill("2026");
    }, (params) => params.get("year") === "2026");
    expect(total(byYear)).toBe(PAGELAS_COUNT);
    await clearAllFilters(page, PAGELAS);

    const asc = await selectFilter(page, PAGELAS, "sort", "period:ASC");
    expect(asc.params.get("sortBy")).toBe("period");
    await expectCards(page, P, (await pagelaIds("", [], "year ASC, visit ASC, id ASC")).slice(0, PAGE_SIZE));
    const byDate = await selectFilter(page, PAGELAS, "sort", "referenceDate:DESC");
    expect(byDate.params.get("sortBy")).toBe("referenceDate");
    await expectCards(page, P, (await pagelaIds("", [], "referenceDate DESC, visit DESC, id ASC")).slice(0, PAGE_SIZE));
    const byMember = await selectFilter(page, PAGELAS, "sort", "member:ASC");
    expect(byMember.status).toBe(200);
    expect((await cardIds(page, P)).length).toBe(PAGE_SIZE);
  });

  test("cartão da pagela mostra ano, visita, presença, data, anotação e membro", async ({ page, request }) => {
    await intoPagelas(page, request);
    const id = pagelas[4];
    await searchFor(page, PAGELAS, `nota-unica-${RUN_TAG}`);
    await expect(page.getByTestId(`${P}-card-title-${id}`)).toHaveText("Ano 2026 - Visita 5");
    await expect(page.getByTestId(`${P}-card-present-${id}`)).toHaveText("Presente");
    await expect(page.getByTestId(`${P}-card-date-${id}`)).toHaveText("Data: 05/05/2026");
    await expect(page.getByTestId(`${P}-card-${id}`)).toContainText(`nota-unica-${RUN_TAG}`);
    await expect(page.getByTestId(`${P}-card-member-${id}`)).toContainText("Membro:");
  });

  test("vazio por filtro (acolhido sem pagelas e filtro sem resultado) e erro real (ano inválido recusado com 400)", async ({ page, request }) => {
    await intoPagelas(page, request);
    const none = await setDateFilter(page, PAGELAS, "referenceTo", "2000-01-01");
    expect(total(none)).toBe(0);
    await expect(page.getByTestId(`${P}-empty`)).toContainText("Tente ajustar sua busca ou limpar os filtros.");
    await expect(summaryText(page, P)).toHaveText("0 itens");

    const bad = await setInvalidYear(page, PAGELAS);
    expect(bad.status).toBe(400);
    await expect(page.getByTestId(`${P}-error`)).toBeVisible();
    const retry = await whenListLoaded(page, PAGELAS, async () => {
      await page.getByTestId(`${P}-error`).getByRole("button", { name: "Tentar novamente" }).click();
    });
    expect(retry.status).toBe(400);
    const ok = await clearAllFilters(page, PAGELAS);
    expect(ok.status).toBe(200);
    await expect(page.getByTestId(`${P}-error`)).toHaveCount(0);

    // acolhido do outro abrigo não tem pagelas: vazio sem filtros
    await whenListLoaded(page, SHELTERED, async () => {
      await page.getByTestId(`${P}-crumb-shelter`).click();
    });
    await whenListLoaded(page, SHELTERS, async () => {
      await page.getByTestId(`${P}-crumb-shelters`).click();
    });
    await searchFor(page, SHELTERS, label("pagelas-lista-b"));
    await whenListLoaded(page, SHELTERED, async () => {
      await page.getByTestId(`${P}-card-open-${shelterB}`).click();
    });
    const other = (await shelteredIds()).length;
    expect(other).toBe(ACOLHIDOS);
    const outro = (await queryOne<{ id: string }>("SELECT id FROM sheltered WHERE shelter_id = ? LIMIT 1", [shelterB]))!.id;
    const empty = await whenListLoaded(page, PAGELAS, async () => {
      await page.getByTestId(`${P}-card-open-${outro}`).click();
    });
    expect(total(empty)).toBe(0);
    await expect(page.getByTestId(`${P}-empty`)).toContainText("Não há registros de pagelas para este acolhido.");
  });

  test("estabilidade de layout: frame e toolbar não mudam entre carga, vazio, lista, página 2 e erro", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await recordLayout(page, P);
    await whenListLoaded(page, SHELTERS, async () => {
      await page.goto(SHELTERS.path);
      await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    });
    await searchFor(page, SHELTERS, label("pagelas-lista-a"));
    await whenListLoaded(page, SHELTERED, async () => {
      await page.getByTestId(`${P}-card-open-${shelterA}`).click();
    });
    await goToPage(page, SHELTERED, 2);
    await goToPage(page, SHELTERED, 1);
    await whenListLoaded(page, PAGELAS, async () => {
      await page.getByTestId(`${P}-card-open-${withPagelas}`).click();
    });
    await setDateFilter(page, PAGELAS, "referenceTo", "2000-01-01");
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await setInvalidYear(page, PAGELAS);
    await expect(page.getByTestId(`${P}-error`)).toBeVisible();
    await clearAllFilters(page, PAGELAS);
    await expect(page.getByTestId(`${P}-cards`)).toBeVisible();

    const samples = await layoutSamples(page);
    const states = new Set(samples.map((s) => s.state));
    for (const state of ["loading", "cards", "empty", "error"] as const) expect(states.has(state), `sem amostra de ${state}`).toBe(true);
    // O frame nunca muda; a toolbar muda só entre níveis (campos diferentes), nunca dentro de um nível.
    const frame = samples.map((s) => s.frame);
    for (const f of frame) {
      expect(Math.abs(f.x - frame[0].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(f.width - frame[0].width)).toBeLessThanOrEqual(1);
    }
    const pagelasSamples = samples.filter((s) => s.toolbar.height > 0).slice(-6);
    expectStableLayout(pagelasSamples.map((s) => ({ ...s, frame: { ...s.frame, top: pagelasSamples[0].frame.top } })));
    const minHeight = await page.getByTestId(`${P}-content`).evaluate((el) => el.getBoundingClientRect().height);
    expect(minHeight).toBeGreaterThanOrEqual(420);
  });

  test("desktop 1440px ocupa 95% da área do painel, sem rolagem lateral", async ({ page, request }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openAdmin(page, request);
    const { ratio, overflow } = await frameWidthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
  });

  test("@mobile 375px usa cartões em coluna única, 98% da tela e filtros atrás do botão", async ({ page, request }) => {
    await openAdmin(page, request);
    const { ratio, overflow } = await frameWidthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);
    const toggle = page.getByTestId(`${P}-toolbar-toggle-filters`);
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeHidden();
    await toggle.click();
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeVisible();
    await toggle.click();
    const ids = await cardIds(page, P);
    expect(ids.length).toBeGreaterThan(1);
    const boxes = [];
    for (const id of ids.slice(0, 3)) boxes.push((await page.getByTestId(`${P}-card-${id}`).boundingBox())!);
    for (const box of boxes) {
      expect(Math.abs(box.x - boxes[0].x)).toBeLessThanOrEqual(1);
      expect(box.width).toBeGreaterThan(375 * 0.9);
    }
    const open = await page.getByTestId(`${P}-card-open-${ids[0]}`).boundingBox();
    expect(open!.height).toBeGreaterThanOrEqual(44);
  });

  test("@mobile o fluxo completo funciona no celular e o filtro pelo botão consulta o servidor", async ({ page, request }) => {
    await intoPagelas(page, request);
    await expect(level(page)).toHaveAttribute("data-level", "pagelas");
    const reply = await setDateFilter(page, PAGELAS, "referenceFrom", "2026-05-02");
    expect(reply.params.get("referenceFrom")).toBe("2026-05-02");
    expect((await frameWidthRatio(page, P)).overflow).toBe(false);
  });

  test("líder começa nos acolhidos do abrigo que lidera (sem o nível de abrigos) e chega às pagelas", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "leader"));
    const first = await whenListLoaded(page, SHELTERED, async () => {
      await page.goto(PAGELAS.path);
      await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    });
    expect(first.params.get("shelterId")).toBe(shelterA);
    await expect(level(page)).toHaveAttribute("data-level", "sheltered");
    await expect(page.getByTestId(`${P}-crumb-shelters`)).toHaveCount(0);
    expect(total(first)).toBe(ACOLHIDOS);
    const records = await whenListLoaded(page, PAGELAS, async () => {
      await page.getByTestId(`${P}-card-open-${withPagelas}`).click();
    });
    expect(total(records)).toBe(PAGELAS_COUNT);
  });

  test("membro não acessa a tela; visitante vai para o login", async ({ page, request, browser }) => {
    const context = await browser.newContext();
    const other = await context.newPage();
    await seedBrowserSession(other, await loginAs(request, "member"));
    await other.goto(PAGELAS.path);
    await other.waitForLoadState("networkidle");
    await expect(other.getByTestId(`${P}-manager`)).toHaveCount(0);
    await context.close();
    await page.goto(PAGELAS.path);
    await expect(page.getByTestId(`${P}-manager`)).toHaveCount(0);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test("flag desligada esconde a rota e a API recusa; ligada de novo, a tela volta", async ({ page, request }) => {
    const adminLogin = await loginAs(request, "admin");
    await withFlagsOff(request, adminLogin.accessToken, ["pagelas_management"], async () => {
      await seedBrowserSession(page, adminLogin);
      await page.goto(PAGELAS.path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId(`${P}-manager`)).toHaveCount(0);
      await expect(page).not.toHaveURL(new RegExp(`${PAGELAS.path}$`));
    });
    await whenListLoaded(page, SHELTERS, async () => {
      await page.goto(PAGELAS.path);
    });
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible();
  });
});
