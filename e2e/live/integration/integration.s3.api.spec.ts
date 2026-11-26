import type { APIRequestContext } from "@playwright/test";

import { closeDb } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expect, loginAs, test } from "../support/live";
import { mediaScenarios, type MediaFeatureAdapter, type TestFile } from "../support/media-scenarios";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import { OVERSIZED_TITLE, create, createRaw, fetchOne, integrationsWithTag, label, mediaCount, png, putRaw, removeApi } from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Cenários `integration.s3.01-12` (plano 25 §7.4): toda operação vai pela API real, o banco é lido por SELECT e o bucket
 * (LocalStack) é listado ao fim de cada cenário — nenhum objeto órfão e nenhuma referência quebrada. A integração tem
 * **várias** fotos, então o adaptador compartilhado vale como está.
 */
test.describe.serial("Integração — S3 sem órfão nem referência quebrada", () => {
  let request: APIRequestContext;
  let admin: string;
  const owners: string[] = [];
  let counter = 0;
  const next = (): string => label(`s3-${(counter += 1)}`);

  const remember = (id: string): string => {
    owners.push(id);
    return id;
  };

  const adapter: MediaFeatureAdapter = {
    async create(files: TestFile[]) {
      return remember((await create(request, admin, { name: next(), files })).id);
    },
    async createWithInvalidSecondFile(first: TestFile) {
      const res = await createRaw(request, admin, {
        name: next(),
        files: [first, { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") }],
      });
      return { status: res.status() };
    },
    async createFailingAtDatabase(files: TestFile[]) {
      const res = await createRaw(request, admin, { name: next(), files, images: files.map((_, i) => (i === 0 ? { title: OVERSIZED_TITLE } : { title: "ok" })) });
      return { status: res.status() };
    },
    async replaceFirst(ownerId: string, file: TestFile) {
      const images = (await fetchOne(request, admin, ownerId)).images ?? [];
      const res = await putRaw(request, admin, ownerId, { images: images.map((image, i) => (i === 0 ? { id: image.id, fieldKey: "files[0]" } : { id: image.id })) }, [file]);
      expect(res.status(), await res.text()).toBe(200);
    },
    async removeFirst(ownerId: string) {
      const images = (await fetchOne(request, admin, ownerId)).images ?? [];
      const res = await putRaw(request, admin, ownerId, { images: images.slice(1).map((image) => ({ id: image.id })) });
      expect(res.status(), await res.text()).toBe(200);
    },
    async updateFailing(ownerId: string, file: TestFile) {
      const images = (await fetchOne(request, admin, ownerId)).images ?? [];
      const res = await putRaw(request, admin, ownerId, { images: [...images.map((image) => ({ id: image.id })), { title: OVERSIZED_TITLE, fieldKey: "files[0]" }] }, [file]);
      return { status: res.status() };
    },
    async remove(ownerId: string) {
      await removeApi(request, admin, ownerId);
    },
    async createWithChildren() {
      return remember((await create(request, admin, { name: next(), files: [png("a1.png"), png("a2.png"), png("a3.png")] })).id);
    },
    async removeWithChildren(ownerId: string) {
      await removeApi(request, admin, ownerId);
    },
    async uploadSameNameTwice() {
      return remember((await create(request, admin, { name: next(), files: [png("igual.png"), png("igual.png")] })).id);
    },
    async uploadInvalid(file: TestFile) {
      const res = await createRaw(request, admin, { name: next(), files: [file] });
      return { status: res.status() };
    },
    async uploadTooLarge() {
      const res = await createRaw(request, admin, {
        name: next(),
        files: [{ name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024, 1) }],
      });
      return { status: res.status() };
    },
    mediaCount,
    async cleanup() {
      for (const id of owners.splice(0)) await removeApi(request, admin, id);
    },
  };

  test.beforeAll(async ({ request: api }) => {
    admin = (await loginAs(api, "admin")).accessToken;
  });

  test.afterEach(async ({ request: api }) => {
    request = api;
    await adapter.cleanup();
  });

  test.afterAll(async ({ request: api }) => {
    request = api;
    await adapter.cleanup();
    if (CLEANUP_ENABLED) expect(await integrationsWithTag(RUN_TAG), "a limpeza deixou integrações do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  const scenarios = mediaScenarios("integration");
  const run = async (id: string, api: APIRequestContext): Promise<void> => {
    request = api;
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) throw new Error(`Cenário ${id} ausente em mediaScenarios`);
    await scenario.run(adapter);
  };

  test("[integration.s3.01] criar com N arquivos", async ({ request: api }) => {
    await run("integration.s3.01", api);
  });

  test("[integration.s3.02] criar com falha de validação no 2º arquivo não deixa objeto", async ({ request: api }) => {
    await run("integration.s3.02", api);
  });

  test("[integration.s3.03] criar com falha real no banco descarta os objetos enviados", async ({ request: api }) => {
    await run("integration.s3.03", api);
  });

  test("[integration.s3.04] substituir um arquivo remove o antigo só depois do commit", async ({ request: api }) => {
    await run("integration.s3.04", api);
  });

  test("[integration.s3.05] remover um item remove objeto e linha", async ({ request: api }) => {
    await run("integration.s3.05", api);
  });

  test("[integration.s3.06] update com falha mantém os antigos e descarta os novos", async ({ request: api }) => {
    await run("integration.s3.06", api);
  });

  test("[integration.s3.07] apagar a entidade remove todos os objetos e linhas", async ({ request: api }) => {
    await run("integration.s3.07", api);
  });

  test("[integration.s3.08] apagar o dono com filhos faz cascata completa", async ({ request: api }) => {
    await run("integration.s3.08", api);
  });

  test("[integration.s3.09] dois uploads de mesmo nome geram chaves distintas", async ({ request: api }) => {
    await run("integration.s3.09", api);
  });

  test("[integration.s3.10] arquivo inválido e acima do limite são recusados sem efeito", async ({ request: api }) => {
    await run("integration.s3.10", api);
  });

  test("[integration.s3.11] falha ao apagar vai para a fila de limpeza e é reprocessada", async ({ request: api }) => {
    await run("integration.s3.11", api);
  });

  test("[integration.s3.12] edições simultâneas não deixam órfão nem referência quebrada", async ({ request: api }) => {
    await run("integration.s3.12", api);
  });
});
