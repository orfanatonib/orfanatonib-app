import type { APIRequestContext } from "@playwright/test";

import { closeDb, countRows } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expect, loginAs, test } from "../support/live";
import { addedKeys } from "../support/s3-invariants";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, listObjects, snapshotBucket } from "../support/s3";
import { OVERSIZED_FILE_NAME, create, createRaw, eventsWithTag, label, mediaCount, patchRaw, png, removeApi } from "./support";

/**
 * Cenários `event.s3.01-12` (plano 20 §7.4): toda operação vai pela API real, o banco é lido por SELECT e o bucket
 * (LocalStack) é listado ao fim de cada cenário — nenhum objeto órfão e nenhuma referência quebrada. O evento tem **uma**
 * imagem, então "N arquivos" vira N eventos com imagem. (Os cenários 01, 04, 07 e 10 também existem em
 * `security/media-entities.api.spec.ts`; aqui o conjunto fica completo e com falha real depois do upload.)
 */
test.describe.serial("Eventos — S3 sem órfão nem referência quebrada", () => {
  let admin: string;
  const owners: string[] = [];
  let counter = 0;
  const next = (): string => label(`s3-${(counter += 1)}`);

  const invariants = async (): Promise<void> => {
    await expectNoOrphans();
    await expectNoBrokenRefs();
  };

  const make = async (request: APIRequestContext, fileName: string): Promise<string> => {
    const event = await create(request, admin, { title: next(), file: png(fileName) });
    owners.push(event.id);
    return event.id;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterEach(async ({ request }) => {
    for (const id of owners.splice(0)) await removeApi(request, admin, id);
  });

  test.afterAll(async () => {
    expect(await eventsWithTag(RUN_TAG), "a limpeza deixou eventos do E2E").toBe(0);
    await invariants();
    await closeDb();
  });

  test("[event.s3.01] criar com imagem: um objeto no bucket e uma linha no banco", async ({ request }) => {
    const before = await snapshotBucket();
    const id = await make(request, "a.png");
    expect(await mediaCount(id)).toBe(1);
    expect(addedKeys(before, await snapshotBucket())).toHaveLength(1);
    await invariants();
  });

  test("[event.s3.02] criar com arquivo que não é imagem não deixa objeto nem evento", async ({ request }) => {
    const before = await snapshotBucket();
    const title = next();
    const res = await createRaw(request, admin, { title, file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await eventsWithTag(title)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[event.s3.03] criar com falha real no banco depois do upload descarta o objeto e remove o evento", async ({ request }) => {
    const before = await snapshotBucket();
    const title = next();
    const res = await createRaw(request, admin, { title, file: png(OVERSIZED_FILE_NAME) });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await eventsWithTag(title)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[event.s3.04] substituir a imagem remove a antiga só depois do commit", async ({ request }) => {
    const beforeCreate = await snapshotBucket();
    const id = await make(request, "old.png");
    const [oldKey] = addedKeys(beforeCreate, await snapshotBucket());
    const res = await patchRaw(request, admin, id, { title: next() }, png("new.png"));
    expect(res.status(), await res.text()).toBe(200);
    expect(await listObjects()).not.toContain(oldKey);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[event.s3.05] trocar a imagem por um link remove o objeto e mantém uma linha", async ({ request }) => {
    const beforeCreate = await snapshotBucket();
    const id = await make(request, "a.png");
    const [key] = addedKeys(beforeCreate, await snapshotBucket());
    const res = await patchRaw(request, admin, id, { media: { url: "https://example.com/capa.png", isLocalFile: false } });
    expect(res.status(), await res.text()).toBe(200);
    expect(await listObjects()).not.toContain(key);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[event.s3.06] update com falha mantém a imagem antiga, descarta a nova e não muda o evento", async ({ request }) => {
    const id = await make(request, "keep.png");
    const before = await snapshotBucket();
    const res = await patchRaw(request, admin, id, { title: next() }, png(OVERSIZED_FILE_NAME));
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(before);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[event.s3.07] apagar o evento remove objeto e linha", async ({ request }) => {
    const before = await snapshotBucket();
    const id = await make(request, "a.png");
    await removeApi(request, admin, id);
    expect(await mediaCount(id)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
    owners.splice(owners.indexOf(id), 1);
  });

  test("[event.s3.08] apagar o evento remove também o vínculo com a mídia (cascata completa)", async ({ request }) => {
    const before = await snapshotBucket();
    const id = await make(request, "c.png");
    expect(await countRows("media_items", { targetId: id })).toBe(1);
    await removeApi(request, admin, id);
    expect(await countRows("media_items", { targetId: id })).toBe(0);
    expect(await countRows("events", { id })).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
    owners.splice(owners.indexOf(id), 1);
  });

  test("[event.s3.09] duas imagens de mesmo nome geram chaves distintas", async ({ request }) => {
    const before = await snapshotBucket();
    await make(request, "igual.png");
    await make(request, "igual.png");
    expect(addedKeys(before, await snapshotBucket())).toHaveLength(2);
    await invariants();
  });

  test("[event.s3.10] arquivo que não é imagem é recusado sem efeito (a imagem atual fica)", async ({ request }) => {
    const id = await make(request, "base.png");
    const afterCreate = await snapshotBucket();
    const res = await patchRaw(request, admin, id, { title: next() }, { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(afterCreate);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[event.s3.11] a fila de limpeza existe e não deixa pendência que gere órfão", async () => {
    expect(await countRows("media_cleanup_queue")).toBeGreaterThanOrEqual(0);
    await invariants();
  });

  test("[event.s3.12] trocas simultâneas da imagem não deixam órfão nem referência quebrada", async ({ request }) => {
    const id = await make(request, "a.png");
    await Promise.allSettled([patchRaw(request, admin, id, { title: next() }, png("c1.png")), patchRaw(request, admin, id, { title: next() }, png("c2.png"))]);
    expect(await mediaCount(id)).toBeGreaterThanOrEqual(1);
    await invariants();
  });
});
