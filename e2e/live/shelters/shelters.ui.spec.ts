import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { buildFlowCast, disposeFlowCast, type FlowCast } from "../attendance/flow-support";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { cleanupData, massCount } from "../support/keep-data";
import { flagEnabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  hasHorizontalOverflow,
  measureShell,
  type ShellBox,
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
import { createShelter, deleteShelterApi, DIRECTORY_FLAGS, label, sheltersWithTag } from "./support";
import { fillDate } from "../support/date-field";
import { localShift, localAddDays } from "../support/local-day";

/**
 * /adm/abrigos no padrão 1 (`AdminTableListScreen`): tabela com ordenação no cabeçalho no desktop,
 * cartões com seletor de ordenação no mobile. Pilha real (API + MySQL); cada cenário cria os próprios
 * abrigos pela API e apaga tudo no fim. Todo filtro/ordenação/página é conferido contra o banco.
 *
 * Massa (14 abrigos com RUN_TAG): 0–2 numa cidade própria (UF "PA"), 3–13 em "Manaus" (UF "AM").
 */
const P = "shelters";
const COUNT = 14;
/** Etiqueta do bloco: desktop e mobile usam sufixos distintos, então um nunca enxerga a massa do outro. */
let BLOCK = RUN_TAG;
let TAG_LIKE = `%${BLOCK}-abrigo-%`;
const nameOf = (i: number): string => `${BLOCK}-abrigo-${String(i).padStart(2, "0")}`;

test.describe.serial("Abrigos — tela /adm/abrigos (UI real)", () => {
  let admin = "";
  let cityName = "";
  let castLabel = "";
  const made: Array<{ id: string; name: string; i: number }> = [];
  const extras: string[] = [];
  let cast: FlowCast | null = null;

  const open = async (page: Page, request: APIRequestContext, role: "admin" | "leader" | "member" = "admin"): Promise<void> => {
    await seedBrowserSession(page, await loginAs(request, role));
    await page.goto("/adm/abrigos");
  };

  const openReady = async (page: Page, request: APIRequestContext): Promise<void> => {
    await open(page, request);
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`${P}-loading`)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId(`${P}-fetching`)).toHaveCount(0, { timeout: 20_000 });
  };

  const kindOf = (page: Page): "row" | "card" => (page.viewportSize()!.width < 900 ? "card" : "row");
  const ids = (page: Page): Promise<string[]> => visibleIds(page, kindOf(page), P);
  const tableTid = (page: Page): string => (kindOf(page) === "row" ? `${P}-table` : `${P}-cards`);

  const dbIds = async (where: string, params: Array<string | number> = [], order = "s.name ASC, s.id ASC", limit = 12, offset = 0): Promise<string[]> =>
    (
      await queryAll<{ id: string }>(
        `SELECT s.id AS id FROM shelters s LEFT JOIN addresses a ON a.id = s.address_id WHERE ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`,
        params,
      )
    ).map((row) => row.id);

  const dbCount = async (where: string, params: Array<string | number> = []): Promise<number> =>
    Number(
      (await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM shelters s LEFT JOIN addresses a ON a.id = s.address_id WHERE ${where}`, params))?.n ?? 0,
    );

  const expectIds = async (page: Page, expected: string[], ordered = false): Promise<void> => {
    await expect
      .poll(async () => (ordered ? (await ids(page)).join("|") : [...(await ids(page))].sort().join("|")), { timeout: 15_000 })
      .toBe(ordered ? expected.join("|") : [...expected].sort().join("|"));
  };

  const scope = async (page: Page): Promise<void> => {
    await page.getByTestId(`${P}-toolbar-search`).fill(`${BLOCK}-abrigo-`);
    await expect.poll(() => totalFromSummary(page, P), { timeout: 15_000 }).toBe(COUNT);
  };

  const expectMatchesDb = async (page: Page, where: string, params: Array<string | number> = []): Promise<number> => {
    const expected = await dbIds(where, params, "s.name ASC, s.id ASC", 1000);
    await expect.poll(() => totalFromSummary(page, P), { timeout: 15_000 }).toBe(expected.length);
    await expect.poll(async () => (await ids(page)).length, { timeout: 15_000 }).toBe(Math.min(12, expected.length));
    for (const id of await ids(page)) expect(expected, `o abrigo ${id} deveria satisfazer o filtro`).toContain(id);
    return expected.length;
  };

  /** Mede a casca com a janela no topo (o clique na paginação rola a página e `boundingBox` é relativo à janela). */
  const shellAtTop = async (page: Page): Promise<ShellBox> => {
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) if (el.scrollTop > 0) el.scrollTop = 0;
    });
    return measureShell(page, P);
  };

  /**
   * A casca não pode mudar de posição vertical nem de altura da toolbar (1px). Na horizontal compara-se a
   * proporção toolbar/frame: a barra de rolagem do navegador aparece quando a lista passa da altura da janela
   * e estreita a área útil igualmente para todos os elementos.
   */
  const expectStable = (actual: ShellBox, expected: ShellBox, label: string): void => {
    expect(Math.abs(actual.frame.y - expected.frame.y), `${label}: frame.y`).toBeLessThanOrEqual(1);
    expect(Math.abs(actual.toolbar.y - expected.toolbar.y), `${label}: toolbar.y`).toBeLessThanOrEqual(1);
    expect(Math.abs(actual.toolbar.height - expected.toolbar.height), `${label}: toolbar.height`).toBeLessThanOrEqual(1);
    expect(Math.abs(actual.toolbar.width / actual.frame.width - expected.toolbar.width / expected.frame.width), `${label}: toolbar/frame`).toBeLessThan(0.01);
  };

  const field = (page: Page, key: string, value: string) =>
    /(From|To)$/.test(key) ? fillDate(page.getByTestId(`${P}-filter-${key}`), value) : page.getByTestId(`${P}-filter-${key}`).fill(value);
  const totalAll = async (): Promise<number> => Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM shelters"))?.n);
  const today = (): string => localShift(0);
  const shiftDay = (days: number): string => localAddDays(today(), days);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    expect(await flagEnabled("shelter_address"), "a flag shelter_address precisa estar ligada para os filtros de endereço").toBe(true);
    BLOCK = `${RUN_TAG}-${test.info().project.name.endsWith("mobile") ? "m" : "d"}`;
    TAG_LIKE = `%${BLOCK}-abrigo-%`;
    castLabel = `abrigos-ui-${BLOCK.slice(-1)}`;
    cityName = `${BLOCK}-cidade`;
    for (let i = 0; i < COUNT; i += 1) {
      const shelter = await createShelter(request, admin, {
        name: nameOf(i),
        teamsQuantity: 1,
        city: i < 3 ? cityName : "Manaus",
        state: i < 3 ? "PA" : "AM",
      });
      made.push({ id: shelter.id, name: nameOf(i), i });
    }
    cast = await buildFlowCast(request, castLabel);
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const { id } of made) await deleteShelterApi(request, admin, id);
      for (const id of extras) await deleteShelterApi(request, admin, id);
      if (cast) await disposeFlowCast(request, cast);
      expect(await sheltersWithTag(RUN_TAG), "sobrou abrigo do E2E").toBe(0);
    });
    await closeDb();
  });

  // ------------------------------------------------------------------ desktop 1440

  test("desktop: carga inicial mostra o esqueleto uma vez e depois a tabela com a mesma página que a API devolve", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`${P}-table`)).toBeVisible({ timeout: 20_000 });
    expect(await skeletonCount(page), "o esqueleto aparece na primeira carga").toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId(`${P}-loading`)).toHaveCount(0);
    await expect(page.getByTestId(`${P}-cards`)).toHaveCount(0);
    await expect(page.getByTestId(`${P}-toolbar-toggle-filters`)).toHaveCount(0);
    // No desktop a ordenação é pelo cabeçalho: o seletor não existe.
    await expect(page.getByTestId(`${P}-filter-sort`)).toHaveCount(0);

    expect(await totalFromSummary(page, P)).toBe(await totalAll());
    const api = (await (await request.get(`${API_URL}/shelters?page=1&limit=12&sort=updatedAt&order=DESC`, { headers: authHeaders(admin) })).json()) as {
      items: Array<{ id: string }>;
      total: number;
    };
    expect(api.total).toBe(await totalAll());
    await expectIds(page, api.items.map((item) => item.id), true);
    for (const key of ["city", "state", "createdFrom", "createdTo"]) await expect(page.getByTestId(`${P}-filter-${key}`)).toBeAttached();
    for (const key of ["name", "city", "state", "createdAt", "updatedAt"]) await expect(page.getByTestId(`${P}-sort-${key}`)).toBeVisible();
  });

  test("desktop 1440px: a tela ocupa 95% da área útil, sem rolagem lateral", async ({ page, request }) => {
    await openReady(page, request);
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
  });

  test("desktop: busca com debounce manda poucas requisições e acha por nome e por cidade", async ({ page, request }) => {
    await openReady(page, request);
    const searches: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (req.method() === "GET" && url.pathname === "/shelters" && url.searchParams.has("searchString")) searches.push(url.searchParams.get("searchString") ?? "");
    });
    const term = nameOf(7);
    await page.getByTestId(`${P}-toolbar-search`).pressSequentially(term, { delay: 25 });
    await expectIds(page, [made[7].id]);
    expect(searches.length, `requisições de busca: ${searches.join(" | ")}`).toBeLessThanOrEqual(3);
    expect(searches.at(-1)).toBe(term);

    await page.getByTestId(`${P}-toolbar-search`).fill(cityName);
    await expectIds(page, made.slice(0, 3).map((item) => item.id));
    await expect(page.getByTestId(`${P}-toolbar-clear`)).toBeEnabled();
    await page.getByTestId(`${P}-toolbar-clear`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
    await expect.poll(() => totalFromSummary(page, P)).toBe(await totalAll());
  });

  test("desktop: filtro isolado de cidade bate com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await field(page, "city", cityName);
    expect(await expectMatchesDb(page, "a.city LIKE ?", [`%${cityName}%`])).toBe(3);
    await field(page, "city", "");
    await expect.poll(() => totalFromSummary(page, P)).toBe(await totalAll());
  });

  test("desktop: filtro isolado de UF bate com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await field(page, "state", "PA");
    const n = await expectMatchesDb(page, "a.state LIKE ?", ["%PA%"]);
    expect(n).toBeGreaterThanOrEqual(3);
  });

  test("desktop: filtros de criação (a partir de, até, intervalo, futuro vazio) batem com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await field(page, "createdFrom", today());
    await expect.poll(() => totalFromSummary(page, P)).toBe(await dbCount("s.name LIKE ? AND s.createdAt >= ?", [TAG_LIKE, `${today()} 00:00:00`]));
    await field(page, "createdFrom", "");
    await field(page, "createdTo", today());
    await expect.poll(() => totalFromSummary(page, P)).toBe(COUNT);
    await field(page, "createdFrom", shiftDay(-1));
    await field(page, "createdTo", shiftDay(1));
    await expect.poll(() => totalFromSummary(page, P)).toBe(COUNT);
    await field(page, "createdFrom", shiftDay(1));
    await field(page, "createdTo", "");
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    expect(await dbCount("s.name LIKE ? AND s.createdAt >= ?", [TAG_LIKE, `${shiftDay(1)} 00:00:00`])).toBe(0);
  });

  test("desktop: filtros combinados (busca + cidade + UF + período) devolvem exatamente o conjunto do banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await field(page, "city", cityName);
    await field(page, "state", "PA");
    await field(page, "createdFrom", today());
    const expected = await dbIds("s.name LIKE ? AND a.city LIKE ? AND a.state LIKE ? AND s.createdAt >= ?", [TAG_LIKE, `%${cityName}%`, "%PA%", `${today()} 00:00:00`]);
    expect(expected).toHaveLength(3);
    await expectIds(page, expected);
    await expect.poll(() => totalFromSummary(page, P)).toBe(3);
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeEnabled();

    await field(page, "state", "AM");
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
  });

  test("desktop: ordenação pelos cabeçalhos segue a ordem do banco (nome, cidade, UF, criado, atualizado)", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    const sorts: Array<[string, string, string]> = [
      ["name", "s.name ASC, s.id ASC", "s.name DESC, s.id ASC"],
      ["city", "a.city ASC, s.id ASC", "a.city DESC, s.id ASC"],
      ["state", "a.state ASC, s.id ASC", "a.state DESC, s.id ASC"],
      ["createdAt", "s.createdAt ASC, s.id ASC", "s.createdAt DESC, s.id ASC"],
      ["updatedAt", "s.updatedAt ASC, s.id ASC", "s.updatedAt DESC, s.id ASC"],
    ];
    for (const [key, asc, desc] of sorts) {
      await page.getByTestId(`${P}-sort-${key}`).click();
      await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], asc), true);
      await page.getByTestId(`${P}-sort-${key}`).click();
      await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], desc), true);
    }
  });

  test("desktop: paginação (próxima, anterior, ir para a 2ª, primeira, última) cobre todos os abrigos sem repetir", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await page.getByTestId(`${P}-sort-name`).click();
    const pager = page.getByTestId(`${P}-pagination`);
    await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], "s.name ASC, s.id ASC", 12, 0), true);
    await expect(summaryOf(page, P)).toHaveText(`1–12 de ${COUNT}`);
    const first = await ids(page);

    await pager.getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], "s.name ASC, s.id ASC", 12, 12), true);
    await expect(summaryOf(page, P)).toHaveText(`13–14 de ${COUNT}`);
    const second = await ids(page);
    expect(second).toHaveLength(2);
    expect(sameSet([...first, ...second], made.map((item) => item.id))).toBe(true);

    await pager.getByRole("button", { name: "Página anterior" }).click();
    await expectIds(page, first, true);
    await pager.getByRole("button", { name: "Ir para a página 2" }).click();
    await expectIds(page, second, true);
    await pager.getByRole("button", { name: "Primeira página" }).click();
    await expectIds(page, first, true);
    await pager.getByRole("button", { name: "Última página" }).click();
    await expectIds(page, second, true);
  });

  test("desktop: sem resultado mostra o vazio e limpar os filtros restaura a lista", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-nao-existe`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`${P}-empty`)).toContainText("limpar os filtros");
    await expect(page.getByTestId(`${P}-table`)).toHaveCount(0);
    await expect(summaryOf(page, P)).toHaveText("0 itens");
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-empty`)).toHaveCount(0);
    await expect(page.getByTestId(`${P}-table`)).toBeVisible();
    await expect.poll(() => totalFromSummary(page, P)).toBe(await totalAll());
  });

  test("desktop: limpar filtros zera busca e campos e a ordenação escolhida no cabeçalho é mantida", async ({ page, request }) => {
    await openReady(page, request);
    let lastQuery = new URLSearchParams();
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (req.method() === "GET" && url.pathname === "/shelters" && url.searchParams.has("page")) lastQuery = url.searchParams;
    });
    await page.getByTestId(`${P}-sort-name`).click();
    await scope(page);
    await field(page, "city", "Manaus");
    await expect.poll(() => totalFromSummary(page, P)).toBe(COUNT - 3);
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeEnabled();
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-filter-city`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeDisabled();
    await expect.poll(() => totalFromSummary(page, P)).toBe(await totalAll());
    await expect.poll(() => lastQuery.get("sort") + ":" + lastQuery.get("order"), { timeout: 15_000 }).toBe("name:ASC");
    expect(lastQuery.has("city") || lastQuery.has("searchString"), "a última consulta não leva mais filtro").toBe(false);
    await expect(page.getByTestId(`${P}-sort-name`)).toHaveClass(/Mui-active/);
  });

  test("desktop: a casca não dança entre carga, lista, vazio e página 2 (1px) e o esqueleto só vem na 1ª carga", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-toolbar`)).toBeVisible({ timeout: 20_000 });
    const loading = await measureShell(page, P);
    await expect(page.getByTestId(`${P}-table`)).toBeVisible({ timeout: 20_000 });
    expectStable(await shellAtTop(page), loading, "lista × carga");
    await resetSkeletonCount(page);

    await scope(page);
    await page.getByTestId(`${P}-sort-name`).click();
    await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], "s.name ASC, s.id ASC", 12, 0), true);
    expectStable(await shellAtTop(page), loading, "busca");
    await page.getByTestId(`${P}-pagination`).getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], "s.name ASC, s.id ASC", 12, 12), true);
    expectStable(await shellAtTop(page), loading, "página 2");

    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-nao-existe`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    expectStable(await shellAtTop(page), loading, "vazio");
    expect(await skeletonCount(page), "trocar filtro/página não volta ao esqueleto").toBe(0);
    const contentHeight = (await page.getByTestId(`${P}-content`).boundingBox())!.height;
    expect(contentHeight, "a área de conteúdo mantém altura mínima mesmo vazia").toBeGreaterThanOrEqual(500);
  });

  test("desktop: erro real da API (busca longa demais recusada com 400) mostra o alerta e limpar recupera a lista", async ({ page, request }) => {
    await openReady(page, request);
    const failed = page.waitForResponse((res) => new URL(res.url()).pathname === "/shelters" && res.status() === 400, { timeout: 15_000 });
    await page.getByTestId(`${P}-toolbar-search`).fill("x".repeat(130));
    await failed;
    await expect(page.getByTestId(`${P}-error`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`${P}-table`)).toHaveCount(0);
    await expect(page.getByTestId(`${P}-toolbar`)).toBeVisible();
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-error`)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId(`${P}-table`)).toBeVisible();
  });

  test("desktop: vínculos aparecem na linha (líderes e membros do abrigo) e o detalhe os lista", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(cast!.shelterName);
    const row = page.getByTestId(`${P}-row-${cast!.shelterId}`);
    await expect(row).toBeVisible({ timeout: 15_000 });
    for (const name of ["lider1", "lider2", "membro1", "membro2", "membro3"]) {
      await expect(row.getByText(new RegExp(`E2E ${castLabel}-${name}`))).toBeVisible();
    }
    await page.getByTestId(`view-shelter-button-${cast!.shelterId}`).click();
    const dialog = page.getByTestId("shelter-view-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(cast!.shelterName);
    await expect(dialog).toContainText(`${castLabel}-lider1`);
    await page.getByTestId("close-shelter-view-dialog-button").click();
    await expect(dialog).toHaveCount(0);
  });

  test("desktop: ver detalhes, editar (navega para o formulário) e excluir gravam no banco e atualizam a lista", async ({ page, request }) => {
    const shelter = await createShelter(request, admin, { name: label("acao"), teamsQuantity: 1 });
    extras.push(shelter.id);
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(label("acao"));
    await expect(page.getByTestId(`${P}-row-${shelter.id}`)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId(`view-shelter-button-${shelter.id}`).click();
    await expect(page.getByTestId("shelter-view-dialog")).toBeVisible();
    await page.getByTestId("close-shelter-view-dialog-button").click();
    await expect(page.getByTestId("shelter-view-dialog")).toHaveCount(0);

    await page.getByTestId(`edit-shelter-button-${shelter.id}`).click();
    await page.waitForURL(`**/adm/abrigos/${shelter.id}/edit`, { timeout: 10_000 });
    await expect(page.getByLabel("Nome do Abrigo")).toHaveValue(label("acao"), { timeout: 15_000 });
    await page.goBack();
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId(`${P}-toolbar-search`).fill(label("acao"));
    await page.getByTestId(`delete-shelter-button-${shelter.id}`).click();
    await expect(page.getByTestId("shelters-delete-dialog")).toContainText(label("acao"));
    await page.getByTestId("shelters-delete-dialog-cancel").click();
    expect(await queryOne("SELECT id FROM shelters WHERE id = ?", [shelter.id])).toBeTruthy();
    await page.getByTestId(`delete-shelter-button-${shelter.id}`).click();
    await page.getByTestId("shelters-delete-dialog-confirm").click();
    await expect(page.getByTestId(`${P}-row-${shelter.id}`)).toHaveCount(0, { timeout: 15_000 });
    expect(await queryOne("SELECT id FROM shelters WHERE id = ?", [shelter.id]), "excluído do banco").toBeNull();
  });

  test("desktop: o botão de criar leva ao formulário de novo abrigo", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId("create-shelter-button").click();
    await page.waitForURL("**/adm/abrigos/novo", { timeout: 10_000 });
    await expect(page.getByLabel("Nome do Abrigo")).toBeVisible({ timeout: 15_000 });
  });

  test("massa: cria de 5 a 10 abrigos pelo formulário da tela e eles ficam no banco e na lista", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    const total = massCount();
    const names: string[] = [];
    for (let i = 0; i < total; i += 1) {
      const name = `${BLOCK}-massa-${String(i).padStart(2, "0")}`;
      await page.goto("/adm/abrigos/novo");
      await page.getByLabel("Nome do Abrigo").fill(name);
      await page.getByLabel("Rua").fill(`Rua da Massa ${i}`);
      await page.getByLabel("Bairro").fill("Centro");
      await page.getByLabel("Cidade").fill("Manaus");
      await page.getByLabel("Estado").fill("AM");
      await page.getByRole("button", { name: "Criar" }).first().click();
      await page.waitForURL((url) => !url.pathname.endsWith("/novo"), { timeout: 20_000 });
      const row = await queryOne<{ id: string }>("SELECT id FROM shelters WHERE name = ?", [name]);
      expect(row, `o abrigo ${name} foi gravado pelo formulário`).toBeTruthy();
      extras.push(row!.id);
      names.push(name);
    }
    expect(await sheltersWithTag(`${BLOCK}-massa-`)).toBe(total);
    await page.goto("/adm/abrigos");
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    await page.getByTestId(`${P}-toolbar-search`).fill(`${BLOCK}-massa-`);
    await expect.poll(() => totalFromSummary(page, P), { timeout: 15_000 }).toBe(total);
  });

  test("RBAC: membro e visitante não acessam; líder cai nos detalhes do próprio abrigo, sem a lista", async ({ page, request, browser }) => {
    await open(page, request, "member");
    await expect(page.getByTestId(`${P}-manager`)).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    await page.waitForURL((url) => !url.pathname.includes("/adm/abrigos"), { timeout: 10_000 }).catch(() => {});
    const redirected = new URL(page.url()).pathname !== "/adm/abrigos";
    expect(redirected || (await page.getByTestId("access-denied-message").isVisible()), "membro é redirecionado ou vê acesso negado").toBe(true);

    const guest = await browser.newPage();
    await guest.goto("http://localhost:5173/adm/abrigos");
    await guest.waitForLoadState("networkidle");
    await expect(guest.getByTestId(`${P}-manager`)).toHaveCount(0);
    await guest.close();

    const leaderPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await seedBrowserSession(leaderPage, await loginAs(request, "leader"));
    await leaderPage.goto("http://localhost:5173/adm/abrigos");
    await leaderPage.waitForLoadState("networkidle");
    await expect(leaderPage.getByTestId(`${P}-table`)).toHaveCount(0);
    await expect(leaderPage.getByTestId(`${P}-toolbar`)).toHaveCount(0);
    await leaderPage.close();
  });

  test("flag shelter_management desligada: a rota mostra 'indisponível'", async ({ page, request }) => {
    await withFlagsOff(request, admin, ["shelter_management"], async () => {
      await open(page, request);
      // Flag desligada: a rota mostra "indisponível" ou devolve o usuário à home; a tela nunca monta.
      await expect
        .poll(async () => (await page.getByTestId("feature-flag-route-disabled").count()) > 0 || new URL(page.url()).pathname !== "/adm/abrigos", { timeout: 20_000 })
        .toBe(true);
      await expect(page.getByTestId(`${P}-manager`)).toHaveCount(0);
    });
  });

  test("flags de diretório todas desligadas: a API devolve 403 FEATURE_DISABLED e a lista mostra o erro", async ({ page, request }) => {
    await openReady(page, request);
    await withFlagsOff(request, admin, DIRECTORY_FLAGS, async () => {
      const res = await request.get(`${API_URL}/shelters?page=1&limit=12`, { headers: authHeaders(admin) });
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
      await page.getByTestId(`${P}-toolbar-refresh`).click();
      await expect(page.getByTestId(`${P}-error`)).toBeVisible({ timeout: 15_000 });
    });
    await page.getByTestId(`${P}-error`).getByRole("button", { name: "Tentar novamente" }).click();
    await expect(page.getByTestId(`${P}-error`)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId(`${P}-table`)).toBeVisible();
  });

  // ------------------------------------------------------------------ mobile 375

  test("@mobile cartões em vez de tabela, filtros atrás do botão, 98% da tela e sem rolagem lateral", async ({ page, request }) => {
    await openReady(page, request);
    await expect(page.getByTestId(`${P}-cards`)).toBeVisible();
    await expect(page.getByTestId(`${P}-table`)).toHaveCount(0);
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).not.toBeVisible();
    await page.getByTestId(`${P}-toolbar-toggle-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeVisible();
    for (const key of ["sort", "city", "state", "createdFrom", "createdTo"]) await expect(page.getByTestId(`${P}-filter-${key}`)).toBeAttached();
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);
  });

  test("@mobile busca e filtros pelos cartões batem com o banco e o botão Filtros mostra o contador", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await openFiltersIfMobile(page, P);
    await field(page, "city", cityName);
    await field(page, "state", "PA");
    const expected = await dbIds("s.name LIKE ? AND a.city LIKE ? AND a.state LIKE ?", [TAG_LIKE, `%${cityName}%`, "%PA%"]);
    await expectIds(page, expected);
    await expect(page.getByTestId(`${P}-toolbar-toggle-filters`)).toContainText("Filtros");
    await expect(page.getByTestId(`${P}-toolbar`).locator(".MuiBadge-badge")).toHaveText("3");
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
  });

  test("@mobile ordenação pelo seletor e paginação nos cartões seguem o banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await openFiltersIfMobile(page, P);
    await pickFilter(page, P, "sort", "name:DESC");
    await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], "s.name DESC, s.id ASC", 12, 0), true);
    await pickFilter(page, P, "sort", "city:ASC");
    await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], "a.city ASC, s.id ASC", 12, 0), true);
    await pickFilter(page, P, "sort", "name:ASC");
    await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], "s.name ASC, s.id ASC", 12, 0), true);
    await page.getByTestId(`${P}-pagination`).getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await dbIds("s.name LIKE ?", [TAG_LIKE], "s.name ASC, s.id ASC", 12, 12), true);
    await expect(summaryOf(page, P)).toHaveText(`13–14 de ${COUNT}`);
  });

  test("@mobile cartão mostra só dados do abrigo, com ações de 44px alinhadas e sem sobrepor", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(cast!.shelterName);
    const id = cast!.shelterId;
    await expect(page.getByTestId(`${P}-card-${id}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`${P}-card-title-${id}`)).toHaveText(cast!.shelterName);
    await expect(page.getByTestId(`${P}-card-${id}`)).toContainText("Manaus / AM");
    await expect(page.getByTestId(`${P}-card-${id}`)).toContainText("Líderes (2)");
    await expect(page.getByTestId(`${P}-card-${id}`)).toContainText("Membros (3)");
    const boxes = [];
    for (const action of ["view", "edit"]) {
      const box = await page.getByTestId(`${P}-card-${action}-${id}`).boundingBox();
      expect(box!.height, `${action} >= 44px`).toBeGreaterThanOrEqual(44);
      boxes.push(box!);
    }
    const del = await page.getByTestId(`${P}-card-delete-${id}`).boundingBox();
    expect(del!.height).toBeGreaterThanOrEqual(44);
    const card = (await page.getByTestId(`${P}-card-${id}`).boundingBox())!;
    for (const box of [...boxes, del!]) {
      expect(box.x).toBeGreaterThanOrEqual(card.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width + 1);
    }
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("@mobile a casca não dança entre carga, lista, vazio e página 2", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-toolbar`)).toBeVisible({ timeout: 20_000 });
    const loading = await measureShell(page, P);
    await expect(page.getByTestId(`${P}-cards`)).toBeVisible({ timeout: 20_000 });
    expectStable(await shellAtTop(page), loading, "lista × carga");
    await resetSkeletonCount(page);
    await scope(page);
    await page.getByTestId(`${P}-pagination`).getByRole("button", { name: "Próxima página" }).click();
    await expect(summaryOf(page, P)).toHaveText(`13–14 de ${COUNT}`);
    expectStable(await shellAtTop(page), loading, "página 2");
    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-nao-existe`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    expectStable(await shellAtTop(page), loading, "vazio");
    expect(await skeletonCount(page)).toBe(0);
  });

  test("@mobile ver, editar e excluir pelos cartões", async ({ page, request }) => {
    const shelter = await createShelter(request, admin, { name: label("mob-acao"), teamsQuantity: 1 });
    extras.push(shelter.id);
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(label("mob-acao"));
    await expect(page.getByTestId(`${P}-card-${shelter.id}`)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId(`${P}-card-view-${shelter.id}`).click();
    await expect(page.getByTestId("shelter-view-dialog")).toBeVisible();
    await page.getByTestId("close-shelter-view-dialog-button").click();
    await expect(page.getByTestId("shelter-view-dialog")).toHaveCount(0);

    await page.getByTestId(`${P}-card-edit-${shelter.id}`).click();
    await page.waitForURL(`**/adm/abrigos/${shelter.id}/edit`, { timeout: 10_000 });
    await page.goBack();
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId(`${P}-toolbar-search`).fill(label("mob-acao"));
    await page.getByTestId(`${P}-card-delete-${shelter.id}`).click();
    await page.getByTestId("shelters-delete-dialog-confirm").click();
    await expect(page.getByTestId(`${P}-card-${shelter.id}`)).toHaveCount(0, { timeout: 15_000 });
    expect(await queryOne("SELECT id FROM shelters WHERE id = ?", [shelter.id])).toBeNull();
  });

  test("@mobile o botão de criar leva ao formulário", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId("create-shelter-button").click();
    await page.waitForURL("**/adm/abrigos/novo", { timeout: 10_000 });
  });
});
