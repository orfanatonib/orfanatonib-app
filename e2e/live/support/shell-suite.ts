import type { Page } from "@playwright/test";
import { API_URL } from "../../../playwright.live.config";
import {
  DESKTOP_VIEWPORT,
  PAGE_SIZE,
  cardIds,
  clearAllFilters,
  expectCards,
  expectStableLayout,
  frameWidthRatio,
  goToPage,
  layoutSamples,
  openAs,
  openScreen,
  recordLayout,
  searchFor,
  sawSkeleton,
  selectFilter,
  setInvalidDateFilter,
  summaryText,
  watchSkeleton,
  whenListLoaded,
  type ListReply,
  type ListScreen,
} from "./admin-list-ui";
import { fillDate } from "./date-field";
import { filtersVisible } from "./admin-list-ui";
import { withFlagsOff } from "./flags";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "./live";

/**
 * Cenários de UI das telas com a casca única `AdminListScreen` que NÃO se encaixam no `registerCommonSuite`
 * (sem botão de criar, ou com líder autorizado). Tudo pela UI real contra a API e o banco reais: esqueleto → lista,
 * busca com debounce, limpar, paginação, vazio por filtro, erro real (400 da API), estabilidade de layout,
 * largura 95%/98%, mobile 375 px, RBAC e flag desligada. A prova de cada lista é um SELECT feito pelo chamador.
 */
export interface ShellSuite {
  screen: ListScreen;
  /** Flag que esconde a rota do app e faz a API recusar. */
  managementFlag: string;
  /** Flag que a API checa na listagem, quando difere da que esconde a rota. */
  apiFlag?: string;
  /** Texto de busca que isola os dados da execução. */
  tag: () => string;
  /** Ids dos itens da execução, na ordem padrão da tela, vindos do banco. */
  expectedDefault: () => Promise<string[]>;
  /** Chaves dos filtros de data que a API valida (400 quando inválidos). */
  dateFromKey: string;
  dateToKey: string;
  /** A tela tem botão `<p>-create`. */
  hasCreate?: boolean;
  /** Papéis que entram na tela (admin sempre). Os demais não podem ver `<p>-manager`. */
  allowedRoles?: ReadonlyArray<"leader">;
  /** Id de um cartão da execução (para medir o alvo de toque do excluir no mobile, quando existe). */
  sampleCardId: () => string;
  /** Se os cartões têm o botão de excluir (`-card-delete-<id>`). */
  hasDelete?: boolean;
  /** Ordenações a provar: valor do seletor (`campo:ORDEM`) e os ids esperados, do banco, na ordem. */
  sorts: Array<{ value: string; expectedIds: () => Promise<string[]> }>;
}

/** Preenche um filtro de data e espera a resposta da lista JÁ com o valor aplicado (ignora respostas intermediárias). */
export async function setDateFilter(page: Page, screen: ListScreen, key: string, value: string): Promise<ListReply> {
  await filtersVisible(page, screen.p);
  return whenListLoaded(
    page,
    screen,
    async () => {
      await fillDate(page.getByTestId(`${screen.p}-filter-${key}`), value);
    },
    (params) => (params.get(key) ?? "") === value,
  );
}

