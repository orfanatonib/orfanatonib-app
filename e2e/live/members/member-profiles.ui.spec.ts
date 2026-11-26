import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
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
import { ensureMassShelter, MASS_PREFIX, MASS_SHELTER_NAMES } from "../sheltered/sheltered-mass";

/**
 * /adm/membros na casca única: tabela no desktop, cartões no mobile, tudo filtrado/ordenado/paginado no
 * servidor. Pilha real (API + MySQL); massa própria criada pela API e apagada no fim.
 *
 * Massa (14 membros, `RUN_TAG` no e-mail): 0–5 no abrigo A equipe 1, 6–8 no A equipe 2, 9–10 no abrigo B,
 * 11–13 sem abrigo. Os nomes são `E2E mb00`…`E2E mb13`.
 */
const P = "member";
const COUNT = 14;
const MEMBER_FLAGS = ["member_management"] as const;
const FROM = "member_profiles mp JOIN users u ON u.id = mp.user_id LEFT JOIN teams t ON t.id = mp.team_id LEFT JOIN shelters sh ON sh.id = t.shelter_id";
const TAG_WHERE = "u.email LIKE ?";

type Made = { actor: Actor; profileId: string; i: number };

test.describe.serial("Membros — tela /adm/membros (UI real)", () => {
  let admin = "";
  let shelterA = { id: "", name: "" };
  let shelterB = { id: "", name: "" };
  const made: Made[] = [];
  const shelters: string[] = [];
  const extraActors: Actor[] = [];
  const massActors: Actor[] = [];
  let leader: Actor | null = null;
  let leaderProfileId = "";
  let memberActor: Actor | null = null;

  const tagLike = `%${RUN_TAG}-up-mb%`;

  const profileOf = async (email: string): Promise<string> =>
    (await queryOne<{ id: string }>("SELECT p.id AS id FROM member_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?", [email]))?.id ?? "";

  const idsWhere = async (where: string, params: Array<string | number> = []): Promise<string[]> =>
    (await queryAll<{ id: string }>(`SELECT mp.id AS id FROM ${FROM} WHERE ${where}`, params)).map((row) => row.id);

  const orderedIds = async (order: string, limit = 12, offset = 0): Promise<string[]> =>
    (await queryAll<{ id: string }>(`SELECT mp.id AS id FROM ${FROM} WHERE ${TAG_WHERE} ORDER BY ${order}, mp.id LIMIT ${limit} OFFSET ${offset}`, [tagLike])).map((row) => row.id);

  const teamIdOf = async (profileId: string): Promise<string | null> =>
    (await queryOne<{ team_id: string | null }>("SELECT team_id FROM member_profiles WHERE id = ?", [profileId]))?.team_id ?? null;

  const assign = async (request: APIRequestContext, profileId: string, shelterId: string, numberTeam: number): Promise<void> => {
    const res = await request.put(`${API_URL}/member-profiles/${profileId}`, { headers: authHeaders(admin), data: { shelterId, numberTeam } });
    expect(res.status(), await res.text()).toBe(200);
  };

  const open = async (page: Page, request: APIRequestContext, role: "admin" | "leader" | "member" = "admin"): Promise<void> => {
    await seedBrowserSession(page, await loginAs(request, role));
    await page.goto("/adm/membros");
  };

  const openReady = async (page: Page, request: APIRequestContext): Promise<void> => {
    await open(page, request);
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`${P}-loading`)).toHaveCount(0, { timeout: 20_000 });
  };

  const kindOf = (page: Page): "row" | "card" => (page.viewportSize()!.width < 600 ? "card" : "row");
  const ids = (page: Page): Promise<string[]> => visibleIds(page, kindOf(page), P);

  const scope = async (page: Page): Promise<void> => {
    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-up-mb`);
    await expect.poll(() => totalFromSummary(page, P), { timeout: 15_000 }).toBe(COUNT);
  };

  const expectIds = async (page: Page, expected: string[], ordered = false): Promise<void> => {
    await expect
      .poll(async () => (ordered ? (await ids(page)).join("|") : [...(await ids(page))].sort().join("|")), { timeout: 15_000 })
      .toBe(ordered ? expected.join("|") : [...expected].sort().join("|"));
  };

  /** createdAt empata (criados no mesmo instante): confere que a ordem visível é monótona e do mesmo conjunto do banco. */
  const expectMonotonic = async (page: Page, dir: "ASC" | "DESC"): Promise<void> => {
    await expect
      .poll(async () => {
        const shown = await ids(page);
        if (shown.length === 0) return false;
        const rows = await queryAll<{ id: string; at: string }>(`SELECT mp.id AS id, mp.createdAt AS at FROM ${FROM} WHERE mp.id IN (${shown.map(() => "?").join(",")})`, shown);
        const at = new Map(rows.map((row) => [row.id, row.at]));
        const values = shown.map((id) => at.get(id) ?? "");
        const sorted = [...values].sort();
        if (dir === "DESC") sorted.reverse();
        return values.join("|") === sorted.join("|");
      }, { timeout: 15_000 })
      .toBe(true);
    const first = (await queryOne<{ at: string }>(`SELECT mp.createdAt AS at FROM ${FROM} WHERE ${TAG_WHERE} ORDER BY mp.createdAt ${dir} LIMIT 1`, [tagLike]))?.at;
    const shownFirst = (await ids(page))[0];
    expect((await queryOne<{ at: string }>("SELECT createdAt AS at FROM member_profiles WHERE id = ?", [shownFirst]))?.at).toBe(first);
  };

  const profileIds = (): string[] => made.map((item) => item.profileId);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    for (const slot of ["A", "B"] as const) {
      const name = label(`abrigo${slot}`);
      const shelter = await createShelter(request, admin, { name, teamsQuantity: slot === "A" ? 2 : 1 });
      shelters.push(shelter.id);
      if (slot === "A") shelterA = { id: shelter.id, name };
      else shelterB = { id: shelter.id, name };
    }
    for (let i = 0; i < COUNT; i += 1) {
      const actor = await createActor(request, admin, "member", `mb${String(i).padStart(2, "0")}`);
      const profileId = await profileOf(actor.email);
      made.push({ actor, profileId, i });
      if (i < 6) await assign(request, profileId, shelterA.id, 1);
      else if (i < 9) await assign(request, profileId, shelterA.id, 2);
      else if (i < 11) await assign(request, profileId, shelterB.id, 1);
    }
  });

  // Massa acumulada: só apaga com E2E_CLEANUP=1. Fechar a conexão do banco roda sempre.
  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      if (leaderProfileId) await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
      const everyone = [...made.map((item) => item.actor), ...extraActors, ...massActors, ...(leader ? [leader] : []), ...(memberActor ? [memberActor] : [])];
      await removeActors(request, admin, everyone.map((actor) => actor.id));
      for (const id of shelters) await deleteShelterApi(request, admin, id);
      expect(await queryOne("SELECT id FROM users WHERE email LIKE ?", [`%${RUN_TAG}%`]), "sobrou usuário do E2E").toBeNull();
      expect(await sheltersWithTag(RUN_TAG), "sobrou abrigo do E2E").toBe(0);
    });
    await closeDb();
  });

  // ------------------------------------------------------------------ desktop 1440

  test("desktop: carga inicial mostra o esqueleto uma vez e depois a tabela com a mesma página que a API devolve", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("member-table")).toBeVisible({ timeout: 20_000 });
    expect(await skeletonCount(page), "o esqueleto aparece na primeira carga").toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId(`${P}-loading`)).toHaveCount(0);
    await expect(page.getByTestId("member-cards")).toHaveCount(0);
    await expect(page.getByTestId(`${P}-toolbar-toggle-filters`)).toHaveCount(0);
    const api = (await (await request.get(`${API_URL}/member-profiles?page=1&limit=12&sort=updatedAt&order=desc`, { headers: authHeaders(admin) })).json()) as {
      items: Array<{ id: string }>;
      total: number;
    };
    expect(await totalFromSummary(page, P)).toBe(api.total);
    expect(sameSet(await ids(page), api.items.map((item) => item.id))).toBe(true);
    await expect(page.getByTestId(`${P}-toolbar-search`)).toBeVisible();
    for (const key of ["hasShelter", "shelterSearchString"]) await expect(page.getByTestId(`${P}-filter-${key}`)).toBeAttached();
  });

  test("desktop 1440px: a tela ocupa 95% da área útil, sem rolagem lateral", async ({ page, request }) => {
    await openReady(page, request);
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
  });

  test("desktop: busca com debounce manda poucas requisições e acha por e-mail e por nome", async ({ page, request }) => {
    await openReady(page, request);
    const searches: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (req.method() === "GET" && url.pathname === "/member-profiles" && url.searchParams.has("memberSearchString")) searches.push(url.searchParams.get("memberSearchString") ?? "");
    });
    const target = made[7];
    await page.getByTestId(`${P}-toolbar-search`).pressSequentially(target.actor.email, { delay: 25 });
    await expectIds(page, [target.profileId]);
    expect(searches.length, `requisições de busca: ${searches.join(" | ")}`).toBeLessThanOrEqual(3);
    expect(searches.at(-1)).toBe(target.actor.email);

    await page.getByTestId(`${P}-toolbar-search`).fill("E2E mb03");
    await expect.poll(async () => (await ids(page)).includes(made[3].profileId), { timeout: 15_000 }).toBe(true);
    const byName = await idsWhere("LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR u.phone LIKE ?", ["%e2e mb03%", "%e2e mb03%", "%E2E mb03%"]);
    await expect.poll(() => totalFromSummary(page, P)).toBe(byName.length);

    await page.getByTestId(`${P}-toolbar-clear`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
  });

  test("desktop: filtro isolado de vínculo (com abrigo / sem abrigo) bate com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await pickFilter(page, P, "hasShelter", "true");
    await expectIds(page, await idsWhere(`${TAG_WHERE} AND mp.team_id IS NOT NULL`, [tagLike]));
    await expect.poll(() => totalFromSummary(page, P)).toBe(11);
    await pickFilter(page, P, "hasShelter", "false");
    await expectIds(page, await idsWhere(`${TAG_WHERE} AND mp.team_id IS NULL`, [tagLike]));
    await expect.poll(() => totalFromSummary(page, P)).toBe(3);
    await pickFilter(page, P, "hasShelter", "");
    await expect.poll(() => totalFromSummary(page, P)).toBe(COUNT);
  });

  test("desktop: filtro isolado por abrigo bate com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await page.getByTestId(`${P}-filter-shelterSearchString`).fill(shelterA.name);
    await expectIds(page, await idsWhere(`${TAG_WHERE} AND sh.name LIKE ?`, [tagLike, `%${shelterA.name}%`]));
    await expect.poll(() => totalFromSummary(page, P)).toBe(9);
    await page.getByTestId(`${P}-filter-shelterSearchString`).fill(shelterB.name);
    await expectIds(page, await idsWhere(`${TAG_WHERE} AND sh.name LIKE ?`, [tagLike, `%${shelterB.name}%`]));
    await expect.poll(() => totalFromSummary(page, P)).toBe(2);
  });

  test("desktop: filtros combinados (busca + vínculo + abrigo) devolvem exatamente o conjunto do banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await pickFilter(page, P, "hasShelter", "true");
    await page.getByTestId(`${P}-filter-shelterSearchString`).fill(shelterA.name);
    const expected = await idsWhere(`${TAG_WHERE} AND mp.team_id IS NOT NULL AND sh.name LIKE ?`, [tagLike, `%${shelterA.name}%`]);
    expect(expected).toHaveLength(9);
    await expectIds(page, expected);
    await pickFilter(page, P, "hasShelter", "false");
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    await expect(summaryOf(page, P)).toHaveText("0 itens");
  });

  test("desktop: ordenação pelos cabeçalhos (nome, criado em, atualizado em) segue a ordem do banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await expect(page.getByTestId(`${P}-filter-sort`)).toHaveCount(0);
    await page.getByTestId("member-sort-name").click();
    await expectIds(page, await orderedIds("u.name ASC"), true);
    await page.getByTestId("member-sort-name").click();
    await expectIds(page, await orderedIds("u.name DESC"), true);
    await page.getByTestId("member-sort-createdAt").click();
    await expectMonotonic(page, "ASC");
    await page.getByTestId("member-sort-createdAt").click();
    await expectMonotonic(page, "DESC");
  });

  test("desktop: paginação (próxima, anterior, ir para a 2ª, primeira, última) cobre todos os membros sem repetir", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await page.getByTestId("member-sort-name").click();
    const pager = page.getByTestId(`${P}-pagination`);
    await expectIds(page, await orderedIds("u.name ASC", 12, 0), true);
    await expect(summaryOf(page, P)).toHaveText(`1–12 de ${COUNT}`);
    const first = await ids(page);

    await pager.getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await orderedIds("u.name ASC", 12, 12), true);
    await expect(summaryOf(page, P)).toHaveText(`13–14 de ${COUNT}`);
    const second = await ids(page);
    expect(second).toHaveLength(2);
    expect(sameSet([...first, ...second], profileIds())).toBe(true);

    await pager.getByRole("button", { name: "Página anterior" }).click();
    await expectIds(page, first, true);
    await pager.getByRole("button", { name: "Ir para a página 2" }).click();
    await expectIds(page, second, true);
    await pager.getByRole("button", { name: "Primeira página" }).click();
    await expectIds(page, first, true);
    await pager.getByRole("button", { name: "Última página" }).click();
    await expectIds(page, second, true);
  });

  test("desktop: sem resultado mostra o vazio e limpar filtros restaura a lista", async ({ page, request }) => {
    await openReady(page, request);
    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-nao-existe`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`${P}-empty`)).toContainText("limpar os filtros");
    await expect(page.getByTestId("member-table")).toHaveCount(0);
    await expect(summaryOf(page, P)).toHaveText("0 itens");
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-empty`)).toHaveCount(0);
    await expect(page.getByTestId("member-table")).toBeVisible();

    await scope(page);
    await page.getByTestId(`${P}-filter-shelterSearchString`).fill(`${RUN_TAG}-sem-abrigo`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-filter-shelterSearchString`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeDisabled();
  });

  test("desktop: a casca não dança entre carregamento, lista, vazio e página 2 (tolerância 1px) e o esqueleto só vem na 1ª carga", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-toolbar`)).toBeVisible({ timeout: 20_000 });
    const loading = await measureShell(page, P);
    await expect(page.getByTestId("member-table")).toBeVisible({ timeout: 20_000 });
    expectSameShell(await measureShell(page, P), loading, "lista × carga");
    await resetSkeletonCount(page);

    await scope(page);
    await page.getByTestId("member-sort-name").click();
    await expectIds(page, await orderedIds("u.name ASC", 12, 0), true);
    expectSameShell(await measureShell(page, P), loading, "busca");
    await page.getByTestId(`${P}-pagination`).getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await orderedIds("u.name ASC", 12, 12), true);
    expectSameShell(await measureShell(page, P), loading, "página 2");

    await page.getByTestId(`${P}-toolbar-search`).fill(`${RUN_TAG}-nao-existe`);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible({ timeout: 15_000 });
    expectSameShell(await measureShell(page, P), loading, "vazio");
    expect(await skeletonCount(page), "trocar filtro/página não volta ao esqueleto").toBe(0);
    expect((await page.getByTestId(`${P}-content`).boundingBox())!.height).toBeGreaterThanOrEqual(500);
  });

  test("desktop: erro real da API (flag desligada) mostra o alerta e 'Tentar novamente' recupera a lista", async ({ page, request }) => {
    await openReady(page, request);
    const before = new Map<string, boolean>();
    for (const key of MEMBER_FLAGS) before.set(key, await flagEnabled(key));
    try {
      for (const key of MEMBER_FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
      await page.getByTestId(`${P}-toolbar-refresh`).click();
      await expect(page.getByTestId(`${P}-error`)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("member-table")).toHaveCount(0);
    } finally {
      for (const key of MEMBER_FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before.get(key) ?? true } });
    }
    await page.getByTestId(`${P}-error`).getByRole("button", { name: "Tentar novamente" }).click();
    await expect(page.getByTestId(`${P}-error`)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId("member-table")).toBeVisible();
  });

  test("RBAC: membro e visitante não acessam; líder do abrigo A vê só os membros dele, sem o filtro de abrigo", async ({ page, request, browser }) => {
    memberActor = await createActor(request, admin, "member", "rbac-membros");
    await seedBrowserSession(page, { accessToken: memberActor.token, refreshToken: memberActor.refreshToken, userId: memberActor.id });
    await page.goto("/adm/membros");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId(`${P}-manager`)).toHaveCount(0);

    const guest = await browser.newPage();
    await guest.goto("http://localhost:5173/adm/membros");
    await guest.waitForLoadState("networkidle");
    await expect(guest.getByTestId(`${P}-manager`)).toHaveCount(0);
    await guest.close();

    leader = await createActor(request, admin, "leader", "lider-membros");
    leaderProfileId = (await queryOne<{ id: string }>("SELECT p.id AS id FROM leader_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?", [leader.email]))?.id ?? "";
    const link = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId: shelterA.id, teams: [1, 2] }] });
    expect(link.status(), await link.text()).toBe(200);

    const leaderTokens = await (async () => {
      const res = await request.post(`${API_URL}/auth/login`, { data: { email: leader!.email, password: "Aa1!senhaforte" } });
      const body = (await res.json()) as { accessToken: string; refreshToken: string; user: { id: string } };
      return { accessToken: body.accessToken, refreshToken: body.refreshToken, userId: body.user.id };
    })();
    const leaderPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await seedBrowserSession(leaderPage, leaderTokens);
    await leaderPage.goto("http://localhost:5173/adm/membros");
    await expect(leaderPage.getByTestId(`${P}-manager`)).toBeVisible({ timeout: 20_000 });
    const api = (await (await request.get(`${API_URL}/member-profiles?page=1&limit=12`, { headers: authHeaders(leaderTokens.accessToken) })).json()) as {
      items: Array<{ id: string }>;
      total: number;
    };
    await expect.poll(() => totalFromSummary(leaderPage, P), { timeout: 15_000 }).toBe(api.total);
    expect(sameSet(await visibleIds(leaderPage, "row", P), api.items.map((item) => item.id))).toBe(true);
    const inShelterA = made.filter((item) => item.i < 9).map((item) => item.profileId);
    for (const id of await visibleIds(leaderPage, "row", P)) expect(inShelterA, `o líder só enxerga membros do abrigo A (${id})`).toContain(id);
    await expect(leaderPage.getByTestId(`${P}-filter-shelterSearchString`)).toHaveCount(0);
    await expect(leaderPage.getByTestId(`${P}-filter-hasShelter`)).toHaveCount(0);
    await leaderPage.close();
  });

  test("flag member_management desligada: a rota redireciona e a API devolve 403 FEATURE_DISABLED", async ({ page, request }) => {
    const before = new Map<string, boolean>();
    for (const key of MEMBER_FLAGS) before.set(key, await flagEnabled(key));
    try {
      for (const key of MEMBER_FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
      await open(page, request);
      // a rota desligada redireciona (sem showMessage): a tela some e a URL sai de /adm/membros
      await expect(page).not.toHaveURL(/\/adm\/membros/, { timeout: 20_000 });
      await expect(page.getByTestId(`${P}-manager`)).toHaveCount(0);
      const res = await request.get(`${API_URL}/member-profiles?page=1&limit=12`, { headers: authHeaders(admin) });
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    } finally {
      for (const key of MEMBER_FLAGS) await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: before.get(key) ?? true } });
    }
  });

  test("ver detalhes e cancelar o vínculo não alteram nada; vincular pelo diálogo grava a equipe no banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    const loose = made[12];
    await page.getByTestId(`${P}-toolbar-search`).fill(loose.actor.email);
    await expect(page.getByTestId(`member-row-${loose.profileId}`)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId(`view-member-button-${loose.profileId}`).click();
    await expect(page.getByTestId("member-view-dialog")).toBeVisible();
    await expect(page.getByTestId("member-view-dialog")).toContainText("Não vinculado");
    await page.getByTestId("close-member-view-dialog-button").click();
    await expect(page.getByTestId("member-view-dialog")).toHaveCount(0);

    await page.getByTestId(`edit-member-button-${loose.profileId}`).click();
    await expect(page.getByTestId("member-edit-dialog")).toBeVisible();
    await page.getByTestId("cancel-member-edit-button").click();
    await expect(page.getByTestId("member-edit-dialog")).toHaveCount(0);
    expect(await teamIdOf(loose.profileId)).toBeNull();

    await page.getByTestId(`edit-member-button-${loose.profileId}`).click();
    await page.getByTestId("shelter-autocomplete").getByRole("combobox").fill(shelterA.name);
    await page.getByRole("option", { name: shelterA.name }).click();
    await expect(page.getByTestId("shelter-autocomplete").getByRole("combobox")).toHaveValue(shelterA.name);
    await page.getByTestId("number-team-select").selectOption("2");
    await page.getByTestId("save-member-edit-button").click();
    await expect(page.getByTestId("member-edit-dialog")).toHaveCount(0, { timeout: 15_000 });

    const teamId = await teamIdOf(loose.profileId);
    expect(teamId, "o membro foi vinculado no banco").not.toBeNull();
    const team = await queryOne<{ shelter_id: string; numberTeam: number }>("SELECT shelter_id, numberTeam FROM teams WHERE id = ?", [teamId]);
    expect(team?.shelter_id).toBe(shelterA.id);
    expect(Number(team?.numberTeam)).toBe(2);
    await expect(page.getByTestId(`member-row-${loose.profileId}`)).toContainText(shelterA.name, { timeout: 15_000 });
    await expect(page.getByTestId(`member-row-${loose.profileId}`)).toContainText("Equipe 2");
  });

  test("massa: cria 5 a 10 membros novos (usuários pela API) e os vincula a equipes pela UI; ficam no banco", async ({ page, request }) => {
    const shelterIds: string[] = [];
    for (const name of MASS_SHELTER_NAMES) shelterIds.push(await ensureMassShelter(request, admin, name));
    const count = massCount();
    await openReady(page, request);
    for (let k = 0; k < count; k += 1) {
      const actor = await createActor(request, admin, "member", `massa-membro-${String(k + 1).padStart(2, "0")}`);
      massActors.push(actor);
      const profileId = await profileOf(actor.email);
      expect(profileId, `perfil de ${actor.email}`).not.toBe("");
      // Cerca de um terço fica sem abrigo para a massa ter os dois estados.
      if (k % 3 === 2) continue;
      await page.getByTestId(`${P}-toolbar-search`).fill(actor.email);
      await expect(page.getByTestId(`member-row-${profileId}`)).toBeVisible({ timeout: 15_000 });
      await page.getByTestId(`edit-member-button-${profileId}`).click();
      await page.getByTestId("shelter-autocomplete").getByRole("combobox").fill(MASS_SHELTER_NAMES[k % MASS_SHELTER_NAMES.length]);
      await page.getByRole("option", { name: MASS_SHELTER_NAMES[k % MASS_SHELTER_NAMES.length], exact: true }).click();
      await page.getByTestId("number-team-select").selectOption(String((k % 2) + 1));
      await page.getByTestId("save-member-edit-button").click();
      await expect(page.getByTestId("member-edit-dialog")).toHaveCount(0, { timeout: 15_000 });
      const teamId = await teamIdOf(profileId);
      expect(teamId, `${MASS_PREFIX}: ${actor.email} vinculado`).not.toBeNull();
      expect((await queryOne<{ shelter_id: string }>("SELECT shelter_id FROM teams WHERE id = ?", [teamId]))?.shelter_id).toBe(shelterIds[k % shelterIds.length]);
    }
    expect(massActors).toHaveLength(count);
  });

  // ------------------------------------------------------------------ mobile 375

  test("@mobile cartões em vez de tabela, filtros atrás do botão, 98% da tela e sem rolagem lateral", async ({ page, request }) => {
    await openReady(page, request);
    await expect(page.getByTestId("member-cards")).toBeVisible();
    await expect(page.getByTestId("member-table")).toHaveCount(0);
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).not.toBeVisible();
    await page.getByTestId(`${P}-toolbar-toggle-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-clear-filters`)).toBeVisible();
    await expect(page.getByTestId(`${P}-filter-sort`)).toBeAttached();
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);
  });

  test("@mobile busca, filtros e ordenação pelos cartões batem com o banco", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await openFiltersIfMobile(page, P);
    await pickFilter(page, P, "hasShelter", "true");
    await page.getByTestId(`${P}-filter-shelterSearchString`).fill(shelterA.name);
    await expectIds(page, await idsWhere(`${TAG_WHERE} AND mp.team_id IS NOT NULL AND sh.name LIKE ?`, [tagLike, `%${shelterA.name}%`]));
    await expect(page.getByTestId(`${P}-toolbar`).locator(".MuiBadge-badge")).toHaveText("3");
    await pickFilter(page, P, "sort", "name:DESC");
    await expectIds(page, (await queryAll<{ id: string }>(`SELECT mp.id AS id FROM ${FROM} WHERE ${TAG_WHERE} AND mp.team_id IS NOT NULL AND sh.name LIKE ? ORDER BY u.name DESC, mp.id`, [tagLike, `%${shelterA.name}%`])).map((row) => row.id), true);
    await page.getByTestId(`${P}-toolbar-clear-filters`).click();
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
  });

  test("@mobile paginação nos cartões cobre os 14 membros", async ({ page, request }) => {
    await openReady(page, request);
    await scope(page);
    await openFiltersIfMobile(page, P);
    await pickFilter(page, P, "sort", "name:ASC");
    await expectIds(page, await orderedIds("u.name ASC", 12, 0), true);
    await page.getByTestId(`${P}-pagination`).getByRole("button", { name: "Próxima página" }).click();
    await expectIds(page, await orderedIds("u.name ASC", 12, 12), true);
    await expect(summaryOf(page, P)).toHaveText(`13–14 de ${COUNT}`);
  });

  test("@mobile cartão mostra nome, abrigo e equipe, com ações de 44px dentro do cartão e sem sobrepor", async ({ page, request }) => {
    await openReady(page, request);
    const item = made[7];
    await page.getByTestId(`${P}-toolbar-search`).fill(item.actor.email);
    await expect(page.getByTestId(`member-card-${item.profileId}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(`member-card-title-${item.profileId}`)).toHaveText(`E2E mb07`);
    await expect(page.getByTestId(`member-card-shelter-${item.profileId}`)).toContainText(shelterA.name);
    await expect(page.getByTestId(`member-card-team-${item.profileId}`)).toContainText("Equipe 2");
    const card = (await page.getByTestId(`member-card-${item.profileId}`).boundingBox())!;
    const boxes = [];
    for (const action of ["view", "edit"]) {
      const box = await page.getByTestId(`${action}-member-card-button-${item.profileId}`).boundingBox();
      expect(box!.height, `${action} >= 44px`).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(card.x - 1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(card.x + card.width + 1);
      boxes.push(box!);
    }
    expect(boxes[1].y, "Equipe abaixo de Ver").toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height - 1);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("@mobile a casca não dança entre carga, lista, vazio e página 2", async ({ page, request }) => {
    await watchSkeleton(page, P);
    await open(page, request);
    await expect(page.getByTestId(`${P}-toolbar`)).toBeVisible({ timeout: 20_000 });
    const loading = await measureShell(page, P);
    await expect(page.getByTestId("member-cards")).toBeVisible({ timeout: 20_000 });
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

  test("@mobile ver e vincular equipe pelos cartões gravam no banco", async ({ page, request }) => {
    await openReady(page, request);
    const loose = made[13];
    await page.getByTestId(`${P}-toolbar-search`).fill(loose.actor.email);
    await expect(page.getByTestId(`member-card-${loose.profileId}`)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId(`view-member-card-button-${loose.profileId}`).click();
    await expect(page.getByTestId("member-view-dialog")).toBeVisible();
    await page.getByTestId("close-member-view-dialog-button").click();
    await expect(page.getByTestId("member-view-dialog")).toHaveCount(0);

    await page.getByTestId(`edit-member-card-button-${loose.profileId}`).click();
    await page.getByTestId("shelter-autocomplete").getByRole("combobox").fill(shelterB.name);
    await page.getByRole("option", { name: shelterB.name }).click();
    await page.getByTestId("save-member-edit-button").click();
    await expect(page.getByTestId("member-edit-dialog")).toHaveCount(0, { timeout: 15_000 });
    const teamId = await teamIdOf(loose.profileId);
    expect(teamId).not.toBeNull();
    expect((await queryOne<{ shelter_id: string }>("SELECT shelter_id FROM teams WHERE id = ?", [teamId]))?.shelter_id).toBe(shelterB.id);
    await expect(page.getByTestId(`member-card-shelter-${loose.profileId}`)).toContainText(shelterB.name, { timeout: 15_000 });
  });
});
