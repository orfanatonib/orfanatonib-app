import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { cleanupData, massCount } from "../support/keep-data";
import { localShift } from "../support/local-day";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { create, deleteRaw, informativesWithTag, type InformativeBody } from "./support";

/**
 * Filtros de `GET /informatives` aplicados no banco: search (title/description), public=true|false, createdFrom/To,
 * sortBy, page/limit. Cria os próprios banners (RUN_TAG) e apaga no afterAll. Sem `page`: array legado.
 */
interface Paged {
  data: Array<{ id: string; title: string; public: boolean }>;
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string };
}


test.describe.serial("Informativos — filtros da listagem no servidor", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];
  const items: Record<string, InformativeBody> = {};

  const list = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/informatives${query}`, { headers: token ? authHeaders(token) : {} });
  const scoped = (extra = ""): string => `search=${encodeURIComponent(RUN_TAG)}${extra ? `&${extra}` : ""}`;
  const paged = async (request: APIRequestContext, query: string): Promise<Paged> => {
    const res = await list(request, `?${query}`);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const idsOf = async (request: APIRequestContext, query: string): Promise<string[]> =>
    (await paged(request, `${query}&page=1&limit=100`)).data.map((d) => d.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    const make = async (key: string, title: string, description: string, isPublic: boolean) => {
      const item = await create(request, admin, { title: `${RUN_TAG}-${title}`, description, public: isPublic });
      created.push(item.id);
      items[key] = item;
    };
    await make("a", "alfa", `${RUN_TAG} culto texto`, true);
    await make("b", "beta", `${RUN_TAG} festa texto 50%_x`, false);
    await make("c", "gama", `${RUN_TAG} culto especial`, true);
    await make("d", "delta", "reuniao interna", false);
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of created) await deleteRaw(request, admin, id);
      expect(await informativesWithTag(RUN_TAG), "a limpeza deixou informativos do E2E").toBe(0);
    });
    await closeDb();
  });

  test("sem page: array legado (createdAt DESC) com públicos e privados", async ({ request }) => {
    const res = await list(request, `?${scoped()}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Array<{ id: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.map((i) => i.id)).toEqual([...created].reverse());
  });

  test("com page: envelope com total filtrado e orderBy padrão createdAt", async ({ request }) => {
    const page = await paged(request, scoped("page=1&limit=100"));
    expect(page.meta).toMatchObject({ page: 1, limit: 100, totalItems: 4, totalPages: 1, orderBy: "createdAt" });
  });

  test("search isolado: title, description e curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-alfa`)}`)).toEqual([items.a.id]);
    const byDescription = await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} culto`)}`);
    expect(byDescription).toEqual(expect.arrayContaining([items.a.id, items.c.id]));
    expect(byDescription).not.toContain(items.b.id);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} festa texto 50%_x`)}`)).toEqual([items.b.id]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} festa texto 50%_y`)}`)).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
  });

  test("public=true e public=false isolados batem com o banco", async ({ request }) => {
    const pub = await paged(request, scoped("public=true&page=1&limit=100"));
    expect(pub.data.map((i) => i.id).sort()).toEqual([items.a.id, items.c.id].sort());
    expect(pub.data.every((i) => i.public)).toBe(true);
    const priv = await paged(request, scoped("public=false&page=1&limit=100"));
    expect(priv.data.map((i) => i.id).sort()).toEqual([items.b.id, items.d.id].sort());
    expect(priv.data.every((i) => !i.public)).toBe(true);
    const row = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM informatives WHERE title LIKE ? AND `public` = 0", [`%${RUN_TAG}%`]);
    expect(priv.meta.totalItems).toBe(Number(row?.n));
  });

  test("createdFrom/createdTo: hoje inclui tudo; amanhã ou ontem excluem", async ({ request }) => {
    const today = localShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1&limit=100`))).meta.totalItems).toBe(4);
    expect((await paged(request, scoped(`createdFrom=${localShift(2)}&page=1`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${localShift(-2)}&page=1`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: search + public + createdFrom", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} culto`)}&public=true&createdFrom=${localShift(0)}`)).toEqual(
      expect.arrayContaining([items.a.id, items.c.id]),
    );
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} culto`)}&public=false`)).toEqual([]);
  });

  test("sortBy title ASC/DESC e createdAt ASC", async ({ request }) => {
    const asc = await paged(request, scoped("sortBy=title&order=ASC&page=1&limit=100"));
    const titles = asc.data.map((i) => i.title);
    expect(titles).toEqual([...titles].sort());
    expect(asc.meta.orderBy).toBe("title");
    const desc = await paged(request, scoped("sortBy=title&order=DESC&page=1&limit=100"));
    expect(desc.data.map((i) => i.title)).toEqual([...titles].reverse());
    const oldest = await paged(request, scoped("sortBy=createdAt&order=ASC&page=1&limit=100"));
    expect(oldest.data.map((i) => i.id)).toEqual(created);
  });

  test("paginação: página 2 sem repetição; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("sortBy=title&order=ASC&page=1&limit=3"));
    const p2 = await paged(request, scoped("sortBy=title&order=ASC&page=2&limit=3"));
    expect(p1.meta).toMatchObject({ totalItems: 4, totalPages: 2, limit: 3 });
    expect(p1.data).toHaveLength(3);
    expect(p2.data).toHaveLength(1);
    expect(p1.data.map((i) => i.id)).not.toContain(p2.data[0].id);
    const beyond = await paged(request, scoped("page=9&limit=3"));
    expect(beyond.data).toEqual([]);
    expect(beyond.meta.totalItems).toBe(4);
  });

  test("validação: sortBy/public/datas inválidos, page=0, limit=101 e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["sortBy=route", "public=talvez", "createdFrom=ontem", "createdTo=2026-13-01", "page=0", "limit=101", "order=UP", "uploadType=link", "foo=bar"]) {
      expect((await list(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro 200 e vê privadas filtradas por public=false", async ({ request }) => {
    expect((await list(request, `?${scoped("public=false")}`, null)).status()).toBe(401);
    const asMember = await list(request, `?${scoped("public=false&page=1")}`, member);
    expect(asMember.status()).toBe(200);
    expect(((await asMember.json()) as Paged).meta.totalItems).toBe(2);
  });

  test("massa: deixa 5 a 10 informativos novos, públicos e privados", async ({ request }) => {
    const total = massCount();
    for (let index = 0; index < total; index += 1) {
      const item = await create(request, admin, {
        title: `${RUN_TAG}-massa-${index + 1}`,
        description: `Informativo de massa ${index + 1}`,
        public: index % 2 === 0,
      });
      created.push(item.id);
    }
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-massa-`)}`)).toHaveLength(total);
  });
});