export function registerShellSuite(suite: ShellSuite): void {
  const { screen } = suite;
  const { p } = screen;
  const { dateFromKey, dateToKey } = suite;

  test(`${p}: carga inicial mostra o esqueleto e depois a lista (primeira página no servidor)`, async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await watchSkeleton(page, p);
    const reply = await openScreen(page, screen);
    expect(reply.status).toBe(200);
    expect(reply.params.get("page")).toBe("1");
    expect(reply.params.get("limit")).toBe(String(PAGE_SIZE));
    expect(await sawSkeleton(page)).toBe(true);
    await expect(page.getByTestId(`${p}-loading`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-manager-heading`)).toBeVisible();
    await expect(page.getByTestId(`${p}-toolbar`)).toBeVisible();
    await expect(page.getByTestId(`${p}-toolbar-search`)).toBeVisible();
    if (suite.hasCreate) await expect(page.getByTestId(`${p}-create`)).toBeVisible();
    await expect(page.getByTestId(`${p}-pagination`)).toBeVisible();
    expect((reply.body.data ?? []).length).toBeGreaterThan(0);
    expect((await cardIds(page, p)).length).toBe((reply.body.data ?? []).length);
  });

  test(`${p}: busca com debounce manda uma única requisição com o termo final, filtrada no banco`, async ({ page, request }) => {
    await openAs(page, request, screen);
    const calls: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (req.method() === "GET" && url.pathname === screen.endpoint && url.searchParams.has("search")) calls.push(url.searchParams.get("search") ?? "");
    });
    const tag = suite.tag();
    const reply = await whenListLoaded(
      page,
      screen,
      async () => {
        await page.getByTestId(`${p}-toolbar-search`).pressSequentially(tag, { delay: 40 });
      },
      (params) => params.get("search") === tag,
    );
    expect(calls).toEqual([tag]);
    const expected = await suite.expectedDefault();
    expect(reply.body.meta?.totalItems).toBe(expected.length);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));
    await expect(page.getByTestId(`${p}-toolbar-clear`)).toBeEnabled();
  });

  test(`${p}: limpar busca e limpar filtros devolvem a lista padrão e mantêm a ordenação`, async ({ page, request }) => {
    await openAs(page, request, screen);
    const tag = suite.tag();
    await searchFor(page, screen, tag);
    await setDateFilter(page, screen, dateToKey, "2000-01-01");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeEnabled();

    const cleared = await clearAllFilters(page, screen);
    expect(cleared.params.has("search")).toBe(false);
    expect(cleared.params.has(dateToKey)).toBe(false);
    await expect(page.getByTestId(`${p}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${p}-filter-${dateToKey}`)).toHaveValue("");
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeDisabled();
    await expect(page.getByTestId(`${p}-empty`)).toHaveCount(0);
    expect(cleared.params.has("sortBy")).toBe(true);

    await searchFor(page, screen, tag);
    const cleanSearch = await whenListLoaded(page, screen, async () => {
      await page.getByTestId(`${p}-toolbar-clear`).click();
    });
    expect(cleanSearch.params.has("search")).toBe(false);
    await expect(page.getByTestId(`${p}-toolbar-clear`)).toBeDisabled();
  });

  test(`${p}: paginação vai para a próxima, volta, pula para a página 2 e usa a janela do servidor`, async ({ page, request }) => {
    await openAs(page, request, screen);
    const expected = await suite.expectedDefault();
    expect(expected.length).toBeGreaterThan(PAGE_SIZE);
    await searchFor(page, screen, suite.tag());
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));
    await expect(summaryText(page, p)).toHaveText(`1–${PAGE_SIZE} de ${expected.length}`);

    const next = await whenListLoaded(page, screen, async () => {
      await page.getByRole("button", { name: "Próxima página", exact: true }).click();
    }, (params) => params.get("page") === "2");
    expect(next.body.meta).toMatchObject({ page: 2, totalItems: expected.length });
    await expectCards(page, p, expected.slice(PAGE_SIZE));
    await expect(summaryText(page, p)).toHaveText(`${PAGE_SIZE + 1}–${expected.length} de ${expected.length}`);

    const prev = await whenListLoaded(page, screen, async () => {
      await page.getByRole("button", { name: "Página anterior", exact: true }).click();
    }, (params) => params.get("page") === "1");
    expect(prev.body.meta?.page).toBe(1);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));

    const jump = await goToPage(page, screen, 2);
    expect(jump.params.get("page")).toBe("2");
    await expectCards(page, p, expected.slice(PAGE_SIZE));

    const first = await whenListLoaded(page, screen, async () => {
      await page.getByRole("button", { name: "Primeira página", exact: true }).click();
    }, (params) => params.get("page") === "1");
    expect(first.params.get("page")).toBe("1");
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));
  });

  test(`${p}: mexer na busca ou num filtro volta para a página 1`, async ({ page, request }) => {
    await openAs(page, request, screen);
    await searchFor(page, screen, suite.tag());
    await goToPage(page, screen, 2);
    const reply = await setDateFilter(page, screen, dateFromKey, "2000-01-01");
    expect(reply.params.get("page")).toBe("1");
    expect(reply.body.meta?.page).toBe(1);
  });

  test(`${p}: vazio por filtro mostra a mensagem de ajuste e o contador zerado`, async ({ page, request }) => {
    await openAs(page, request, screen);
    await searchFor(page, screen, suite.tag());
    const reply = await setDateFilter(page, screen, dateToKey, "2000-01-01");
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await expect(page.getByTestId(`${p}-empty`)).toContainText("Tente ajustar sua busca ou limpar os filtros.");
    await expect(summaryText(page, p)).toHaveText("0 itens");
    await expect(page.getByTestId(`${p}-cards`)).toHaveCount(0);
  });

  test(`${p}: erro real da API (filtro recusado com 400) mostra o alerta e se recupera ao limpar`, async ({ page, request }) => {
    await openAs(page, request, screen);
    const reply = await setInvalidDateFilter(page, screen, dateToKey);
    expect(reply.status).toBe(400);
    await expect(page.getByTestId(`${p}-error`)).toBeVisible();
    await expect(page.getByTestId(`${p}-cards`)).toHaveCount(0);
    await expect(page.getByTestId(`${p}-toolbar`)).toBeVisible();

    const retry = await whenListLoaded(page, screen, async () => {
      await page.getByTestId(`${p}-error`).getByRole("button", { name: "Tentar novamente" }).click();
    });
    expect(retry.status).toBe(400);
    await expect(page.getByTestId(`${p}-error`)).toBeVisible();

    const recovered = await clearAllFilters(page, screen);
    expect(recovered.status).toBe(200);
    await expect(page.getByTestId(`${p}-error`)).toHaveCount(0);
    expect((await cardIds(page, p)).length).toBeGreaterThan(0);
  });

  test(`${p}: estabilidade de layout, o frame e a toolbar não mudam entre carga, vazio, lista, página 2 e erro`, async ({ page, request }) => {
    await seedBrowserSession(page, await loginAs(request, "admin"));
    await recordLayout(page, p);
    await openScreen(page, screen);
    await searchFor(page, screen, suite.tag());
    await goToPage(page, screen, 2);
    await goToPage(page, screen, 1);
    await setDateFilter(page, screen, dateToKey, "2000-01-01");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await setInvalidDateFilter(page, screen, dateToKey);
    await expect(page.getByTestId(`${p}-error`)).toBeVisible();
    await clearAllFilters(page, screen);
    await expect(page.getByTestId(`${p}-cards`)).toBeVisible();

    const samples = await layoutSamples(page);
    const states = new Set(samples.map((s) => s.state));
    for (const state of ["loading", "cards", "empty", "error"] as const) expect(states.has(state), `sem amostra de ${state}`).toBe(true);
    expectStableLayout(samples);

    const minHeight = await page.getByTestId(`${p}-content`).evaluate((el) => el.getBoundingClientRect().height);
    expect(minHeight).toBeGreaterThanOrEqual(420);
  });

  test(`${p}: desktop 1440px ocupa 95% da área do painel, sem rolagem lateral`, async ({ page, request }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openAs(page, request, screen);
    const { ratio, overflow } = await frameWidthRatio(page, p);
    expect(ratio).toBeGreaterThan(0.945);
    expect(ratio).toBeLessThan(0.955);
    expect(overflow).toBe(false);
  });

  test(`${p}: @mobile 375px usa cartões em coluna única, 98% da tela e filtros atrás do botão`, async ({ page, request }) => {
    await openAs(page, request, screen);
    const { ratio, overflow } = await frameWidthRatio(page, p);
    expect(ratio).toBeGreaterThan(0.975);
    expect(ratio).toBeLessThan(0.985);
    expect(overflow).toBe(false);

    const toggle = page.getByTestId(`${p}-toolbar-toggle-filters`);
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeHidden();
    await toggle.click();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeVisible();
    await toggle.click();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeHidden();

    const ids = await cardIds(page, p);
    expect(ids.length).toBeGreaterThan(1);
    const boxes = [];
    for (const id of ids.slice(0, 3)) {
      const box = await page.getByTestId(`${p}-card-${id}`).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }
    for (const box of boxes) {
      expect(Math.abs(box.x - boxes[0].x)).toBeLessThanOrEqual(1);
      expect(box.width).toBeGreaterThan(375 * 0.9);
    }
    if (suite.hasCreate) {
      const create = await page.getByTestId(`${p}-create`).boundingBox();
      expect(create!.height).toBeGreaterThanOrEqual(44);
    }
    if (suite.hasDelete) {
      const delete_ = page.getByTestId(`${p}-card-delete-${suite.sampleCardId()}`);
      if ((await delete_.count()) > 0) {
        const del = await delete_.boundingBox();
        expect(Math.min(del!.width, del!.height)).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test(`${p}: @mobile filtro aplicado pelo botão de filtros consulta o servidor`, async ({ page, request }) => {
    await openAs(page, request, screen);
    await searchFor(page, screen, suite.tag());
    const reply = await setDateFilter(page, screen, dateFromKey, "2000-01-01");
    expect(reply.params.get(dateFromKey)).toBe("2000-01-01");
    await expect(page.getByTestId(`${p}-toolbar-toggle-filters`)).toContainText("Filtros");
  });

  test(`${p}: ordenação pelo seletor manda sortBy/order e a lista segue a ordem do banco`, async ({ page, request }) => {
    await openAs(page, request, screen);
    await searchFor(page, screen, suite.tag());
    for (const sort of suite.sorts) {
      const [sortBy, order] = sort.value.split(":");
      const reply = await selectFilter(page, screen, "sort", sort.value);
      expect(reply.params.get("sortBy")).toBe(sortBy);
      expect(reply.params.get("order")).toBe(order);
      const expected = await sort.expectedIds();
      await expectCards(page, p, expected.slice(0, PAGE_SIZE));
    }
  });

  test(`${p}: acesso por papel (membro bloqueado, líder conforme a tela, visitante vai para o login)`, async ({ page, request, browser }) => {
    const roles = ["member", "leader"] as const;
    for (const role of roles) {
      const allowed = role === "leader" && suite.allowedRoles?.includes("leader");
      const context = await browser.newContext();
      const other = await context.newPage();
      await seedBrowserSession(other, await loginAs(request, role));
      await other.goto(screen.path);
      await other.waitForLoadState("networkidle");
      if (allowed) {
        await expect(other.getByTestId(`${p}-manager`).or(other.getByTestId(`${p}-no-team`))).toBeVisible({ timeout: 20_000 });
      } else {
        await expect(other.getByTestId(`${p}-manager`)).toHaveCount(0);
        await expect(other).not.toHaveURL(new RegExp(`${screen.path}$`));
      }
      await context.close();
    }
    await page.goto(screen.path);
    await expect(page.getByTestId(`${p}-manager`)).toHaveCount(0);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test(`${p}: flag desligada esconde a rota e a API recusa; ligada de novo, a tela volta`, async ({ page, request }) => {
    const admin = await loginAs(request, "admin");
    await withFlagsOff(request, admin.accessToken, [suite.managementFlag], async () => {
      await seedBrowserSession(page, admin);
      await page.goto(screen.path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId(`${p}-manager`)).toHaveCount(0);
      await expect(page).not.toHaveURL(new RegExp(`${screen.path}$`));
      if (!suite.apiFlag) {
        const refused = await request.get(`${API_URL}${screen.endpoint}`, { headers: authHeaders(admin.accessToken), params: { page: 1 } });
        expect(refused.status()).toBe(403);
      }
    });
    if (suite.apiFlag) {
      await withFlagsOff(request, admin.accessToken, [suite.apiFlag], async () => {
        const refused = await request.get(`${API_URL}${screen.endpoint}`, { headers: authHeaders(admin.accessToken), params: { page: 1 } });
        expect(refused.status()).toBe(403);
      });
    }
    await openScreen(page, screen);
    await expect(page.getByTestId(`${p}-manager`)).toBeVisible();
  });
}

