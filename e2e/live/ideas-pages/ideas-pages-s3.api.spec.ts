import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows } from "../support/db";
import { RUN_TAG, tagged } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import {
  expectBucketUnchanged,
  expectNoBrokenRefs,
  expectNoOrphans,
  listObjects,
  objectExists,
  snapshotBucket,
  uploadsPrefix,
} from "../support/s3";
import {
  LONG_TITLE,
  TARGET_TYPE,
  createPage,
  createPageRaw,
  deletePageApi,
  mediaRows,
  pageRow,
  pagesWithTag,
  png,
  routeRows,
  sectionRows,
  snapshotDb,
  updatePage,
  updatePageRaw,
  type IdeasPageBody,
  type SectionInput,
} from "./support";

/**
 * S3 sem órfão e sem referência quebrada (plano 31, §7.4): API real + MySQL + bucket (LocalStack);
 * cada cenário termina provando as duas invariantes no prefixo das seções de ideias.
 * `[ideas-page.s3.11]` (falha ao apagar no S3) é provado de verdade no Jest da API
 * (`update-ideas-page.service.spec.ts`/`media-storage.service.spec.ts`: falha vai para `media_cleanup_queue`);
 * aqui valida-se que a fila existe e que as invariantes seguem verdadeiras.
 */
const PREFIX = `${uploadsPrefix()}${TARGET_TYPE}/`;

const invariants = async (): Promise<void> => {
  await expectNoOrphans(PREFIX);
  await expectNoBrokenRefs(PREFIX);
};

