import type { APIRequestContext, APIResponse } from "@playwright/test";
import { cleanupData } from "../support/keep-data";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import { create, label, pdf, recordsWithTag, removeApi } from "./support";
import { localShift } from "../support/local-day";

/**
 * Filtros de `GET /antecedentes-criminais` aplicados no banco: search (nome do cadastro ou do usuário vinculado),
 * attendableType, documents (subconsulta em media_items), createdFrom/To, sortBy, page/limit. Cria os próprios
 * cadastros (RUN_TAG) e apaga no afterAll. O envelope da rota é `{ data, total, page, limit, totalPages }`.
 */
interface Row {
  id: string;
  name?: string;
  attendableType?: string | null;
  attendableDisplayName?: string;
  pdfEstadual?: unknown;
  pdfFederal?: unknown;
}
interface Paged {
  data: Row[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

test.describe.serial("Antecedentes criminais — filtros da listagem no servidor", () => {
  let admin: string;
  let leader: string;
  let member: Actor;
  let linked: Actor;
  const created: string[] = [];
  const by: Record<string, string> = {};

  const list = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/antecedentes-criminais${query}`, { headers: token ? authHeaders(token) : {} });
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
    leader = (await loginAs(request, "leader")).accessToken;
    member = await createActor(request, admin, "member", "antf-member");
    linked = await createActor(request, admin, "member", `${RUN_TAG}-vinculo`);
    const make = async (key: string, input: Parameters<typeof create>[2]) => {
      const record = await create(request, admin, input);
      created.push(record.id);
      by[key] = record.id;
    };
    await make("alfa", { name: label("alfa"), estadual: pdf("a-e.pdf"), federal: pdf("a-f.pdf") });
    await make("beta", { name: label("beta"), estadual: pdf("b-e.pdf") });
    await make("gama", { name: label("gama"), federal: pdf("g-f.pdf") });
    await make("delta", { name: label("delta"), estadual: pdf("d-e.pdf"), federal: pdf("d-f.pdf") });
    await make("vinculo", { attendableType: "user", attendableId: linked.id, estadual: pdf("v-e.pdf") });
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of created) await removeApi(request, admin, id);
      await removeActors(request, admin, [member.id, linked.id]);
      expect(await recordsWithTag(RUN_TAG), "a limpeza deixou cadastros do E2E").toBe(0);
    });
    await closeDb();
  });

  test("envelope legado: data, total, page, limit e totalPages, com a página 1 de 10 por padrão", async ({ request }) => {
    const body = await paged(request, scoped());
    expect(body).toMatchObject({ total: 5, page: 1, limit: 10, totalPages: 1 });
    expect(body.data.map((row) => row.id)).toEqual([...created].reverse());
  });

  test("search isolado: nome do cadastro, nome do usuário vinculado e curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(label("alfa"))}`)).toEqual([by.alfa]);
    expect(await idsOf(request, `search=${encodeURIComponent(`E2E ${RUN_TAG}-vinculo`)}`)).toEqual([by.vinculo]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}_alfa`)}`)).toEqual([]);
  });

  test("attendableType isolado: usuário traz só o vinculado; integração, nenhum", async ({ request }) => {
    expect(await idsOf(request, scoped("attendableType=user"))).toEqual([by.vinculo]);
    expect(await idsOf(request, scoped("attendableType=integration"))).toEqual([]);
  });

  test("documents isolado: completo, só estadual e só federal batem com media_items", async ({ request }) => {
    expect((await idsOf(request, scoped("documents=complete"))).sort()).toEqual([by.alfa, by.delta].sort());
    expect((await idsOf(request, scoped("documents=only_estadual"))).sort()).toEqual([by.beta, by.vinculo].sort());
    expect(await idsOf(request, scoped("documents=only_federal"))).toEqual([by.gama]);
    const complete = await paged(request, scoped("documents=complete&page=1"));
    const db = await queryOne<{ n: number }>(
      `SELECT COUNT(*) AS n FROM atendentes a LEFT JOIN users u ON a.attendableType = 'user' AND u.id = a.attendableId
       WHERE (a.name LIKE ? OR u.name LIKE ?)
         AND EXISTS (SELECT 1 FROM media_items m WHERE m.targetId = a.id AND m.targetType IN ('AtendenteEstadual', 'Atendente'))
         AND EXISTS (SELECT 1 FROM media_items m WHERE m.targetId = a.id AND m.targetType = 'AtendenteFederal')`,
      [`%${RUN_TAG}%`, `%${RUN_TAG}%`],
    );
    expect(complete.total).toBe(Number(db?.n));
  });

  test("createdFrom/createdTo: hoje inclui tudo; amanhã ou ontem excluem", async ({ request }) => {
    const today = localShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1&limit=100`))).total).toBe(5);
    expect((await paged(request, scoped(`createdFrom=${localShift(2)}&page=1`))).total).toBe(0);
    expect((await paged(request, scoped(`createdTo=${localShift(-2)}&page=1`))).total).toBe(0);
  });

  test("filtros combinados: search + documents + attendableType + createdFrom", async ({ request }) => {
    expect(await idsOf(request, `${scoped("documents=only_estadual")}&createdFrom=${localShift(0)}`)).toEqual(expect.arrayContaining([by.beta, by.vinculo]));
    expect(await idsOf(request, `${scoped("documents=only_estadual&attendableType=user")}`)).toEqual([by.vinculo]);
    expect(await idsOf(request, `${scoped("documents=complete&attendableType=user")}`)).toEqual([]);
  });

  test("sortBy name usa o nome exibido; createdAt e updatedAt nas duas direções", async ({ request }) => {
    const dbOrder = async (direction: "ASC" | "DESC"): Promise<string[]> =>
      (
        await queryAll<{ id: string }>(
          `SELECT a.id AS id FROM atendentes a LEFT JOIN users u ON a.attendableType = 'user' AND u.id = a.attendableId
           WHERE (a.name LIKE ? OR u.name LIKE ?) ORDER BY COALESCE(NULLIF(a.name, ''), u.name) ${direction}, a.id ASC`,
          [`%${RUN_TAG}%`, `%${RUN_TAG}%`],
        )
      ).map((row) => row.id);
    const asc = await paged(request, scoped("sortBy=name&order=ASC&page=1&limit=100"));
    expect(asc.data.map((row) => row.id)).toEqual(await dbOrder("ASC"));
    const desc = await paged(request, scoped("sortBy=name&order=DESC&page=1&limit=100"));
    expect(desc.data.map((row) => row.id)).toEqual(await dbOrder("DESC"));
    const oldest = await paged(request, scoped("sortBy=createdAt&order=ASC&page=1&limit=100"));
    expect(oldest.data.map((row) => row.id)).toEqual(created);
    const updated = await paged(request, scoped("sortBy=updatedAt&order=DESC&page=1&limit=100"));
    expect(updated.data.map((row) => row.id)).toEqual([...created].reverse());
  });

  test("paginação: página 1 e 2 sem repetição; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("sortBy=createdAt&order=ASC&page=1&limit=3"));
    const p2 = await paged(request, scoped("sortBy=createdAt&order=ASC&page=2&limit=3"));
    expect(p1).toMatchObject({ total: 5, totalPages: 2, limit: 3 });
    expect(p1.data).toHaveLength(3);
    expect(p2.data).toHaveLength(2);
    expect(p1.data.map((row) => row.id)).not.toEqual(expect.arrayContaining(p2.data.map((row) => row.id)));
    const beyond = await paged(request, scoped("page=9&limit=3"));
    expect(beyond.data).toEqual([]);
    expect(beyond.total).toBe(5);
  });

  test("validação: documents/sortBy/datas inválidos, page=0, limit=101 e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["documents=nenhum", "sortBy=attendableId", "attendableType=abrigo", "createdFrom=ontem", "createdTo=2026-13-01", "page=0", "limit=101", "order=UP", "foo=bar"]) {
      expect((await list(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro 403, líder 200, flag desligada 403", async ({ request }) => {
    expect((await list(request, `?${scoped("documents=complete")}`, null)).status()).toBe(401);
    expect((await list(request, `?${scoped("documents=complete")}`, member.token)).status()).toBe(403);
    expect((await list(request, `?${scoped("documents=complete")}`, leader)).status()).toBe(200);
    await withFlagsOff(request, admin, ["criminal_records"], async () => {
      await expectFeatureDisabled(await list(request, `?${scoped("documents=complete")}`));
    });
    expect((await list(request, `?${scoped()}`)).status()).toBe(200);
  });
});
