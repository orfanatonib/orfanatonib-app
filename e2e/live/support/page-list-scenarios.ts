import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "./db";
import { localShift } from "./local-day";
import { cleanupData, massCount } from "./keep-data";
import { expectNoBrokenRefs, expectNoOrphans } from "./s3";
import { authHeaders, expect, loginAs, test } from "./live";

/**
 * Cenários de filtros/ordenação/paginação no servidor das listas de páginas
 * (`/image-pages`, `/video-pages`, `/ideas-pages`). Cada área só informa como criar/apagar
 * uma página pela API real e qual tabela conferir; o contrato é o mesmo.
 */
export interface PageListConfig {
  title: string;
  endpoint: string;
  /** Tabela e coluna do título, para conferir o total direto no banco. */
  table: string;
  titleColumn: string;
  /** Chave dos filhos no corpo (`sections` ou `videos`), que precisam vir só para a janela. */
  childKey: string;
  /** Tem filtro `public` e visitante só vê públicas (galerias e vídeos). */
  hasPublic: boolean;
  /** Leitura anônima permitida (galerias e vídeos); ideias exige sessão. */
  anonymousRead: boolean;
  create: (
    request: APIRequestContext,
    token: string,
    input: { title: string; description: string; isPublic: boolean },
  ) => Promise<{ id: string }>;
  remove: (request: APIRequestContext, token: string, id: string) => Promise<void>;
}

interface Meta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  orderBy?: string;
  order?: string;
}
interface Item {
  id: string;
  title: string;
  public?: boolean;
  [key: string]: unknown;
}
interface Paged {
  data: Item[];
  meta: Meta;
}

/**
 * Marca própria destes cenários, sem conter o `RUN_TAG` da execução: as páginas dela ficam no banco
 * (massa acumulada) e os outros specs de página contam as suas por `RUN_TAG`.
 */
