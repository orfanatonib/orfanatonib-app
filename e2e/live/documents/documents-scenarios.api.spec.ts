import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, snapshotBucket } from "../support/s3";
import {
  BAD_ID,
  OVERSIZED_MEDIA_TITLE,
  create,
  createRaw,
  documentRow,
  documentsWithTag,
  get,
  label,
  mediaCount,
  mediaPayload,
  patchRaw,
  pdf,
  removeApi,
  routesCount,
  snapshotDb,
  type DocumentBody,
} from "./support";

/**
 * Cenários de `/documents` por handler (plano 27 §7.3): feliz, validação, conflito, não encontrado, escopo, flag,
 * rollback, falha sem efeito parcial e S3 sem órfão. Cada cenário cria os próprios dados pela API (prefixo RUN_TAG),
 * prova o efeito por SELECT e o `afterAll` confere 0 sobras e o bucket consistente.
 */
test.describe.serial("Documentos — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let member: string;
  const created: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const make = async (request: APIRequestContext, name: string, extra: { file?: boolean } = {}): Promise<DocumentBody> => {
    const doc = await create(request, admin, { name: label(name), file: extra.file ? pdf(`${name}.pdf`) : undefined });
    created.push(doc.id);
    return doc;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await removeApi(request, admin, id);
    // Só o que este cenário criou: o RUN_TAG é do processo e cobre a massa que outros arquivos mantêm.
    for (const id of created) expect(await documentRow(id), "a limpeza deixou documentos do cenário").toBeNull();
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /documents

  test("[document.post.documents#feliz] admin cria com PDF: documento, mídia local e rota batem com o banco", async ({ request }) => {
    const doc = await make(request, "post-feliz", { file: true });
    expect(await documentRow(doc.id)).toMatchObject({ name: label("post-feliz") });
    expect(await mediaCount(doc.id)).toBe(1);
    expect(await routesCount(doc.id)).toBe(1);
    expect(doc.media?.isLocalFile).toBe(true);
  });

  test("[document.post.documents#validacao] sem nome, nome que não é texto, sem mídia e upload sem o arquivo: 400 e nada gravado", async ({ request }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    for (const data of [
      { description: "sem nome", media: mediaPayload({}) },
      { name: 5, media: mediaPayload({}) },
      { name: label("v-sem-midia") },
      { name: label("v-sem-arquivo"), media: mediaPayload({ file: pdf("x.pdf") }) },
    ]) {
      const res = await request.post(`${API_URL}/documents`, { headers: authHeaders(admin), multipart: { documentData: JSON.stringify(data) } });
      expect(res.status(), JSON.stringify(data).slice(0, 70)).toBe(400);
    }
    const noField = await request.post(`${API_URL}/documents`, { headers: authHeaders(admin), multipart: { outro: "x" } });
    expect(noField.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  test("[document.post.documents#conflito-ou-duplicidade] mesmo nome duas vezes: dois documentos com rotas distintas", async ({ request }) => {
    const first = await make(request, "post-duplicado");
    const second = await make(request, "post-duplicado");
    expect(second.id).not.toBe(first.id);
    expect(await documentsWithTag(label("post-duplicado"))).toBe(2);
    expect(await routesCount(first.id)).toBe(1);
    expect(await routesCount(second.id)).toBe(1);
  });

  test("[document.post.documents#falha-do-colaborador-sem-efeito-parcial] [document.post.documents#rollback-de-transacao] [document.post.documents#s3-sem-orfao] mídia com título que o banco recusa, DEPOIS do upload: nenhum documento, rota, mídia nem objeto", async ({
    request,
  }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await createRaw(request, admin, { name: label("post-rollback"), file: pdf("rollback.pdf"), mediaTitle: OVERSIZED_MEDIA_TITLE });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await documentsWithTag(label("post-rollback"))).toBe(0);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  // ---------------------------------------------------------------- GET

  test("[document.get.documents#feliz] [document.get.documents-id#feliz] listagem (com busca) e leitura por id batem com o banco", async ({ request }) => {
    const doc = await make(request, "get-feliz", { file: true });
    const list = await get(request, admin, `/documents?search=${encodeURIComponent(label("get-feliz"))}`);
    expect(list.status()).toBe(200);
    expect((await json<DocumentBody[]>(list)).map((item) => item.id)).toContain(doc.id);

    const one = await get(request, admin, `/documents/${doc.id}`);
    expect(one.status()).toBe(200);
    const body = await json<DocumentBody>(one);
    expect(body.name).toBe((await documentRow(doc.id))?.name);
    expect(body.media?.url).toBeTruthy();
  });

  test("[document.get.documents#escopo-proprio-x-outro] [document.get.documents-id#escopo-proprio-x-outro] o material é igual para admin, líder e membro; visitante é 401", async ({ request }) => {
    const doc = await make(request, "get-escopo");
    for (const token of [admin, leader, member]) {
      const list = await json<DocumentBody[]>(await get(request, token, `/documents?search=${encodeURIComponent(label("get-escopo"))}`));
      expect(list.map((item) => item.id)).toContain(doc.id);
      expect((await get(request, token, `/documents/${doc.id}`)).status()).toBe(200);
    }
    expect((await get(request, undefined, "/documents")).status()).toBe(401);
    expect((await get(request, undefined, `/documents/${doc.id}`)).status()).toBe(401);
  });

  test("[document.get.documents-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await get(request, admin, `/documents/${BAD_ID}`)).status()).toBe(404);
  });

  test("[document.get.documents-id#flag-desligada] com documents_library e document_management desligadas: 403 FEATURE_DISABLED", async ({ request }) => {
    const doc = await make(request, "get-flag");
    await withFlagsOff(request, admin, ["documents_library", "document_management"], async () => {
      await expectFeatureDisabled(await get(request, admin, `/documents/${doc.id}`));
    });
    expect((await get(request, admin, `/documents/${doc.id}`)).status()).toBe(200);
  });

  // ---------------------------------------------------------------- PATCH /documents/:id

  test("[document.patch.documents-id#feliz] admin renomeia e troca o PDF: o banco reflete e a mídia continua uma só", async ({ request }) => {
    const doc = await make(request, "patch-feliz", { file: true });
    const res = await patchRaw(request, admin, doc.id, { name: label("patch-feliz-novo"), description: "nova", media: { ...mediaPayload({ file: pdf("novo.pdf") }, doc.media?.id), title: "Novo" } }, pdf("novo.pdf"));
    expect(res.status(), await res.text()).toBe(200);
    expect((await documentRow(doc.id))?.name).toBe(label("patch-feliz-novo"));
    expect(await mediaCount(doc.id)).toBe(1);
  });

  test("[document.patch.documents-id#validacao] sem nome, nome que não é texto e sem mídia: 400 e o documento fica como estava", async ({ request }) => {
    const doc = await make(request, "patch-validacao");
    const before = await documentRow(doc.id);
    for (const data of [{ media: mediaPayload({}, doc.media?.id) }, { name: 5, media: mediaPayload({}, doc.media?.id) }, { name: label("sem-midia") }]) {
      const res = await patchRaw(request, admin, doc.id, data);
      expect(res.status(), JSON.stringify(data).slice(0, 70)).toBe(400);
    }
    expect(await documentRow(doc.id)).toEqual(before);
    expect(await mediaCount(doc.id)).toBe(1);
  });

  test("[document.patch.documents-id#nao-encontrado] uuid inexistente: 404 e nada criado", async ({ request }) => {
    const before = await snapshotDb();
    const res = await patchRaw(request, admin, BAD_ID, { name: label("patch-fantasma"), media: mediaPayload({}) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[document.patch.documents-id#conflito-ou-duplicidade] renomear para o nome de outro documento é aceito (sem unicidade): os dois existem e as rotas seguem distintas", async ({
    request,
  }) => {
    const first = await make(request, "patch-conflito-a");
    const second = await make(request, "patch-conflito-b");
    const res = await patchRaw(request, admin, second.id, { name: label("patch-conflito-a"), media: mediaPayload({}, second.media?.id) });
    expect(res.status(), await res.text()).toBe(200);
    expect((await documentRow(first.id))?.name).toBe(label("patch-conflito-a"));
    expect((await documentRow(second.id))?.name).toBe(label("patch-conflito-a"));
    expect(await routesCount(first.id)).toBe(1);
    expect(await routesCount(second.id)).toBe(1);
  });

  test("[document.patch.documents-id#falha-do-colaborador-sem-efeito-parcial] [document.patch.documents-id#rollback-de-transacao] [document.patch.documents-id#s3-sem-orfao] mídia com título que o banco recusa junto de PDF novo e outro nome: nome, mídia e bucket intactos", async ({
    request,
  }) => {
    const doc = await make(request, "patch-rollback", { file: true });
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await patchRaw(
      request,
      admin,
      doc.id,
      { name: label("patch-nao-grava"), media: { ...mediaPayload({ file: pdf("never.pdf"), mediaTitle: OVERSIZED_MEDIA_TITLE }, doc.media?.id) } },
      pdf("never.pdf"),
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect((await documentRow(doc.id))?.name).toBe(label("patch-rollback"));
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  // ---------------------------------------------------------------- DELETE

  test("[document.delete.documents-id#feliz] [document.delete.documents-id#s3-sem-orfao] admin remove: documento, mídia, rota e o objeto somem", async ({ request }) => {
    const doc = await make(request, "delete-feliz", { file: true });
    const res = await request.delete(`${API_URL}/documents/${doc.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBeLessThan(300);
    expect(await documentRow(doc.id)).toBeNull();
    expect(await mediaCount(doc.id)).toBe(0);
    expect(await routesCount(doc.id)).toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[document.delete.documents-id#nao-encontrado] uuid inexistente: 404 e nada some", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/documents/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[document.delete.documents-id#falha-do-colaborador-sem-efeito-parcial] [document.delete.documents-id#rollback-de-transacao] id malformado: 400 e nenhum documento, mídia nem objeto some", async ({ request }) => {
    const doc = await make(request, "delete-colaborador", { file: true });
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await request.delete(`${API_URL}/documents/nao-e-uuid`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
    expect(await documentRow(doc.id)).not.toBeNull();
  });
});
