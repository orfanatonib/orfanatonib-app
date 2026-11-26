import type { APIRequestContext, APIResponse } from "@playwright/test";
import { cleanupData } from "../support/keep-data";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import { create, deleteRaw, feedbacksWithTag, label, readRaw } from "./support";
import { localShift } from "../support/local-day";

/**
 * Filtros de `GET /site-feedbacks` aplicados no banco: search (nome, e-mail, comentário), read, category, rating,
 * createdFrom/To, sortBy, page/limit. Cria os próprios feedbacks (RUN_TAG) e apaga no afterAll. Sem `page`: array legado.
 */
interface Row {
  id: string;
  name: string;
  rating: number;
  category: string;
  read: boolean;
}
interface Paged {
  data: Row[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string };
}

test.describe.serial("Feedbacks — filtros da listagem no servidor", () => {
  let admin: string;
  let member: Actor;
  let leader: Actor;
  const created: string[] = [];
  const by: Record<string, string> = {};

  const list = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/site-feedbacks${query}`, { headers: token ? authHeaders(token) : {} });
  const scoped = (extra = ""): string => `search=${encodeURIComponent(RUN_TAG)}${extra ? `&${extra}` : ""}`;
  const paged = async (request: APIRequestContext, query: string): Promise<Paged> => {
    const res = await list(request, `?${query}`);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const idsOf = async (request: APIRequestContext, query: string): Promise<string[]> =>
    (await paged(request, `${query}&page=1&limit=100`)).data.map((row) => row.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = await createActor(request, admin, "member", "fbf-member");
    leader = await createActor(request, admin, "leader", "fbf-leader");
    const make = async (key: string, input: Parameters<typeof create>[2]) => {
      const feedback = await create(request, admin, input);
      created.push(feedback.id);
      by[key] = feedback.id;
    };
    await make("alfa", { name: label("alfa"), email: `alfa.fb.${RUN_TAG}@orfanatonib.test`, rating: 5, category: "suggestion", comment: `site muito bom ${RUN_TAG} 50%_x` });
    await make("beta", { name: label("beta"), rating: 2, category: "complaint", comment: `lento no celular ${RUN_TAG}` });
    await make("gama", { name: label("gama"), email: `gama.fb.${RUN_TAG}@orfanatonib.test`, rating: 2, category: "suggestion", comment: `faltou um botão ${RUN_TAG}` });
    await make("delta", { name: label("delta"), rating: 4, category: "content", comment: `texto com erro ${RUN_TAG}` });
    expect((await readRaw(request, admin, by.alfa)).status()).toBe(200);
    expect((await readRaw(request, admin, by.beta)).status()).toBe(200);
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of created) await deleteRaw(request, admin, id);
      await removeActors(request, admin, [member.id, leader.id]);
      expect(await feedbacksWithTag(RUN_TAG), "a limpeza deixou feedbacks do E2E").toBe(0);
    });
    await closeDb();
  });

  test("sem page: array legado (createdAt DESC) e sem envelope", async ({ request }) => {
    const res = await list(request, `?${scoped()}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Row[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.map((row) => row.id)).toEqual([...created].reverse());
  });

  test("com page: envelope com total filtrado e orderBy padrão createdAt", async ({ request }) => {
    const page = await paged(request, scoped("page=1&limit=100"));
    expect(page.meta).toMatchObject({ page: 1, limit: 100, totalItems: 4, totalPages: 1, orderBy: "createdAt" });
    expect(page.data).toHaveLength(4);
  });

  test("search isolado: nome, e-mail, comentário e curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(label("alfa"))}`)).toEqual([by.alfa]);
    expect(await idsOf(request, `search=${encodeURIComponent(`gama.fb.${RUN_TAG}@`)}`)).toEqual([by.gama]);
    expect(await idsOf(request, `search=${encodeURIComponent(`lento no celular ${RUN_TAG}`)}`)).toEqual([by.beta]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} 50%_x`)}`)).toEqual([by.alfa]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} 50%_y`)}`)).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
  });

  test("read isolado: lidos e não lidos batem com o banco", async ({ request }) => {
    const unread = await paged(request, scoped("read=false&page=1&limit=100"));
    expect(unread.data.map((row) => row.id).sort()).toEqual([by.gama, by.delta].sort());
    expect(unread.data.every((row) => row.read === false)).toBe(true);
    const read = await paged(request, scoped("read=true&page=1&limit=100"));
    expect(read.data.map((row) => row.id).sort()).toEqual([by.alfa, by.beta].sort());
    const dbRead = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM site_feedbacks WHERE name LIKE ? AND `read` = 1", [`%${RUN_TAG}%`]);
    expect(read.meta.totalItems).toBe(Number(dbRead?.n));
  });

  test("category isolado: cada tipo bate com o banco", async ({ request }) => {
    expect((await idsOf(request, scoped("category=suggestion"))).sort()).toEqual([by.alfa, by.gama].sort());
    expect(await idsOf(request, scoped("category=complaint"))).toEqual([by.beta]);
    expect(await idsOf(request, scoped("category=content"))).toEqual([by.delta]);
    expect(await idsOf(request, scoped("category=other"))).toEqual([]);
    const db = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM site_feedbacks WHERE name LIKE ? AND category = 'suggestion'", [`%${RUN_TAG}%`]);
    expect((await paged(request, scoped("category=suggestion&page=1"))).meta.totalItems).toBe(Number(db?.n));
  });

  test("rating isolado: nota exata bate com o banco", async ({ request }) => {
    expect((await idsOf(request, scoped("rating=2"))).sort()).toEqual([by.beta, by.gama].sort());
    expect(await idsOf(request, scoped("rating=5"))).toEqual([by.alfa]);
    expect(await idsOf(request, scoped("rating=1"))).toEqual([]);
  });

  test("createdFrom/createdTo: hoje inclui tudo; amanhã ou ontem excluem", async ({ request }) => {
    const today = localShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1&limit=100`))).meta.totalItems).toBe(4);
    expect((await paged(request, scoped(`createdFrom=${localShift(2)}&page=1`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${localShift(-2)}&page=1`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: tipo + nota + situação", async ({ request }) => {
    expect(await idsOf(request, scoped("category=suggestion&rating=2&read=false"))).toEqual([by.gama]);
    expect(await idsOf(request, scoped("category=suggestion&rating=2&read=true"))).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent(label("beta"))}&read=true&category=complaint&rating=2&createdFrom=${localShift(0)}`)).toEqual([by.beta]);
  });

  test("sortBy rating, name e createdAt, nas duas direções", async ({ request }) => {
    const high = await paged(request, scoped("sortBy=rating&order=DESC&page=1&limit=100"));
    const ratings = high.data.map((row) => row.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
    expect(high.meta.orderBy).toBe("rating");
    const low = await paged(request, scoped("sortBy=rating&order=ASC&page=1&limit=100"));
    expect(low.data.map((row) => row.rating)).toEqual([...ratings].reverse());
    const asc = await paged(request, scoped("sortBy=name&order=ASC&page=1&limit=100"));
    const names = asc.data.map((row) => row.name);
    expect(names).toEqual([...names].sort());
    const desc = await paged(request, scoped("sortBy=name&order=DESC&page=1&limit=100"));
    expect(desc.data.map((row) => row.name)).toEqual([...names].reverse());
    const oldest = await paged(request, scoped("sortBy=createdAt&order=ASC&page=1&limit=100"));
    expect(oldest.data.map((row) => row.id)).toEqual(created);
  });

  test("paginação: página 1 e 2 sem repetição; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("sortBy=name&order=ASC&page=1&limit=3"));
    const p2 = await paged(request, scoped("sortBy=name&order=ASC&page=2&limit=3"));
    expect(p1.meta).toMatchObject({ totalItems: 4, totalPages: 2, limit: 3 });
    expect(p1.data).toHaveLength(3);
    expect(p2.data).toHaveLength(1);
    expect(p1.data.map((row) => row.id)).not.toContain(p2.data[0].id);
    const beyond = await paged(request, scoped("page=9&limit=3"));
    expect(beyond.data).toEqual([]);
    expect(beyond.meta.totalItems).toBe(4);
  });

  test("validação: sortBy/read/category/rating/datas inválidos, page=0, limit=101 e param desconhecido dão 400", async ({ request }) => {
    for (const query of [
      "sortBy=comment",
      "read=talvez",
      "category=spam",
      "rating=0",
      "rating=6",
      "rating=2.5",
      "createdFrom=ontem",
      "createdTo=2026-13-01",
      "page=0",
      "limit=101",
      "order=UP",
      "public=true",
      "foo=bar",
    ]) {
      expect((await list(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro e líder 403, flag desligada 403", async ({ request }) => {
    expect((await list(request, `?${scoped("read=true")}`, null)).status()).toBe(401);
    expect((await list(request, `?${scoped("read=true&page=1")}`, member.token)).status()).toBe(403);
    expect((await list(request, `?${scoped("read=true&page=1")}`, leader.token)).status()).toBe(403);
    await withFlagsOff(request, admin, ["feedback_management"], async () => {
      await expectFeatureDisabled(await list(request, `?${scoped("read=true&page=1")}`));
    });
    expect((await list(request, `?${scoped("page=1")}`)).status()).toBe(200);
  });
});
