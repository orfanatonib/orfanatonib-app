import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { cleanupData, massCount } from "../support/keep-data";
import { withFlagsOff } from "../support/flags";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import {
  expectSameShell,
  hasHorizontalOverflow,
  measureShell as measureShellRaw,
  openFiltersIfMobile,
  pickFilter,
  resetSkeletonCount,
  skeletonCount,
  summaryOf,
  totalFromSummary,
  visibleIds,
  widthRatio,
} from "../support/people-list-ui";
import { createShelter, deleteShelterApi, label } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";
import { fillDate } from "../support/date-field";
import { localShift, localAddDays } from "../support/local-day";

/**
 * `/adm/lideres` pela UI real: casca única, toolbar padrão, tabela no desktop e cartões no mobile,
 * filtros (busca, abrigo, vínculo, equipe, datas), ordenação e paginação no servidor. 14 líderes e
 * 2 abrigos criados pela API; todo número da tela é conferido no banco.
 */
const P = "leader-profiles";
const ROW = P;
let TAG = RUN_TAG;
const TOTAL = 14;
const PAGE_SIZE = 12;
const NOBODY = "zzzz-ninguem-tem-este-nome";

interface Lead {
  actor: Actor;
  profileId: string;
}

const leads: Lead[] = [];
const shelters: { id: string; name: string }[] = [];
let admin = "";

const pad = (n: number): string => String(n).padStart(2, "0");

const FROM = "FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.active = 1 AND u.email LIKE ?";


async function dbCount(extra = "", params: Array<string | number> = []): Promise<number> {
  const row = await queryOne<{ n: number }>(`SELECT COUNT(DISTINCT lp.id) AS n ${FROM} ${extra}`, [`%${TAG}%`, ...params]);
  return Number(row?.n ?? 0);
}

async function dbIds(extra = "", params: Array<string | number> = [], order = "u.name ASC"): Promise<string[]> {
  const rows = await queryAll<{ id: string }>(`SELECT lp.id AS id ${FROM} ${extra} ORDER BY ${order}`, [`%${TAG}%`, ...params]);
  return rows.map((r) => r.id);
}

const inShelter = "AND EXISTS (SELECT 1 FROM leader_teams lt JOIN teams t ON t.id = lt.team_id WHERE lt.leader_id = lp.id AND t.shelter_id = ?)";
const hasLink = "AND EXISTS (SELECT 1 FROM leader_teams lt WHERE lt.leader_id = lp.id)";
const noLink = "AND NOT EXISTS (SELECT 1 FROM leader_teams lt WHERE lt.leader_id = lp.id)";
const inTeamNumber = "AND EXISTS (SELECT 1 FROM leader_teams lt JOIN teams t ON t.id = lt.team_id WHERE lt.leader_id = lp.id AND t.numberTeam = ?)";

const linkedTeams = (profileId: string): Promise<number> => countRows("leader_teams", { leader_id: profileId });

/** Mede a casca com a rolagem no topo (a posição é relativa à janela; clicar na paginação rola a página). */
async function measureShell(page: Page, prefix: string) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.scrollTop > 0) el.scrollTop = 0;
    });
  });
  return measureShellRaw(page, prefix);
}