const LIST_TAG = `lista-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const LABELS = ["alpha", "bravo", "charlie", "delta", "echo"] as const;
/** bravo e delta são privadas (nas áreas com `public`). */
const PRIVATE = new Set(["bravo", "delta"]);
const day = (offset: number): string => localShift(offset);

export function definePageListFilterScenarios(config: PageListConfig): void {
  const tag = (label: string): string => `${LIST_TAG}-${label}`;
  const zebra = `${LIST_TAG}-zebra`;

  test.describe.serial(config.title, () => {
    let admin: string;
    let member: string;
    const created: Record<string, string> = {};
    const mass: string[] = [];
    const base = `search=${encodeURIComponent(LIST_TAG)}`;

    const get = (request: APIRequestContext, query: string, token?: string) =>
      request.get(`${API_URL}${config.endpoint}?${query}`, token ? { headers: authHeaders(token) } : undefined);
    const paged = async (request: APIRequestContext, query: string, token = admin): Promise<Paged> => {
      const response = await get(request, query, token);
      expect(response.status(), await response.text()).toBe(200);
      const body = (await response.json()) as Paged;
      expect(Array.isArray(body), "com page a resposta é { data, meta }").toBe(false);
      return body;
    };
    const array = async (request: APIRequestContext, query: string, token?: string): Promise<Item[]> => {
      const response = await get(request, query, token);
      expect(response.status(), await response.text()).toBe(200);
      const body = (await response.json()) as Item[];
      expect(Array.isArray(body), "sem page a resposta continua sendo o array legado").toBe(true);
      return body;
    };
    const titles = (items: Item[]): string[] => items.map((item) => item.title.replace(`${LIST_TAG}-`, ""));
    const dbCount = async (extra = ""): Promise<number> =>
      Number(
        (await queryOne<{ n: number }>(
          `SELECT COUNT(*) AS n FROM ${config.table} WHERE ${config.titleColumn} LIKE ? ${extra}`,
          [`%${LIST_TAG}%`],
        ))?.n ?? 0,
      );

    test.beforeAll(async ({ request }) => {
      admin = (await loginAs(request, "admin")).accessToken;
      member = (await loginAs(request, "member")).accessToken;
      for (const label of LABELS) {
        const page = await config.create(request, admin, {
          title: tag(label),
          // só a "charlie" carrega a palavra rara na descrição (busca por descrição)
          description: label === "charlie" ? `Descrição com ${zebra}` : `Descrição de ${label}`,
          isPublic: !PRIVATE.has(label),
        });
        created[label] = page.id;
      }
    });

    test.afterAll(async ({ request }) => {
      // Massa acumulada: só apaga com E2E_CLEANUP=1; fechar o banco é sempre.
      await cleanupData(async () => {
        for (const id of [...Object.values(created), ...mass]) await config.remove(request, admin, id);
        expect(await dbCount(), "a limpeza deixou páginas do E2E").toBe(0);
      });
      // Invariante global do bucket (não "voltou ao tamanho de antes"): sem objeto órfão nem referência quebrada.
      await expectNoOrphans();
      await expectNoBrokenRefs();
      await closeDb();
    });

    test("sem page: array legado em id ASC, com as cinco páginas do cenário", async ({ request }) => {
      const items = await array(request, base, admin);
      expect(items).toHaveLength(5);
      const ids = items.map((item) => item.id);
      expect(ids).toEqual([...ids].sort());
      expect(titles(items).sort()).toEqual([...LABELS]);
    });

    test("busca por título e por descrição é isolada e o total bate com o banco", async ({ request }) => {
      expect(titles(await array(request, `search=${encodeURIComponent(tag("alpha"))}`, admin))).toEqual(["alpha"]);
      expect(titles(await array(request, `search=${encodeURIComponent(zebra)}`, admin))).toEqual(["charlie"]);
      const body = await paged(request, `${base}&page=1&limit=100`);
      expect(body.meta.totalItems).toBe(await dbCount());
    });

    test("curingas do LIKE são escapados: % e _ valem como texto", async ({ request }) => {
      expect(await array(request, `search=${encodeURIComponent(`${LIST_TAG}-%`)}`, admin)).toEqual([]);
      expect(await array(request, `search=${encodeURIComponent(`${LIST_TAG}_alpha`)}`, admin)).toEqual([]);
    });

    test("período de criação: hoje traz tudo; amanhã (de) e ontem (até) esvaziam", async ({ request }) => {
      expect(await array(request, `${base}&createdFrom=${day(0)}&createdTo=${day(0)}`, admin)).toHaveLength(5);
      expect(await array(request, `${base}&createdFrom=${day(1)}`, admin)).toEqual([]);
      expect(await array(request, `${base}&createdTo=${day(-1)}`, admin)).toEqual([]);
      const body = await paged(request, `${base}&createdFrom=${day(1)}&page=1`);
      expect(body).toMatchObject({ data: [], meta: { totalItems: 0, totalPages: 1 } });
    });

    if (config.hasPublic) {
      test("public=true|false filtra no banco e o total reflete o filtro", async ({ request }) => {
        expect(titles(await array(request, `${base}&public=true&sortBy=title&order=ASC`, admin))).toEqual([
          "alpha",
          "charlie",
          "echo",
        ]);
        const priv = await paged(request, `${base}&public=false&sortBy=title&order=ASC&page=1`);
        expect(titles(priv.data)).toEqual(["bravo", "delta"]);
        expect(priv.meta.totalItems).toBe(await dbCount("AND public = 0"));
      });
    } else {
      test("não existe filtro public: a página de ideias é sempre privada (400)", async ({ request }) => {
        expect((await get(request, `${base}&public=true`, admin)).status()).toBe(400);
      });
    }

    test("combinado + paginação: filtro, ordenação por título, página 1, 2 e fora do alcance", async ({ request }) => {
      const where = config.hasPublic ? `${base}&public=true` : base;
      const expected = config.hasPublic ? ["alpha", "charlie", "echo"] : [...LABELS];
      const limit = 2;
      const first = await paged(request, `${where}&sortBy=title&order=ASC&page=1&limit=${limit}`);
      expect(titles(first.data)).toEqual(expected.slice(0, limit));
      expect(first.meta).toMatchObject({
        page: 1,
        limit,
        totalItems: expected.length,
        totalPages: Math.ceil(expected.length / limit),
        orderBy: "title",
        order: "ASC",
      });
      const second = await paged(request, `${where}&sortBy=title&order=ASC&page=2&limit=${limit}`);
      expect(titles(second.data)).toEqual(expected.slice(limit, limit * 2));
      const beyond = await paged(request, `${where}&sortBy=title&order=ASC&page=99&limit=${limit}`);
      expect(beyond.data).toEqual([]);
      expect(beyond.meta.totalItems).toBe(expected.length);
    });

    test("ordenação: title ASC/DESC, createdAt ASC e padrão com page (createdAt DESC)", async ({ request }) => {
      expect(titles(await array(request, `${base}&sortBy=title&order=DESC`, admin))).toEqual([...LABELS].reverse());
      expect(titles((await paged(request, `${base}&sortBy=title&order=ASC&page=1`)).data)).toEqual([...LABELS]);
      expect(titles((await paged(request, `${base}&sortBy=createdAt&order=ASC&page=1`)).data)).toEqual([...LABELS]);
      expect(titles((await paged(request, `${base}&page=1`)).data)).toEqual([...LABELS].reverse());
    });

    test("cada item da janela traz seus filhos (carregados só para a página pedida)", async ({ request }) => {
      const body = await paged(request, `${base}&sortBy=title&order=ASC&page=2&limit=2`);
      expect(body.data).toHaveLength(2);
      for (const item of body.data) {
        expect((item[config.childKey] as unknown[]).length, `${item.title} sem ${config.childKey}`).toBeGreaterThan(0);
      }
    });

    test("parâmetros inválidos são 400 (sortBy fora da lista, page=0, limit=101, public, datas, order, desconhecido)", async ({
      request,
    }) => {
      const bad = [
        "sortBy=name",
        "sortBy=id",
        "page=0",
        "page=abc",
        "limit=101",
        "limit=0",
        "createdFrom=01/01/2026",
        "createdTo=ontem",
        "order=UP",
        "foo=bar",
        ...(config.hasPublic ? ["public=talvez"] : []),
      ];
      for (const query of bad) {
        const response = await get(request, `${base}&${query}`, admin);
        expect(response.status(), `${query}: ${await response.text()}`).toBe(400);
      }
    });

    if (config.anonymousRead) {
      test("visitante: só públicas; public=false dele devolve vazio e não vaza privadas", async ({ request }) => {
        expect(titles(await array(request, `${base}&sortBy=title&order=ASC`))).toEqual(["alpha", "charlie", "echo"]);
        expect(await array(request, `${base}&public=false`)).toEqual([]);
        const body = (await (await get(request, `${base}&public=false&page=1`)).json()) as Paged;
        expect(body).toMatchObject({ data: [], meta: { totalItems: 0 } });
        const publicOnly = (await (await get(request, `${base}&page=1&limit=2&sortBy=title&order=ASC`)).json()) as Paged;
        expect(publicOnly.meta.totalItems).toBe(3);
        expect(titles(publicOnly.data)).toEqual(["alpha", "charlie"]);
      });

      test("membro com sessão enxerga todas (visibilidade igual à de antes)", async ({ request }) => {
        expect(await array(request, base, member)).toHaveLength(5);
      });
    } else {
      test("autorização igual à atual: visitante 401; membro com sessão lê a lista filtrada", async ({ request }) => {
        expect((await get(request, base)).status()).toBe(401);
        expect((await get(request, `${base}&page=1`)).status()).toBe(401);
        expect(await array(request, base, member)).toHaveLength(5);
        expect((await paged(request, `${base}&page=1&limit=2`, member)).meta.totalItems).toBe(5);
      });
    }

    test("massa: deixa de 5 a 10 páginas novas por execução (ficam no banco; E2E_CLEANUP=1 apaga)", async ({ request }) => {
      const count = massCount();
      const stamp = `massa-lista-${Date.now().toString(36)}`;
      for (let n = 1; n <= count; n += 1) {
        const page = await config.create(request, admin, {
          title: `${stamp}-${n}`,
          description: `Massa de lista ${n} de ${count}`,
          isPublic: n % 2 === 1,
        });
        mass.push(page.id);
      }
      expect(mass).toHaveLength(count);
      // Totais globais mudam a cada rodada: compara com o SELECT feito no mesmo instante.
      const body = await paged(request, `search=${encodeURIComponent(stamp)}&page=1&limit=100`);
      expect(body.meta.totalItems).toBe(count);
      const row = await queryOne<{ n: number }>(
        `SELECT COUNT(*) AS n FROM ${config.table} WHERE ${config.titleColumn} LIKE ?`,
        [`%${stamp}%`],
      );
      expect(Number(row?.n)).toBe(count);
    });
  });
}
