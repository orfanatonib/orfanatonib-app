import type { Page, Response } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "./live";
import { withFlagsOff } from "./flags";
import { fillDate } from "./date-field";
import { localShift } from "./local-day";

/**
 * Passos comuns das telas de lista administrativas (casca `AdminListScreen`): tudo pela UI real,
 * contra a API real. Cada tela informa o prefixo dos `data-testid`, o caminho e o endpoint da lista.
 */
export interface ListScreen {
  /** Prefixo dos `data-testid` (`documents`, `meditations`, `informatives`). */
  p: string;
  /** Rota do app (`/adm/documentos`). */
  path: string;
  /** Caminho do endpoint da lista na API (`/documents`). */
  endpoint: string;
}

export const PAGE_SIZE = 12;
export const MOBILE_VIEWPORT = { width: 375, height: 812 } as const;
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
// A primeira carga a frio de uma tela no Vite de desenvolvimento (~560 módulos) chega perto de 20 s.
const LOAD_TIMEOUT = 45_000;

export interface ListReply {
  status: number;
  params: URLSearchParams;
  body: { data?: unknown[]; meta?: { page: number; limit: number; totalItems: number; totalPages: number } };
}

export const todayUtc = (): string => localShift(0);
export const addDays = (iso: string, days: number): string =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

const isListCall = (screen: ListScreen, response: Response): boolean => {
  const url = new URL(response.url());
  return response.request().method() === "GET" && url.pathname === screen.endpoint && url.searchParams.has("page");
};

/** Espera o esqueleto e a barra de "buscando" sumirem: a lista está parada. */
export async function settle(page: Page, p: string): Promise<void> {
  await expect(page.getByTestId(`${p}-loading`)).toHaveCount(0, { timeout: LOAD_TIMEOUT });
  await expect(page.getByTestId(`${p}-fetching`)).toHaveCount(0, { timeout: LOAD_TIMEOUT });
}

/**
 * As listas respondem `{ data, meta }`; antecedentes (`{ data, total, page, limit, totalPages }`) e perfis
 * (`{ items, meta: { currentPage, ... } }`) têm o próprio envelope, convertido aqui para o mesmo formato.
 */
