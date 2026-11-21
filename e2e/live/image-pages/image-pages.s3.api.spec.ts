import type { APIRequestContext } from "@playwright/test";

import { closeDb, queryOne } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { expect, loginAs, test } from "../support/live";
import { mediaScenarios, type MediaFeatureAdapter, type TestFile } from "../support/media-scenarios";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import {
  OVERSIZED_CAPTION,
  createPage,
  createPageRaw,
  deletePageApi,
  fetchPage,
  inputFromBody,
  pagesWithTag,
  sectionsWithTag,
  updatePage,
  updatePageRaw,
  type ImagePageBody,
} from "./support";

/**
 * Cenários `image-page.s3.01-12` (plano 33 §7.4): toda operação vai pela API real, o banco é lido por SELECT e o bucket
 * (LocalStack) é listado ao fim de cada cenário — nenhum objeto órfão e nenhuma referência quebrada.
 */
test.describe.serial("Image Pages — S3 sem órfão nem referência quebrada", () => {
  let request: APIRequestContext;
  let admin: string;
  const owners = new Map<string, string[]>();
  let counter = 0;

  const label = (): string => `s3-${(counter += 1)}`;

  const remember = (page: ImagePageBody): string => {
    owners.set(page.id, page.sections.map((section) => section.id));
    return page.id;
  };

  const adapter: MediaFeatureAdapter = {
    async create(files: TestFile[]) {
      const page = await createPage(request, admin, {
        title: tagged(label()),
        sections: [{ caption: tagged(label()), media: files.map((file) => ({ file })) }],
      });
      return remember(page);
    },
    async createWithInvalidSecondFile(first: TestFile) {
      const res = await createPageRaw(request, admin, {
        title: tagged(label()),
        sections: [
          {
            caption: tagged(label()),
            media: [{ file: first }, { file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } }],
          },
        ],
      });
      return { status: res.status() };
    },
    async createFailingAtDatabase(files: TestFile[]) {
      const res = await createPageRaw(request, admin, {
        title: tagged(label()),
        sections: [
          { caption: tagged(label()), media: files.map((file) => ({ file })) },
          { caption: OVERSIZED_CAPTION, media: [{ title: "link" }] },
        ],
      });
      return { status: res.status() };
    },
    async replaceFirst(ownerId: string, file: TestFile) {
      const body = await fetchPage(request, admin, ownerId);
      const input = inputFromBody(body);
      input.sections[0].media[0] = { id: input.sections[0].media[0].id, file };
      await updatePage(request, admin, ownerId, input);
    },
    async removeFirst(ownerId: string) {
      const body = await fetchPage(request, admin, ownerId);
      const input = inputFromBody(body);
      input.sections[0].media = input.sections[0].media.slice(1);
      await updatePage(request, admin, ownerId, input);
    },
    async updateFailing(ownerId: string, file: TestFile) {
      const body = await fetchPage(request, admin, ownerId);
      const input = inputFromBody(body);
      input.sections[0].media.push({ file });
      input.sections.push({ caption: OVERSIZED_CAPTION, media: [{ title: "link" }] });
      const res = await updatePageRaw(request, admin, ownerId, input);
      return { status: res.status() };
    },
    async remove(ownerId: string) {
      await deletePageApi(request, admin, ownerId);
    },
    async createWithChildren() {
      const page = await createPage(request, admin, {
        title: tagged(label()),
        sections: [
          { caption: tagged(label()), media: [{ file: pngFile("a1.png") }, { file: pngFile("a2.png") }] },
          { caption: tagged(label()), media: [{ file: pngFile("b1.png") }, { file: pngFile("b2.png") }] },
        ],
      });
      return remember(page);
    },
    async removeWithChildren(ownerId: string) {
      await deletePageApi(request, admin, ownerId);
    },
    async uploadSameNameTwice() {
      const page = await createPage(request, admin, {
        title: tagged(label()),
        sections: [{ caption: tagged(label()), media: [{ file: pngFile("igual.png") }, { file: pngFile("igual.png") }] }],
      });
      return remember(page);
    },
    async uploadInvalid(file: TestFile) {
      const res = await createPageRaw(request, admin, {
        title: tagged(label()),
        sections: [{ caption: tagged(label()), media: [{ file }] }],
      });
      return { status: res.status() };
    },
    async uploadTooLarge() {
      const res = await createPageRaw(request, admin, {
        title: tagged(label()),
        sections: [
          {
            caption: tagged(label()),
            media: [{ file: { name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024, 1) } }],
          },
        ],
      });
      return { status: res.status() };
    },
    async mediaCount(ownerId: string) {
      const sectionIds = owners.get(ownerId) ?? [];
      if (sectionIds.length === 0) return 0;
      const marks = sectionIds.map(() => "?").join(",");
      const row = await queryOne<{ n: number }>(
        `SELECT COUNT(*) AS n FROM media_items WHERE targetType = 'ImagesPage' AND targetId IN (${marks})`,
        sectionIds,
      );
      return Number(row?.n ?? 0);
    },
    async cleanup() {
      for (const id of owners.keys()) await deletePageApi(request, admin, id);
      owners.clear();
    },
  };

  const pngFile = (name: string): TestFile => ({
    name,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aR1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });

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
    expect(await pagesWithTag(RUN_TAG), "a limpeza deixou galerias do E2E").toBe(0);
    expect(await sectionsWithTag(RUN_TAG), "a limpeza deixou seções do E2E").toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  const scenarios = mediaScenarios("image-page");
  const run = async (id: string, api: APIRequestContext): Promise<void> => {
    request = api;
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) throw new Error(`Cenário ${id} ausente em mediaScenarios`);
    await scenario.run(adapter);
  };

  test("[image-page.s3.01] criar com N arquivos", async ({ request: api }) => {
    await run("image-page.s3.01", api);
  });

  test("[image-page.s3.02] criar com falha de validação no 2º arquivo não deixa objeto", async ({ request: api }) => {
    await run("image-page.s3.02", api);
  });

  test("[image-page.s3.03] criar com falha real no banco descarta os objetos enviados", async ({ request: api }) => {
    await run("image-page.s3.03", api);
  });

  test("[image-page.s3.04] substituir um arquivo remove o antigo só depois do commit", async ({ request: api }) => {
    await run("image-page.s3.04", api);
  });

  test("[image-page.s3.05] remover um item remove objeto e linha", async ({ request: api }) => {
    await run("image-page.s3.05", api);
  });

  test("[image-page.s3.06] update com falha mantém os antigos e descarta os novos", async ({ request: api }) => {
    await run("image-page.s3.06", api);
  });

  test("[image-page.s3.07] apagar a entidade remove todos os objetos e linhas de mídia", async ({ request: api }) => {
    await run("image-page.s3.07", api);
  });

  test("[image-page.s3.08] apagar a galeria com seções faz cascata completa", async ({ request: api }) => {
    await run("image-page.s3.08", api);
  });

  test("[image-page.s3.09] dois uploads de mesmo nome geram chaves distintas", async ({ request: api }) => {
    await run("image-page.s3.09", api);
  });

  test("[image-page.s3.10] arquivo inválido e acima do limite são recusados sem efeito", async ({ request: api }) => {
    await run("image-page.s3.10", api);
  });

  test("[image-page.s3.11] falha ao apagar vai para a fila de limpeza e é reprocessada", async ({ request: api }) => {
    await run("image-page.s3.11", api);
  });

  test("[image-page.s3.12] edições simultâneas não deixam órfão nem referência quebrada", async ({ request: api }) => {
    await run("image-page.s3.12", api);
  });
});
