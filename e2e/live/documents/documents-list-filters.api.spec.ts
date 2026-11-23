import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import { cleanupData, massCount } from "../support/keep-data";
import { localShift } from "../support/local-day";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { create, documentsWithTag, label, pdf, removeApi, type DocumentBody } from "./support";

/**
 * Filtros de `GET /documents` aplicados no banco: search (name/description), uploadType (subconsulta em media_items),
 * createdFrom/To, sortBy, page/limit. Cria os próprios documentos (RUN_TAG) e apaga no afterAll. Sem `page`: array legado.
 */
interface Paged {
  data: Array<{ id: string; name: string; media?: { isLocalFile: boolean } | null }>;
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string };
}


test.describe.serial("Documentos — filtros da listagem no servidor", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];
  const docs: Record<string, DocumentBody> = {};

  const list = (request: APIRequestContext, query: string, token: string | null = admin): Promise<APIResponse> =>
    request.get(`${API_URL}/documents${query}`, { headers: token ? authHeaders(token) : {} });
  const scoped = (extra = ""): string => `search=${encodeURIComponent(RUN_TAG)}${extra ? `&${extra}` : ""}`;
  const paged = async (request: APIRequestContext, query: string): Promise<Paged> => {
    const res = await list(request, `?${query}`);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const idsOf = async (request: APIRequestContext, query: string): Promise<string[]> =>
    (await paged(request, `${query}&page=1&limit=100`)).data.map((d) => d.id);
  const dbCount = async (sql: string, params: string[]): Promise<number> => Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    const make = async (key: string, input: Parameters<typeof create>[2]) => {
      const doc = await create(request, admin, input);
      created.push(doc.id);
      docs[key] = doc;
    };
    await make("upload-a", { name: label("alfa-upload"), description: `${RUN_TAG} cozinha guia`, file: pdf("a.pdf") });
    await make("upload-b", { name: label("beta-upload"), description: "outro texto", file: pdf("b.pdf") });
    await make("link-a", { name: label("gama-link"), description: `${RUN_TAG} cozinha link 50%_x` });
    await make("link-b", { name: label("delta-link"), description: "outro link" });
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      for (const id of created) await removeApi(request, admin, id);
      expect(await documentsWithTag(RUN_TAG), "a limpeza deixou documentos do E2E").toBe(0);
    });
    await closeDb();
  });

  test("sem page: array legado (createdAt DESC) e sem envelope", async ({ request }) => {
    const res = await list(request, `?${scoped()}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Array<{ id: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(4);
    expect(body.map((d) => d.id)).toEqual([...created].reverse());
  });

  test("com page: envelope com total filtrado e orderBy padrão createdAt", async ({ request }) => {
    const page = await paged(request, scoped("page=1&limit=100"));
    expect(page.meta).toMatchObject({ page: 1, limit: 100, totalItems: 4, totalPages: 1, orderBy: "createdAt" });
    expect(page.data).toHaveLength(4);
  });

  test("search isolado: name, description e curinga escapado", async ({ request }) => {
    expect(await idsOf(request, `search=${encodeURIComponent(label("alfa"))}`)).toEqual([docs["upload-a"].id]);
    const byDescription = await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} cozinha`)}`);
    expect(byDescription).toEqual(expect.arrayContaining([docs["upload-a"].id, docs["link-a"].id]));
    expect(byDescription).not.toContain(docs["upload-b"].id);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} cozinha link 50%_x`)}`)).toEqual([docs["link-a"].id]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} cozinha link 50%_y`)}`)).toEqual([]);
    expect(await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG}-%`)}`)).toEqual([]);
  });

  test("uploadType isolado: upload e link batem com media_items e a mídia retornada", async ({ request }) => {
    const uploads = await paged(request, scoped("uploadType=upload&page=1&limit=100"));
    expect(uploads.data.map((d) => d.id).sort()).toEqual([docs["upload-a"].id, docs["upload-b"].id].sort());
    expect(uploads.data.every((d) => d.media?.isLocalFile === true)).toBe(true);
    const links = await paged(request, scoped("uploadType=link&page=1&limit=100"));
    expect(links.data.map((d) => d.id).sort()).toEqual([docs["link-a"].id, docs["link-b"].id].sort());
    expect(links.data.every((d) => d.media?.isLocalFile === false)).toBe(true);

    const dbUploads = await dbCount(
      "SELECT COUNT(*) AS n FROM documents d WHERE d.name LIKE ? AND EXISTS (SELECT 1 FROM media_items m WHERE m.targetId = d.id AND m.targetType = 'Document' AND m.uploadType = 'upload')",
      [`%${RUN_TAG}%`],
    );
    expect(uploads.meta.totalItems).toBe(dbUploads);
  });

  test("createdFrom/createdTo: hoje inclui tudo; amanhã ou ontem excluem", async ({ request }) => {
    const today = localShift(0);
    expect((await paged(request, scoped(`createdFrom=${today}&createdTo=${today}&page=1&limit=100`))).meta.totalItems).toBe(4);
    expect((await paged(request, scoped(`createdFrom=${localShift(2)}&page=1`))).meta.totalItems).toBe(0);
    expect((await paged(request, scoped(`createdTo=${localShift(-2)}&page=1`))).meta.totalItems).toBe(0);
  });

  test("filtros combinados: search + uploadType + createdFrom", async ({ request }) => {
    const out = await idsOf(request, `search=${encodeURIComponent(`${RUN_TAG} cozinha`)}&uploadType=link&createdFrom=${localShift(0)}`);
    expect(out).toEqual([docs["link-a"].id]);
  });

  test("sortBy name ASC/DESC e createdAt ASC", async ({ request }) => {
    const asc = await paged(request, scoped("sortBy=name&order=ASC&page=1&limit=100"));
    const names = asc.data.map((d) => d.name);
    expect(names).toEqual([...names].sort());
    expect(asc.meta.orderBy).toBe("name");
    const desc = await paged(request, scoped("sortBy=name&order=DESC&page=1&limit=100"));
    expect(desc.data.map((d) => d.name)).toEqual([...names].reverse());
    const oldest = await paged(request, scoped("sortBy=createdAt&order=ASC&page=1&limit=100"));
    expect(oldest.data.map((d) => d.id)).toEqual(created);
  });

  test("paginação: página 1 e 2 sem repetição; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("sortBy=name&order=ASC&page=1&limit=3"));
    const p2 = await paged(request, scoped("sortBy=name&order=ASC&page=2&limit=3"));
    expect(p1.meta).toMatchObject({ totalItems: 4, totalPages: 2, limit: 3 });
    expect(p1.data).toHaveLength(3);
    expect(p2.data).toHaveLength(1);
    expect(p1.data.map((d) => d.id)).not.toContain(p2.data[0].id);
    const beyond = await paged(request, scoped("page=9&limit=3"));
    expect(beyond.data).toEqual([]);
    expect(beyond.meta.totalItems).toBe(4);
  });

  test("validação: sortBy/uploadType/datas inválidos, page=0, limit=101 e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["sortBy=description", "uploadType=s3", "createdFrom=ontem", "createdTo=2026-13-01", "page=0", "limit=101", "order=UP", "public=true", "foo=bar"]) {
      expect((await list(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização igual à atual: visitante 401, membro 200 com filtros", async ({ request }) => {
    expect((await list(request, `?${scoped("uploadType=link")}`, null)).status()).toBe(401);
    const asMember = await list(request, `?${scoped("uploadType=link&page=1")}`, member);
    expect(asMember.status()).toBe(200);
    expect(((await asMember.json()) as Paged).meta.totalItems).toBe(2);
  });

  test("massa: deixa 5 a 10 documentos novos (metade com PDF) e o S3 segue consistente", async ({ request }) => {
    const total = massCount();
    for (let index = 0; index < total; index += 1) {
      const withFile = index % 2 === 0;
      const doc = await create(request, admin, {
        name: label(`massa-${index + 1}`),
        description: `Documento de massa ${index + 1} da execução ${RUN_TAG}`,
        file: withFile ? pdf(`massa-${index + 1}.pdf`) : undefined,
      });
      created.push(doc.id);
      expect(doc.media?.isLocalFile).toBe(withFile);
    }
    expect(await idsOf(request, `search=${encodeURIComponent(label("massa-"))}`)).toHaveLength(total);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });
});
