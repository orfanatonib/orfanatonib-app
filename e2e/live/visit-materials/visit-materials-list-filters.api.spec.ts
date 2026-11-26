import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createMaterial, deletePageApi, label, pagesWithTag, type PageBody } from "./support";
import { cleanupData } from "../support/keep-data";
import { localShift } from "../support/local-day";

/**
 * Filtros de `GET /visit-material-pages` aplicados no banco: search/searchString, testament, category, public, currentWeek,
 * createdFrom/To, sortBy/order, page/limit. Cria os próprios materiais (RUN_TAG); a massa fica (limpeza só com E2E_CLEANUP=1).
 * Sem `page` continua o array legado.
 */
interface Paged {
  data: Array<{ id: string; title: string; testament: string }>;
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string };
}

const utcShift = (days: number): string => localShift(days);

test.describe.serial("Materiais de visita — filtros da listagem no servidor", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];
  const pages: Record<string, PageBody> = {};

  const list = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/visit-material-pages${query}`, { headers: token ? authHeaders(token) : {} });
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
    const make = async (key: string, input: Parameters<typeof createMaterial>[2]) => {
      const page = await createMaterial(request, admin, input);
      created.push(page.id);
      pages[key] = page;
    };
    await make("a", { title: label("alfa"), description: `estudo da cozinha-${RUN_TAG} 50%_x`, testament: "OLD_TESTAMENT", categories: ["BABY"] });
    await make("b", { title: label("beta"), description: "outro texto", testament: "NEW_TESTAMENT", categories: ["TEEN", "ADULT"] });
    await make("c", { title: label("gama"), subtitle: `subtitulo-unico-${RUN_TAG}`, testament: "NEW_TESTAMENT" });
    await make("d", { title: label("delta"), testament: "OLD_TESTAMENT" });
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of created) await deletePageApi(request, admin, id);
      expect(await pagesWithTag(RUN_TAG), "a limpeza deixou materiais do E2E").toBe(0);
    });
    await closeDb();
  });

  test("sem page: array legado e sem envelope; searchString continua valendo", async ({ request }) => {
    const res = await list(request, `?searchString=${encodeURIComponent(RUN_TAG)}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Array<{ id: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.map((p) => p.id)).toEqual([...created].reverse());
  });

  test("com page: envelope com total filtrado e orderBy padrão createdAt", async ({ request }) => {
    const page = await paged(request, scoped("page=1&limit=100"));
    expect(page.meta).toMatchObject({ page: 1, limit: 100, totalItems: 4, totalPages: 1, orderBy: "createdAt" });
  });

  test("search isolado: título, subtítulo, descrição e curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(label("alfa"))}`)).toEqual([pages.a.id]);
    expect(await idsOf(request, `search=${encodeURIComponent(`subtitulo-unico-${RUN_TAG}`)}`)).toEqual([pages.c.id]);
    expect(await idsOf(request, `search=${encodeURIComponent(`cozinha-${RUN_TAG} 50%_x`)}`)).toEqual([pages.a.id]);
    expect(await idsOf(request, `search=${encodeURIComponent(`cozinha-${RUN_TAG} 50%_y`)}`)).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
  });

  test("testament e category isolados batem com o banco", async ({ request }) => {
    const nt = await paged(request, scoped("testament=NEW_TESTAMENT&page=1&limit=100"));
    expect(nt.data.map((p) => p.id).sort()).toEqual([pages.b.id, pages.c.id].sort());
    const dbNt = Number(
      (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM visit_material_pages WHERE title LIKE ? AND testament = 'NEW_TESTAMENT'", [`%${RUN_TAG}%`]))?.n,
    );
    expect(nt.meta.totalItems).toBe(dbNt);
    expect(await idsOf(request, scoped("category=TEEN"))).toEqual([pages.b.id]);
    expect(await idsOf(request, scoped("category=BABY"))).toEqual([pages.a.id]);
    expect(await idsOf(request, scoped("category=CHILD"))).toEqual([]);
  });

  test("public e currentWeek isolados: rota pública e flag da semana", async ({ request }) => {
    expect((await paged(request, scoped("public=true&page=1&limit=100"))).meta.totalItems).toBe(4);
    expect((await paged(request, scoped("public=false&page=1"))).meta.totalItems).toBe(0);
    const notCurrent = (await paged(request, scoped("currentWeek=false&page=1&limit=100"))).meta.totalItems;
    const current = (await paged(request, scoped("currentWeek=true&page=1&limit=100"))).meta.totalItems;
    expect(notCurrent + current).toBe(4);
    const dbCurrent = Number(
      (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM visit_material_pages WHERE title LIKE ? AND currentWeek = 1", [`%${RUN_TAG}%`]))?.n,
    );
    expect(current).toBe(dbCurrent);
  });

  test("createdFrom/createdTo: hoje inclui tudo; amanhã ou ontem excluem", async ({ request }) => {
    const today = utcShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1&limit=100`))).meta.totalItems).toBe(4);
    expect((await paged(request, scoped(`createdFrom=${utcShift(2)}&page=1`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${utcShift(-2)}&page=1`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: search + testament + category + createdFrom", async ({ request }) => {
    const out = await idsOf(request, `search=${encodeURIComponent(RUN_TAG)}&testament=NEW_TESTAMENT&category=ADULT&createdFrom=${utcShift(0)}`);
    expect(out).toEqual([pages.b.id]);
  });

  test("sortBy title ASC/DESC, testament e createdAt ASC", async ({ request }) => {
    const asc = await paged(request, scoped("sortBy=title&order=ASC&page=1&limit=100"));
    const titles = asc.data.map((p) => p.title);
    expect(titles).toEqual([...titles].sort());
    expect(asc.meta.orderBy).toBe("title");
    const desc = await paged(request, scoped("sortBy=title&order=DESC&page=1&limit=100"));
    expect(desc.data.map((p) => p.title)).toEqual([...titles].reverse());
    const byTestament = await paged(request, scoped("sortBy=testament&order=ASC&page=1&limit=100"));
    expect(byTestament.data.map((p) => p.testament)).toEqual(["OLD_TESTAMENT", "OLD_TESTAMENT", "NEW_TESTAMENT", "NEW_TESTAMENT"]);
    const oldest = await paged(request, scoped("sortBy=createdAt&order=ASC&page=1&limit=100"));
    expect(oldest.data.map((p) => p.id)).toEqual(created);
  });

  test("paginação: página 1 e 2 sem repetição; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("sortBy=title&order=ASC&page=1&limit=3"));
    const p2 = await paged(request, scoped("sortBy=title&order=ASC&page=2&limit=3"));
    expect(p1.meta).toMatchObject({ totalItems: 4, totalPages: 2, limit: 3 });
    expect(p1.data).toHaveLength(3);
    expect(p2.data).toHaveLength(1);
    expect(p1.data.map((p) => p.id)).not.toContain(p2.data[0].id);
    const beyond = await paged(request, scoped("page=9&limit=3"));
    expect(beyond.data).toEqual([]);
    expect(beyond.meta.totalItems).toBe(4);
  });

  test("validação: sortBy/testament/category/public/currentWeek/datas inválidos, page=0, limit=101 e param desconhecido dão 400", async ({ request }) => {
    for (const query of [
      "sortBy=route", "testament=GOSPEL", "category=GENERAL", "public=talvez", "currentWeek=talvez",
      "createdFrom=ontem", "createdTo=2026-13-01", "page=0", "limit=101", "order=UP", "foo=bar",
    ]) {
      expect((await list(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro 200 com filtros", async ({ request }) => {
    expect((await list(request, `?${scoped("testament=NEW_TESTAMENT")}`, null)).status()).toBe(401);
    const asMember = await list(request, `?${scoped("testament=NEW_TESTAMENT&page=1")}`, member);
    expect(asMember.status()).toBe(200);
    expect(((await asMember.json()) as Paged).meta.totalItems).toBe(2);
  });
});
