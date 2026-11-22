import type { APIRequestContext } from "@playwright/test";

import { closeDb, countRows } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expect, loginAs, test } from "../support/live";
import { addedKeys } from "../support/s3-invariants";
import {
  expectBucketUnchanged,
  expectNoBrokenRefs,
  expectNoOrphans,
  listObjects,
  snapshotBucket,
} from "../support/s3";
import {
  OVERSIZED_CITY,
  createShelter,
  createShelterRaw,
  deleteShelterApi,
  exe,
  label,
  mediaCount,
  patchMediaRaw,
  png,
  putShelterRaw,
  sheltersWithTag,
  teamsCount,
} from "./support";

/**
 * Cenários `shelter.s3.01-12` (plano 13 §7.4): toda operação vai pela API real, o banco é lido por
 * SELECT e o bucket (LocalStack) é listado ao fim de cada cenário — nenhum objeto órfão e nenhuma
 * referência quebrada. O abrigo tem **uma** foto principal; "N arquivos" vira N abrigos com foto.
 */
test.describe.serial("Abrigos — S3 sem órfão nem referência quebrada", () => {
  let admin: string;
  const owners: string[] = [];
  let counter = 0;
  const next = (): string => `s3-${(counter += 1)}`;

  const invariants = async (): Promise<void> => {
    await expectNoOrphans();
    await expectNoBrokenRefs();
  };

  const make = async (request: APIRequestContext, fileName: string): Promise<string> => {
    const shelter = await createShelter(request, admin, { name: label(next()), file: png(fileName) });
    owners.push(shelter.id);
    return shelter.id;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterEach(async ({ request }) => {
    for (const id of owners.splice(0)) await deleteShelterApi(request, admin, id);
  });

  test.afterAll(async () => {
    expect(await sheltersWithTag(RUN_TAG), "a limpeza deixou abrigos do E2E").toBe(0);
    await invariants();
    await closeDb();
  });

  test("[shelter.s3.01] [shelter.post.shelters#s3-sem-orfao] criar com foto: um objeto no bucket e uma linha no banco", async ({ request }) => {
    const before = await snapshotBucket();
    const id = await make(request, "a.png");
    expect(await mediaCount(id)).toBe(1);
    expect(addedKeys(before, await snapshotBucket())).toHaveLength(1);
    await invariants();
  });

  test("[shelter.s3.02] criar com arquivo inválido não deixa objeto nem abrigo", async ({ request }) => {
    const before = await snapshotBucket();
    const name = label(next());
    const res = await createShelterRaw(request, admin, { name, file: exe() });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await sheltersWithTag(name)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[shelter.s3.03] criar com falha real no banco descarta o objeto enviado", async ({ request }) => {
    const before = await snapshotBucket();
    const name = label(next());
    const res = await createShelterRaw(request, admin, { name, file: png("x.png"), city: OVERSIZED_CITY });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await sheltersWithTag(name)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[shelter.s3.04] [shelter.patch.shelters-id-media#s3-sem-orfao] substituir a foto remove o objeto antigo só depois do commit", async ({
    request,
  }) => {
    const beforeCreate = await snapshotBucket();
    const id = await make(request, "old.png");
    const [oldKey] = addedKeys(beforeCreate, await snapshotBucket());
    const res = await patchMediaRaw(request, admin, id, { file: png("new.png") });
    expect(res.status(), await res.text()).toBe(200);
    expect(await listObjects()).not.toContain(oldKey);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[shelter.s3.05] trocar a foto por um link remove o objeto e mantém uma linha", async ({ request }) => {
    const beforeCreate = await snapshotBucket();
    const id = await make(request, "a.png");
    const [key] = addedKeys(beforeCreate, await snapshotBucket());
    const res = await patchMediaRaw(request, admin, id, { url: "https://cdn.exemplo/link.png" });
    expect(res.status(), await res.text()).toBe(200);
    expect(await listObjects()).not.toContain(key);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[shelter.s3.06] [shelter.put.shelters-id#s3-sem-orfao] update com falha mantém a foto antiga e descarta a nova", async ({ request }) => {
    const id = await make(request, "keep.png");
    const before = await snapshotBucket();
    const res = await putShelterRaw(
      request,
      admin,
      id,
      {
        name: label("put-falha"),
        teamsQuantity: 1,
        mediaItem: { title: "n", uploadType: "upload", isLocalFile: true, originalName: "never.png", fieldKey: "foto" },
        address: { city: OVERSIZED_CITY, state: "AM" },
      },
      png("never.png"),
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(before);
    expect(await mediaCount(id)).toBe(1);
    await invariants();
  });

  test("[shelter.s3.07] apagar o abrigo remove objeto e linha", async ({ request }) => {
    const before = await snapshotBucket();
    const id = await make(request, "a.png");
    await deleteShelterApi(request, admin, id);
    expect(await mediaCount(id)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
    owners.splice(owners.indexOf(id), 1);
  });

  test("[shelter.s3.08] [shelter.delete.shelters-id#s3-sem-orfao] apagar o abrigo com equipes faz cascata completa", async ({ request }) => {
    const before = await snapshotBucket();
    const shelter = await createShelter(request, admin, { name: label(next()), teamsQuantity: 3, file: png("c.png") });
    expect(await teamsCount(shelter.id)).toBe(3);
    await deleteShelterApi(request, admin, shelter.id);
    expect(await teamsCount(shelter.id)).toBe(0);
    expect(await mediaCount(shelter.id)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[shelter.s3.09] dois abrigos com foto de mesmo nome geram chaves distintas", async ({ request }) => {
    const before = await snapshotBucket();
    await make(request, "igual.png");
    await make(request, "igual.png");
    expect(addedKeys(before, await snapshotBucket())).toHaveLength(2);
    await invariants();
  });

  test("[shelter.s3.10] arquivo inválido e acima do limite são recusados sem efeito", async ({ request }) => {
    const before = await snapshotBucket();
    const id = await make(request, "base.png");
    const afterCreate = await snapshotBucket();
    const invalid = await patchMediaRaw(request, admin, id, { file: exe() });
    expect(invalid.status()).toBeGreaterThanOrEqual(400);
    const huge = await patchMediaRaw(request, admin, id, {
      file: { name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024, 1) },
    });
    expect(huge.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(afterCreate);
    expect(await mediaCount(id)).toBe(1);
    expect(addedKeys(before, afterCreate)).toHaveLength(1);
    await invariants();
  });

  test("[shelter.s3.11] a fila de limpeza existe e não deixa pendência que gere órfão", async () => {
    expect(await countRows("media_cleanup_queue")).toBeGreaterThanOrEqual(0);
    await invariants();
  });

  test("[shelter.s3.12] trocas simultâneas da foto não deixam órfão nem referência quebrada", async ({ request }) => {
    const id = await make(request, "a.png");
    await Promise.allSettled([
      patchMediaRaw(request, admin, id, { file: png("c1.png") }),
      patchMediaRaw(request, admin, id, { file: png("c2.png") }),
    ]);
    expect(await mediaCount(id)).toBeGreaterThanOrEqual(1);
    await invariants();
  });
});
