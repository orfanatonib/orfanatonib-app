import type { APIRequestContext } from "@playwright/test";

import { closeDb, countRows } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expect, loginAs, test } from "../support/live";
import { addedKeys } from "../support/s3-invariants";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, listObjects, snapshotBucket } from "../support/s3";
import { OVERSIZED_TITLE, create, createRaw, exe, label, mediaCount, pdf, putRaw, recordsWithTag, removeApi } from "./support";

/**
 * Cenários `background-checks.s3.NN` (plano 26 §7.4): toda operação vai pela API real, o banco é lido por SELECT e o
 * bucket (LocalStack) é listado ao fim de cada cenário — nenhum objeto órfão e nenhuma referência quebrada. O
 * antecedente tem até **dois** PDFs (estadual e federal): "N arquivos" aqui é N ≤ 2.
 */
test.describe.serial("Antecedentes criminais — S3 sem órfão nem referência quebrada", () => {
  let admin: string;
  const owners: string[] = [];
  let counter = 0;
  const next = (): string => label(`s3-${(counter += 1)}`);

  const invariants = async (): Promise<void> => {
    await expectNoOrphans();
    await expectNoBrokenRefs();
  };

  const make = async (request: APIRequestContext, withFederal = false, fileName = "e.pdf"): Promise<string> => {
    const body = await create(request, admin, {
      name: next(),
      estadual: pdf(fileName),
      ...(withFederal ? { federal: pdf(fileName) } : {}),
    });
    owners.push(body.id);
    return body.id;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterEach(async ({ request }) => {
    for (const id of owners.splice(0)) await removeApi(request, admin, id);
  });

  test.afterAll(async () => {
    expect(await recordsWithTag(RUN_TAG), "a limpeza deixou antecedentes do E2E").toBe(0);
    await invariants();
    await closeDb();
  });

  test("[background-checks.s3.02] criar com o 2º arquivo de tipo não aceito não deixa objeto nem cadastro", async ({ request }) => {
    const before = await snapshotBucket();
    const name = next();
    const res = await createRaw(request, admin, { name, estadual: pdf("ok.pdf"), federal: exe() });
    expect(res.status(), "um executável não pode virar antecedente").toBeGreaterThanOrEqual(400);
    expect(await recordsWithTag(name)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[background-checks.s3.03] criar com falha real no banco depois dos uploads descarta os dois objetos", async ({ request }) => {
    const before = await snapshotBucket();
    const name = next();
    const res = await createRaw(request, admin, { name, estadual: pdf("x.pdf"), federal: pdf("y.pdf"), estadualTitle: OVERSIZED_TITLE });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await recordsWithTag(name)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
  });

  test("[background-checks.s3.05] remover um dos PDFs remove objeto e linha e mantém o outro", async ({ request }) => {
    const id = await make(request, true);
    expect(await mediaCount(id)).toBe(2);
    const before = await snapshotBucket();
    const res = await putRaw(request, admin, id, { removePdfFederal: true });
    expect(res.status(), await res.text()).toBe(200);
    expect(await mediaCount(id)).toBe(1);
    expect(before.filter((key) => key.includes(`/${id}/`))).toHaveLength(2);
    expect((await snapshotBucket()).filter((key) => key.includes(`/${id}/`))).toHaveLength(1);
    await invariants();
  });

  test("[background-checks.s3.06] update com falha mantém os PDFs antigos e descarta os novos", async ({ request }) => {
    const id = await make(request, true);
    const before = await snapshotBucket();
    const res = await putRaw(request, admin, id, { name: next(), pdfFederal: { title: OVERSIZED_TITLE } }, { estadual: pdf("never-e.pdf"), federal: pdf("never-f.pdf") });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(before);
    expect(await mediaCount(id)).toBe(2);
    await invariants();
  });

  test("[background-checks.s3.08] apagar o cadastro faz cascata completa: as duas linhas e os dois objetos", async ({ request }) => {
    const before = await snapshotBucket();
    const id = await make(request, true);
    expect(addedKeys(before, await snapshotBucket())).toHaveLength(2);
    await removeApi(request, admin, id);
    expect(await mediaCount(id)).toBe(0);
    await expectBucketUnchanged(before);
    await invariants();
    owners.splice(owners.indexOf(id), 1);
  });

  test("[background-checks.s3.09] dois PDFs de mesmo nome geram chaves distintas", async ({ request }) => {
    const before = await snapshotBucket();
    const id = await make(request, true, "igual.pdf");
    expect(await mediaCount(id)).toBe(2);
    const added = addedKeys(before, await snapshotBucket());
    expect(added).toHaveLength(2);
    expect(new Set(added).size).toBe(2);
    await invariants();
  });

  test("[background-checks.s3.11] a fila de limpeza existe e não deixa pendência que gere órfão", async () => {
    expect(await countRows("media_cleanup_queue")).toBeGreaterThanOrEqual(0);
    await invariants();
  });

  test("[background-checks.s3.12] trocas simultâneas do PDF não deixam órfão nem referência quebrada", async ({ request }) => {
    const id = await make(request);
    const swap = (name: string) => putRaw(request, admin, id, { name: next() }, { estadual: pdf(`${name}.pdf`) });
    const results = await Promise.all([swap("c1"), swap("c2"), swap("c3")]);
    expect(results.map((res) => res.status()).every((status) => status === 200), "a linha travada enfileira as trocas").toBe(true);
    expect(await mediaCount(id)).toBe(1);
    expect((await listObjects()).filter((key) => key.includes(`/${id}/`))).toHaveLength(1);
    await invariants();
  });
});
