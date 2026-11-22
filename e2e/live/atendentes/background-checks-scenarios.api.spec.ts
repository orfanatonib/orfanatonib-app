import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, listObjects, snapshotBucket } from "../support/s3";
import { addedKeys } from "../support/s3-invariants";
import { createActor, removeActors, type Actor } from "../users/support";
import {
  BAD_ID,
  OVERSIZED_TITLE,
  TARGET_ESTADUAL,
  allRecords,
  create,
  createRaw,
  exe,
  get,
  label,
  mediaCount,
  pdf,
  pdfRow,
  putRaw,
  recordRow,
  recordsWithTag,
  removeApi,
  snapshotDb,
  type RecordBody,
} from "./support";

/**
 * Cenários do plano 26 (`background-checks`): dado de maior sensibilidade (antecedente criminal). Cada cenário cria os
 * próprios dados pela API, prova o efeito por SELECT e o bucket é listado ao fim: PDF é objeto privado, sem órfão e
 * sem referência quebrada. Autorização por perfil está em `background-checks-authorization.api.spec.ts`.
 */
test.describe.serial("Antecedentes criminais — cenários de contrato, atomicidade e S3", () => {
  let admin: string;
  let seeded: string;
  const owners: string[] = [];
  const people: Actor[] = [];
  let counter = 0;
  const next = (): string => label(`bc-${(counter += 1)}`);

  const invariants = async (): Promise<void> => {
    await expectNoOrphans();
    await expectNoBrokenRefs();
  };

  const make = async (request: APIRequestContext, input: Parameters<typeof create>[2] = {}): Promise<RecordBody> => {
    const body = await create(request, admin, { name: next(), estadual: pdf("e.pdf"), ...input });
    owners.push(body.id);
    return body;
  };

  const person = async (request: APIRequestContext): Promise<Actor> => {
    const actor = await createActor(request, seeded, "member", `bc-person-${(counter += 1)}`);
    people.push(actor);
    return actor;
  };

  test.beforeAll(async ({ request }) => {
    seeded = (await loginAs(request, "admin")).accessToken;
    admin = seeded;
  });

  test.afterEach(async ({ request }) => {
    for (const id of owners.splice(0)) await removeApi(request, admin, id);
  });

  test.afterAll(async ({ request }) => {
    await removeActors(request, seeded, people.map((p) => p.id));
    expect(await recordsWithTag(RUN_TAG), "a limpeza deixou antecedentes do E2E").toBe(0);
    await invariants();
    await closeDb();
  });

  // ───────────────────────── POST ─────────────────────────
  test("[background-checks.post.antecedentes-criminais#feliz] cria com os dois PDFs: cadastro, duas linhas privadas e dois objetos", async ({ request }) => {
    const before = await snapshotBucket();
    const body = await make(request, { federal: pdf("f.pdf") });
    expect((await recordRow(body.id))?.name).toContain(RUN_TAG);
    expect(await mediaCount(body.id)).toBe(2);
    expect((await pdfRow(body.id, TARGET_ESTADUAL))?.url).toContain("/private/AtendenteEstadual/");
    expect(addedKeys(before, await snapshotBucket())).toHaveLength(2);
    await invariants();
  });

  test("[background-checks.post.antecedentes-criminais#validacao] sem nome e sem vínculo, sem PDF, vínculo incompleto ou tipo fora do enum: 400 e nada gravado", async ({ request }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    expect((await createRaw(request, admin, { estadual: pdf("e.pdf") })).status(), "sem nome e sem vínculo").toBe(400);
    expect((await createRaw(request, admin, { name: next() })).status(), "sem PDF").toBe(400);
    expect((await createRaw(request, admin, { name: next(), attendableType: "user", estadual: pdf("e.pdf") })).status(), "tipo sem id").toBe(400);
    const badType = await request.post(`${API_URL}/antecedentes-criminais`, {
      headers: authHeaders(admin),
      multipart: { atendenteData: JSON.stringify({ name: next(), attendableType: "alien" }), estadual: pdf("e.pdf") },
    });
    expect(badType.status(), "tipo fora do enum").toBe(400);
    const missingData = await request.post(`${API_URL}/antecedentes-criminais`, { headers: authHeaders(admin), multipart: { estadual: pdf("e.pdf") } });
    expect(missingData.status(), "sem atendenteData").toBe(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
    await invariants();
  });

  test("[background-checks.post.antecedentes-criminais#conflito-ou-duplicidade] segundo antecedente para a mesma pessoa: 400 e só existe um", async ({ request }) => {
    const actor = await person(request);
    await make(request, { name: undefined, attendableType: "user", attendableId: actor.id });
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const again = await createRaw(request, admin, { attendableType: "user", attendableId: actor.id, estadual: pdf("e2.pdf") });
    expect(again.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
    await invariants();
  });

  test("[background-checks.post.antecedentes-criminais#falha-do-colaborador-sem-efeito-parcial] [background-checks.post.antecedentes-criminais#s3-sem-orfao] 2º PDF que o banco recusa DEPOIS dos uploads: nenhum cadastro, linha nem objeto", async ({ request }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    const res = await createRaw(request, admin, {
      name: next(),
      estadual: pdf("ok.pdf"),
      federal: pdf("falha.pdf"),
      federalTitle: OVERSIZED_TITLE,
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
    await invariants();
  });

  // ───────────────────────── GET ─────────────────────────
  test("[background-checks.get.antecedentes-criminais#feliz] a listagem acha o cadastro pelo nome e entrega só URL assinada", async ({ request }) => {
    const body = await make(request);
    const res = await get(request, admin, `/antecedentes-criminais?search=${encodeURIComponent(body.name ?? "")}`);
    expect(res.status()).toBe(200);
    const list = (await res.json()) as { data: RecordBody[]; total: number };
    const item = list.data.find((entry) => entry.id === body.id);
    expect(item, "o cadastro aparece na busca").toBeTruthy();
    expect(item?.pdfEstadual?.url).toContain("X-Amz-Signature=");
    expect(list.data.every((entry) => (entry.name ?? "").includes(body.name ?? "")), "o filtro vale para todos").toBe(true);
  });

  test("[background-checks.get.antecedentes-criminais#flag-desligada] [background-checks.get.antecedentes-criminais-id#flag-desligada] com criminal_records desligada, listar e ler: 403 FEATURE_DISABLED", async ({ request }) => {
    const body = await make(request);
    await withFlagsOff(request, admin, ["criminal_records"], async () => {
      await expectFeatureDisabled(await get(request, admin, "/antecedentes-criminais"));
      await expectFeatureDisabled(await get(request, admin, `/antecedentes-criminais/${body.id}`));
    });
    expect((await get(request, admin, `/antecedentes-criminais/${body.id}`)).status(), "religada, volta a responder").toBe(200);
  });

  test("[background-checks.get.antecedentes-criminais-id#feliz] ler por id traz o vínculo, o nome da pessoa e a URL assinada que abre o PDF", async ({ request }) => {
    const actor = await person(request);
    const body = await make(request, { name: undefined, attendableType: "user", attendableId: actor.id });
    const res = await get(request, admin, `/antecedentes-criminais/${body.id}`);
    expect(res.status()).toBe(200);
    const detail = (await res.json()) as RecordBody & { attendableDisplayName?: string };
    expect(detail.attendableId).toBe(actor.id);
    expect(detail.attendableDisplayName).toBeTruthy();
    const download = await request.get(detail.pdfEstadual!.url);
    expect(download.status()).toBe(200);
    expect((await download.body()).subarray(0, 4).toString()).toBe("%PDF");
    // O objeto é privado (a política do bucket nega leitura anônima de `*/private/*`; o LocalStack não a aplica, então
    // aqui se prova o que a API controla): pasta privada e URL assinada de curta duração.
    const signed = new URL(detail.pdfEstadual!.url);
    expect(signed.pathname).toContain("/private/AtendenteEstadual/");
    expect(Number(signed.searchParams.get("X-Amz-Expires"))).toBeLessThanOrEqual(900);
  });

  test("[background-checks.get.antecedentes-criminais-id#nao-encontrado] id que não existe: 404; id malformado: 400", async ({ request }) => {
    expect((await get(request, admin, `/antecedentes-criminais/${BAD_ID}`)).status()).toBe(404);
    expect((await get(request, admin, "/antecedentes-criminais/nao-e-uuid")).status()).toBe(400);
  });

  // ───────────────────────── PUT ─────────────────────────
  test("[background-checks.put.antecedentes-criminais-id#feliz] troca nome, troca o PDF estadual e acrescenta o federal numa só chamada", async ({ request }) => {
    const body = await make(request);
    const bucketBefore = await snapshotBucket();
    const oldRow = await pdfRow(body.id, TARGET_ESTADUAL);
    const res = await putRaw(request, admin, body.id, { name: next() }, { estadual: pdf("novo-e.pdf"), federal: pdf("novo-f.pdf") });
    expect(res.status(), await res.text()).toBe(200);
    expect(await mediaCount(body.id)).toBe(2);
    const newRow = await pdfRow(body.id, TARGET_ESTADUAL);
    expect(newRow?.id, "o PDF estadual é outra linha").not.toBe(oldRow?.id);
    expect((await recordRow(body.id))?.name).not.toBe(body.name);
    const after = await snapshotBucket();
    expect(addedKeys(bucketBefore, after), "dois objetos novos (estadual trocado e federal)").toHaveLength(2);
    expect(after.filter((key) => key.includes(`/${body.id}/`)), "o objeto antigo saiu: restam só os dois do cadastro").toHaveLength(2);
    await invariants();
  });

  test("[background-checks.put.antecedentes-criminais-id#validacao] remover o único PDF, tipo fora do enum ou vínculo sem id: 4xx e o cadastro NÃO muda (nem o nome)", async ({ request }) => {
    const body = await make(request);
    const snapshot = await recordRow(body.id);
    const bucket = await snapshotBucket();
    const onlyPdf = await putRaw(request, admin, body.id, { name: next(), removePdfEstadual: true });
    expect(onlyPdf.status(), "sem nenhum PDF").toBe(400);
    const badType = await putRaw(request, admin, body.id, { name: next(), attendableType: "alien" });
    expect(badType.status(), "tipo fora do enum").toBe(400);
    const noId = await putRaw(request, admin, body.id, { name: next(), attendableType: "user" });
    expect(noId.status(), "tipo sem id").toBe(400);
    const noData = await request.put(`${API_URL}/antecedentes-criminais/${body.id}`, { headers: authHeaders(admin), multipart: {} });
    expect(noData.status(), "sem atendenteData").toBe(400);
    expect(await recordRow(body.id)).toEqual(snapshot);
    expect(await mediaCount(body.id)).toBe(1);
    await expectBucketUnchanged(bucket);
    await invariants();
  });

  test("[background-checks.put.antecedentes-criminais-id#nao-encontrado] id que não existe: 404 e nenhum PDF sobe; malformado: 400", async ({ request }) => {
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    expect((await putRaw(request, admin, BAD_ID, { name: next() }, { estadual: pdf("x.pdf") })).status()).toBe(404);
    expect((await putRaw(request, admin, "nao-e-uuid", { name: next() })).status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    await expectBucketUnchanged(bucket);
  });

  test("[background-checks.put.antecedentes-criminais-id#conflito-ou-duplicidade] religar a uma pessoa que já tem antecedente: 400 e o vínculo não muda", async ({ request }) => {
    const first = await person(request);
    const second = await person(request);
    await make(request, { name: undefined, attendableType: "user", attendableId: first.id });
    const other = await make(request, { name: undefined, attendableType: "user", attendableId: second.id });
    const res = await putRaw(request, admin, other.id, { attendableType: "user", attendableId: first.id });
    expect(res.status()).toBe(400);
    expect((await recordRow(other.id))?.attendableId).toBe(second.id);
    // Reenviar o PRÓPRIO vínculo não é conflito.
    const same = await putRaw(request, admin, other.id, { attendableType: "user", attendableId: second.id });
    expect(same.status(), await same.text()).toBe(200);
    await invariants();
  });

  test("[background-checks.put.antecedentes-criminais-id#falha-do-colaborador-sem-efeito-parcial] [background-checks.put.antecedentes-criminais-id#s3-sem-orfao] PDF que o banco recusa DEPOIS do upload: nome, PDF antigo e bucket ficam como estavam", async ({ request }) => {
    const body = await make(request);
    const snapshot = await recordRow(body.id);
    const oldRow = await pdfRow(body.id, TARGET_ESTADUAL);
    const bucket = await snapshotBucket();
    const res = await putRaw(
      request,
      admin,
      body.id,
      { name: next(), pdfEstadual: { title: OVERSIZED_TITLE } },
      { estadual: pdf("falha.pdf") },
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await recordRow(body.id), "o nome não mudou").toEqual(snapshot);
    expect((await pdfRow(body.id, TARGET_ESTADUAL))?.id).toBe(oldRow?.id);
    await expectBucketUnchanged(bucket);
    expect(await listObjects()).toEqual(bucket);
    await invariants();
  });

  // ───────────────────────── DELETE ─────────────────────────
  test("[background-checks.delete.antecedentes-criminais-id#feliz] [background-checks.delete.antecedentes-criminais-id#s3-sem-orfao] apagar remove cadastro, as duas linhas e os dois objetos", async ({ request }) => {
    const bucket = await snapshotBucket();
    const body = await make(request, { federal: pdf("f.pdf") });
    expect(await mediaCount(body.id)).toBe(2);
    const res = await request.delete(`${API_URL}/antecedentes-criminais/${body.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await recordRow(body.id)).toBeNull();
    expect(await mediaCount(body.id)).toBe(0);
    await expectBucketUnchanged(bucket);
    await invariants();
    owners.splice(owners.indexOf(body.id), 1);
  });

  test("[background-checks.delete.antecedentes-criminais-id#nao-encontrado] apagar o que não existe: 404, e apagar de novo o que já foi apagado também", async ({ request }) => {
    const body = await make(request);
    const first = await request.delete(`${API_URL}/antecedentes-criminais/${body.id}`, { headers: authHeaders(admin) });
    expect(first.status()).toBe(200);
    const again = await request.delete(`${API_URL}/antecedentes-criminais/${body.id}`, { headers: authHeaders(admin) });
    expect(again.status()).toBe(404);
    expect((await request.delete(`${API_URL}/antecedentes-criminais/${BAD_ID}`, { headers: authHeaders(admin) })).status()).toBe(404);
    owners.splice(owners.indexOf(body.id), 1);
  });

  test("[background-checks.delete.antecedentes-criminais-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhum cadastro, linha ou objeto some", async ({ request }) => {
    await make(request, { federal: pdf("f.pdf") });
    const before = await snapshotDb();
    const bucket = await snapshotBucket();
    expect((await request.delete(`${API_URL}/antecedentes-criminais/nao-e-uuid`, { headers: authHeaders(admin) })).status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    expect(await allRecords()).toBe(before.records);
    await expectBucketUnchanged(bucket);
    await invariants();
  });
});
