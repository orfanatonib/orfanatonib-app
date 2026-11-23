import type { APIRequestContext, Page } from "@playwright/test";

import { closeDb, queryAll, queryOne } from "./db";
import { RUN_TAG, tagged } from "./factory";
import { expect, loginAs, seedBrowserSession, test, type LoginResult } from "./live";
import { fillDate } from "./date-field";

/**
 * Cenários de UI compartilhados das listagens de páginas de conteúdo (ideias, fotos, vídeos): a casca única
 * `AdminListScreen` com busca, filtros, ordenação e paginação NO SERVIDOR. Cada tela só informa o que é dela
 * (testids, tabela, como criar/apagar pela API). A prova de cada resultado é um SELECT no banco com o mesmo critério.
 */

export const PAGE_SIZE = 12;
export const TOTAL_ITEMS = 13;
const UUID = "[0-9a-f-]{36}";

export interface ListChipExpectation {
  testId: (id: string) => string;
  text: RegExp;
}

export interface ListScreenConfig {
  /** Nome do bloco de testes. */
  name: string;
  path: string;
  /** Rota da API da listagem (`/image-pages`). */
  apiPath: string;
  /** Prefixo dos testids da casca (`image-pages`). */
  prefix: string;
  /** Prefixo do testid do cartão (`image-page-card-`). */
  cardPrefix: string;
  titleTestId: (id: string) => string;
  /** Selo de visibilidade; ausente em ideias (sempre privadas). */
  visibilityTestId?: (id: string) => string;
  table: string;
  titleColumn: string;
  /** Colunas varridas pela busca do servidor. */
  searchColumns: string[];
  hasPublicFilter: boolean;
  create: (request: APIRequestContext, token: string, title: string, isPublic: boolean) => Promise<{ id: string }>;
  remove: (request: APIRequestContext, token: string, id: string) => Promise<void>;
  chips: ListChipExpectation[];
  viewTestId: (id: string) => string;
  viewModalTestId: string;
  editTestId?: (id: string) => string;
  editUrl?: RegExp;
  deleteTestId: (id: string) => string;
  deleteDialogTestId: string;
}

type Sort = "createdAt:DESC" | "createdAt:ASC" | "title:ASC" | "title:DESC";

