import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "../support/db";
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
  FAKE_MP4,
  TARGET_TYPE,
  createPage,
  createPageRaw,
  deletePageApi,
  mediaRows,
  mp4,
  pageRow,
  pagesWithTag,
  routeRows,
  snapshotDb,
  updatePage,
  updatePageRaw,
  type VideoPageBody,
} from "./support";

/**
 * S3 sem órfão e sem referência quebrada (plano 34, §7.4): cada cenário usa a API real, o MySQL e o
 * bucket (LocalStack) e termina provando as duas invariantes no prefixo das páginas de vídeo.
 * `[video-page.s3.11]` (falha real ao apagar no S3) tem o equivalente em Jest na API: provocar a falha
 * no LocalStack exige derrubá-lo/negar permissão, o que não cabe numa suíte compartilhada.
 */
const PREFIX = `${uploadsPrefix()}${TARGET_TYPE}/`;
const LONG_TITLE = "x".repeat(300);

const invariants = async (): Promise<void> => {
  await expectNoOrphans(PREFIX);
  await expectNoBrokenRefs(PREFIX);
};

test.describe.serial("Video Pages — S3 sem órfãos", () => {
  let admin: string;
  const created: string[] = [];

  const make = async (
    request: import("@playwright/test").APIRequestContext,
    label: string,
    videos: Parameters<typeof createPage>[2]["videos"],
  ): Promise<VideoPageBody> => {
    const page = await createPage(request, admin, { title: tagged(label), videos });
    created.push(page.id);
    return page;
  };

  const objectsOf = (pageId: string) => listObjects(`${PREFIX}${pageId}/`);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deletePageApi(request, admin, id);
    expect(await pagesWithTag(RUN_TAG)).toBe(0);
    await invariants();
    await closeDb();
  });

  test("[video-page.s3.01] [video-page.post.video-pages#s3-sem-orfao] criar com N arquivos: N objetos, N linhas, 0 órfãos", async ({
    request,
  }) => {
    const page = await make(request, "s3-01", [
      { title: "A", file: mp4("a.mp4") },
      { title: "B", file: mp4("b.mp4") },
    ]);
    const rows = await mediaRows(page.id);
    expect(rows).toHaveLength(2);
    const objects = await objectsOf(page.id);
    expect(objects).toHaveLength(2);
    expect(rows.map((r) => r.storageKey).sort()).toEqual(objects);
    expect(rows.every((r) => r.isLocalFile === 1)).toBe(true);
    await invariants();
  });

  test("[video-page.s3.02] [video-page.post.video-pages#s3-sem-orfao] falha de validação no 2º arquivo: 400, bucket e banco inalterados", async ({
    request,
  }) => {
    const bucket = await snapshotBucket();
    const db = await snapshotDb();
    const res = await createPageRaw(request, admin, {
      title: tagged("s3-02"),
      videos: [
        { title: "ok", file: mp4("ok.mp4") },
        { title: "ruim", file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } },
      ],
    });
    expect(res.status()).toBe(400);
    await expectBucketUnchanged(bucket);
    expect(await snapshotDb()).toEqual(db);
    await invariants();
  });

  test("[video-page.s3.03] [video-page.post.video-pages#s3-sem-orfao] falha real no banco depois do upload: rollback e objetos descartados", async ({
    request,
  }) => {
    const bucket = await snapshotBucket();
    const db = await snapshotDb();
    const res = await createPageRaw(request, admin, {
      title: tagged("s3-03"),
      videos: [
        { title: "ok", file: mp4("ok.mp4") },
        { title: LONG_TITLE, file: mp4("estoura-coluna.mp4") },
      ],
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(bucket);
    expect(await snapshotDb()).toEqual(db);
    await invariants();
  });

  test("[video-page.s3.04] [video-page.patch.video-pages-id#s3-sem-orfao] substituir 1 arquivo: novo existe, antigo some só depois do commit, a linha aponta para o novo", async ({
    request,
  }) => {
    const page = await make(request, "s3-04", [{ title: "A", file: mp4("old.mp4") }]);
    const [oldRow] = await mediaRows(page.id);
    const oldKey = oldRow.storageKey as string;
    expect(await objectExists(oldKey)).toBe(true);

    await updatePage(request, admin, page.id, {
      title: tagged("s3-04"),
      videos: [{ id: oldRow.id, title: "A", file: mp4("new.mp4") }],
    });
    const [newRow] = await mediaRows(page.id);
    expect(newRow.id).toBe(oldRow.id);
    expect(newRow.storageKey).not.toBe(oldKey);
    expect(await objectExists(newRow.storageKey as string)).toBe(true);
    expect(await objectExists(oldKey)).toBe(false);
    await invariants();
  });

  test("[video-page.s3.05] [video-page.patch.video-pages-id#s3-sem-orfao] remover 1 item de mídia: objeto e linha removidos", async ({
    request,
  }) => {
    const page = await make(request, "s3-05", [
      { title: "A", file: mp4("a.mp4") },
      { title: "B", file: mp4("b.mp4") },
    ]);
    const [first, second] = await mediaRows(page.id);
    await updatePage(request, admin, page.id, {
      title: tagged("s3-05"),
      videos: [{ id: first.id, title: "A" }],
    });
    const rows = await mediaRows(page.id);
    expect(rows.map((r) => r.id)).toEqual([first.id]);
    expect(await objectExists(second.storageKey as string)).toBe(false);
    expect(await objectExists(first.storageKey as string)).toBe(true);
    await invariants();
  });

  test("[video-page.s3.06] [video-page.patch.video-pages-id#s3-sem-orfao] update com falha no 2º item: antigos intactos, novos descartados", async ({
    request,
  }) => {
    const page = await make(request, "s3-06", [{ title: "A", file: mp4("keep.mp4") }]);
    const rowsBefore = await mediaRows(page.id);
    const bucket = await snapshotBucket();

    const res = await updatePageRaw(request, admin, page.id, {
      title: tagged("s3-06-novo"),
      videos: [
        { id: rowsBefore[0].id, title: "A" },
        { title: LONG_TITLE, file: mp4("never.mp4") },
      ],
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(bucket);
    expect(await mediaRows(page.id)).toEqual(rowsBefore);
    expect((await pageRow(page.id))?.name).toBe(tagged("s3-06"));
    expect(await objectExists(rowsBefore[0].storageKey as string)).toBe(true);
    await invariants();
  });

  test("[video-page.s3.07] [video-page.delete.video-pages-id#s3-sem-orfao] apagar a página: todos os objetos e linhas de mídia somem", async ({
    request,
  }) => {
    const page = await make(request, "s3-07", [
      { title: "A", file: mp4("a.mp4") },
      { title: "B", file: mp4("b.mp4") },
    ]);
    expect(await objectsOf(page.id)).toHaveLength(2);
    const res = await request.delete(`${API_URL}/video-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await mediaRows(page.id)).toHaveLength(0);
    expect(await objectsOf(page.id)).toHaveLength(0);
    await invariants();
  });

  test("[video-page.s3.08] [video-page.delete.video-pages-id#s3-sem-orfao] apagar página com mídia mista (arquivos e link): cascata completa com a rota", async ({
    request,
  }) => {
    const page = await make(request, "s3-08", [
      { title: "A", file: mp4("a.mp4") },
      { title: "B", file: mp4("b.mp4") },
      { title: "C" },
    ]);
    expect(await mediaRows(page.id)).toHaveLength(3);
    expect(await routeRows(page.id)).toHaveLength(1);
    const res = await request.delete(`${API_URL}/video-pages/${page.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await pageRow(page.id)).toBeNull();
    expect(await mediaRows(page.id)).toHaveLength(0);
    expect(await routeRows(page.id)).toHaveLength(0);
    expect(await objectsOf(page.id)).toHaveLength(0);
    await invariants();
  });

  test("[video-page.s3.09] dois uploads com o mesmo nome no mesmo envio: chaves distintas e dois objetos", async ({
    request,
  }) => {
    const page = await make(request, "s3-09", [
      { title: "A", file: mp4("mesmo.mp4") },
      { title: "B", file: mp4("mesmo.mp4") },
    ]);
    const rows = await mediaRows(page.id);
    expect(new Set(rows.map((r) => r.storageKey)).size).toBe(2);
    expect(await objectsOf(page.id)).toHaveLength(2);
    await invariants();
  });

  test("[video-page.s3.10] [video-page.post.video-pages#s3-sem-orfao] MIME inválido e arquivo acima do limite: recusados, bucket e banco inalterados", async ({
    request,
  }) => {
    const bucket = await snapshotBucket();
    const db = await snapshotDb();
    const badMime = await createPageRaw(request, admin, {
      title: tagged("s3-10-mime"),
      videos: [{ title: "avi", file: { name: "x.avi", mimeType: "video/x-msvideo", buffer: FAKE_MP4 } }],
    });
    expect(badMime.status()).toBe(400);
    const tooBig = await createPageRaw(request, admin, {
      title: tagged("s3-10-big"),
      videos: [
        { title: "grande", file: { name: "grande.mp4", mimeType: "video/mp4", buffer: Buffer.alloc(200 * 1024 * 1024 + 1) } },
      ],
    });
    expect(tooBig.status()).toBeGreaterThanOrEqual(400);
    await expectBucketUnchanged(bucket);
    expect(await snapshotDb()).toEqual(db);
    await invariants();
  });

  test("[video-page.s3.12] edições simultâneas da mesma página: sem órfão e sem referência quebrada", async ({
    request,
  }) => {
    const page = await make(request, "s3-12", [{ title: "A", file: mp4("base.mp4") }]);
    const [row] = await mediaRows(page.id);
    const replace = (name: string) =>
      updatePageRaw(request, admin, page.id, {
        title: tagged("s3-12"),
        videos: [{ id: row.id, title: "A", file: mp4(name) }],
      });
    const results = await Promise.all([replace("c1.mp4"), replace("c2.mp4")]);
    expect(results.some((r) => r.status() === 200)).toBe(true);

    const rows = await mediaRows(page.id);
    expect(rows).toHaveLength(1);
    expect(await objectsOf(page.id)).toEqual([rows[0].storageKey]);
    await invariants();
  });
});
