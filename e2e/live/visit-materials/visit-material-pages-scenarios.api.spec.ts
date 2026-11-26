import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, snapshotBucket } from "../support/s3";
import {
  BAD_ID,
  OVERSIZED_TITLE,
  createPage,
  createPageRaw,
  currentPageIds,
  deletePageApi,
  fetchPage,
  inputFromBody,
  label,
  mediaCount,
  pageRow,
  pagesWithTag,
  png,
  routesCount,
  sectionMediaCount,
  snapshotDb,
  updatePageRaw,
  type PageBody,
} from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Cenários de `/visit-material-pages` por handler (plano 35 §7.3): feliz, validação, conflito, não encontrado,
 * escopo, flag, rollback, falha sem efeito parcial e S3 sem órfão. Cada cenário cria os próprios dados pela API
 * (prefixo RUN_TAG), prova o efeito por SELECT e o `afterAll` confere 0 sobras e o bucket consistente.
 * O "material atual" é estado global: o estado de antes é restaurado ao fim.
 */
test.describe.serial("Materiais de visita — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let currentBefore: string[] = [];
  const created: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const make = async (request: APIRequestContext, name: string, extra: { images?: number; sections?: boolean } = {}): Promise<PageBody> => {
    const page = await createPage(request, admin, {
      title: label(name),
      images: Array.from({ length: extra.images ?? 0 }, (_, i) => ({ file: png(`${name}-${i}.png`) })),
      ...(extra.sections ? { sections: [{ category: "BABY" as const, images: [{ file: png(`${name}-s.png`) }] }] } : {}),
    });
    created.push(page.id);
    return page;
  };

  const get = (request: APIRequestContext, token: string | undefined, path: string) =>
    request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

  const promote = (request: APIRequestContext, token: string, id: string) =>
    request.post(`${API_URL}/visit-material-pages/current-material/${id}`, { headers: authHeaders(token) });

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    currentBefore = await currentPageIds();
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deletePageApi(request, admin, id);
    // Devolve o "material atual" ao que era (o estado é global).
    if (currentBefore.length === 1 && (await currentPageIds()).join() !== currentBefore.join()) {
      await promote(request, admin, currentBefore[0]);
    }
    if (CLEANUP_ENABLED) expect(await pagesWithTag(RUN_TAG), "a limpeza deixou páginas do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /visit-material-pages

  test("[visit-material.post.visit-material-pages#feliz] admin cria com imagem e seção: página, rota e mídias batem com o banco", async ({ request }) => {
    const page = await make(request, "post-feliz", { images: 1, sections: true });
    expect(await pageRow(page.id)).toMatchObject({ title: label("post-feliz"), currentWeek: 0 });
    expect(await routesCount(page.id)).toBe(1);
    expect(await mediaCount(page.id)).toBe(1);
    expect(await sectionMediaCount(page.id)).toBe(1);
    expect(page.route.path).toMatch(/^materiais_visita_/);
  });

  test("[visit-material.post.visit-material-pages#validacao] sem título, só espaços, testamento inválido e seção repetida: 400 e nada gravado", async ({ request }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    for (const data of [
      { pageSubtitle: "s", pageDescription: "d" },
      { pageTitle: "   ", pageSubtitle: "s", pageDescription: "d" },
      { pageTitle: label("v"), pageSubtitle: "s", pageDescription: "d", testament: "GOSPEL" },
      {
        pageTitle: label("v"),
        pageSubtitle: "s",
        pageDescription: "d",
        sections: [{ category: "BABY" }, { category: "BABY" }],
      },
    ]) {
      const res = await request.post(`${API_URL}/visit-material-pages`, {
        headers: authHeaders(admin),
        multipart: { visitMaterialsPageData: JSON.stringify(data) },
      });
      expect(res.status(), JSON.stringify(data)).toBe(400);
    }
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  test("[visit-material.post.visit-material-pages#conflito-ou-duplicidade] mesmo título duas vezes: duas páginas com rotas distintas", async ({ request }) => {
    const first = await make(request, "post-duplicado");
    const second = await make(request, "post-duplicado");
    expect(second.id).not.toBe(first.id);
    expect(second.route.path).not.toBe(first.route.path);
    expect(await pagesWithTag(label("post-duplicado"))).toBe(2);
  });

  test("[visit-material.post.visit-material-pages#falha-do-colaborador-sem-efeito-parcial] [visit-material.post.visit-material-pages#rollback-de-transacao] [visit-material.post.visit-material-pages#s3-sem-orfao] título que o banco recusa com imagem e seção: nenhuma página, rota, mídia, seção nem objeto", async ({
    request,
  }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await createPageRaw(request, admin, {
      title: OVERSIZED_TITLE,
      images: [{ file: png("rollback.png") }],
      sections: [{ category: "BABY", images: [{ file: png("rollback-s.png") }] }],
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  // ---------------------------------------------------------------- GET

  test("[visit-material.get.visit-material-pages#feliz] [visit-material.get.visit-material-pages-id#feliz] listagem e leitura por id batem com o banco", async ({ request }) => {
    const page = await make(request, "get-feliz", { images: 2 });
    const list = await get(request, admin, "/visit-material-pages");
    expect(list.status()).toBe(200);
    const found = (await json<PageBody[]>(list)).find((item) => item.id === page.id);
    expect(found?.images).toHaveLength(await mediaCount(page.id));

    const one = await get(request, admin, `/visit-material-pages/${page.id}`);
    expect(one.status()).toBe(200);
    expect((await json<PageBody>(one)).title).toBe((await pageRow(page.id))?.title);
  });

  test("[visit-material.get.visit-material-pages#escopo-proprio-x-outro] [visit-material.get.visit-material-pages-id#escopo-proprio-x-outro] a leitura é igual para admin, líder e membro (o material é de todos); visitante é 401", async ({
    request,
  }) => {
    const page = await make(request, "get-escopo", { images: 1 });
    for (const token of [admin, leader, member]) {
      const list = await json<PageBody[]>(await get(request, token, "/visit-material-pages"));
      expect(list.map((item) => item.id)).toContain(page.id);
      expect((await get(request, token, `/visit-material-pages/${page.id}`)).status()).toBe(200);
    }
    expect((await get(request, undefined, "/visit-material-pages")).status()).toBe(401);
    expect((await get(request, undefined, `/visit-material-pages/${page.id}`)).status()).toBe(401);
  });

  test("[visit-material.get.visit-material-pages-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await get(request, admin, `/visit-material-pages/${BAD_ID}`)).status()).toBe(404);
  });

  test("[visit-material.get.visit-material-pages-id#flag-desligada] [visit-material.get.visit-material-pages-current-material#flag-desligada] com visit_materials desligada: 403 FEATURE_DISABLED", async ({
    request,
  }) => {
    const page = await make(request, "get-flag");
    await withFlagsOff(request, admin, ["visit_materials"], async () => {
      await expectFeatureDisabled(await get(request, admin, `/visit-material-pages/${page.id}`));
      await expectFeatureDisabled(await get(request, admin, "/visit-material-pages/current-material"));
    });
    expect((await get(request, admin, `/visit-material-pages/${page.id}`)).status()).toBe(200);
  });

  // ---------------------------------------------------------------- PATCH /visit-material-pages/:id

  test("[visit-material.patch.visit-material-pages-id#feliz] admin renomeia e troca a imagem: o banco reflete e a rota acompanha", async ({ request }) => {
    const page = await make(request, "patch-feliz", { images: 1 });
    const body = await fetchPage(request, admin, page.id);
    const input = inputFromBody(body, { title: label("patch-feliz-novo") });
    input.images = [{ id: body.images[0].id, file: png("nova.png") }];
    const res = await updatePageRaw(request, admin, page.id, input);
    expect(res.status(), await res.text()).toBe(200);
    expect((await pageRow(page.id))?.title).toBe(label("patch-feliz-novo"));
    expect((await json<PageBody>(res)).route.title).toBe(label("patch-feliz-novo"));
    expect(await mediaCount(page.id)).toBe(1);
  });

  test("[visit-material.patch.visit-material-pages-id#validacao] título só com espaços, id diferente do caminho e currentWeek que não é booleano: 400 e a página fica como estava", async ({
    request,
  }) => {
    const page = await make(request, "patch-validacao");
    const before = await pageRow(page.id);
    const send = (data: Record<string, unknown>, id = page.id) =>
      request.patch(`${API_URL}/visit-material-pages/${id}`, {
        headers: authHeaders(admin),
        multipart: { visitMaterialsPageData: JSON.stringify(data) },
      });
    const valid = { id: page.id, pageTitle: label("x"), pageSubtitle: "s", pageDescription: "d", currentWeek: false };
    expect((await send({ ...valid, pageTitle: "   " })).status()).toBe(400);
    expect((await send({ ...valid, id: BAD_ID })).status()).toBe(400);
    expect((await send({ ...valid, currentWeek: "talvez" })).status()).toBe(400);
    expect(await pageRow(page.id)).toEqual(before);
  });

  test("[visit-material.patch.visit-material-pages-id#nao-encontrado] uuid inexistente: 404 e nada criado", async ({ request }) => {
    const before = await snapshotDb();
    const res = await updatePageRaw(request, admin, BAD_ID, { title: label("patch-fantasma") });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[visit-material.patch.visit-material-pages-id#conflito-ou-duplicidade] renomear para o título de outra página: as duas existem e as rotas seguem distintas", async ({
    request,
  }) => {
    const first = await make(request, "patch-conflito-a");
    const second = await make(request, "patch-conflito-b");
    const res = await updatePageRaw(request, admin, second.id, inputFromBody(await fetchPage(request, admin, second.id), { title: label("patch-conflito-a") }));
    expect(res.status(), await res.text()).toBe(200);
    expect((await pageRow(first.id))?.title).toBe(label("patch-conflito-a"));
    expect((await pageRow(second.id))?.title).toBe(label("patch-conflito-a"));
    expect(await routesCount(first.id)).toBe(1);
    expect(await routesCount(second.id)).toBe(1);
  });

  test("[visit-material.patch.visit-material-pages-id#falha-do-colaborador-sem-efeito-parcial] arquivo do fieldKey ausente junto de outras mudanças: 400 e nada é gravado (título, mídia e bucket)", async ({
    request,
  }) => {
    const page = await make(request, "patch-colaborador", { images: 1 });
    const body = await fetchPage(request, admin, page.id);
    const bucket = await snapshotBucket();
    const res = await request.patch(`${API_URL}/visit-material-pages/${page.id}`, {
      headers: authHeaders(admin),
      multipart: {
        visitMaterialsPageData: JSON.stringify({
          id: page.id,
          pageTitle: label("patch-nao-grava"),
          pageSubtitle: "s",
          pageDescription: "d",
          currentWeek: false,
          images: [
            { id: body.images[0].id, title: "x", description: "d", mediaType: "image", uploadType: "upload", isLocalFile: true },
            { title: "novo", description: "d", mediaType: "image", uploadType: "upload", isLocalFile: true, fieldKey: "ausente" },
          ],
        }),
      },
    });
    expect(res.status(), await res.text()).toBe(400);
    expect((await pageRow(page.id))?.title).toBe(label("patch-colaborador"));
    expect(await mediaCount(page.id)).toBe(1);
    await expectBucketUnchanged(bucket);
  });

  test("[visit-material.patch.visit-material-pages-id#rollback-de-transacao] [visit-material.patch.visit-material-pages-id#s3-sem-orfao] título que o banco recusa com imagem nova e seção nova: título, mídias, seções e bucket intactos", async ({
    request,
  }) => {
    const page = await make(request, "patch-rollback", { images: 1 });
    const body = await fetchPage(request, admin, page.id);
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const input = inputFromBody(body, { title: OVERSIZED_TITLE });
    input.images = [{ id: body.images[0].id }, { file: png("novo.png") }];
    input.sections = [{ category: "CHILD", images: [{ file: png("novo-s.png") }] }];
    const res = await updatePageRaw(request, admin, page.id, input);
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect((await pageRow(page.id))?.title).toBe(label("patch-rollback"));
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  // ---------------------------------------------------------------- DELETE

  test("[visit-material.delete.visit-material-pages-id#feliz] [visit-material.delete.visit-material-pages-id#s3-sem-orfao] admin remove: página, rota, mídias da página e das seções e objetos somem", async ({
    request,
  }) => {
    const page = await make(request, "delete-feliz", { images: 1, sections: true });
    const res = await request.delete(`${API_URL}/visit-material-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(204);
    expect(await pageRow(page.id)).toBeNull();
    expect(await routesCount(page.id)).toBe(0);
    expect(await mediaCount(page.id)).toBe(0);
    expect(await sectionMediaCount(page.id)).toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[visit-material.delete.visit-material-pages-id#nao-encontrado] uuid inexistente: 404 e nada some", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/visit-material-pages/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[visit-material.delete.visit-material-pages-id#falha-do-colaborador-sem-efeito-parcial] [visit-material.delete.visit-material-pages-id#rollback-de-transacao] id malformado: 400 e nenhuma página, mídia nem objeto some", async ({
    request,
  }) => {
    const page = await make(request, "delete-colaborador", { images: 1 });
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await request.delete(`${API_URL}/visit-material-pages/nao-e-uuid`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
    expect(await pageRow(page.id)).not.toBeNull();
  });

  // ---------------------------------------------------------------- material atual

  test("[visit-material.post.visit-material-pages-current-material-id#feliz] [visit-material.get.visit-material-pages-current-material#feliz] promover a página: ela vira a única atual e a leitura a devolve", async ({
    request,
  }) => {
    const page = await make(request, "current-feliz");
    const res = await promote(request, admin, page.id);
    expect(res.status(), await res.text()).toBe(201);
    expect((await json<PageBody>(res)).currentWeek).toBe(true);
    expect(await currentPageIds()).toEqual([page.id]);
    const current = await json<PageBody>(await get(request, admin, "/visit-material-pages/current-material"));
    expect(current.id).toBe(page.id);
    expect(await queryOne<{ current: number }>("SELECT current FROM routes WHERE entityId = ? AND entityType = 'VisitMaterialsPage'", [page.id])).toMatchObject({ current: 1 });
  });

  test("[visit-material.post.visit-material-pages-current-material-id#validacao] id que não é uuid: 400 e o material atual não muda", async ({ request }) => {
    const before = await currentPageIds();
    const res = await request.post(`${API_URL}/visit-material-pages/current-material/nao-e-uuid`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(400);
    expect(await currentPageIds()).toEqual(before);
  });

  test("[visit-material.post.visit-material-pages-current-material-id#nao-encontrado] [visit-material.post.visit-material-pages-current-material-id#falha-do-colaborador-sem-efeito-parcial] [visit-material.post.visit-material-pages-current-material-id#rollback-de-transacao] uuid inexistente: 404 e a página atual de antes continua atual (nada é rebaixado)", async ({
    request,
  }) => {
    const page = await make(request, "current-colaborador");
    await promote(request, admin, page.id);
    const res = await promote(request, admin, BAD_ID);
    expect(res.status()).toBe(404);
    expect(await currentPageIds()).toEqual([page.id]);
  });

  test("[visit-material.post.visit-material-pages-current-material-id#conflito-ou-duplicidade] promover uma segunda página rebaixa a primeira (nunca duas atuais); repetir a mesma é idempotente", async ({
    request,
  }) => {
    const first = await make(request, "current-a");
    const second = await make(request, "current-b");
    expect((await promote(request, admin, first.id)).status()).toBe(201);
    expect((await promote(request, admin, second.id)).status()).toBe(201);
    expect(await currentPageIds()).toEqual([second.id]);
    expect((await promote(request, admin, second.id)).status()).toBe(201);
    expect(await currentPageIds()).toEqual([second.id]);
  });

  test("[visit-material.post.visit-material-pages-current-material-id#s3-sem-orfao] [visit-material.get.visit-material-pages-current-material#escopo-proprio-x-outro] promover não toca o bucket; admin, líder e membro leem o mesmo material atual", async ({
    request,
  }) => {
    const page = await make(request, "current-s3", { images: 1 });
    const bucket = await snapshotBucket();
    expect((await promote(request, admin, page.id)).status()).toBe(201);
    await expectBucketUnchanged(bucket);
    for (const token of [admin, leader, member]) {
      const current = await json<PageBody>(await get(request, token, "/visit-material-pages/current-material"));
      expect(current.id).toBe(page.id);
    }
  });
});