interface Criteria {
  search?: string;
  isPublic?: boolean;
  from?: string;
  to?: string;
  sort?: Sort;
  page?: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LoadingSnapshot {
  toolbar: Rect;
  frame: Rect;
}

type SpyWindow = Window & { __loadingSeen?: boolean; __loadingSnapshot?: LoadingSnapshot; __samples?: Rect[] };

export function defineListScenarios(cfg: ListScreenConfig): void {
  const p = cfg.prefix;
  const tag = tagged(`lst-${p}`);
  const titleOf = (n: number): string => `${tag}-${String(n).padStart(2, "0")}`;

  test.describe.serial(cfg.name, () => {
    let admin: LoginResult;
    const ids: string[] = [];

    /* ───────── helpers ───────── */

    const where = (c: Criteria, params: Array<string | number>): string => {
      const clauses: string[] = [];
      const search = c.search ?? tag;
      clauses.push(`(${cfg.searchColumns.map((col) => `${col} LIKE ?`).join(" OR ")})`);
      for (let i = 0; i < cfg.searchColumns.length; i += 1) params.push(`%${search}%`);
      if (c.isPublic !== undefined) {
        clauses.push("public = ?");
        params.push(c.isPublic ? 1 : 0);
      }
      if (c.from) {
        clauses.push("createdAt >= ?");
        params.push(c.from);
      }
      if (c.to) {
        clauses.push("createdAt < DATE_ADD(?, INTERVAL 1 DAY)");
        params.push(c.to);
      }
      return clauses.join(" AND ");
    };

    const orderBy = (sort: Sort): string => {
      const [field, direction] = sort.split(":");
      return `${field === "title" ? cfg.titleColumn : "createdAt"} ${direction}, id`;
    };

    const expectedIds = async (c: Criteria): Promise<string[]> => {
      const params: Array<string | number> = [];
      const clause = where(c, params);
      const offset = ((c.page ?? 1) - 1) * PAGE_SIZE;
      const rows = await queryAll<{ id: string }>(
        `SELECT id FROM ${cfg.table} WHERE ${clause} ORDER BY ${orderBy(c.sort ?? "createdAt:DESC")} LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
        params,
      );
      return rows.map((row) => row.id);
    };

    const expectedTotal = async (c: Criteria): Promise<number> => {
      const params: Array<string | number> = [];
      const clause = where(c, params);
      return Number((await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM ${cfg.table} WHERE ${clause}`, params))?.n ?? 0);
    };

    const dayOfCreation = async (): Promise<string> =>
      String(
        (await queryOne<{ d: string }>(
          `SELECT DATE_FORMAT(MIN(createdAt), '%Y-%m-%d') AS d FROM ${cfg.table} WHERE ${cfg.titleColumn} LIKE ?`,
          [`${tag}%`],
        ))?.d,
      );

    const shiftDay = (day: string, delta: number): string => {
      const date = new Date(`${day}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + delta);
      return date.toISOString().slice(0, 10);
    };

    const cardIds = (page: Page): Promise<string[]> =>
      page
        .locator(`[data-testid^="${cfg.cardPrefix}"]`)
        .evaluateAll(
          (els, args) => {
            const re = new RegExp(`^${args.prefix}(${args.uuid})$`);
            return els.flatMap((el) => {
              const match = re.exec(el.getAttribute("data-testid") ?? "");
              return match ? [match[1]] : [];
            });
          },
          { prefix: cfg.cardPrefix, uuid: UUID },
        );

    /** `y` é medido a partir do título da tela (a rolagem acontece num contêiner interno, não na janela). */
    const rectOf = (page: Page, testId: string): Promise<Rect> =>
      page.evaluate(
        (args) => {
          const el = document.querySelector<HTMLElement>(`[data-testid="${args.id}"]`);
          const origin = document.querySelector<HTMLElement>(`[data-testid="${args.origin}"]`);
          if (!el || !origin) throw new Error(`faltou ${args.id}`);
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top - origin.getBoundingClientRect().top, width: r.width, height: r.height };
        },
        { id: testId, origin: `${p}-manager-heading` },
      );

    const open = async (page: Page, viewport?: { width: number; height: number }): Promise<void> => {
      await seedBrowserSession(page, admin);
      if (viewport) await page.setViewportSize(viewport);
      await page.goto(cfg.path);
      await expect(page.getByTestId(`${p}-manager`)).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId(`${p}-loading`)).toHaveCount(0, { timeout: 20_000 });
    };

    const isListRequest = (url: string): boolean => {
      const { pathname, searchParams } = new URL(url);
      return pathname === cfg.apiPath && searchParams.has("page");
    };

    /** Executa a ação e espera a resposta da listagem (a lista nova só chega depois do debounce/filtro). */
    const listResponse = async (page: Page, action: () => Promise<void>, accept: (url: URL) => boolean = () => true): Promise<URL> => {
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.request().method() === "GET" && isListRequest(r.url()) && accept(new URL(r.url()))),
        action(),
      ]);
      return new URL(response.url());
    };

    const search = (page: Page, text: string) =>
      listResponse(page, () => page.getByTestId(`${p}-toolbar-search`).fill(text));

    const pick = (page: Page, key: string, value: string) =>
      listResponse(page, async () => {
        await page.locator(".MuiTextField-root", { has: page.getByTestId(`${p}-filter-${key}`) }).getByRole("combobox").click();
        await page.getByTestId(`${p}-filter-${key}-option-${value || "all"}`).click();
      });

    const setDate = (page: Page, key: "createdFrom" | "createdTo", value: string) =>
      listResponse(page, () => fillDate(page.getByTestId(`${p}-filter-${key}`), value), (url) => (url.searchParams.get(key) ?? "") === value);

    const gotoPage = (page: Page, label: string) =>
      listResponse(page, () => page.getByTestId(`${p}-pagination-pages`).getByRole("button", { name: label }).click());

    const expectList = async (page: Page, c: Criteria): Promise<void> => {
      const want = await expectedIds(c);
      await expect.poll(() => cardIds(page), { timeout: 15_000 }).toEqual(want);
      const total = await expectedTotal(c);
      const first = ((c.page ?? 1) - 1) * PAGE_SIZE + 1;
      const last = Math.min(total, (c.page ?? 1) * PAGE_SIZE);
      await expect(page.getByTestId(`${p}-pagination-summary`)).toHaveText(total === 0 ? "0 itens" : `${first}–${last} de ${total}`);
    };

    test.beforeAll(async ({ request }) => {
      admin = await loginAs(request, "admin");
      for (let n = 1; n <= TOTAL_ITEMS; n += 1) {
        const created = await cfg.create(request, admin.accessToken, titleOf(n), n % 2 === 1);
        ids.push(created.id);
      }
    });

    test.afterAll(async ({ request }) => {
      /** Fixtures de paginação (13 páginas só para provar filtros/2ª página): removidas SEMPRE; a massa fica a cargo do spec de massa. */
      for (const id of ids) await cfg.remove(request, admin.accessToken, id);
      const left = await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM ${cfg.table} WHERE ${cfg.titleColumn} LIKE ?`, [`%${tag}%`]);
      expect(Number(left?.n ?? 0), "a limpeza deixou páginas do E2E").toBe(0);
      await closeDb();
    });