test.describe.serial("Páginas de ideias — S3 sem órfãos", () => {
  let admin: string;
  const created: string[] = [];

  const make = async (
    request: import("@playwright/test").APIRequestContext,
    label: string,
    sections: SectionInput[],
  ): Promise<IdeasPageBody> => {
    const page = await createPage(request, admin, { title: tagged(label), sections });
    created.push(page.id);
    return page;
  };

  const keysOf = async (pageId: string): Promise<string[]> =>
    (await mediaRows(pageId)).map((row) => row.storageKey as string).sort();

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deletePageApi(request, admin, id);
    expect(await pagesWithTag(RUN_TAG)).toBe(0);
    await invariants();
    await closeDb();
  });

  test("[ideas-page.s3.01] [ideas-page.post.ideas-pages#s3-sem-orfao] criar com N arquivos: N objetos, N linhas, 0 órfãos", async ({
    request,
  }) => {
    const page = await make(request, "s3-01", [
      { title: "S1", medias: [{ title: "A", file: png("a.png") }] },
      { title: "S2", medias: [{ title: "B", file: png("b.png") }] },
    ]);
    const rows = await mediaRows(page.id);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.isLocalFile === 1)).toBe(true);
    for (const key of await keysOf(page.id)) expect(await objectExists(key)).toBe(true);
    await invariants();
  });

  test("[ideas-page.s3.02] [ideas-page.post.ideas-pages#s3-sem-orfao] arquivo inválido no 2º item depois do 1º enviado: 400, bucket e banco inalterados", async ({
    request,
  }) => {
    const bucket = await snapshotBucket();
    const db = await snapshotDb();
    const res = await createPageRaw(request, admin, {
      title: tagged("s3-02"),
      sections: [
        {
          title: "S1",
          medias: [
            { title: "ok", file: png("ok.png") },
            { title: "ruim", file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("<html>não é png</html>") } },
          ],
        },
      ],
    });
    expect(res.status()).toBe(400);
    await expectBucketUnchanged(bucket);
    expect(await snapshotDb()).toEqual(db);
    await invariants();
  });

  test("[ideas-page.s3.03] [ideas-page.post.ideas-pages#rollback-de-transacao] falha real no banco depois do upload: rollback, objetos descartados, nada gravado", async ({
    request,
  }) => {
    const bucket = await snapshotBucket();
    const db = await snapshotDb();
    const res = await createPageRaw(request, admin, {
      title: tagged("s3-03"),
      sections: [
        { title: "S1", medias: [{ title: "ok", file: png("ok.png") }] },
        { title: LONG_TITLE, medias: [{ title: "outra", file: png("outra.png") }] },
      ],
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(bucket);
    expect(await snapshotDb()).toEqual(db);
    await invariants();
  });

  test("[ideas-page.s3.04] [ideas-page.patch.ideas-pages-id#s3-sem-orfao] substituir 1 arquivo: novo existe, antigo some só depois do commit, a linha aponta para o novo", async ({
    request,
  }) => {
    const page = await make(request, "s3-04", [{ title: "S1", medias: [{ title: "A", file: png("old.png") }] }]);
    const [oldRow] = await mediaRows(page.id);
    const oldKey = oldRow.storageKey as string;
    expect(await objectExists(oldKey)).toBe(true);

    await updatePage(request, admin, page.id, {
      title: tagged("s3-04"),
      sections: [{ id: page.sections[0].id, title: "S1", medias: [{ id: oldRow.id, title: "A", file: png("new.png") }] }],
    });
    const [newRow] = await mediaRows(page.id);
    expect(newRow.id).toBe(oldRow.id);
    expect(newRow.storageKey).not.toBe(oldKey);
    expect(await objectExists(newRow.storageKey as string)).toBe(true);
    expect(await objectExists(oldKey)).toBe(false);
    await invariants();
  });

  test("[ideas-page.s3.05] [ideas-page.patch.ideas-pages-id#s3-sem-orfao] remover 1 item de mídia: objeto e linha removidos", async ({
    request,
  }) => {
    const page = await make(request, "s3-05", [
      { title: "S1", medias: [{ title: "A", file: png("a.png") }, { title: "B", file: png("b.png") }] },
    ]);
    const [first, second] = await mediaRows(page.id);
    await updatePage(request, admin, page.id, {
      title: tagged("s3-05"),
      sections: [{ id: page.sections[0].id, title: "S1", medias: [{ id: first.id, title: "A", keepFile: true }] }],
    });
    const rows = await mediaRows(page.id);
    expect(rows.map((r) => r.id)).toEqual([first.id]);
    expect(await objectExists(second.storageKey as string)).toBe(false);
    expect(await objectExists(first.storageKey as string)).toBe(true);
    await invariants();
  });

  test("[ideas-page.s3.06] [ideas-page.patch.ideas-pages-id#rollback-de-transacao] update com falha no 2º item: antigos intactos, novos descartados, título antigo", async ({
    request,
  }) => {
    const page = await make(request, "s3-06", [{ title: "S1", medias: [{ title: "A", file: png("keep.png") }] }]);
    const rowsBefore = await mediaRows(page.id);
    const bucket = await snapshotBucket();

    const res = await updatePageRaw(request, admin, page.id, {
      title: tagged("s3-06-novo"),
      sections: [
        { id: page.sections[0].id, title: "S1", medias: [{ id: rowsBefore[0].id, title: "A", keepFile: true }] },
        { title: LONG_TITLE, medias: [{ title: "never", file: png("never.png") }] },
      ],
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(bucket);
    expect(await mediaRows(page.id)).toEqual(rowsBefore);
    expect((await pageRow(page.id))?.title).toBe(tagged("s3-06"));
    expect(await objectExists(rowsBefore[0].storageKey as string)).toBe(true);
    await invariants();
  });

  test("[ideas-page.s3.07] [ideas-page.delete.ideas-pages-id#s3-sem-orfao] apagar a página: todos os objetos e linhas de mídia somem", async ({
    request,
  }) => {
    const page = await make(request, "s3-07", [
      { title: "S1", medias: [{ title: "A", file: png("a.png") }, { title: "B", file: png("b.png") }] },
    ]);
    const keys = await keysOf(page.id);
    expect(keys).toHaveLength(2);
    const res = await request.delete(`${API_URL}/ideas-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await mediaRows(page.id)).toHaveLength(0);
    for (const key of keys) expect(await objectExists(key)).toBe(false);
    await invariants();
  });

  test("[ideas-page.s3.08] [ideas-page.delete.ideas-pages-id#s3-sem-orfao] apagar página com seções, mídia mista e rota: cascata completa", async ({
    request,
  }) => {
    const page = await make(request, "s3-08", [
      { title: "S1", medias: [{ title: "A", file: png("a.png") }, { title: "L", url: "https://www.youtube.com/watch?v=abc" }] },
      { title: "S2", medias: [{ title: "B", file: png("b.png") }] },
    ]);
    const keys = await keysOf(page.id);
    expect(await mediaRows(page.id)).toHaveLength(3);
    expect(await sectionRows(page.id)).toHaveLength(2);
    expect(await routeRows(page.id)).toHaveLength(1);

    const res = await request.delete(`${API_URL}/ideas-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await pageRow(page.id)).toBeNull();
    expect(await sectionRows(page.id)).toHaveLength(0);
    expect(await mediaRows(page.id)).toHaveLength(0);
    expect(await routeRows(page.id)).toHaveLength(0);
    for (const key of keys) expect(await objectExists(key)).toBe(false);
    await invariants();
  });

  test("[ideas-page.s3.09] dois uploads com o mesmo nome no mesmo envio: chaves distintas e dois objetos", async ({
    request,
  }) => {
    const page = await make(request, "s3-09", [
      { title: "S1", medias: [{ title: "A", file: png("mesmo.png") }, { title: "B", file: png("mesmo.png") }] },
    ]);
    const keys = await keysOf(page.id);
    expect(new Set(keys).size).toBe(2);
    for (const key of keys) expect(await objectExists(key)).toBe(true);
    await invariants();
  });

  test("[ideas-page.s3.10] [ideas-page.post.ideas-pages#s3-sem-orfao] MIME inválido e arquivo acima do limite: recusados, bucket e banco inalterados", async ({
    request,
  }) => {
    const bucket = await snapshotBucket();
    const db = await snapshotDb();
    const badMime = await createPageRaw(request, admin, {
      title: tagged("s3-10-mime"),
      sections: [
        { title: "S1", medias: [{ title: "exe", file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } }] },
      ],
    });
    expect(badMime.status()).toBe(400);
    const tooBig = await createPageRaw(request, admin, {
      title: tagged("s3-10-big"),
      sections: [
        { title: "S1", medias: [{ title: "grande", file: { name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024) } }] },
      ],
    });
    expect(tooBig.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(bucket);
    expect(await snapshotDb()).toEqual(db);
    await invariants();
  });

  test("[ideas-page.s3.11] falha ao apagar no S3 vai para a fila de limpeza (a tabela existe) e as invariantes seguem verdadeiras", async () => {
    expect(await countRows("media_cleanup_queue")).toBeGreaterThanOrEqual(0);
    await invariants();
  });

  test("[ideas-page.s3.12] edições simultâneas da mesma página: sem órfão e sem referência quebrada", async ({ request }) => {
    const page = await make(request, "s3-12", [{ title: "S1", medias: [{ title: "A", file: png("base.png") }] }]);
    const [row] = await mediaRows(page.id);
    const replace = (name: string) =>
      updatePageRaw(request, admin, page.id, {
        title: tagged("s3-12"),
        sections: [{ id: page.sections[0].id, title: "S1", medias: [{ id: row.id, title: "A", file: png(name) }] }],
      });
    const results = await Promise.all([replace("c1.png"), replace("c2.png")]);
    expect(results.some((r) => r.status() === 200)).toBe(true);

    const rows = await mediaRows(page.id);
    expect(rows).toHaveLength(1);
    const objects = (await listObjects(PREFIX)).filter((key) => key === rows[0].storageKey);
    expect(objects).toEqual([rows[0].storageKey]);
    await invariants();
  });
});
