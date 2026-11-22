import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, snapshotBucket } from "../support/s3";
import {
  BAD_ID,
  OVERSIZED_TITLE,
  create,
  createRaw,
  fetchOne,
  get,
  integrationRow,
  integrationsWithTag,
  label,
  mediaCount,
  png,
  putRaw,
  removeApi,
  snapshotDb,
  type IntegrationBody,
} from "./support";

/**
 * Cenários de `/integrations` por handler (plano 25 §7.3): feliz, validação, conflito, não encontrado, flag,
 * falha sem efeito parcial e S3 sem órfão. Cada cenário cria os próprios dados pela API (prefixo RUN_TAG), prova o efeito
 * por SELECT e o `afterAll` confere 0 sobras e o bucket consistente. Admin e líder usam; membro nunca (autorização em outro spec).
 */
test.describe.serial("Integração — cenários por handler", () => {
  let admin: string;
  const created: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const make = async (request: APIRequestContext, name: string, photos = 0): Promise<IntegrationBody> => {
    const item = await create(request, admin, { name: label(name), files: Array.from({ length: photos }, (_, i) => png(`${name}-${i}.png`)) });
    created.push(item.id);
    return item;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await removeApi(request, admin, id);
    expect(await integrationsWithTag(RUN_TAG), "a limpeza deixou integrações do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /integrations

  test("[integration.post.integrations#feliz] [integration.post.integrations#s3-sem-orfao] admin cria com duas fotos: o cadastro e as duas mídias batem com o banco e os objetos estão no bucket", async ({ request }) => {
    const item = await make(request, "post-feliz", 2);
    expect(await integrationRow(item.id)).toMatchObject({ name: label("post-feliz"), phone: "11999990000", churchYears: 3 });
    expect(await mediaCount(item.id)).toBe(2);
    expect((await fetchOne(request, admin, item.id)).images).toHaveLength(2);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[integration.post.integrations#validacao] tipos errados, JSON quebrado e campo ausente: 400 e nada gravado", async ({ request }) => {
    const before = await snapshotDb();
    for (const data of [{ name: 5 }, { name: label("v"), baptized: "sim" }, { name: label("v"), churchYears: "muitos" }, { name: label("v"), images: "não é lista" }]) {
      const res = await request.post(`${API_URL}/integrations`, { headers: authHeaders(admin), multipart: { integrationData: JSON.stringify(data) } });
      expect(res.status(), JSON.stringify(data)).toBe(400);
    }
    expect((await request.post(`${API_URL}/integrations`, { headers: authHeaders(admin), multipart: { integrationData: "{ json quebrado" } })).status()).toBe(400);
    expect((await request.post(`${API_URL}/integrations`, { headers: authHeaders(admin), multipart: { outro: "x" } })).status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[integration.post.integrations#conflito-ou-duplicidade] o mesmo cadastro duas vezes é aceito (sem unicidade): dois registros", async ({ request }) => {
    const first = await make(request, "post-duplicado");
    const second = await make(request, "post-duplicado");
    expect(second.id).not.toBe(first.id);
    expect(await integrationsWithTag(label("post-duplicado"))).toBe(2);
  });

  test("[integration.post.integrations#falha-do-colaborador-sem-efeito-parcial] foto cujo registro o banco recusa, DEPOIS do upload: nenhum cadastro, mídia nem objeto", async ({ request }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await createRaw(request, admin, { name: label("post-colaborador"), files: [png("a.png")], images: [{ title: OVERSIZED_TITLE }] });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await integrationsWithTag(label("post-colaborador"))).toBe(0);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  // ---------------------------------------------------------------- GET

  test("[integration.get.integrations#feliz] [integration.get.integrations-id#feliz] [integration.get.integrations-simple#feliz] listagem paginada (com busca), lista simples e leitura por id batem com o banco", async ({ request }) => {
    const item = await make(request, "get-feliz", 1);
    const page = await get(request, admin, `/integrations?page=1&limit=10&search=${encodeURIComponent(label("get-feliz"))}`);
    expect(page.status(), await page.text()).toBe(200);
    const body = await json<{ data: IntegrationBody[]; total: number }>(page);
    expect(body.data.map((entry) => entry.id)).toContain(item.id);

    const simple = await get(request, admin, "/integrations/simple");
    expect(simple.status()).toBe(200);
    expect((await json<IntegrationBody[]>(simple)).map((entry) => entry.id)).toContain(item.id);

    const one = await fetchOne(request, admin, item.id);
    expect(one.name).toBe((await integrationRow(item.id))?.name);
    expect(one.images).toHaveLength(await mediaCount(item.id));
  });

  test("[integration.get.integrations-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await get(request, admin, `/integrations/${BAD_ID}`)).status()).toBe(404);
  });

  test("[integration.get.integrations-id#flag-desligada] [integration.get.integrations-simple#flag-desligada] com a flag integration desligada: 403 FEATURE_DISABLED", async ({ request }) => {
    const item = await make(request, "get-flag");
    await withFlagsOff(request, admin, ["integration"], async () => {
      await expectFeatureDisabled(await get(request, admin, `/integrations/${item.id}`));
      await expectFeatureDisabled(await get(request, admin, "/integrations/simple"));
    });
    expect((await get(request, admin, `/integrations/${item.id}`)).status()).toBe(200);
  });

  // ---------------------------------------------------------------- PUT /integrations/:id

  test("[integration.put.integrations-id#feliz] admin altera os dados e troca uma foto: o banco reflete e a quantidade de mídias continua", async ({ request }) => {
    const item = await make(request, "put-feliz", 2);
    const before = await fetchOne(request, admin, item.id);
    const [first, second] = before.images ?? [];
    const res = await putRaw(
      request,
      admin,
      item.id,
      { name: label("put-feliz-novo"), phone: "11888880000", images: [{ id: first.id, fieldKey: "files[0]" }, { id: second.id }] },
      [png("nova.png")],
    );
    expect(res.status(), await res.text()).toBe(200);
    expect(await integrationRow(item.id)).toMatchObject({ name: label("put-feliz-novo"), phone: "11888880000" });
    expect(await mediaCount(item.id)).toBe(2);
    expect((await fetchOne(request, admin, item.id)).images?.find((image) => image.id === first.id)?.url).not.toBe(first.url);
  });

  test("[integration.put.integrations-id#validacao] tipos errados e JSON quebrado: 400 e o cadastro fica como estava", async ({ request }) => {
    const item = await make(request, "put-validacao");
    const before = await integrationRow(item.id);
    for (const data of [{ name: 5 }, { baptized: "sim" }, { churchYears: "muitos" }]) {
      expect((await putRaw(request, admin, item.id, data)).status(), JSON.stringify(data)).toBe(400);
    }
    const broken = await request.put(`${API_URL}/integrations/${item.id}`, { headers: authHeaders(admin), multipart: { integrationData: "{ json quebrado" } });
    expect(broken.status()).toBe(400);
    expect(await integrationRow(item.id)).toEqual(before);
  });

  test("[integration.put.integrations-id#nao-encontrado] uuid inexistente: 404 e nada criado", async ({ request }) => {
    const before = await snapshotDb();
    expect((await putRaw(request, admin, BAD_ID, { name: label("put-fantasma") })).status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[integration.put.integrations-id#conflito-ou-duplicidade] renomear para o nome de outro cadastro é aceito (sem unicidade): os dois existem", async ({ request }) => {
    const first = await make(request, "put-conflito-a");
    const second = await make(request, "put-conflito-b");
    const res = await putRaw(request, admin, second.id, { name: label("put-conflito-a") });
    expect(res.status(), await res.text()).toBe(200);
    expect((await integrationRow(first.id))?.name).toBe(label("put-conflito-a"));
    expect((await integrationRow(second.id))?.name).toBe(label("put-conflito-a"));
  });

  test("[integration.put.integrations-id#falha-do-colaborador-sem-efeito-parcial] [integration.put.integrations-id#s3-sem-orfao] foto nova que o banco recusa junto de outras mudanças: o cadastro NÃO muda (nome, telefone), as mídias e o bucket ficam intactos", async ({
    request,
  }) => {
    const item = await make(request, "put-colaborador", 1);
    const before = await integrationRow(item.id);
    const existing = (await fetchOne(request, admin, item.id)).images ?? [];
    const dbBefore = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await putRaw(
      request,
      admin,
      item.id,
      { name: label("put-nao-grava"), phone: "00000000000", images: [{ id: existing[0].id }, { title: OVERSIZED_TITLE, fieldKey: "files[0]" }] },
      [png("never.png")],
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await integrationRow(item.id)).toEqual(before);
    expect(await snapshotDb()).toEqual(dbBefore);
    await expectBucketUnchanged(bucket);
  });

  // ---------------------------------------------------------------- DELETE

  test("[integration.delete.integrations-id#feliz] [integration.delete.integrations-id#s3-sem-orfao] admin remove: cadastro, mídias e objetos somem", async ({ request }) => {
    const item = await make(request, "delete-feliz", 2);
    const res = await request.delete(`${API_URL}/integrations/${item.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBeLessThan(300);
    expect(await integrationRow(item.id)).toBeNull();
    expect(await mediaCount(item.id)).toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("[integration.delete.integrations-id#nao-encontrado] uuid inexistente: 404 e nada some", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/integrations/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[integration.delete.integrations-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhum cadastro, mídia nem objeto some", async ({ request }) => {
    const item = await make(request, "delete-colaborador", 1);
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await request.delete(`${API_URL}/integrations/nao-e-uuid`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
    expect(await integrationRow(item.id)).not.toBeNull();
  });
});
