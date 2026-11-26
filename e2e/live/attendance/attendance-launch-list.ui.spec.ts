import type { Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import {
  cardIds,
  clearAllFilters,
  DESKTOP_VIEWPORT,
  expectCards,
  goToPage,
  MOBILE_VIEWPORT,
  PAGE_SIZE,
  sawSkeleton,
  searchFor,
  selectFilter,
  summaryText,
  watchSkeleton,
  whenListLoaded,
  type ListReply,
  type ListScreen,
} from "../support/admin-list-ui";
import { withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import type { Actor } from "../users/support";
import { ACCENT_NAME, buildLaunchWorld, disposeLaunchWorld, LAUNCH_MEMBER_SEARCH, LAUNCH_SHELTERS, LAUNCH_TAG, launchShelterIds, type LaunchWorld } from "./list-support";

const SCREEN: ListScreen = { p: "attendance-register", path: "/adm/presenca/lancar", endpoint: "/attendance/leader/teams/members" };
const { p } = SCREEN;
const asSession = (actor: Actor) => ({ accessToken: actor.token, refreshToken: actor.refreshToken, userId: actor.id });

async function openLaunch(page: Page, session: Parameters<typeof seedBrowserSession>[1]): Promise<ListReply> {
  await seedBrowserSession(page, session);
  return whenListLoaded(page, SCREEN, async () => {
    await page.goto(SCREEN.path);
    await expect(page.getByTestId("attendance-page")).toBeVisible({ timeout: 20_000 });
  });
}

/** Largura do conteúdo do fluxo de presença relativa ao `admin-main`. */
async function contentRatio(page: Page): Promise<{ ratio: number; overflow: boolean }> {
  return page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('[data-testid="attendance-content"]');
    const main = document.querySelector<HTMLElement>('[data-testid="admin-main"]');
    if (!content || !main) throw new Error("faltou attendance-content ou admin-main");
    return {
      ratio: content.getBoundingClientRect().width / main.getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

test.describe.serial("Presença · lançar: casca única, filtros no servidor e cartões de abrigo (UI real)", () => {
  let world: LaunchWorld;
  let admin: Awaited<ReturnType<typeof loginAs>>;

  test.beforeAll(async ({ request }) => {
    world = await buildLaunchWorld(request);
    admin = await loginAs(request, "admin");
  });
  test.afterAll(async ({ request }) => {
    await disposeLaunchWorld(request, world);
  });

  const openAdmin = (page: Page) => openLaunch(page, admin);
  const openTagged = async (page: Page) => {
    await openAdmin(page);
    return searchFor(page, SCREEN, LAUNCH_TAG);
  };

  test("carga inicial: esqueleto, depois a primeira página do servidor (12 por página), com toolbar, paginação e a casca do fluxo", async ({ page }) => {
    await seedBrowserSession(page, admin);
    await watchSkeleton(page, p);
    const reply = await whenListLoaded(page, SCREEN, async () => {
      await page.goto(SCREEN.path);
      await expect(page.getByTestId("attendance-page")).toBeVisible({ timeout: 20_000 });
    });
    expect(reply.status).toBe(200);
    expect(reply.params.get("page")).toBe("1");
    expect(reply.params.get("limit")).toBe(String(PAGE_SIZE));
    expect(reply.params.get("sortBy")).toBe("shelterName");
    expect(await sawSkeleton(page)).toBe(true);
    for (const id of ["toolbar", "toolbar-search", "toolbar-refresh", "pagination", "cards", "filter-shelterId", "filter-sort"]) {
      await expect(page.getByTestId(`${p}-${id}`)).toBeVisible();
    }
    await expect(page.getByTestId("attendance-mode-register")).toBeVisible();
    expect((await cardIds(page, p)).length).toBe((reply.body.data ?? []).length);
  });

  test("busca com debounce: uma requisição com o termo final, filtrada no banco (15 abrigos)", async ({ page }) => {
    await openAdmin(page);
    const calls: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (req.method() === "GET" && url.pathname === SCREEN.endpoint && url.searchParams.has("search")) calls.push(url.searchParams.get("search") ?? "");
    });
    const reply = await whenListLoaded(
      page,
      SCREEN,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).pressSequentially(LAUNCH_TAG, { delay: 30 });
      },
      (params) => params.get("search") === LAUNCH_TAG,
    );
    expect(calls).toEqual([LAUNCH_TAG]);
    expect(reply.body.meta?.totalItems).toBe(LAUNCH_SHELTERS);
    await expectCards(page, p, (await launchShelterIds()).slice(0, PAGE_SIZE));
    await expect(page.getByTestId(`${p}-toolbar-clear`)).toBeEnabled();
  });

  test("busca por membro e por 'Equipe N' estreita as equipes do cartão; sem acento acha o abrigo acentuado", async ({ page }) => {
    await openAdmin(page);
    await searchFor(page, SCREEN, LAUNCH_MEMBER_SEARCH);
    const member = await selectFilter(page, SCREEN, "shelterId", world.cast.shelterId);
    expect(member.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [world.cast.shelterId]);
    await expect(page.getByTestId(`attendance-team-${world.cast.teamIds.one}`)).toBeVisible();
    await expect(page.getByTestId(`attendance-team-${world.cast.teamIds.two}`)).toHaveCount(0);

    await clearAllFilters(page, SCREEN);
    const accent = await searchFor(page, SCREEN, `${LAUNCH_TAG}-x14 esperanca`);
    expect(accent.body.meta?.totalItems).toBe(1);
    await expect(page.getByText(ACCENT_NAME)).toBeVisible();
  });

  test("filtro de abrigo: isolado e combinado com a busca (cruza com o banco)", async ({ page }) => {
    await openTagged(page);
    const one = await selectFilter(page, SCREEN, "shelterId", world.cast.shelterId);
    expect(one.params.get("shelterId")).toBe(world.cast.shelterId);
    expect(one.body.meta?.totalItems).toBe(1);
    await expectCards(page, p, [world.cast.shelterId]);
    await expect(page.getByTestId(`attendance-team-${world.cast.teamIds.one}`)).toBeVisible();
    await expect(page.getByTestId(`attendance-team-${world.cast.teamIds.two}`)).toBeVisible();

    const other = world.extraShelterIds[0];
    const noMatch = await selectFilter(page, SCREEN, "shelterId", other);
    expect(noMatch.body.meta?.totalItems).toBe(1);
    await searchFor(page, SCREEN, LAUNCH_MEMBER_SEARCH);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();

    const all = await selectFilter(page, SCREEN, "shelterId", "");
    expect(all.params.has("shelterId")).toBe(false);
    expect(all.body.meta?.totalItems).toBeGreaterThanOrEqual(1);
  });

  test("ordenação no servidor: nome A–Z/Z–A e quantidade de equipes batem com o banco", async ({ page }) => {
    await openTagged(page);
    const desc = await selectFilter(page, SCREEN, "sort", "shelterName:DESC");
    expect(desc.params.get("order")).toBe("DESC");
    await expectCards(page, p, (await launchShelterIds("", [], "sh.name DESC, sh.id ASC")).slice(0, PAGE_SIZE));

    const asc = await selectFilter(page, SCREEN, "sort", "shelterName:ASC");
    expect(asc.params.get("order")).toBe("ASC");
    await expectCards(page, p, (await launchShelterIds()).slice(0, PAGE_SIZE));

    const many = await selectFilter(page, SCREEN, "sort", "teamCount:DESC");
    expect(many.params.get("sortBy")).toBe("teamCount");
    expect((await cardIds(page, p))[0]).toBe(world.cast.shelterId);

    await selectFilter(page, SCREEN, "sort", "teamCount:ASC");
    const shown = await cardIds(page, p);
    expect(shown).toHaveLength(PAGE_SIZE);
    expect(shown).not.toContain(world.cast.shelterId);
  });

  test("limpar filtros zera busca e abrigo e mantém a ordenação escolhida", async ({ page }) => {
    await openTagged(page);
    await selectFilter(page, SCREEN, "sort", "shelterName:DESC");
    await selectFilter(page, SCREEN, "shelterId", world.cast.shelterId);
    const cleared = await clearAllFilters(page, SCREEN);
    expect(cleared.params.has("search")).toBe(false);
    expect(cleared.params.has("shelterId")).toBe(false);
    expect(cleared.params.get("order")).toBe("DESC");
    await expect(page.getByTestId(`${p}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeDisabled();

    await searchFor(page, SCREEN, LAUNCH_TAG);
    const cleanSearch = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-toolbar-clear`).click();
    });
    expect(cleanSearch.params.has("search")).toBe(false);
  });

  test("paginação por abrigo: próxima, anterior, ir para a 2ª e primeira (12 + 3)", async ({ page }) => {
    await openTagged(page);
    const expected = await launchShelterIds();
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${LAUNCH_SHELTERS}`);

    const next = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Próxima página" }).click();
    }, (params) => params.get("page") === "2");
    expect(next.body.meta).toMatchObject({ page: 2, totalItems: LAUNCH_SHELTERS, totalPages: 2 });
    await expectCards(page, p, expected.slice(PAGE_SIZE));
    await expect(summaryText(page, p)).toHaveText(`${PAGE_SIZE + 1}–${LAUNCH_SHELTERS} de ${LAUNCH_SHELTERS}`);

    const prev = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Página anterior" }).click();
    }, (params) => params.get("page") === "1");
    expect(prev.body.meta?.page).toBe(1);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));

    const jump = await goToPage(page, SCREEN, 2);
    expect(jump.params.get("page")).toBe("2");
    const first = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Primeira página" }).click();
    }, (params) => params.get("page") === "1");
    expect(first.params.get("page")).toBe("1");
  });

  test("mexer na busca ou no filtro na página 2 volta para a página 1", async ({ page }) => {
    await openTagged(page);
    await goToPage(page, SCREEN, 2);
    const reply = await selectFilter(page, SCREEN, "sort", "shelterName:DESC");
    expect(reply.params.get("page")).toBe("1");
    await goToPage(page, SCREEN, 2);
    const bySearch = await searchFor(page, SCREEN, `${LAUNCH_TAG}-x`);
    expect(bySearch.params.get("page")).toBe("1");
  });

  test("vazio por filtro: mensagem de ajuste, contador zerado e sem cartões", async ({ page }) => {
    await openAdmin(page);
    const reply = await searchFor(page, SCREEN, "zzz-nao-existe-zzz");
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toContainText("Tente ajustar sua busca ou limpar os filtros.");
    await expect(summaryText(page, p)).toHaveText("0 itens");
    await expect(page.getByTestId(`${p}-cards`)).toHaveCount(0);
  });

  test("erro real da API (busca longa demais, 400) mostra o alerta e se recupera ao limpar", async ({ page }) => {
    await openAdmin(page);
    const reply = await searchFor(page, SCREEN, "a".repeat(130));
    expect(reply.status).toBe(400);
    await expect(page.getByTestId(`${p}-error`)).toBeVisible();
    await expect(page.getByTestId(`${p}-cards`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-toolbar`)).toBeVisible();
    const retry = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-error`).getByRole("button", { name: "Tentar novamente" }).click();
    });
    expect(retry.status).toBe(400);
    const recovered = await whenListLoaded(page, SCREEN, async () => {
      await page.getByTestId(`${p}-toolbar-clear`).click();
    });
    expect(recovered.status).toBe(200);
    await expect(page.getByTestId(`${p}-error`)).toHaveCount(0);
  });

  test("ações do cartão: abrir e fechar o abrigo e entrar na equipe para lançar a presença", async ({ page }) => {
    await openAdmin(page);
    await searchFor(page, SCREEN, LAUNCH_MEMBER_SEARCH);
    await selectFilter(page, SCREEN, "shelterId", world.cast.shelterId);
    const card = page.getByTestId(`${p}-card-${world.cast.shelterId}`);
    await expect(card).toBeVisible();
    const toggle = page.getByTestId(`attendance-shelter-toggle-${world.cast.shelterId}`);
    const team = page.getByTestId(`attendance-team-${world.cast.teamIds.one}`);
    await expect(team).toBeVisible();
    await toggle.click();
    await expect(team).toBeHidden();
    await toggle.click();
    await expect(team).toBeVisible();
    await team.click();
    await expect(page).toHaveURL(new RegExp(`/adm/presenca/equipes/${world.cast.teamIds.one}`));
    await expect(page.getByTestId("team-attendance-page")).toBeVisible({ timeout: 20_000 });
  });

  test("estabilidade de layout: o conteúdo e a toolbar não mudam entre carga, lista, página 2, vazio e erro", async ({ page }) => {
    await page.addInitScript((prefix) => {
      const w = window as unknown as { __samples: Array<Record<string, unknown>> };
      w.__samples = [];
      const q = (id: string) => document.querySelector(`[data-testid="${id}"]`);
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
      };
      const sample = () => {
        const frame = q("attendance-content");
        const toolbar = q(`${prefix}-toolbar`);
        if (!frame || !toolbar) return;
        const state = q(`${prefix}-loading`) ? "loading" : q(`${prefix}-error`) ? "error" : q(`${prefix}-empty`) ? "empty" : q(`${prefix}-cards`) ? "cards" : "other";
        w.__samples.push({ frame: box(frame), toolbar: box(toolbar), state });
      };
      new MutationObserver(sample).observe(document, { childList: true, subtree: true });
    }, p);
    await openLaunch(page, admin);
    await searchFor(page, SCREEN, LAUNCH_TAG);
    await goToPage(page, SCREEN, 2);
    await goToPage(page, SCREEN, 1);
    await searchFor(page, SCREEN, "zzz-nao-existe-zzz");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await searchFor(page, SCREEN, "a".repeat(130));
    await expect(page.getByTestId(`${p}-error`)).toBeVisible();
    await page.getByTestId(`${p}-toolbar-clear`).click();
    await expect(page.getByTestId(`${p}-cards`)).toBeVisible();

    const samples = await page.evaluate(() => (window as unknown as { __samples: Array<{ frame: Record<string, number>; toolbar: Record<string, number>; state: string }> }).__samples);
    const states = new Set(samples.map((sample) => sample.state));
    for (const state of ["loading", "cards", "empty", "error"]) expect(states.has(state), `sem amostra de ${state}`).toBe(true);
    // A casca do painel ainda termina de montar na primeira carga: a base é a 1ª lista já estável.
    const firstCards = samples.findIndex((sample) => sample.state === "cards");
    const base = samples[firstCards];
    for (const sample of samples.slice(firstCards)) {
      // A rolagem é do painel: a posição da toolbar vale relativa ao conteúdo da casca.
      expect(Math.abs((sample.toolbar.top - sample.frame.top) - (base.toolbar.top - base.frame.top)), `toolbar.top em ${sample.state}`).toBeLessThanOrEqual(1);
      expect(Math.abs(sample.toolbar.height - base.toolbar.height), `toolbar.height em ${sample.state}`).toBeLessThanOrEqual(1);
    }
    const height = await page.getByTestId(`${p}-content`).evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(420);
  });

  test("desktop 1440px: o conteúdo ocupa 95% da área do painel e os filtros ficam à vista", async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openAdmin(page);
    const { ratio, overflow } = await contentRatio(page);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
    await expect(page.getByTestId(`${p}-toolbar-toggle-filters`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-filter-shelterId`)).toBeVisible();
  });

  test("@mobile 375px: 98% da tela, filtros atrás do botão e cartões em coluna única", async ({ page }) => {
    await openAdmin(page);
    const { ratio, overflow } = await contentRatio(page);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);

    const toggle = page.getByTestId(`${p}-toolbar-toggle-filters`);
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeHidden();
    await toggle.click();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeVisible();
    const reply = await selectFilter(page, SCREEN, "sort", "shelterName:DESC");
    expect(reply.params.get("order")).toBe("DESC");
    await toggle.click();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeHidden();

    const ids = await cardIds(page, p);
    expect(ids.length).toBeGreaterThan(1);
    const boxes = [];
    for (const id of ids.slice(0, 3)) boxes.push((await page.getByTestId(`${p}-card-${id}`).boundingBox())!);
    for (const box of boxes) {
      expect(Math.abs(box.x - boxes[0].x)).toBeLessThanOrEqual(1);
      expect(box.width).toBeGreaterThan(MOBILE_VIEWPORT.width * 0.9);
    }
    const header = await page.getByTestId(`attendance-shelter-toggle-${ids[0]}`).boundingBox();
    expect(header!.height).toBeGreaterThanOrEqual(44);
  });

  test("líder: vê só as equipes dele (cartão com a equipe 1), a busca respeita o escopo e a API não vaza o resto", async ({ page, request }) => {
    const reply = await openLaunch(page, asSession(world.cast.leaderOne));
    const leaderTeams = (reply.body.data as Array<{ shelterId: string; teams: Array<{ teamId: string }> }>) ?? [];
    expect(leaderTeams.flatMap((shelter) => shelter.teams.map((team) => team.teamId))).toEqual([world.cast.teamIds.one]);
    await expect(page.getByTestId(`attendance-team-${world.cast.teamIds.one}`)).toBeVisible();
    await expect(page.getByTestId(`attendance-team-${world.cast.teamIds.two}`)).toHaveCount(0);
    const other = await searchFor(page, SCREEN, `${LAUNCH_TAG}-x01`);
    expect(other.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    const leak = await request.get(`${API_URL}${SCREEN.endpoint}`, {
      headers: authHeaders(world.cast.leaderOne.token),
      params: { page: 1, shelterId: world.extraShelterIds[0] },
    });
    expect(((await leak.json()) as { meta: { totalItems: number } }).meta.totalItems).toBe(0);
  });

  test("RBAC: membro não acessa a tela; visitante vai para o login", async ({ page, browser }) => {
    const context = await browser.newContext();
    const other = await context.newPage();
    await seedBrowserSession(other, asSession(world.cast.memberOne));
    await other.goto(SCREEN.path);
    await other.waitForLoadState("networkidle");
    await expect(other.getByTestId("attendance-page")).toHaveCount(0);
    await expect(other).not.toHaveURL(new RegExp(`${SCREEN.path}$`));
    await context.close();

    await page.goto(SCREEN.path);
    await expect(page.getByTestId("attendance-page")).toHaveCount(0);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test("flag attendance desligada esconde a rota e a API recusa; ligada de novo, a tela volta", async ({ page, request }) => {
    await withFlagsOff(request, admin.accessToken, ["attendance_control"], async () => {
      await seedBrowserSession(page, admin);
      await page.goto(SCREEN.path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("attendance-page")).toHaveCount(0);
      await expect(page).not.toHaveURL(new RegExp(`${SCREEN.path}$`));
      const res = await request.get(`${API_URL}${SCREEN.endpoint}`, { headers: authHeaders(admin.accessToken), params: { page: 1 } });
      expect(res.status()).toBe(403);
    });
    await openAdmin(page);
    await expect(page.getByTestId("attendance-page")).toBeVisible();
  });
});
