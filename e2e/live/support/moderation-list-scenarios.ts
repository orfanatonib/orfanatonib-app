import type { APIRequestContext } from "@playwright/test";
import { CLEANUP_ENABLED, cleanupData } from "./keep-data";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "./db";
import { authHeaders, expect, loginAs, test } from "./live";
import { localShift } from "./local-day";

/** Tag própria da fila: não contém o RUN_TAG, para a massa de outros specs do mesmo worker não entrar na contagem. */
export const RUN_TAG = `fila-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * Cenários de filtros/ordenação/paginação no servidor das FILAS DE MODERAÇÃO (fotos dos abrigos, ideias
 * compartilhadas, depoimentos). Cada área informa como criar/apagar um item pela API real e quais filtros
 * próprios existem; o contrato comum (sem `page` → array legado, `{ data, meta }` com `page`, `sortBy` por
 * whitelist, 400 nos inválidos, só admin) é o mesmo.
 */
export interface ModerationFilterCase {
  name: string;
  query: string;
  /** Rótulos esperados (ordenados por rótulo ASC). */
  expected: string[];
  /** SQL extra (depois do `LIKE` do rótulo) cujo COUNT deve bater com o total da resposta paginada. */
  dbWhere?: string;
  /** Não junta a busca pela tag: só os itens desta execução entram na comparação (ex.: busca por autor). */
  noBase?: boolean;
}

export interface ModerationListConfig {
  title: string;
  endpoint: string;
  table: string;
  /** Coluna do rótulo/ordenação principal (`caption`, `title`, `name`) e o nome dela na API (`sortBy`). */
  labelColumn: string;
  sortKey: string;
  /** Cria o item `index` (0..4) com o rótulo (já com a tag da execução) e o texto de descrição. */
  create: (
    request: APIRequestContext,
    ctx: { admin: string; member: string; leader: string; memberId: string; leaderId: string },
    input: { index: number; label: string; text: string; description: string },
  ) => Promise<{ id: string }>;
  /** Depois de criar todos (ex.: reprovar/publicar alguns). */
  afterCreate?: (request: APIRequestContext, ctx: { admin: string }, ids: Record<string, string>) => Promise<void>;
  remove: (request: APIRequestContext, admin: string, id: string) => Promise<void>;
  /** Flags que a leitura exige (ligadas durante o cenário e restauradas). */
  flags: readonly string[];
  /** Campo do corpo que carrega o rótulo. */
  labelOf: (item: Record<string, unknown>) => string;
  /** Filtros próprios da área; `{memberId}`/`{leaderId}` na query viram os ids das contas do E2E. */
  filters: ModerationFilterCase[];
  /** Querystring inválida própria da área (além das comuns). */
  invalid: string[];
  /** Ordenações extras (além do rótulo e createdAt). */
  extraSorts?: Array<{ query: string; expected: string[] }>;
}

const LABELS = ["alpha", "bravo", "charlie", "delta", "echo"] as const;
const day = (offset: number): string => localShift(offset);

interface Meta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  orderBy?: string;
  order?: string;
}
interface Paged {
  data: Array<Record<string, unknown>>;
  meta: Meta;
}

export function defineModerationListFilterScenarios(config: ModerationListConfig): void {
  const zebra = `${RUN_TAG}-zebra`;
  const label = (name: string): string => `${RUN_TAG}-${name}`;

  test.describe.serial(config.title, () => {
    let admin: string;
    let member: string;
    let leader: string;
    let memberId = "";
    let leaderId = "";
    const ids: Record<string, string> = {};
    const flagsBefore: Record<string, boolean> = {};
    const base = `search=${encodeURIComponent(RUN_TAG)}`;

    const get = (request: APIRequestContext, query: string, token?: string) =>
      request.get(`${API_URL}${config.endpoint}?${query}`, token ? { headers: authHeaders(token) } : undefined);
    const paged = async (request: APIRequestContext, query: string): Promise<Paged> => {
      const response = await get(request, query, admin);
      expect(response.status(), await response.text()).toBe(200);
      const body = (await response.json()) as Paged;
      expect(Array.isArray(body), "com page a resposta é { data, meta }").toBe(false);
      return body;
    };
    const array = async (request: APIRequestContext, query: string): Promise<Array<Record<string, unknown>>> => {
      const response = await get(request, query, admin);
      expect(response.status(), await response.text()).toBe(200);
      const body = (await response.json()) as Array<Record<string, unknown>>;
      expect(Array.isArray(body), "sem page a resposta continua sendo o array legado").toBe(true);
      return body;
    };
    const fill = (query: string): string => query.replace("{memberId}", memberId).replace("{leaderId}", leaderId);
    const labels = (items: Array<Record<string, unknown>>): string[] =>
      items.map((item) => config.labelOf(item).replace(`${RUN_TAG}-`, ""));
    const dbCount = async (extra = ""): Promise<number> =>
      Number(
        (await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM ${config.table} WHERE ${config.labelColumn} LIKE ? ${extra}`, [
          `%${RUN_TAG}%`,
        ]))?.n ?? 0,
      );
    const setFlag = (request: APIRequestContext, key: string, enabled: boolean) =>
      request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled } });

    test.beforeAll(async ({ request }) => {
      admin = (await loginAs(request, "admin")).accessToken;
      const memberLogin = await loginAs(request, "member");
      const leaderLogin = await loginAs(request, "leader");
      member = memberLogin.accessToken;
      leader = leaderLogin.accessToken;
      memberId = memberLogin.userId;
      leaderId = leaderLogin.userId;
      for (const key of config.flags) {
        flagsBefore[key] = ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
        await setFlag(request, key, true);
      }
      for (const [index, name] of LABELS.entries()) {
        const created = await config.create(
          request,
          { admin, member, leader, memberId, leaderId },
          {
            index,
            label: label(name),
            text: name === "charlie" ? `Texto com ${zebra}` : `Texto de ${name}`,
            description: name === "charlie" ? `Descrição com ${zebra}` : `Descrição de ${name}`,
          },
        );
        ids[name] = created.id;
      }
      await config.afterCreate?.(request, { admin }, ids);
    });

    test.afterAll(async ({ request }) => {
      await cleanupData(async () => {
        for (const id of Object.values(ids)) await config.remove(request, admin, id);
      });
      for (const key of config.flags) await setFlag(request, key, flagsBefore[key]);
      if (CLEANUP_ENABLED) expect(await dbCount(), "a limpeza deixou itens do E2E").toBe(0);
      await closeDb();
    });

    test("sem page: array legado com os cinco itens do cenário", async ({ request }) => {
      const items = await array(request, base);
      expect(labels(items).sort()).toEqual([...LABELS]);
    });

    test("busca por rótulo e por descrição é isolada e o total bate com o banco", async ({ request }) => {
      expect(labels(await array(request, `search=${encodeURIComponent(label("alpha"))}`))).toEqual(["alpha"]);
      expect(labels(await array(request, `search=${encodeURIComponent(zebra)}`))).toEqual(["charlie"]);
      const body = await paged(request, `${base}&page=1&limit=100`);
      expect(body.meta.totalItems).toBe(await dbCount());
    });

    test("curingas do LIKE são escapados: % e _ valem como texto", async ({ request }) => {
      expect(await array(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
      expect(await array(request, `search=${encodeURIComponent(`${RUN_TAG}_alpha`)}`)).toEqual([]);
    });

    test("período de criação: hoje traz tudo; amanhã (de) e ontem (até) esvaziam; total e página vazia coerentes", async ({ request }) => {
      expect(await array(request, `${base}&createdFrom=${day(0)}&createdTo=${day(0)}`)).toHaveLength(5);
      expect(await array(request, `${base}&createdFrom=${day(1)}`)).toEqual([]);
      expect(await array(request, `${base}&createdTo=${day(-1)}`)).toEqual([]);
      const body = await paged(request, `${base}&createdFrom=${day(1)}&page=1`);
      expect(body).toMatchObject({ data: [], meta: { totalItems: 0, totalPages: 1 } });
    });

    test("filtros próprios, isolados: o resultado bate com o esperado e o total com o banco", async ({ request }) => {
      for (const filter of config.filters) {
        const prefix = filter.noBase ? "" : `${base}&`;
        const query = `${prefix}${fill(filter.query)}&sortBy=${config.sortKey}&order=ASC`;
        const own = (items: Array<Record<string, unknown>>) =>
          items.filter((item) => config.labelOf(item).startsWith(`${RUN_TAG}-`));
        expect(labels(own(await array(request, query))), filter.name).toEqual(filter.expected);
        if (filter.noBase) continue;
        const body = await paged(request, `${query}&page=1`);
        expect(labels(body.data), `${filter.name} paginado`).toEqual(filter.expected);
        expect(body.meta.totalItems, `${filter.name} total`).toBe(filter.expected.length);
        if (filter.dbWhere) expect(body.meta.totalItems, `${filter.name} banco`).toBe(await dbCount(fill(filter.dbWhere)));
      }
    });

    test("filtros combinados + paginação: página 1, 2 e fora do alcance", async ({ request }) => {
      const limit = 2;
      const where = `${base}&createdFrom=${day(0)}&createdTo=${day(0)}`;
      const first = await paged(request, `${where}&sortBy=${config.sortKey}&order=ASC&page=1&limit=${limit}`);
      expect(labels(first.data)).toEqual([...LABELS].slice(0, limit));
      expect(first.meta).toMatchObject({ page: 1, limit, totalItems: 5, totalPages: 3, orderBy: config.sortKey, order: "ASC" });
      const second = await paged(request, `${where}&sortBy=${config.sortKey}&order=ASC&page=2&limit=${limit}`);
      expect(labels(second.data)).toEqual([...LABELS].slice(limit, limit * 2));
      const last = await paged(request, `${where}&sortBy=${config.sortKey}&order=ASC&page=3&limit=${limit}`);
      expect(labels(last.data)).toEqual(["echo"]);
      const beyond = await paged(request, `${where}&sortBy=${config.sortKey}&order=ASC&page=99&limit=${limit}`);
      expect(beyond.data).toEqual([]);
      expect(beyond.meta.totalItems).toBe(5);
      if (config.filters.length > 0) {
        const filter = config.filters.find((item) => !item.noBase) ?? config.filters[0];
        const combined = await paged(request, `${where}&${fill(filter.query)}&sortBy=${config.sortKey}&order=DESC&page=1&limit=${limit}`);
        expect(labels(combined.data)).toEqual([...filter.expected].reverse().slice(0, limit));
        expect(combined.meta.totalItems).toBe(filter.expected.length);
      }
    });

    test("ordenação: rótulo ASC/DESC, createdAt ASC e o padrão com page (createdAt DESC)", async ({ request }) => {
      expect(labels((await paged(request, `${base}&sortBy=${config.sortKey}&order=DESC&page=1`)).data)).toEqual([...LABELS].reverse());
      expect(labels((await paged(request, `${base}&sortBy=${config.sortKey}&order=ASC&page=1`)).data)).toEqual([...LABELS]);
      expect(labels((await paged(request, `${base}&sortBy=createdAt&order=ASC&page=1`)).data)).toEqual([...LABELS]);
      expect(labels((await paged(request, `${base}&page=1`)).data)).toEqual([...LABELS].reverse());
      for (const sort of config.extraSorts ?? []) {
        expect(labels((await paged(request, `${base}&${sort.query}&page=1`)).data), sort.query).toEqual(sort.expected);
      }
    });

    test("parâmetros inválidos são 400 (sortBy fora da lista, page=0, limit=101, datas, order, desconhecido)", async ({ request }) => {
      const bad = [
        "sortBy=id",
        "sortBy=password",
        "page=0",
        "page=abc",
        "limit=101",
        "limit=0",
        "createdFrom=01/01/2026",
        "createdTo=ontem",
        "order=UP",
        "foo=bar",
        ...config.invalid,
      ];
      for (const query of bad) {
        const response = await get(request, `${base}&${query}`, admin);
        expect(response.status(), `${query}: ${await response.text()}`).toBe(400);
      }
    });

    test("autorização igual à atual: visitante 401; membro e líder 403 (sem vazar a fila)", async ({ request }) => {
      expect((await get(request, base)).status()).toBe(401);
      expect((await get(request, `${base}&page=1`)).status()).toBe(401);
      for (const token of [member, leader]) {
        expect((await get(request, base, token)).status()).toBe(403);
        expect((await get(request, `${base}&page=1`, token)).status()).toBe(403);
      }
    });

    test("flag de moderação desligada: 403 FEATURE_DISABLED mesmo com filtros; ligada de novo, a lista volta", async ({ request }) => {
      const key = config.flags[config.flags.length - 1];
      await setFlag(request, key, false);
      try {
        const response = await get(request, `${base}&page=1`, admin);
        expect(response.status()).toBe(403);
        expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
      } finally {
        await setFlag(request, key, true);
      }
      expect((await paged(request, `${base}&page=1`)).meta.totalItems).toBe(5);
    });
  });
}
