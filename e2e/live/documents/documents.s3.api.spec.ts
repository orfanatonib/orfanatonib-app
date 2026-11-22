import type { APIRequestContext } from "@playwright/test";

import { closeDb, countRows } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expect, loginAs, test } from "../support/live";
import { addedKeys } from "../support/s3-invariants";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, listObjects, snapshotBucket } from "../support/s3";
import { OVERSIZED_MEDIA_TITLE, create, createRaw, documentsWithTag, label, mediaCount, mediaPayload, patchRaw, pdf, removeApi, routesCount } from "./support";

/**
 * Cenários `document.s3.01-12` (plano 27 §7.4): toda operação vai pela API real, o banco é lido por SELECT e o bucket
 * (LocalStack) é listado ao fim de cada cenário — nenhum objeto órfão e nenhuma referência quebrada. O documento tem
 * **uma** mídia, então "N arquivos" vira N documentos com PDF.
 */
test.describe.serial("Documentos — S3 sem órfão nem referência quebrada", () => {
  let admin: string;
  const owners: string[] = [];
  let counter = 0;
  const next = (): string => label(`s3-${(counter += 1)}`);

  const invariants = async (): Promise<void> => {
    await expectNoOrphans();
    await expectNoBrokenRefs();
  };

  const make = async (request: APIRequestContext, fileName: string): Promise<{ id: string; mediaId?: string }> => {
    const doc = await create(request, admin, { name: next(), file: pdf(fileName) });
    owners.push(doc.id);
    return { id: doc.id, mediaId: doc.media?.id };
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterEach(async ({ request }) => {
    for (const id of owners.splice(0)) await removeApi(request, admin, id);
  });

  test.afterAll(async () => {
    expect(await documentsWithTag(RUN_TAG), "a limpeza deixou documentos do E2E").toBe(0);
    await invariants();
    await closeDb();
  });

  test("[document.s3.01] criar com PDF: um objeto no bucket e uma linha no banco", async ({ request }) => {
    const before = await snapshotBucket();
    const { id } = await make(request, "a.pdf");
    expect(await mediaCount(id)).toBe(1);
    expect(addedKeys(before, await snapshotBucket())).toHaveLength(1);
    await invariants();
  });

  test("[document.s3.02] criar com arquivo de tipo não aceito não deixa objeto nem documento", async ({ request }) => {
    const before = await snapshotBucket();
    const name = next();
    const res = await createRaw(request, admin, { name, file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } });
    expect(res.status(), "um executável não pode virar documento").toBeGreaterThanOrEqual(400);
    expect(await documentsWithTag(name)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[document.s3.03] criar com falha real no banco depois do upload descarta o objeto enviado", async ({ request }) => {
    const before = await snapshotBucket();
    const name = next();
    const res = await createRaw(request, admin, { name, file: pdf("x.pdf"), mediaTitle: OVERSIZED_MEDIA_TITLE });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await documentsWithTag(name)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[document.s3.04] [document.patch.documents-id#s3-sem-orfao] substituir o PDF atualiza a mesma linha e remove o objeto antigo só depois do commit", async ({ request }) => {
    const beforeCreate = await snapshotBucket();
    const { id, mediaId } = await make(request, "old.pdf");
    const [oldKey] = addedKeys(beforeCreate, await snapshotBucket());
    const res = await patchRaw(request, admin, id, { name: next(), media: mediaPayload({ file: pdf("new.pdf") }, mediaId) }, pdf("new.pdf"));
    expect(res.status(), await res.text()).toBe(200);
    expect(await listObjects()).not.toContain(oldKey);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[document.s3.05] trocar o PDF por um link remove o objeto e mantém uma linha", async ({ request }) => {
    const beforeCreate = await snapshotBucket();
    const { id, mediaId } = await make(request, "a.pdf");
    const [key] = addedKeys(beforeCreate, await snapshotBucket());
    const res = await patchRaw(request, admin, id, { name: next(), media: mediaPayload({ url: "https://example.com/novo.pdf" }, mediaId) });
    expect(res.status(), await res.text()).toBe(200);
    expect(await listObjects()).not.toContain(key);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[document.s3.06] update com falha mantém o PDF antigo e descarta o novo", async ({ request }) => {
    const { id, mediaId } = await make(request, "keep.pdf");
    const before = await snapshotBucket();
    const res = await patchRaw(request, admin, id, { name: next(), media: mediaPayload({ file: pdf("never.pdf"), mediaTitle: OVERSIZED_MEDIA_TITLE }, mediaId) }, pdf("never.pdf"));
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(before);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[document.s3.07] apagar o documento remove objeto e linha", async ({ request }) => {
    const before = await snapshotBucket();
    const { id } = await make(request, "a.pdf");
    await removeApi(request, admin, id);
    expect(await mediaCount(id)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
    owners.splice(owners.indexOf(id), 1);
  });

  test("[document.s3.08] apagar o documento faz cascata completa (mídia, rota, objeto)", async ({ request }) => {
    const before = await snapshotBucket();
    const { id } = await make(request, "c.pdf");
    expect(await routesCount(id)).toBe(1);
    await removeApi(request, admin, id);
    expect(await mediaCount(id)).toBe(0);
    expect(await routesCount(id)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
    owners.splice(owners.indexOf(id), 1);
  });

  test("[document.s3.09] dois PDFs de mesmo nome geram chaves distintas", async ({ request }) => {
    const before = await snapshotBucket();
    await make(request, "igual.pdf");
    await make(request, "igual.pdf");
    expect(addedKeys(before, await snapshotBucket())).toHaveLength(2);
    await invariants();
  });

  test("[document.s3.10] arquivo de tipo não aceito é recusado sem efeito (o PDF atual fica)", async ({ request }) => {
    const { id, mediaId } = await make(request, "base.pdf");
    const afterCreate = await snapshotBucket();
    const res = await patchRaw(
      request,
      admin,
      id,
      { name: next(), media: mediaPayload({ file: pdf("x.exe") }, mediaId) },
      { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
    );
    expect(res.status(), "um executável não pode substituir o documento").toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(afterCreate);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[document.s3.11] a fila de limpeza existe e não deixa pendência que gere órfão", async () => {
    expect(await countRows("media_cleanup_queue")).toBeGreaterThanOrEqual(0);
    await invariants();
  });

  test("[document.s3.12] trocas simultâneas do PDF não deixam órfão nem referência quebrada", async ({ request }) => {
    const { id, mediaId } = await make(request, "a.pdf");
    const swap = (name: string) => patchRaw(request, admin, id, { name: next(), media: { ...mediaPayload({ file: pdf(`${name}.pdf`) }, mediaId), title: name } }, pdf(`${name}.pdf`));
    await Promise.allSettled([swap("c1"), swap("c2")]);
    expect(await mediaCount(id)).toBeGreaterThanOrEqual(1);
    await invariants();
  });
});