    /* ───────── cenários ───────── */

    test("carga inicial: esqueleto só na 1ª carga e depois a 1ª página (12) vinda do banco, sem filtro", async ({ page }) => {
      await seedBrowserSession(page, admin);
      await page.addInitScript((prefix) => {
        const w = window as SpyWindow;
        const rect = (id: string): Rect | null => {
          const el = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
          const origin = document.querySelector<HTMLElement>(`[data-testid="${prefix}-manager-heading"]`);
          if (!el || !origin) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top - origin.getBoundingClientRect().top, width: r.width, height: r.height };
        };
        new MutationObserver(() => {
          if (w.__loadingSeen || !document.querySelector(`[data-testid="${prefix}-loading"]`)) return;
          const toolbar = rect(`${prefix}-toolbar`);
          const frame = rect(`${prefix}-manager-frame`);
          if (toolbar && frame) {
            w.__loadingSeen = true;
            w.__loadingSnapshot = { toolbar, frame };
          }
        }).observe(document, { childList: true, subtree: true });
      }, p);
      await page.goto(cfg.path);
      await expect(page.getByTestId(`${p}-manager`)).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId(`${p}-loading`)).toHaveCount(0, { timeout: 20_000 });

      expect(await page.evaluate(() => (window as SpyWindow).__loadingSeen), "esqueleto da 1ª carga nunca apareceu").toBe(true);
      const all = Number((await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM ${cfg.table}`))?.n ?? 0);
      await expect(page.getByTestId(`${p}-pagination-summary`)).toHaveText(`1–${Math.min(PAGE_SIZE, all)} de ${all}`);
      expect(await cardIds(page)).toHaveLength(Math.min(PAGE_SIZE, all));
      await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeDisabled();

      /** A toolbar e a casca nascem no mesmo lugar do esqueleto e ficam ali com a lista. */
      const snapshot = (await page.evaluate(() => (window as SpyWindow).__loadingSnapshot)) as LoadingSnapshot;
      const toolbar = await rectOf(page, `${p}-toolbar`);
      const frame = await rectOf(page, `${p}-manager-frame`);
      for (const key of ["x", "y", "width", "height"] as const) expect(Math.abs(toolbar[key] - snapshot.toolbar[key]), `toolbar.${key}`).toBeLessThanOrEqual(1);
      for (const key of ["x", "y", "width"] as const) expect(Math.abs(frame[key] - snapshot.frame[key]), `frame.${key}`).toBeLessThanOrEqual(1);
    });

    test("busca com debounce: digitar rápido dispara UMA consulta com o termo completo e a lista é a do banco", async ({ page }) => {
      await open(page);
      const terms: string[] = [];
      page.on("request", (r) => {
        const url = new URL(r.url());
        const term = url.searchParams.get("search");
        if (r.method() === "GET" && term) terms.push(term);
      });
      const term = `${tag}-1`;
      const response = listResponse(page, async () => {
        await page.getByTestId(`${p}-toolbar-search`).pressSequentially(term, { delay: 0 });
      });
      expect((await response).searchParams.get("search")).toBe(term);
      await expectList(page, { search: term });
      expect(terms, "a digitação não pode gerar consultas parciais").toEqual([term]);
      expect(await expectedTotal({ search: term })).toBeGreaterThan(0);

      const cleared = await listResponse(page, () => page.getByTestId(`${p}-toolbar-clear`).click());
      expect(cleared.searchParams.has("search")).toBe(false);
      await expect(page.getByTestId(`${p}-toolbar-search`)).toHaveValue("");
    });

    if (cfg.hasPublicFilter) {
      test("filtro de visibilidade isolado: Pública, Privada e Todas batem com o banco (lista e total)", async ({ page }) => {
        await open(page);
        await search(page, tag);
        await expectList(page, {});

        const publicUrl = await pick(page, "public", "true");
        expect(publicUrl.searchParams.get("public")).toBe("true");
        await expectList(page, { isPublic: true });
        for (const id of await cardIds(page)) await expect(page.getByTestId(cfg.visibilityTestId!(id))).toHaveText("Pública");

        const privateUrl = await pick(page, "public", "false");
        expect(privateUrl.searchParams.get("public")).toBe("false");
        await expectList(page, { isPublic: false });
        for (const id of await cardIds(page)) await expect(page.getByTestId(cfg.visibilityTestId!(id))).toHaveText("Privada");

        const allUrl = await pick(page, "public", "");
        expect(allUrl.searchParams.has("public")).toBe(false);
        await expectList(page, {});
      });
    }

    test("datas isoladas (a partir de / até, dia inclusivo): o resultado bate com o banco e o intervalo fora do dia fica vazio", async ({ page }) => {
      const day = await dayOfCreation();
      await open(page);
      await search(page, tag);

      const fromUrl = await setDate(page, "createdFrom", day);
      expect(fromUrl.searchParams.get("createdFrom")).toBe(day);
      await expectList(page, { from: day });

      await page.getByTestId(`${p}-toolbar-clear-filters`).click();
      await expect(page.getByTestId(`${p}-filter-createdFrom`)).toHaveValue("");
      await search(page, tag);

      const toUrl = await setDate(page, "createdTo", day);
      expect(toUrl.searchParams.get("createdTo")).toBe(day);
      await expectList(page, { to: day });

      await setDate(page, "createdTo", shiftDay(day, -1));
      await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
      expect(await expectedTotal({ to: shiftDay(day, -1) })).toBe(0);

      await setDate(page, "createdTo", "");
      await setDate(page, "createdFrom", shiftDay(day, 1));
      await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
      expect(await expectedTotal({ from: shiftDay(day, 1) })).toBe(0);
    });

    test("ordenação isolada: título A–Z, Z–A, mais antigas e mais recentes seguem a ordem do banco", async ({ page }) => {
      await open(page);
      await search(page, tag);
      for (const sort of ["title:ASC", "title:DESC", "createdAt:ASC", "createdAt:DESC"] as const) {
        const url = await pick(page, "sort", sort);
        const [by, order] = sort.split(":");
        expect(url.searchParams.get("sortBy")).toBe(by);
        expect(url.searchParams.get("order")).toBe(order);
        await expectList(page, { sort });
      }
      await expect(page.getByTestId(`${p}-filter-sort-option-all`)).toHaveCount(0);
    });

    test("filtros combinados: busca + visibilidade + data + ordenação juntos e o total do banco", async ({ page }) => {
      const day = await dayOfCreation();
      await open(page);
      const combined: Criteria = { search: `${tag}-0`, from: day, to: day, sort: "title:DESC" };
      if (cfg.hasPublicFilter) combined.isPublic = true;

      await search(page, combined.search!);
      if (cfg.hasPublicFilter) await pick(page, "public", "true");
      await setDate(page, "createdFrom", day);
      await setDate(page, "createdTo", day);
      const url = await pick(page, "sort", "title:DESC");
      expect(url.searchParams.get("search")).toBe(combined.search);
      expect(url.searchParams.get("createdFrom")).toBe(day);
      expect(url.searchParams.get("createdTo")).toBe(day);
      if (cfg.hasPublicFilter) expect(url.searchParams.get("public")).toBe("true");
      await expectList(page, combined);
      expect(await expectedTotal(combined)).toBeGreaterThan(0);

      await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeEnabled();
      const cleared = await listResponse(page, () => page.getByTestId(`${p}-toolbar-clear-filters`).click());
      for (const key of ["search", "public", "createdFrom", "createdTo"]) expect(cleared.searchParams.has(key), key).toBe(false);
      /** Limpar filtros não mexe na ordenação escolhida. */
      expect(cleared.searchParams.get("sortBy")).toBe("title");
      expect(cleared.searchParams.get("order")).toBe("DESC");
      await expect(page.getByTestId(`${p}-toolbar-search`)).toHaveValue("");
      await expect(page.getByTestId(`${p}-filter-createdFrom`)).toHaveValue("");
      await expect(page.getByTestId(`${p}-filter-createdTo`)).toHaveValue("");
      await expect(page.getByTestId(`${p}-toolbar-clear-filters`)).toBeDisabled();
      await expectList(page, { search: "", sort: "title:DESC" });
    });

    test("paginação: 1ª página com 12, próxima, anterior e ir direto para a 2ª; mudar o filtro volta à página 1", async ({ page }) => {
      await open(page);
      await search(page, tag);
      await expectList(page, {});
      expect(await cardIds(page)).toHaveLength(PAGE_SIZE);
      await expect(page.getByTestId(`${p}-pagination-summary`)).toHaveText(`1–${PAGE_SIZE} de ${TOTAL_ITEMS}`);

      const next = await gotoPage(page, "Próxima página");
      expect(next.searchParams.get("page")).toBe("2");
      await expectList(page, { page: 2 });
      expect(await cardIds(page)).toHaveLength(TOTAL_ITEMS - PAGE_SIZE);

      const previous = await gotoPage(page, "Página anterior");
      expect(previous.searchParams.get("page")).toBe("1");
      await expectList(page, { page: 1 });

      const direct = await gotoPage(page, "Ir para a página 2");
      expect(direct.searchParams.get("page")).toBe("2");
      await expectList(page, { page: 2 });

      const reset = await pick(page, "sort", "title:ASC");
      expect(reset.searchParams.get("page")).toBe("1");
      await expectList(page, { sort: "title:ASC", page: 1 });
    });

    test("vazio por filtro: busca sem resultado e filtro sem resultado mostram o vazio e '0 itens'; limpar volta a lista", async ({ page }) => {
      const day = await dayOfCreation();
      await open(page);
      await search(page, `nao-existe-${RUN_TAG}`);
      await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
      await expect(page.getByTestId(`${p}-empty`)).toContainText("Tente ajustar sua busca");
      await expect(page.getByTestId(`${p}-pagination-summary`)).toHaveText("0 itens");
      expect(await cardIds(page)).toEqual([]);

      await listResponse(page, () => page.getByTestId(`${p}-toolbar-clear-filters`).click());
      await search(page, tag);
      await expectList(page, {});

      await setDate(page, "createdFrom", shiftDay(day, 2));
      await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
      await expect(page.getByTestId(`${p}-pagination-summary`)).toHaveText("0 itens");

      await listResponse(page, () => page.getByTestId(`${p}-toolbar-clear-filters`).click());
      await expect(page.getByTestId(`${p}-empty`)).toHaveCount(0);
      expect((await cardIds(page)).length).toBeGreaterThan(0);
    });

    test("erro real da API: busca acima do limite (400 do servidor) mostra o erro e uma busca válida recupera a lista", async ({ page }) => {
      await open(page);
      const tooLong = "x".repeat(121);
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.request().method() === "GET" && isListRequest(r.url()) && r.status() === 400),
        page.getByTestId(`${p}-toolbar-search`).fill(tooLong),
      ]);
      expect(response.status()).toBe(400);
      await expect(page.getByTestId(`${p}-error`)).toBeVisible();
      await expect(page.getByTestId(`${p}-error`)).toContainText("Erro");

      await search(page, tag);
      await expect(page.getByTestId(`${p}-error`)).toHaveCount(0);
      await expectList(page, {});
    });

    test("layout estável: toolbar e casca não mudam de posição/altura entre vazio, lista, página 2 e consulta em andamento", async ({ page }) => {
      await open(page, { width: 1440, height: 900 });
      await search(page, tag);
      await expectList(page, {});
      const baseToolbar = await rectOf(page, `${p}-toolbar`);
      const baseFrame = await rectOf(page, `${p}-manager-frame`);

      /** Amostra a cada quadro enquanto a tela troca de estado: nada pode se mexer. */
      await page.evaluate((prefix) => {
        const w = window as SpyWindow;
        w.__samples = [];
        const sample = (): void => {
          const el = document.querySelector<HTMLElement>(`[data-testid="${prefix}-toolbar"]`);
          const origin = document.querySelector<HTMLElement>(`[data-testid="${prefix}-manager-heading"]`);
          if (el && origin) {
            const r = el.getBoundingClientRect();
            w.__samples!.push({ x: r.left, y: r.top - origin.getBoundingClientRect().top, width: r.width, height: r.height });
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }, p);

      const states: Array<{ name: string; frame: Rect; toolbar: Rect }> = [];
      const snap = async (name: string): Promise<void> => {
        states.push({ name, frame: await rectOf(page, `${p}-manager-frame`), toolbar: await rectOf(page, `${p}-toolbar`) });
      };
      await gotoPage(page, "Próxima página");
      await expectList(page, { page: 2 });
      await snap("página 2 (1 item)");
      await search(page, `nao-existe-${RUN_TAG}`);
      await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
      await snap("vazio");
      await search(page, tag);
      await expectList(page, {});
      await snap("lista");
      await search(page, `${tag}-0`);
      await expectList(page, { search: `${tag}-0` });
      await snap("lista filtrada");

      const samples = (await page.evaluate(() => (window as SpyWindow).__samples)) as Rect[];
      expect(samples.length).toBeGreaterThan(10);
      for (const key of ["x", "y", "width", "height"] as const) {
        const values = samples.map((s) => s[key]);
        expect(Math.max(...values) - Math.min(...values), `toolbar.${key} variou durante as trocas`).toBeLessThanOrEqual(1);
        expect(Math.abs(values[0] - baseToolbar[key]), `toolbar.${key} mudou`).toBeLessThanOrEqual(1);
      }
      for (const state of states) {
        for (const key of ["x", "y", "width"] as const) expect(Math.abs(state.frame[key] - baseFrame[key]), `${state.name}: frame.${key}`).toBeLessThanOrEqual(1);
        for (const key of ["x", "y", "width", "height"] as const) expect(Math.abs(state.toolbar[key] - baseToolbar[key]), `${state.name}: toolbar.${key}`).toBeLessThanOrEqual(1);
      }

      /** Vazio e página curta ocupam a mesma altura mínima de conteúdo: a casca não encolhe nem estica. */
      const empty = states.find((s) => s.name === "vazio")!;
      const content = await rectOf(page, `${p}-content`);
      expect(content.height).toBeGreaterThanOrEqual(420);
      expect(empty.frame.height).toBeGreaterThan(0);
    });

    test("largura desktop 1440px: a casca ocupa 95% do admin-main, sem rolagem lateral", async ({ page }) => {
      await open(page, { width: 1440, height: 900 });
      const box = await page.evaluate((id) => {
        const frame = document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
        const main = document.querySelector<HTMLElement>('[data-testid="admin-main"]')!;
        return {
          ratio: frame.getBoundingClientRect().width / main.getBoundingClientRect().width,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      }, `${p}-manager-frame`);
      expect(box.ratio).toBeGreaterThan(0.945);
      expect(box.ratio).toBeLessThan(0.955);
      expect(box.overflow).toBe(false);
    });

    test("@mobile 375px: cartões em 1 coluna, 98% da tela, filtros atrás do botão e sem rolagem lateral", async ({ page }) => {
      await open(page, { width: 375, height: 812 });
      await search(page, tag);
      await expectList(page, {});

      const box = await page.evaluate((id) => {
        const frame = document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
        const main = document.querySelector<HTMLElement>('[data-testid="admin-main"]')!;
        return {
          ratio: frame.getBoundingClientRect().width / main.getBoundingClientRect().width,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      }, `${p}-manager-frame`);
      expect(box.ratio).toBeGreaterThan(0.975);
      expect(box.ratio).toBeLessThan(0.985);
      expect(box.overflow).toBe(false);

      const [first, second] = await cardIds(page);
      const a = await page.getByTestId(`${cfg.cardPrefix}${first}`).boundingBox();
      const b = await page.getByTestId(`${cfg.cardPrefix}${second}`).boundingBox();
      expect(Math.abs(a!.x - b!.x), "1 coluna").toBeLessThanOrEqual(1);
      expect(b!.y).toBeGreaterThan(a!.y + a!.height - 2);

      const toggle = page.getByTestId(`${p}-toolbar-toggle-filters`);
      await expect(toggle).toBeVisible();
      const sortFilter = page.getByTestId(`${p}-filter-sort`);
      await expect(page.getByTestId(`${p}-filter-createdFrom`)).toBeHidden();
      await toggle.click();
      await expect(page.getByTestId(`${p}-filter-createdFrom`)).toBeVisible();
      await expect(sortFilter).toBeAttached();
      await setDate(page, "createdFrom", await dayOfCreation());
      await expectList(page, { from: await dayOfCreation() });
    });

    test("cartão: chips de seções/mídias/data, selo, ver detalhes, editar e excluir (cancelar não apaga)", async ({ page }) => {
      await open(page);
      await search(page, titleOf(1));
      const [id] = await cardIds(page);
      expect(id).toBe(ids[0]);
      const title = String((await queryOne<{ t: string }>(`SELECT ${cfg.titleColumn} AS t FROM ${cfg.table} WHERE id = ?`, [id]))?.t);
      await expect(page.getByTestId(cfg.titleTestId(id))).toHaveText(title);
      for (const chip of cfg.chips) await expect(page.getByTestId(chip.testId(id))).toHaveText(chip.text);
      if (cfg.visibilityTestId) await expect(page.getByTestId(cfg.visibilityTestId(id))).toHaveText("Pública");

      await page.getByTestId(cfg.viewTestId(id)).click();
      await expect(page.getByTestId(cfg.viewModalTestId)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId(cfg.viewModalTestId)).toHaveCount(0);

      await page.getByTestId(cfg.deleteTestId(id)).click();
      await expect(page.getByTestId(cfg.deleteDialogTestId)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId(cfg.deleteDialogTestId)).toHaveCount(0);
      expect(await expectedIds({ search: titleOf(1) })).toEqual([id]);

      if (cfg.editTestId && cfg.editUrl) {
        await page.getByTestId(cfg.editTestId(id)).click();
        await expect(page).toHaveURL(cfg.editUrl);
      }
    });

    test("exclusão pelo cartão recarrega a lista no servidor: o total cai de 14 para 13 e a 2ª página segue o banco", async ({ page, request }) => {
      const extra = await cfg.create(request, admin.accessToken, titleOf(99), true);
      ids.push(extra.id);
      await open(page);
      await search(page, tag);
      await pick(page, "sort", "createdAt:ASC");
      await expectList(page, { sort: "createdAt:ASC" });
      await expect(page.getByTestId(`${p}-pagination-summary`)).toHaveText(`1–${PAGE_SIZE} de ${TOTAL_ITEMS + 1}`);

      await gotoPage(page, "Próxima página");
      await expectList(page, { sort: "createdAt:ASC", page: 2 });
      expect(await cardIds(page)).toContain(extra.id);

      await page.getByTestId(cfg.deleteTestId(extra.id)).click();
      const reload = page.waitForResponse((r) => r.request().method() === "GET" && isListRequest(r.url()));
      await page.getByTestId(`${cfg.deleteDialogTestId}-confirm`).click();
      await reload;
      ids.splice(ids.indexOf(extra.id), 1);
      await expect(page.getByTestId(`${p}-pagination-summary`)).toHaveText(`13–${TOTAL_ITEMS} de ${TOTAL_ITEMS}`, { timeout: 15_000 });
      await expectList(page, { sort: "createdAt:ASC", page: 2 });
      expect(await expectedTotal({})).toBe(TOTAL_ITEMS);
    });
  });
}
