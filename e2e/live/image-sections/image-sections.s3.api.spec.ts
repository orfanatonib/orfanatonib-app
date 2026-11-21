import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { mediaScenarios, type MediaFeatureAdapter, type TestFile } from "../support/media-scenarios";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";
import {
  OVERSIZED_CAPTION,
  SECTION_FLAGS,
  createGallery,
  deleteRaw,
  fetchSection,
  inputFromBody,
  mediaRows,
  mediaWithTag,
  patchRaw,
  png,
  removeGallery,
  sectionsWithTag,
  submit,
  submitRaw,
} from "./support";

/**
 * Cenários `image-section.s3.01-12` (plano 32 §7.4): toda operação vai pela API real, o banco é lido por SELECT e o
 * bucket (LocalStack) é listado ao fim de cada cenário — nenhum objeto órfão e nenhuma referência quebrada.
 * Na unidade, o "dono com filhos" é a publicação com várias mídias (não há cascata de página: a seção é a raiz).
 */
test.describe.serial("Seções de imagem — S3 sem órfão nem referência quebrada", () => {
  let request: APIRequestContext;
  let admin: string;
  let member: string;
  let galleryId = "";
  const owners = new Set<string>();
  const flagsBefore: Record<string, boolean> = {};
  let counter = 0;

  const label = (): string => tagged(`s3-${(counter += 1)}`);

  const setFlag = (key: string, enabled: boolean) =>
    request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled } });

  const pngFile = (name: string): TestFile => png(name);

  const adapter: MediaFeatureAdapter = {
    async create(files: TestFile[]) {
      const body = await submit(request, member, { caption: label(), media: files.map((file) => ({ file })) });
      owners.add(body.id);
      return body.id;
    },
    async createWithInvalidSecondFile(first: TestFile) {
      const res = await submitRaw(request, member, {
        caption: label(),
        media: [{ file: first }, { file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } }],
      });
      return { status: res.status() };
    },
    async createFailingAtDatabase(files: TestFile[]) {
      const res = await submitRaw(request, member, { caption: OVERSIZED_CAPTION, media: files.map((file) => ({ file })) });
      return { status: res.status() };
    },
    async replaceFirst(ownerId: string, file: TestFile) {
      const body = await fetchSection(request, admin, ownerId);
      const input = inputFromBody(body, { isPublic: true, pageId: galleryId });
      input.media[0] = { id: input.media[0].id, file };
      const res = await patchRaw(request, admin, ownerId, input);
      expect(res.status(), await res.text()).toBe(200);
    },
    async removeFirst(ownerId: string) {
      const body = await fetchSection(request, admin, ownerId);
      const input = inputFromBody(body, { isPublic: true, pageId: galleryId });
      input.media = input.media.slice(1);
      const res = await patchRaw(request, admin, ownerId, input);
      expect(res.status(), await res.text()).toBe(200);
    },
    async updateFailing(ownerId: string, file: TestFile) {
      const body = await fetchSection(request, admin, ownerId);
      const input = inputFromBody(body, { caption: OVERSIZED_CAPTION, isPublic: true, pageId: galleryId });
      input.media.push({ file });
      const res = await patchRaw(request, admin, ownerId, input);
      return { status: res.status() };
    },
    async remove(ownerId: string) {
      expect((await deleteRaw(request, admin, ownerId)).status()).toBe(200);
      owners.delete(ownerId);
    },
    async createWithChildren() {
      const body = await submit(request, member, {
        caption: label(),
        media: ["a1", "a2", "b1", "b2"].map((name) => ({ file: pngFile(`${name}.png`) })),
      });
      owners.add(body.id);
      return body.id;
    },
    async removeWithChildren(ownerId: string) {
      expect((await deleteRaw(request, admin, ownerId)).status()).toBe(200);
      owners.delete(ownerId);
    },
    async uploadSameNameTwice() {
      const body = await submit(request, member, {
        caption: label(),
        media: [{ file: pngFile("igual.png") }, { file: pngFile("igual.png") }],
      });
      owners.add(body.id);
      return body.id;
    },
    async uploadInvalid(file: TestFile) {
      const res = await submitRaw(request, member, { caption: label(), media: [{ file }] });
      return { status: res.status() };
    },
    async uploadTooLarge() {
      const res = await submitRaw(request, member, {
        caption: label(),
        media: [{ file: { name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024, 1) } }],
      });
      return { status: res.status() };
    },
    async mediaCount(ownerId: string) {
      return (await mediaRows(ownerId)).length;
    },
    async cleanup() {
      for (const id of [...owners]) {
        await deleteRaw(request, admin, id);
        owners.delete(id);
      }
    },
  };

  test.beforeAll(async ({ request: api }) => {
    request = api;
    admin = (await loginAs(api, "admin")).accessToken;
    member = (await loginAs(api, "member")).accessToken;
    for (const key of SECTION_FLAGS) {
      flagsBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0) === 1;
      await setFlag(key, true);
    }
    galleryId = await createGallery(api, admin, tagged("galeria-s3"));
  });

  test.afterEach(async ({ request: api }) => {
    request = api;
    await adapter.cleanup();
  });

  test.afterAll(async ({ request: api }) => {
    request = api;
    await adapter.cleanup();
    await removeGallery(api, admin, galleryId);
    for (const key of SECTION_FLAGS) await setFlag(key, flagsBefore[key]);
    expect(await sectionsWithTag(RUN_TAG), "a limpeza deixou publicações do E2E").toBe(0);
    expect(await mediaWithTag(RUN_TAG), "a limpeza deixou mídias do E2E").toBe(0);
    expect(await countRows("image_sections", { caption: OVERSIZED_CAPTION })).toBe(0);
    await expectNoOrphans();
    await expectNoBrokenRefs();
    await closeDb();
  });

  const scenarios = mediaScenarios("image-section");
  const run = async (id: string, api: APIRequestContext): Promise<void> => {
    request = api;
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) throw new Error(`Cenário ${id} ausente em mediaScenarios`);
    await scenario.run(adapter);
  };

  test("[image-section.s3.01] criar com N arquivos", async ({ request: api }) => {
    await run("image-section.s3.01", api);
  });

  test("[image-section.s3.02] criar com falha de validação no 2º arquivo não deixa objeto", async ({ request: api }) => {
    await run("image-section.s3.02", api);
  });

  test("[image-section.s3.03] criar com falha real no banco descarta os objetos enviados", async ({ request: api }) => {
    await run("image-section.s3.03", api);
  });

  test("[image-section.s3.04] substituir um arquivo remove o antigo só depois do commit", async ({ request: api }) => {
    await run("image-section.s3.04", api);
  });

  test("[image-section.s3.05] remover um item remove objeto e linha", async ({ request: api }) => {
    await run("image-section.s3.05", api);
  });

  test("[image-section.s3.06] update com falha mantém os antigos e descarta os novos", async ({ request: api }) => {
    await run("image-section.s3.06", api);
  });

  test("[image-section.s3.07] apagar a entidade remove todos os objetos e linhas de mídia", async ({ request: api }) => {
    await run("image-section.s3.07", api);
  });

  test("[image-section.s3.08] apagar a publicação com várias mídias faz cascata completa", async ({ request: api }) => {
    await run("image-section.s3.08", api);
  });

  test("[image-section.s3.09] dois uploads de mesmo nome geram chaves distintas", async ({ request: api }) => {
    await run("image-section.s3.09", api);
  });

  test("[image-section.s3.10] arquivo inválido e acima do limite são recusados sem efeito", async ({ request: api }) => {
    await run("image-section.s3.10", api);
  });

  test("[image-section.s3.11] falha ao apagar vai para a fila de limpeza e é reprocessada", async ({ request: api }) => {
    await run("image-section.s3.11", api);
  });

  test("[image-section.s3.12] edições simultâneas não deixam órfão nem referência quebrada", async ({ request: api }) => {
    await run("image-section.s3.12", api);
  });
});
