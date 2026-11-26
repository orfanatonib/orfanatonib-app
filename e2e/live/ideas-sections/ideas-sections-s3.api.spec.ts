import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { s3Config } from "../support/env";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, objectExists, snapshotBucket } from "../support/s3";
import { keyFromUrl } from "../support/s3-invariants";
import {
  countSections,
  createIdea,
  createIdeasPage,
  deleteIdea,
  deleteIdeasPage,
  mediaRows,
  png,
  sectionBody,
  sectionRow,
  uploadMedia,
} from "./ideas-sections.helpers";

/**
 * Os 12 cenários S3 da §7.4 do plano 30 contra API + MySQL + LocalStack reais.
 * Invariante ao fim de cada um: nenhum objeto sem linha e nenhuma linha sem
 * objeto. O s3.11 (falha real ao apagar) é de integração e vive no Jest
 * (`ideas-section-media.service.spec.ts`): derrubar o LocalStack não é possível
 * daqui, e o banco dos E2E é só leitura.
 */
const TAG = `e2e-ideia-s3-${Date.now()}`;

test.describe.serial("Ideias compartilhadas — S3 sem órfão e sem referência quebrada", () => {
  let admin: string;
  let member: string;
  const created: string[] = [];
  const pages: string[] = [];

  const keyOf = (url: string) => keyFromUrl(url, s3Config().bucket) as string;
  const invariants = async () => {
    await expectNoOrphans();
    await expectNoBrokenRefs();
  };
  const idea = async (
    request: import("@playwright/test").APIRequestContext,
    name: string,
    names: string[],
  ) => {
    const files = Object.fromEntries(names.map((n, i) => [`f${i}`, png(n)]));
    const section = await createIdea(request, member, `${TAG}-${name}`, {
      medias: names.map((n, i) => uploadMedia(`f${i}`, n)),
      files,
    });
    created.push(section.id);
    return section;
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    await invariants();
  });

  test.afterAll(async ({ request }) => {
    for (const page of pages) await deleteIdeasPage(request, admin, page);
    for (const id of created) await deleteIdea(request, admin, id);
    for (const id of created) expect(await sectionRow(id)).toBeNull();
    await invariants();
    await closeDb();
  });

  test("[ideas-section.s3.01] criar com N arquivos: N objetos no bucket, N linhas de mídia, 0 órfãos", async ({ request }) => {
    const section = await idea(request, "s01", ["a.png", "b.png", "c.png"]);
    const rows = await mediaRows(section.id);
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(await objectExists(keyOf(row.url))).toBe(true);
    await invariants();
  });

  test("[ideas-section.s3.02] falha de validação no 2º arquivo depois do 1º enviado: 400, bucket igual e 0 linhas novas", async ({ request }) => {
    const bucket = await snapshotBucket();
    const rows = await countSections();
    const response = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member),
      multipart: {
        sectionData: sectionBody(`${TAG}-s02`, [uploadMedia("a"), uploadMedia("b")]),
        a: png("ok.png"),
        b: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
      },
    });
    expect(response.status()).toBe(400);
    await expectBucketUnchanged(bucket);
    expect(await countSections()).toBe(rows);
    await invariants();
  });

  test("[ideas-section.s3.03] falha real no banco depois do upload (título de mídia acima do limite da coluna): rollback e objetos descartados", async ({ request }) => {
    const bucket = await snapshotBucket();
    const rows = await countSections();
    const response = await request.post(`${API_URL}/ideas-sections`, {
      headers: authHeaders(member),
      multipart: {
        sectionData: sectionBody(`${TAG}-s03`, [uploadMedia("a", "ok"), uploadMedia("b", "x".repeat(400))]),
        a: png("um.png"),
        b: png("dois.png"),
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(await countSections()).toBe(rows);
    expect(
      Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM ideas_sections WHERE title = ?", [`${TAG}-s03`]))?.n),
    ).toBe(0);
    await expectBucketUnchanged(bucket);
    await invariants();
  });

  test("[ideas-section.s3.04] substituir 1 arquivo: o novo existe, o antigo só some depois de gravar e a linha aponta para o novo", async ({ request }) => {
    const section = await idea(request, "s04", ["antigo.png"]);
    const [before] = await mediaRows(section.id);
    const response = await request.patch(`${API_URL}/ideas-sections/${section.id}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: sectionBody(`${TAG}-s04`, [{ ...uploadMedia("n"), id: before.id }]), n: png("novo.png") },
    });
    expect(response.status(), await response.text()).toBe(200);
    const [after] = await mediaRows(section.id);
    expect(after.id).toBe(before.id);
    expect(after.url).not.toBe(before.url);
    expect(await objectExists(keyOf(after.url))).toBe(true);
    expect(await objectExists(keyOf(before.url))).toBe(false);
    await invariants();
  });

  test("[ideas-section.s3.05] remover 1 item de mídia: objeto e linha removidos, o outro intacto", async ({ request }) => {
    const section = await idea(request, "s05", ["um.png", "dois.png"]);
    const rows = await mediaRows(section.id);
    const keep = rows[0];
    const drop = rows[1];
    const response = await request.patch(`${API_URL}/ideas-sections/${section.id}`, {
      headers: authHeaders(admin),
      multipart: { sectionData: sectionBody(`${TAG}-s05`, [{ ...uploadMedia("x", "mantida"), id: keep.id }]) },
    });
    expect(response.status(), await response.text()).toBe(200);
    expect((await mediaRows(section.id)).map((r) => r.id)).toEqual([keep.id]);
    expect(await objectExists(keyOf(keep.url))).toBe(true);
    expect(await objectExists(keyOf(drop.url))).toBe(false);
    await invariants();
  });

  test("[ideas-section.s3.06] update com falha no 2º item: os antigos ficam intactos e os novos são descartados", async ({ request }) => {
    const section = await idea(request, "s06", ["fica.png"]);
    const before = await mediaRows(section.id);
    const row = await sectionRow(section.id);
    const bucket = await snapshotBucket();
    const response = await request.patch(`${API_URL}/ideas-sections/${section.id}`, {
      headers: authHeaders(admin),
      multipart: {
        sectionData: sectionBody(`${TAG}-s06-novo`, [
          { ...uploadMedia("n", "novo"), id: before[0].id },
          uploadMedia("b", "y".repeat(400)),
        ]),
        n: png("novo.png"),
        b: png("outro.png"),
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(await mediaRows(section.id)).toEqual(before);
    expect(await sectionRow(section.id)).toMatchObject({ title: row?.title, description: row?.description });
    expect(await objectExists(keyOf(before[0].url))).toBe(true);
    await expectBucketUnchanged(bucket);
    await invariants();
  });

  test("[ideas-section.s3.07] apagar a ideia: todos os objetos e todas as linhas de media_items do targetId removidos", async ({ request }) => {
    const section = await idea(request, "s07", ["a.png", "b.png"]);
    const rows = await mediaRows(section.id);
    expect((await request.delete(`${API_URL}/ideas-sections/${section.id}`, { headers: authHeaders(admin) })).status()).toBe(200);
    expect(await mediaRows(section.id)).toEqual([]);
    for (const row of rows) expect(await objectExists(keyOf(row.url))).toBe(false);
    await invariants();
  });

  test("[ideas-section.s3.08] apagar a página dona de ideias já publicadas: cascata completa, 0 objetos e 0 linhas das seções", async ({ request }) => {
    const pageId = await createIdeasPage(request, admin, `${TAG}-pagina`);
    pages.push(pageId);
    const section = await idea(request, "s08", ["a.png", "b.png"]);
    const rows = await mediaRows(section.id);
    const attach = await request.patch(`${API_URL}/ideas-sections/${section.id}/attach/${pageId}`, {
      headers: authHeaders(admin),
      multipart: {
        sectionData: sectionBody(
          `${TAG}-s08`,
          rows.map((r) => ({ ...uploadMedia("x", "m"), id: r.id })),
        ),
      },
    });
    expect(attach.status(), await attach.text()).toBe(200);

    expect((await request.delete(`${API_URL}/ideas-pages/${pageId}`, { headers: authHeaders(admin) })).ok()).toBe(true);
    pages.splice(pages.indexOf(pageId), 1);
    expect(await sectionRow(section.id)).toBeNull();
    await expect.poll(async () => (await mediaRows(section.id)).length, { timeout: 15_000 }).toBe(0);
    for (const row of rows) expect(await objectExists(keyOf(row.url))).toBe(false);
    await invariants();
  });

  test("[ideas-section.s3.09] dois uploads com o mesmo nome na mesma requisição: duas chaves distintas e dois objetos", async ({ request }) => {
    const section = await idea(request, "s09", ["igual.png", "igual.png"]);
    const rows = await mediaRows(section.id);
    expect(rows).toHaveLength(2);
    const keys = rows.map((r) => keyOf(r.url));
    expect(new Set(keys).size).toBe(2);
    for (const key of keys) expect(await objectExists(key)).toBe(true);
    await invariants();
  });

  test("[ideas-section.s3.10] tipo inválido e arquivo acima do limite do tipo: 400/413, bucket e banco inalterados", async ({ request }) => {
    const bucket = await snapshotBucket();
    const rows = await countSections();
    const post = (name: string, file: { name: string; mimeType: string; buffer: Buffer }) =>
      request.post(`${API_URL}/ideas-sections`, {
        headers: authHeaders(member),
        multipart: {
          sectionData: sectionBody(`${TAG}-s10-${name}`, [{ ...uploadMedia("a"), mediaType: "document" }]),
          a: file,
        },
      });

    expect([400, 413]).toContain(
      (await post("tipo", { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") })).status(),
    );
    expect([400, 413]).toContain(
      (await post("audio", { name: "x.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("ID3") })).status(),
    );
    // Documento acima do teto de 25 MB do tipo, mas dentro do teto de 100 MB do Multer.
    const big = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(26 * 1024 * 1024)]);
    expect([400, 413]).toContain((await post("grande", { name: "grande.pdf", mimeType: "application/pdf", buffer: big })).status());

    expect(await countSections()).toBe(rows);
    await expectBucketUnchanged(bucket);
    await invariants();
  });

  test("[ideas-section.s3.12] duas edições simultâneas da mesma ideia: sem órfão e sem referência quebrada", async ({ request }) => {
    const section = await idea(request, "s12", ["base.png"]);
    const [base] = await mediaRows(section.id);
    const edit = (file: string) =>
      request.patch(`${API_URL}/ideas-sections/${section.id}`, {
        headers: authHeaders(admin),
        multipart: { sectionData: sectionBody(`${TAG}-s12`, [{ ...uploadMedia("n"), id: base.id }]), n: png(file) },
      });
    const results = await Promise.all([edit("c1.png"), edit("c2.png")]);
    for (const result of results) expect(result.status(), await result.text()).toBe(200);
    const rows = await mediaRows(section.id);
    expect(rows).toHaveLength(1);
    expect(await objectExists(keyOf(rows[0].url))).toBe(true);
    await invariants();
  });
});
