import type { APIRequestContext } from "@playwright/test";

import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expect, loginAs, test } from "../support/live";
import { mediaScenarios, type MediaFeatureAdapter, type TestFile } from "../support/media-scenarios";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import {
  OVERSIZED_TITLE,
  createPage,
  createPageRaw,
  deletePageApi,
  fetchPage,
  inputFromBody,
  label,
  pagesWithTag,
  png,
  sectionMediaCount,
  updatePageRaw,
  type PageBody,
} from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Cenários `visit-material.s3.01-12` (plano 35 §7.4): toda operação vai pela API real, o banco é lido por SELECT e o
 * bucket (LocalStack) é listado ao fim de cada cenário — nenhum objeto órfão e nenhuma referência quebrada.
 * A mídia dos cenários é a de imagens (limite de 10 MB, o que permite provar "arquivo grande demais").
 */
test.describe.serial("Materiais de visita — S3 sem órfão nem referência quebrada", () => {
  let request: APIRequestContext;
  let admin: string;
  const owners: string[] = [];
  let counter = 0;
  const next = (): string => label(`s3-${(counter += 1)}`);

  const remember = (page: PageBody): string => {
    owners.push(page.id);
    return page.id;
  };

  const adapter: MediaFeatureAdapter = {
    async create(files: TestFile[]) {
      return remember(await createPage(request, admin, { title: next(), images: files.map((file) => ({ file })) }));
    },
    async createWithInvalidSecondFile(first: TestFile) {
      const res = await createPageRaw(request, admin, {
        title: next(),
        images: [{ file: first }, { file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } }],
      });
      return { status: res.status() };
    },
    async createFailingAtDatabase(files: TestFile[]) {
      const res = await createPageRaw(request, admin, { title: OVERSIZED_TITLE, images: files.map((file) => ({ file })) });
      return { status: res.status() };
    },
    async replaceFirst(ownerId: string, file: TestFile) {
      const body = await fetchPage(request, admin, ownerId);
      const input = inputFromBody(body);
      input.images = [{ id: body.images[0].id, file }, ...(input.images ?? []).slice(1)];
      const res = await updatePageRaw(request, admin, ownerId, input);
      expect(res.status(), await res.text()).toBe(200);
    },
    async removeFirst(ownerId: string) {
      const body = await fetchPage(request, admin, ownerId);
      const input = inputFromBody(body);
      input.images = (input.images ?? []).slice(1);
      const res = await updatePageRaw(request, admin, ownerId, input);
      expect(res.status(), await res.text()).toBe(200);
    },
    async updateFailing(ownerId: string, file: TestFile) {
      const body = await fetchPage(request, admin, ownerId);
      const input = inputFromBody(body, { title: OVERSIZED_TITLE });
      input.images = [...(input.images ?? []), { file }];
      const res = await updatePageRaw(request, admin, ownerId, input);
      return { status: res.status() };
    },
    async remove(ownerId: string) {
      await deletePageApi(request, admin, ownerId);
    },
    async uploadSameNameTwice() {
      return remember(
        await createPage(request, admin, { title: next(), images: [{ file: png("igual.png") }, { file: png("igual.png") }] }),
      );
    },
    async uploadInvalid(file: TestFile) {
      const res = await createPageRaw(request, admin, { title: next(), images: [{ file }] });
      return { status: res.status() };
    },
    async uploadTooLarge() {
      const res = await createPageRaw(request, admin, {
        title: next(),
        images: [{ file: { name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024, 1) } }],
      });
      return { status: res.status() };
    },
    async mediaCount(ownerId: string) {
      const row = await queryOne<{ n: number }>(
        "SELECT COUNT(*) AS n FROM media_items WHERE targetType = 'VisitMaterialsPage' AND targetId = ?",
        [ownerId],
      );
      return Number(row?.n ?? 0);
    },
    async cleanup() {
      for (const id of owners.splice(0)) await deletePageApi(request, admin, id);
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
    if (CLEANUP_ENABLED) expect(await pagesWithTag(RUN_TAG), "a limpeza deixou páginas do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  const scenarios = mediaScenarios("visit-material");
  const run = async (id: string, api: APIRequestContext): Promise<void> => {
    request = api;
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) throw new Error(`Cenário ${id} ausente em mediaScenarios`);
    await scenario.run(adapter);
  };

  test("[visit-material.s3.01] criar com N arquivos [visit-material.post.visit-material-pages#s3-sem-orfao]", async ({ request: api }) => {
    await run("visit-material.s3.01", api);
  });

  test("[visit-material.s3.02] criar com arquivo inválido no 2º lugar não deixa objeto", async ({ request: api }) => {
    await run("visit-material.s3.02", api);
  });

  test("[visit-material.s3.03] criar com falha real no banco descarta os objetos enviados", async ({ request: api }) => {
    await run("visit-material.s3.03", api);
  });

  test("[visit-material.s3.04] substituir um arquivo remove o antigo só depois do commit [visit-material.patch.visit-material-pages-id#s3-sem-orfao]", async ({ request: api }) => {
    await run("visit-material.s3.04", api);
  });

  test("[visit-material.s3.05] remover um item remove objeto e linha", async ({ request: api }) => {
    await run("visit-material.s3.05", api);
  });

  test("[visit-material.s3.06] update com falha mantém os antigos e descarta os novos", async ({ request: api }) => {
    await run("visit-material.s3.06", api);
  });

  test("[visit-material.s3.07] apagar a página remove todos os objetos e linhas [visit-material.delete.visit-material-pages-id#s3-sem-orfao]", async ({ request: api }) => {
    await run("visit-material.s3.07", api);
  });

  test("[visit-material.s3.09] dois uploads de mesmo nome geram chaves distintas", async ({ request: api }) => {
    await run("visit-material.s3.09", api);
  });

  test("[visit-material.s3.10] arquivo inválido e acima do limite são recusados sem efeito", async ({ request: api }) => {
    await run("visit-material.s3.10", api);
  });

  test("[visit-material.s3.11] a fila de limpeza existe e não deixa pendência que gere órfão", async ({ request: api }) => {
    await run("visit-material.s3.11", api);
  });

  test("[visit-material.s3.12] edições simultâneas não deixam órfão nem referência quebrada", async ({ request: api }) => {
    await run("visit-material.s3.12", api);
  });

  test("[visit-material.s3.08] apagar a página com seções faz cascata completa (mídia da página e das seções)", async ({ request: api }) => {
    request = api;
    const page = await createPage(request, admin, {
      title: next(),
      images: [{ file: png("a.png") }],
      sections: [
        { category: "BABY", images: [{ file: png("s1.png") }] },
        { category: "CHILD", images: [{ file: png("s2.png") }, { file: png("s3.png") }] },
      ],
    });
    owners.push(page.id);
    expect(await adapter.mediaCount(page.id)).toBe(1);
    expect(await sectionMediaCount(page.id)).toBe(3);
    await deletePageApi(request, admin, page.id);
    expect(await adapter.mediaCount(page.id)).toBe(0);
    expect(await sectionMediaCount(page.id)).toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    owners.splice(owners.indexOf(page.id), 1);
  });
});