export function normalizeListBody(raw: unknown): ListReply["body"] {
  const body = (raw ?? {}) as Record<string, unknown> & {
    data?: unknown[];
    items?: unknown[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    meta?: Record<string, number>;
  };
  if (body.meta && typeof body.meta.totalItems === "number" && typeof body.meta.currentPage === "number") {
    return {
      ...body,
      data: body.items,
      meta: { page: body.meta.currentPage, limit: body.meta.itemsPerPage, totalItems: body.meta.totalItems, totalPages: body.meta.totalPages },
    };
  }
  if (!body.meta && typeof body.total === "number") {
    const limit = body.limit ?? PAGE_SIZE;
    return {
      ...body,
      data: body.data ?? body.items,
      meta: { page: body.page ?? 1, limit, totalItems: body.total, totalPages: body.totalPages ?? Math.max(1, Math.ceil(body.total / limit)) },
    };
  }
  return body as ListReply["body"];
}

/** Roda a ação e devolve a próxima resposta paginada da lista (opcionalmente filtrada por `match`). */
export async function whenListLoaded(
  page: Page,
  screen: ListScreen,
  action: () => Promise<void>,
  match?: (params: URLSearchParams) => boolean,
): Promise<ListReply> {
  const waiting = page.waitForResponse(
    (response) => isListCall(screen, response) && (!match || match(new URL(response.url()).searchParams)),
    { timeout: LOAD_TIMEOUT },
  );
  await action();
  const response = await waiting;
  const body = normalizeListBody(await response.json().catch(() => ({})));
  await settle(page, screen.p);
  return { status: response.status(), params: new URL(response.url()).searchParams, body };
}

/** Abre a tela e espera a primeira página chegar. */
export async function openScreen(page: Page, screen: ListScreen): Promise<ListReply> {
  const reply = await whenListLoaded(page, screen, async () => {
    await page.goto(screen.path);
    await expect(page.getByTestId(`${screen.p}-manager`)).toBeVisible({ timeout: LOAD_TIMEOUT });
  });
  return reply;
}

/** Ids dos cartões da página, na ordem em que aparecem. */
export async function cardIds(page: Page, p: string): Promise<string[]> {
  const prefix = `${p}-card-`;
  return page.evaluate(
    ({ grid, prefix: pre }) => {
      const root = document.querySelector(`[data-testid="${grid}"]`);
      if (!root) return [];
      return Array.from(root.querySelectorAll(":scope > * > [data-testid]"))
        .map((el) => el.getAttribute("data-testid") ?? "")
        .filter((id) => id.startsWith(pre))
        .map((id) => id.slice(pre.length));
    },
    { grid: `${p}-cards`, prefix },
  );
}

/** Espera a lista visível ser exatamente `expected` (mesma ordem, quando `ordered`). */
export async function expectCards(page: Page, p: string, expected: string[], ordered = true): Promise<void> {
  await expect
    .poll(async () => {
      const ids = await cardIds(page, p);
      return ordered ? ids : [...ids].sort();
    }, { timeout: LOAD_TIMEOUT })
    .toEqual(ordered ? expected : [...expected].sort());
}

export async function filtersVisible(page: Page, p: string): Promise<void> {
  const toggle = page.getByTestId(`${p}-toolbar-toggle-filters`);
  if (await toggle.isVisible().catch(() => false)) {
    const probe = page.getByTestId(`${p}-toolbar-clear-filters`);
    if (!(await probe.isVisible().catch(() => false))) await toggle.click();
  }
}

export async function selectFilter(page: Page, screen: ListScreen, key: string, value: string): Promise<ListReply> {
  await filtersVisible(page, screen.p);
  const testId = `${screen.p}-filter-${key}`;
  return whenListLoaded(page, screen, async () => {
    await page.getByTestId(testId).locator('xpath=preceding-sibling::div[@role="combobox"]').click();
    await page.getByTestId(`${testId}-option-${value === "" ? "all" : value}`).click();
  });
}

export async function setDateFilter(page: Page, screen: ListScreen, key: string, value: string): Promise<ListReply> {
  await filtersVisible(page, screen.p);
  return whenListLoaded(page, screen, async () => {
    await fillDate(page.getByTestId(`${screen.p}-filter-${key}`), value);
  }, (params) => params.get(key) === value);
}

/**
 * Erro 400 real da API: busca acima do limite de caracteres (`search` aceita até 120).
 * (O seletor de data em português não deixa digitar ano inválido, então a data não serve mais.)
 */
export async function setInvalidDateFilter(page: Page, screen: ListScreen, _key?: string): Promise<ListReply> {
  return whenListLoaded(page, screen, async () => {
    await page.getByTestId(`${screen.p}-toolbar-search`).fill("x".repeat(130));
  });
}

export async function searchFor(page: Page, screen: ListScreen, text: string): Promise<ListReply> {
  return whenListLoaded(
    page,
    screen,
    async () => {
      await page.getByTestId(`${screen.p}-toolbar-search`).fill(text);
    },
    (params) => (params.get("search") ?? "") === text.trim(),
  );
}

export async function clearAllFilters(page: Page, screen: ListScreen): Promise<ListReply> {
  await filtersVisible(page, screen.p);
  return whenListLoaded(page, screen, async () => {
    await page.getByTestId(`${screen.p}-toolbar-clear-filters`).click();
  });
}

export async function goToPage(page: Page, screen: ListScreen, target: number): Promise<ListReply> {
  return whenListLoaded(
    page,
    screen,
    async () => {
      await page.getByTestId(`${screen.p}-pagination-pages`).getByRole("button", { name: `Ir para a página ${target}` }).click();
    },
    (params) => params.get("page") === String(target),
  );
}

export const summaryText = (page: Page, p: string) => page.getByTestId(`${p}-pagination-summary`);

/** Autentica e abre a tela no papel indicado. */
export async function openAs(
  page: Page,
  request: Parameters<typeof loginAs>[0],
  screen: ListScreen,
  role: "admin" | "leader" | "member" = "admin",
): Promise<ListReply> {
  await seedBrowserSession(page, await loginAs(request, role));
  return openScreen(page, screen);
}

/* ───────── medição de layout ───────── */

export interface Rect {
  x: number;
  top: number;
  width: number;
  height: number;
}

export interface LayoutSample {
  frame: Rect;
  toolbar: Rect;
  state: "loading" | "empty" | "error" | "cards" | "other";
}

/** Grava, a cada mutação do DOM, onde estão o frame e a toolbar (coordenadas da página). */
export async function recordLayout(page: Page, p: string): Promise<void> {
  await page.addInitScript((prefix) => {
    const w = window as unknown as { __layout: unknown[] };
    w.__layout = [];
    const rect = (el: Element): Rect => {
      const r = el.getBoundingClientRect();
      const main = document.querySelector('[data-testid="admin-main"]');
      const origin = main ? main.getBoundingClientRect() : { x: -window.scrollX, top: -window.scrollY };
      const shiftX = main ? main.scrollLeft : 0;
      const shiftY = main ? main.scrollTop : 0;
      return { x: r.x - origin.x + shiftX, top: r.top - origin.top + shiftY, width: r.width, height: r.height };
    };
    const q = (id: string) => document.querySelector(`[data-testid="${id}"]`);
    const sample = () => {
      const frame = q(`${prefix}-manager-frame`);
      const toolbar = q(`${prefix}-toolbar`);
      if (!frame || !toolbar) return;
      const state = q(`${prefix}-loading`) ? "loading" : q(`${prefix}-error`) ? "error" : q(`${prefix}-empty`) ? "empty" : q(`${prefix}-cards`) ? "cards" : "other";
      w.__layout.push({ frame: rect(frame), toolbar: rect(toolbar), state });
    };
    new MutationObserver(sample).observe(document, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", sample);
    type Rect = { x: number; top: number; width: number; height: number };
  }, p);
}

export const layoutSamples = (page: Page): Promise<LayoutSample[]> =>
  page.evaluate(() => (window as unknown as { __layout: LayoutSample[] }).__layout);

/** Prova que frame e toolbar não se mexeram entre as amostras (tolerância 1px). */
export function expectStableLayout(samples: LayoutSample[]): void {
  expect(samples.length).toBeGreaterThan(1);
  const base = samples[0];
  for (const sample of samples) {
    for (const key of ["x", "top", "width"] as const) {
      expect(Math.abs(sample.frame[key] - base.frame[key]), `frame.${key} em ${sample.state}`).toBeLessThanOrEqual(1);
    }
    for (const key of ["x", "top", "width", "height"] as const) {
      expect(Math.abs(sample.toolbar[key] - base.toolbar[key]), `toolbar.${key} em ${sample.state}`).toBeLessThanOrEqual(1);
    }
  }
}

export async function frameWidthRatio(page: Page, p: string): Promise<{ ratio: number; overflow: boolean }> {
  return page.evaluate((prefix) => {
    const frame = document.querySelector<HTMLElement>(`[data-testid="${prefix}-manager-frame"]`);
    const main = document.querySelector<HTMLElement>('[data-testid="admin-main"]');
    if (!frame || !main) throw new Error("faltou o frame ou o admin-main");
    return {
      // O frame ocupa 95% (desktop) ou 98% (celular) do admin-main inteiro.
      ratio: frame.getBoundingClientRect().width / main.getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  }, p);
}

/** Registra se o esqueleto chegou a aparecer (a primeira carga é rápida demais para polling). */
export async function watchSkeleton(page: Page, p: string): Promise<void> {
  await page.addInitScript((id) => {
    const w = window as unknown as { __sawSkeleton: boolean };
    w.__sawSkeleton = false;
    const check = () => {
      if (document.querySelector(`[data-testid="${id}"]`)) w.__sawSkeleton = true;
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true });
  }, `${p}-loading`);
}

export const sawSkeleton = (page: Page): Promise<boolean> =>
  page.evaluate(() => (window as unknown as { __sawSkeleton: boolean }).__sawSkeleton);

/* ───────── cenários comuns ───────── */

export interface CommonSuite {
  screen: ListScreen;
  /** Chave da feature flag de gestão (esconde a rota do app). */
  managementFlag: string;
  /** Texto de busca que isola os dados da execução. */
  tag: () => string;
  /** Ids dos itens da execução na ordem padrão da tela, vindos do banco. */
  expectedDefault: () => Promise<string[]>;
  /** Chave do filtro de data de criação usado para o vazio/erro. */
  createdToKey?: string;
  /** Texto do estado vazio sem filtros. */
  emptyWithoutFilters?: RegExp;
  /** Id do cartão que serve de amostra para as ações (opcional). */
  sampleCardId: () => string;
  /** `false` nas filas de moderação, que não têm botão de criar (padrão `true`). */
  hasCreate?: boolean;
  /** `data-testid` da lixeira do cartão de amostra; `null` quando o cartão não tem lixeira. */
  cardDeleteTestId?: ((id: string) => string) | null;
  /** `true` quando o líder também abre a tela (o RBAC então só nega o membro e prova que o líder entra). */
  leaderAllowed?: boolean;
  /** `true` quando a tela cobre o acesso por papel em teste próprio (ex.: líder sem equipe vê um aviso, não a lista). */
  skipAccessTest?: boolean;
}

/** Cenários iguais nas três telas: esqueleto, busca com debounce, limpar, paginação, vazio, erro, layout, largura e acesso. */
export function registerCommonSuite(suite: CommonSuite): void {
  const { screen } = suite;
  const { p } = screen;
  const createdToKey = suite.createdToKey ?? "createdTo";

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
    if (suite.hasCreate !== false) await expect(page.getByTestId(`${p}-create`)).toBeVisible();
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
    await setDateFilter(page, screen, createdToKey, "2000-01-01");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeEnabled();

    const cleared = await clearAllFilters(page, screen);
    expect(cleared.params.has("search")).toBe(false);
    expect(cleared.params.has(createdToKey)).toBe(false);
    await expect(page.getByTestId(`${p}-toolbar-search`)).toHaveValue("");
    await expect(page.getByTestId(`${p}-filter-${createdToKey}`)).toHaveValue("");
    await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeDisabled();
    await expect(page.getByTestId(`${p}-empty`)).toHaveCount(0);

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
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Próxima página", exact: true }).click();
    }, (params) => params.get("page") === "2");
    expect(next.body.meta).toMatchObject({ page: 2, totalItems: expected.length });
    await expectCards(page, p, expected.slice(PAGE_SIZE));
    await expect(summaryText(page, p)).toHaveText(`${PAGE_SIZE + 1}–${expected.length} de ${expected.length}`);

    const prev = await whenListLoaded(page, screen, async () => {
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Página anterior", exact: true }).click();
    }, (params) => params.get("page") === "1");
    expect(prev.body.meta?.page).toBe(1);
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));

    const jump = await goToPage(page, screen, 2);
    expect(jump.params.get("page")).toBe("2");
    await expectCards(page, p, expected.slice(PAGE_SIZE));

    const first = await whenListLoaded(page, screen, async () => {
      await page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: "Primeira página", exact: true }).click();
    }, (params) => params.get("page") === "1");
    expect(first.params.get("page")).toBe("1");
    await expectCards(page, p, expected.slice(0, PAGE_SIZE));
  });

  test(`${p}: mexer na busca ou num filtro volta para a página 1`, async ({ page, request }) => {
    await openAs(page, request, screen);
    const tag = suite.tag();
    await searchFor(page, screen, tag);
    await goToPage(page, screen, 2);
    const reply = await setDateFilter(page, screen, "createdFrom", "2000-01-01");
    expect(reply.params.get("page")).toBe("1");
    expect(reply.body.meta?.page).toBe(1);
  });

  test(`${p}: vazio por filtro mostra a mensagem de ajuste e o contador zerado`, async ({ page, request }) => {
    await openAs(page, request, screen);
    await searchFor(page, screen, suite.tag());
    const reply = await setDateFilter(page, screen, createdToKey, "2000-01-01");
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await expect(page.getByTestId(`${p}-empty`)).toContainText("Tente ajustar sua busca ou limpar os filtros.");
    await expect(summaryText(page, p)).toHaveText("0 itens");
    await expect(page.getByTestId(`${p}-cards`)).toHaveCount(0);
  });

  test(`${p}: erro real da API (filtro recusado com 400) mostra o alerta e se recupera ao limpar`, async ({ page, request }) => {
    await openAs(page, request, screen);
    const reply = await setInvalidDateFilter(page, screen, createdToKey);
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
    await setDateFilter(page, screen, createdToKey, "2000-01-01");
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await setInvalidDateFilter(page, screen, createdToKey);
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
      expect(box.width).toBeGreaterThan(MOBILE_VIEWPORT.width * 0.9);
    }
    if (suite.hasCreate !== false) {
      const create = await page.getByTestId(`${p}-create`).boundingBox();
      expect(create!.height).toBeGreaterThanOrEqual(44);
    }
    if (suite.cardDeleteTestId !== null) {
      const deleteId = (suite.cardDeleteTestId ?? ((id: string) => `${p}-card-delete-${id}`))(ids[0]);
      const del = await page.getByTestId(deleteId).boundingBox().catch(() => null);
      if (del) expect(Math.min(del.width, del.height)).toBeGreaterThanOrEqual(44);
    }
  });

  test(`${p}: @mobile filtro aplicado pelo botão de filtros consulta o servidor`, async ({ page, request }) => {
    await openAs(page, request, screen);
    await searchFor(page, screen, suite.tag());
    const reply = await setDateFilter(page, screen, "createdFrom", "2000-01-01");
    expect(reply.params.get("createdFrom")).toBe("2000-01-01");
    await expect(page.getByTestId(`${p}-toolbar-toggle-filters`)).toContainText("Filtros");
  });

  if (!suite.skipAccessTest) test(`${p}: membro e líder não acessam a tela; visitante vai para o login`, async ({ page, request, browser }) => {
    const denied = suite.leaderAllowed ? (["member"] as const) : (["member", "leader"] as const);
    for (const role of denied) {
      const context = await browser.newContext();
      const other = await context.newPage();
      await seedBrowserSession(other, await loginAs(request, role));
      await other.goto(screen.path);
      await other.waitForLoadState("networkidle");
      await expect(other.getByTestId(`${p}-manager`)).toHaveCount(0);
      await expect(other).not.toHaveURL(new RegExp(`${screen.path}$`));
      await context.close();
    }
    if (suite.leaderAllowed) {
      const context = await browser.newContext();
      const leader = await context.newPage();
      await seedBrowserSession(leader, await loginAs(request, "leader"));
      await leader.goto(screen.path);
      await expect(leader.getByTestId(`${p}-manager`)).toBeVisible({ timeout: LOAD_TIMEOUT });
      await context.close();
    }
    await page.goto(screen.path);
    await expect(page.getByTestId(`${p}-manager`)).toHaveCount(0);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test(`${p}: flag de gestão desligada esconde a rota e a API recusa; ligada de novo, a tela volta`, async ({ page, request }) => {
    const admin = await loginAs(request, "admin");
    await withFlagsOff(request, admin.accessToken, [suite.managementFlag], async () => {
      await seedBrowserSession(page, admin);
      await page.goto(screen.path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId(`${p}-manager`)).toHaveCount(0);
      await expect(page).not.toHaveURL(new RegExp(`${screen.path}$`));
    });
    await openScreen(page, screen);
    await expect(page.getByTestId(`${p}-manager`)).toBeVisible();
  });
}

/** Apaga pela API tudo que a busca por `tag` devolve (modo legado: sem `page`, é um array). */
export async function deleteAllByTag(
  request: Parameters<typeof loginAs>[0],
  endpoint: string,
  tag: string,
  idOf: (row: Record<string, unknown>) => string | undefined,
): Promise<void> {
  const token = (await loginAs(request, "admin")).accessToken;
  const response = await request.get(`${API_URL}${endpoint}`, { headers: authHeaders(token), params: { search: tag } });
  if (!response.ok()) return;
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  for (const row of rows) {
    const id = idOf(row);
    if (id) await request.delete(`${API_URL}${endpoint}/${id}`, { headers: authHeaders(token) });
  }
}