/** Conta quantas vezes o esqueleto apareceu (amostra a cada quadro; instalar ANTES do `goto`). */
async function watchLoading(page: Page): Promise<void> {
  await page.addInitScript((id) => {
    const w = window as unknown as { __skeletonSeen: number };
    w.__skeletonSeen = 0;
    let present = false;
    const tick = () => {
      const now = Boolean(document.querySelector(`[data-testid="${id}-loading"]`));
      if (now && !present) w.__skeletonSeen += 1;
      present = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, "leader-profiles");
}

const isCall = (url: string, method: string): boolean => {
  const u = new URL(url);
  return method === "GET" && u.pathname === "/leader-profiles" && u.searchParams.has("page");
};

async function whenLoaded(page: Page, action: () => Promise<void>): Promise<void> {
  const waiting = page.waitForResponse((r) => isCall(r.url(), r.request().method()), { timeout: 20_000 });
  await action();
  expect((await waiting).status()).toBe(200);
  await expect(page.getByTestId(`${P}-fetching`)).toHaveCount(0, { timeout: 20_000 });
}

async function open(page: Page, request: APIRequestContext): Promise<void> {
  await seedBrowserSession(page, await loginAs(request, "admin"));
  await page.goto("/adm/lideres");
  await expect(page.getByTestId(`${P}-content`)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(`${P}-loading`)).toHaveCount(0, { timeout: 20_000 });
}

const searchTag = (page: Page, term = TAG) => whenLoaded(page, () => page.getByTestId(`${P}-toolbar-search`).fill(term));
const ids = (page: Page, kind: "row" | "card") => visibleIds(page, kind, ROW);

async function link(request: APIRequestContext, profileId: string, body: unknown): Promise<void> {
  const res = await request.put(`${API_URL}/leader-profiles/${profileId}`, { headers: authHeaders(admin), data: body });
  expect(res.status(), await res.text()).toBe(200);
}

test.describe.serial("Líderes — tela real", () => {
  test.beforeAll(async ({ request }, testInfo) => {
    TAG = `${RUN_TAG}-${testInfo.project.name === "live-ui-mobile" ? "m" : "d"}${Math.random().toString(36).slice(2, 5)}`; // um conjunto por execução do bloco
    admin = (await loginAs(request, "admin")).accessToken;
    for (const name of ["abrigo-a", "abrigo-b"]) {
      const s = await createShelter(request, admin, { name: label(name), teamsQuantity: 2 });
      shelters.push({ id: s.id, name: s.name });
    }
    for (let i = 0; i < TOTAL; i += 1) {
      const actor = await createActor(request, admin, "leader", `${TAG}-l${pad(i)}`);
      const row = await queryOne<{ id: string }>("SELECT lp.id AS id FROM leader_profiles lp WHERE lp.user_id = ?", [actor.id]);
      expect(row?.id, "perfil de líder criado com o usuário").toBeTruthy();
      leads.push({ actor, profileId: String(row?.id) });
    }
    // 0-4 no abrigo A (equipe 1); 3-6 no abrigo B (equipe 2): 3 e 4 nos dois; 7-13 sem vínculo
    for (let i = 0; i < 7; i += 1) {
      const body: Array<{ shelterId: string; teams: number[] }> = [];
      if (i < 5) body.push({ shelterId: shelters[0].id, teams: [1] });
      if (i >= 3) body.push({ shelterId: shelters[1].id, teams: [2] });
      await link(request, leads[i].profileId, body);
    }
    expect(await dbCount()).toBe(TOTAL);
    expect(await dbCount(hasLink)).toBe(7);
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const s of shelters) await deleteShelterApi(request, admin, s.id);
      await removeActors(request, admin, leads.map((l) => l.actor.id));
      expect(await dbCount()).toBe(0);
    });
    await closeDb();
  });

  test("carga inicial: esqueleto só na 1ª carga, depois tabela; filtrar e paginar não voltam ao esqueleto", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await watchLoading(page);
    await page.goto("/adm/lideres");
    await expect(page.getByTestId("leader-profiles-table")).toBeVisible({ timeout: 20_000 });
    expect(await skeletonCount(page)).toBeGreaterThan(0);
    await expect(page.getByTestId("leader-profiles-cards")).toHaveCount(0);
    await expect(page.getByTestId(`${P}-manager-heading`)).toBeVisible();
    await resetSkeletonCount(page);
    await searchTag(page);
    await whenLoaded(page, () => page.getByTestId(`${P}-pagination-pages`).getByRole("button", { name: "Próxima página" }).click());
    await whenLoaded(page, () => pickFilter(page, P, "hasShelter", "true"));
    expect(await skeletonCount(page)).toBe(0);
  });

  test("busca com debounce: o total bate com o banco e não há uma requisição por letra", async ({ page, request }) => {
    await open(page, request);
    const calls: string[] = [];
    page.on("request", (r) => {
      if (isCall(r.url(), r.method())) calls.push(new URL(r.url()).searchParams.get("leaderSearchString") ?? "");
    });
    await page.getByTestId(`${P}-toolbar-search`).pressSequentially(TAG, { delay: 40 });
    await expect(summaryOf(page, P)).toContainText(new RegExp(`de ${TOTAL}(\\D|$)`), { timeout: 20_000 });
    expect(calls.filter((q) => q).length, calls.join("|")).toBeLessThanOrEqual(3);
    expect(calls.at(-1)).toBe(TAG);
    expect(await totalFromSummary(page, P)).toBe(await dbCount());
  });

  test("filtros isolados e combinados batem com o banco (abrigo, vínculo, equipe, datas)", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page);
    const clear = async () => {
      await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-clear-filters`).click());
      await searchTag(page);
    };

    await whenLoaded(page, () => pickFilter(page, P, "shelterId", shelters[0].id));
    expect(await totalFromSummary(page, P)).toBe(await dbCount(inShelter, [shelters[0].id]));
    expect((await ids(page, "row")).sort()).toEqual((await dbIds(inShelter, [shelters[0].id])).sort());
    await clear();

    await whenLoaded(page, () => pickFilter(page, P, "hasShelter", "true"));
    expect(await totalFromSummary(page, P)).toBe(await dbCount(hasLink));
    await clear();
    await whenLoaded(page, () => pickFilter(page, P, "hasShelter", "false"));
    expect(await totalFromSummary(page, P)).toBe(await dbCount(noLink));
    await clear();

    await whenLoaded(page, () => pickFilter(page, P, "teamName", "2"));
    expect(await totalFromSummary(page, P)).toBe(await dbCount(inTeamNumber, [2]));
    expect((await ids(page, "row")).sort()).toEqual((await dbIds(inTeamNumber, [2])).sort());

    // combinado: equipe 2 + abrigo A -> só os líderes 3 e 4 (nos dois abrigos)
    await whenLoaded(page, () => pickFilter(page, P, "shelterId", shelters[0].id));
    const both = await dbIds(`${inTeamNumber} ${inShelter}`, [2, shelters[0].id]);
    expect(both.length).toBe(2);
    expect((await ids(page, "row")).sort()).toEqual([...both].sort());
    await whenLoaded(page, () => pickFilter(page, P, "hasShelter", "false"));
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await clear();

    const today = localShift(0);
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdFrom`), today));
    expect(await totalFromSummary(page, P)).toBe(await dbCount("AND lp.createdAt >= ?", [`${today} 00:00:00`]));
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdFrom`), localAddDays(today, 2)));
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdFrom`), ""));
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdTo`), localAddDays(today, -2)));
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await whenLoaded(page, () => fillDate(page.getByTestId(`${P}-filter-createdTo`), localAddDays(today, 1)));
    expect(await totalFromSummary(page, P)).toBe(TOTAL);
  });

  test("ordenação pelo cabeçalho: a ordem é a do banco", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page);
    await whenLoaded(page, () => page.getByTestId("leader-profiles-sort-name").click());
    expect(await ids(page, "row")).toEqual((await dbIds("", [], "u.name ASC")).slice(0, PAGE_SIZE));
    await whenLoaded(page, () => page.getByTestId("leader-profiles-sort-name").click());
    expect(await ids(page, "row")).toEqual((await dbIds("", [], "u.name DESC")).slice(0, PAGE_SIZE));
    await whenLoaded(page, () => page.getByTestId("leader-profiles-sort-name").click());
    expect(await ids(page, "row")).toEqual((await dbIds("", [], "u.name ASC")).slice(0, PAGE_SIZE));
    await whenLoaded(page, () => page.getByTestId("leader-profiles-sort-createdAt").click());
    await expect(page.getByTestId("leader-profiles-sort-createdAt")).toHaveClass(/Mui-active/);
  });

  test("paginação: próxima, anterior e ir para a página 2, com resumo e linhas do banco", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page);
    await whenLoaded(page, () => page.getByTestId("leader-profiles-sort-name").click());
    const all = await dbIds("", [], "u.name ASC");
    await expect(summaryOf(page, P)).toHaveText(`1–${PAGE_SIZE} de ${TOTAL}`);
    const first = await ids(page, "row");
    expect(first).toEqual(all.slice(0, PAGE_SIZE));
    const pages = page.getByTestId(`${P}-pagination-pages`);
    await whenLoaded(page, () => pages.getByRole("button", { name: "Próxima página" }).click());
    await expect(summaryOf(page, P)).toHaveText(`${PAGE_SIZE + 1}–${TOTAL} de ${TOTAL}`);
    expect(await ids(page, "row")).toEqual(all.slice(PAGE_SIZE));
    await whenLoaded(page, () => pages.getByRole("button", { name: "Página anterior" }).click());
    expect(await ids(page, "row")).toEqual(first);
    await whenLoaded(page, () => pages.getByRole("button", { name: "Ir para a página 2" }).click());
    expect((await ids(page, "row")).length).toBe(TOTAL - PAGE_SIZE);
  });

  test("vazio por busca e por filtro; limpar volta à lista", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page, NOBODY);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await expect(summaryOf(page, P)).toHaveText("0 itens");
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-clear`).click());
    await expect(page.getByTestId(`${P}-empty`)).toHaveCount(0);
    await searchTag(page);
    await whenLoaded(page, () => pickFilter(page, P, "hasShelter", "false"));
    await whenLoaded(page, () => pickFilter(page, P, "shelterId", shelters[1].id));
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-clear-filters`).click());
    await expect(page.getByTestId(`${P}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${P}-empty`)).toHaveCount(0);
  });

  test("estabilidade: frame e toolbar não mudam de lugar entre carga, vazio, lista e página 2", async ({ page, request }) => {
    await open(page, request);
    const base = await measureShell(page, P);
    await searchTag(page);
    expectSameShell(await measureShell(page, P), base, "lista filtrada");
    await whenLoaded(page, () => page.getByTestId(`${P}-pagination-pages`).getByRole("button", { name: "Próxima página" }).click());
    expectSameShell(await measureShell(page, P), base, "página 2");
    await searchTag(page, NOBODY);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    expectSameShell(await measureShell(page, P), base, "vazio");
    await searchTag(page);
    expectSameShell(await measureShell(page, P), base, "lista de novo");
  });

  test("largura: o frame ocupa 95% da área útil no desktop, sem rolagem lateral", async ({ page, request }) => {
    await open(page, request);
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
  });

  test("linha: abrigos e equipes batem com o banco; ver, WhatsApp e gerenciar associações", async ({ page, request }) => {
    await open(page, request);
    await searchTag(page);
    const both = leads[3];
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-search`).fill(both.actor.email));
    await expect(page.getByTestId(`leader-profiles-row-${both.profileId}`)).toBeVisible();
    await expect(page.getByTestId(`leader-profiles-row-shelters-${both.profileId}`)).toContainText(shelters[0].name);
    await expect(page.getByTestId(`leader-profiles-row-shelters-${both.profileId}`)).toContainText(shelters[1].name);
    await expect(page.getByTestId(`leader-profiles-row-teams-${both.profileId}`)).toHaveText(`${await linkedTeams(both.profileId)} equipes`);

    expect(await page.getByTestId(`leader-profiles-row-wa-${both.profileId}`).getAttribute("href")).toContain("wa.me");
    await page.getByTestId(`leader-profiles-row-view-${both.profileId}`).click();
    await expect(page.getByTestId("leader-view-dialog")).toContainText(both.actor.email);
    await page.getByTestId("leader-view-close-button").click();
    await expect(page.getByTestId("leader-view-dialog")).toHaveCount(0);

    // remover uma das duas associações pela tela (o botão só existe com mais de uma)
    await page.getByTestId(`leader-profiles-row-edit-${both.profileId}`).click();
    await expect(page.getByTestId("leader-multi-edit-dialog")).toBeVisible();
    await expect(page.getByTestId("leader-association-card")).toHaveCount(2);
    await page.getByTestId("remove-association-button").first().click();
    await expect(page.getByTestId("leader-association-card")).toHaveCount(1);
    await expect(page.getByTestId("remove-association-button")).toHaveCount(0);
    await page.getByTestId("leader-multi-edit-submit-button").click();
    await expect(page.getByTestId("leader-multi-edit-dialog")).toHaveCount(0, { timeout: 15_000 });
    await expect.poll(() => linkedTeams(both.profileId), { timeout: 15_000 }).toBe(1);
    await expect(page.getByTestId(`leader-profiles-row-shelters-${both.profileId}`)).not.toContainText(shelters[0].name, { timeout: 15_000 });
    await expect(page.getByTestId(`leader-profiles-row-shelters-${both.profileId}`)).toContainText(shelters[1].name);

    // vincular a um abrigo pela tela
    const target = leads[10];
    await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-search`).fill(target.actor.email));
    await page.getByTestId(`leader-profiles-row-edit-${target.profileId}`).click();
    await page.getByTestId("add-association-button").click();
    await page.getByTestId("association-shelter-input").getByRole("combobox").fill(shelters[1].name);
    await page.getByRole("option", { name: shelters[1].name }).click();
    await page.getByTestId("team-chip-1").click();
    await page.getByTestId("leader-multi-edit-submit-button").click();
    await expect(page.getByTestId("leader-multi-edit-dialog")).toHaveCount(0, { timeout: 15_000 });
    await expect.poll(() => linkedTeams(target.profileId), { timeout: 15_000 }).toBe(1);
    expect(await countRows("leader_teams", { leader_id: target.profileId })).toBe(1);
    await expect(page.getByTestId(`leader-profiles-row-shelters-${target.profileId}`)).toContainText(shelters[1].name, { timeout: 15_000 });
    // cancelar não grava
    await page.getByTestId(`leader-profiles-row-edit-${target.profileId}`).click();
    await page.getByTestId("add-association-button").click();
    await expect(page.getByTestId("leader-association-card")).toHaveCount(2);
    await page.getByTestId("leader-multi-edit-cancel-button").click();
    expect(await linkedTeams(target.profileId)).toBe(1);
  });

  test("erro real: com a flag leader_management desligada a atualização falha e volta ao religar", async ({ page, request }) => {
    await open(page, request);
    await withFlagsOff(request, admin, ["leader_management"], async () => {
      await page.getByTestId(`${P}-toolbar-refresh`).click();
      await expect(page.getByTestId(`${P}-error`)).toBeVisible({ timeout: 20_000 });
    });
    await page.getByTestId(`${P}-toolbar-refresh`).click();
    await expect(page.getByTestId(`${P}-error`)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId("leader-profiles-table")).toBeVisible();
  });

  test("flag desligada: a rota não carrega a gestão", async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await withFlagsOff(request, admin, ["leader_management"], async () => {
      await page.goto("/adm/lideres");
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("leader-profiles-manager")).toHaveCount(0);
    });
  });

  test("RBAC: membro não acessa /adm/lideres nem a API; líder não vê a tela de gestão", async ({ page, request }) => {
    const member = await loginAs(request, "member");
    expect((await request.get(`${API_URL}/leader-profiles?page=1&limit=1`, { headers: authHeaders(member.accessToken) })).status()).toBe(403);
    for (const role of ["member", "leader"] as const) {
      await seedBrowserSession(page, await loginAs(request, role));
      await page.goto("/adm/lideres");
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("leader-profiles-manager"), role).toHaveCount(0);
    }
  });

  test("@mobile 375px: cartões (sem tabela), 98%, filtros atrás do botão, ações de 44px e vínculo pela tela", async ({ page, request, context }) => {
    await open(page, request);
    await searchTag(page);
    await expect(page.getByTestId("leader-profiles-cards")).toBeVisible();
    await expect(page.getByTestId("leader-profiles-table")).toHaveCount(0);
    const { ratio, overflow } = await widthRatio(page, P);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await expect(page.getByTestId(`${P}-toolbar-toggle-filters`)).toBeVisible();
    await expect(page.getByTestId(`${P}-filter-hasShelter`)).toBeHidden();
    await openFiltersIfMobile(page, P);
    await whenLoaded(page, () => pickFilter(page, P, "sort", "name:ASC"));
    const all = await dbIds("", [], "u.name ASC");
    expect(await ids(page, "card")).toEqual(all.slice(0, PAGE_SIZE));
    await whenLoaded(page, () => pickFilter(page, P, "hasShelter", "true"));
    expect(await totalFromSummary(page, P)).toBe(await dbCount(hasLink));

    const first = (await ids(page, "card"))[0];
    for (const key of ["view", "edit", "whatsapp", "copy-email"]) {
      const box = await page.getByTestId(`leader-profiles-card-${key}-${first}`).boundingBox();
      expect(box?.height ?? 0, key).toBeGreaterThanOrEqual(43.5);
      expect(box?.width ?? 0, key).toBeGreaterThanOrEqual(43.5);
    }
    const lead = leads.find((l) => l.profileId === first);
    expect(lead).toBeTruthy();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByTestId(`leader-profiles-card-copy-email-${first}`).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(lead!.actor.email);
    await page.getByTestId(`leader-profiles-card-view-${first}`).click();
    await expect(page.getByTestId("leader-view-dialog")).toBeVisible();
    await page.getByTestId("leader-view-close-button").click();
    await page.getByTestId(`leader-profiles-card-edit-${first}`).click();
    await expect(page.getByTestId("leader-multi-edit-dialog")).toBeVisible();
    await page.getByTestId("leader-multi-edit-cancel-button").click();
    await expect(page.getByTestId("leader-multi-edit-dialog")).toHaveCount(0);
  });

  test("@mobile 375px: paginação, vazio e casca estável", async ({ page, request }) => {
    await open(page, request);
    const base = await measureShell(page, P);
    await searchTag(page);
    await openFiltersIfMobile(page, P);
    await whenLoaded(page, () => pickFilter(page, P, "sort", "name:ASC"));
    const all = await dbIds("", [], "u.name ASC");
    await whenLoaded(page, () => page.getByTestId(`${P}-pagination-pages`).getByRole("button", { name: "Próxima página" }).click());
    expect(await ids(page, "card")).toEqual(all.slice(PAGE_SIZE));
    await searchTag(page, NOBODY);
    await expect(page.getByTestId(`${P}-empty`)).toBeVisible();
    const shell = await measureShell(page, P);
    expect(Math.abs(shell.frame.x - base.frame.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(shell.frame.width - base.frame.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(shell.toolbar.y - base.toolbar.y)).toBeLessThanOrEqual(1);
  });

  // MASSA (regra do E2E): 5 a 10 líderes novos por execução; o vínculo ao abrigo é feito pela UI. Ficam e acumulam.
  test("massa: cria de 5 a 10 líderes e vincula cada um a um abrigo pela tela", async ({ page, request }) => {
    test.setTimeout(300_000);
    const quantity = massCount();
    const shelter = await createShelter(request, admin, { name: label("abrigo-massa"), teamsQuantity: 2 });
    shelters.push({ id: shelter.id, name: shelter.name });
    const made: Lead[] = [];
    for (let i = 0; i < quantity; i += 1) {
      const actor = await createActor(request, admin, "leader", `${TAG}-massa${pad(i)}`);
      const row = await queryOne<{ id: string }>("SELECT lp.id AS id FROM leader_profiles lp WHERE lp.user_id = ?", [actor.id]);
      expect(row?.id).toBeTruthy();
      const lead = { actor, profileId: String(row?.id) };
      leads.push(lead);
      made.push(lead);
    }
    await open(page, request);
    for (const [i, lead] of made.entries()) {
      await whenLoaded(page, () => page.getByTestId(`${P}-toolbar-search`).fill(lead.actor.email));
      await page.getByTestId(`leader-profiles-row-edit-${lead.profileId}`).click();
      await page.getByTestId("add-association-button").click();
      await page.getByTestId("association-shelter-input").getByRole("combobox").fill(shelter.name);
      await page.getByRole("option", { name: shelter.name }).click();
      await page.getByTestId(`team-chip-${(i % 2) + 1}`).click();
      await page.getByTestId("leader-multi-edit-submit-button").click();
      await expect(page.getByTestId("leader-multi-edit-dialog")).toHaveCount(0, { timeout: 15_000 });
      await expect.poll(() => linkedTeams(lead.profileId), { timeout: 15_000 }).toBe(1);
    }
    expect(await dbCount(inShelter, [shelter.id])).toBe(quantity);
  });

});
