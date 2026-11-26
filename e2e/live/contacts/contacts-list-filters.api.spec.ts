import type { APIRequestContext, APIResponse } from "@playwright/test";
import { cleanupData } from "../support/keep-data";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import { contactsWithTag, create, deleteRaw, label, readRaw } from "./support";
import { localShift } from "../support/local-day";

/**
 * Filtros de `GET /contact` aplicados no banco: search (nome, e-mail, telefone, mensagem), read, createdFrom/To,
 * sortBy, page/limit. Cria os próprios contatos (RUN_TAG) e apaga no afterAll. Sem `page`: array legado.
 */
interface Row {
  id: string;
  name: string;
  email: string;
  read: boolean;
}
interface Paged {
  data: Row[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string; order?: string };
}

/** DDD 11 + 7 dígitos do relógio: telefones únicos por execução, mesmo com a massa acumulada. */
const PHONE_BASE = `11${String(Date.now()).slice(-7)}`;
test.describe.serial("Contatos — filtros da listagem no servidor", () => {
  let admin: string;
  let member: Actor;
  let leader: Actor;
  const created: string[] = [];
  const by: Record<string, string> = {};

  const list = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/contact${query}`, { headers: token ? authHeaders(token) : {} });
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
    member = await createActor(request, admin, "member", "ctf-member");
    leader = await createActor(request, admin, "leader", "ctf-leader");
    const make = async (key: string, input: Parameters<typeof create>[1]) => {
      const receipt = await create(request, input);
      created.push(receipt.id);
      by[key] = receipt.id;
    };
    await make("alfa", { name: label("alfa"), email: `alfa.${RUN_TAG}@orfanatonib.test`, phone: `${PHONE_BASE}01`, message: `visita ao abrigo ${RUN_TAG} 50%_x` });
    await make("beta", { name: label("beta"), email: `beta.${RUN_TAG}@orfanatonib.test`, phone: `${PHONE_BASE}02`, message: "outra mensagem" });
    await make("gama", { name: label("gama"), email: `gama.${RUN_TAG}@orfanatonib.test`, phone: `${PHONE_BASE}03`, message: `pedido de visita ${RUN_TAG}` });
    await make("delta", { name: label("delta"), email: `delta.${RUN_TAG}@orfanatonib.test`, phone: `${PHONE_BASE}04`, message: "agradecimento" });
    expect((await readRaw(request, admin, by.alfa)).status()).toBe(200);
    expect((await readRaw(request, admin, by.gama)).status()).toBe(200);
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of created) await deleteRaw(request, admin, id);
      await removeActors(request, admin, [member.id, leader.id]);
      expect(await contactsWithTag(RUN_TAG), "a limpeza deixou contatos do E2E").toBe(0);
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

  test("search isolado: nome, e-mail, telefone, mensagem e curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(label("alfa"))}`)).toEqual([by.alfa]);
    expect(await idsOf(request, `search=${encodeURIComponent(`gama.${RUN_TAG}@`)}`)).toEqual([by.gama]);
    expect(await idsOf(request, `search=${PHONE_BASE}02`)).toEqual([by.beta]);
    expect(await idsOf(request, `search=${encodeURIComponent(`pedido de visita ${RUN_TAG}`)}`)).toEqual([by.gama]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} 50%_x`)}`)).toEqual([by.alfa]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} 50%_y`)}`)).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
  });

  test("read isolado: lidos e não lidos batem com o banco", async ({ request }) => {
    const unread = await paged(request, scoped("read=false&page=1&limit=100"));
    expect(unread.data.map((row) => row.id).sort()).toEqual([by.beta, by.delta].sort());
    expect(unread.data.every((row) => row.read === false)).toBe(true);
    const read = await paged(request, scoped("read=true&page=1&limit=100"));
    expect(read.data.map((row) => row.id).sort()).toEqual([by.alfa, by.gama].sort());
    const dbRead = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM contacts WHERE name LIKE ? AND `read` = 1", [`%${RUN_TAG}%`]);
    expect(read.meta.totalItems).toBe(Number(dbRead?.n));
  });

  test("createdFrom/createdTo: hoje inclui tudo; amanhã ou ontem excluem", async ({ request }) => {
    const today = localShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1&limit=100`))).meta.totalItems).toBe(4);
    expect((await paged(request, scoped(`createdFrom=${localShift(2)}&page=1`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${localShift(-2)}&page=1`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: search + read + createdFrom", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent("visita")}&read=true&createdFrom=${localShift(0)}`)).toEqual(
      expect.arrayContaining([by.alfa, by.gama]),
    );
    expect(await idsOf(request, `search=${encodeURIComponent(label("beta"))}&read=false`)).toEqual([by.beta]);
    expect(await idsOf(request, `search=${encodeURIComponent(label("beta"))}&read=true`)).toEqual([]);
  });

  test("sortBy name ASC/DESC e createdAt ASC", async ({ request }) => {
    const asc = await paged(request, scoped("sortBy=name&order=ASC&page=1&limit=100"));
    const names = asc.data.map((row) => row.name);
    expect(names).toEqual([...names].sort());
    expect(asc.meta.orderBy).toBe("name");
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

  test("validação: sortBy/read/datas inválidos, page=0, limit=101 e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["sortBy=email", "read=talvez", "createdFrom=ontem", "createdTo=2026-13-01", "page=0", "limit=101", "order=UP", "public=true", "foo=bar"]) {
      expect((await list(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro e líder 403, flag desligada 403", async ({ request }) => {
    expect((await list(request, `?${scoped("read=true")}`, null)).status()).toBe(401);
    expect((await list(request, `?${scoped("read=true&page=1")}`, member.token)).status()).toBe(403);
    expect((await list(request, `?${scoped("read=true&page=1")}`, leader.token)).status()).toBe(403);
    await withFlagsOff(request, admin, ["contact_management"], async () => {
      await expectFeatureDisabled(await list(request, `?${scoped("read=true&page=1")}`));
    });
    expect((await list(request, `?${scoped("page=1")}`)).status()).toBe(200);
  });
});
