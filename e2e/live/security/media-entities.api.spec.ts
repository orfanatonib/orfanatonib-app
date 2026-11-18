import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { PNG_1X1 } from "../support/media-scenarios";
import { expectNoBrokenRefs, expectNoOrphans, listObjects, snapshotBucket, uploadsPrefix } from "../support/s3";

/**
 * Eventos, integrações e antecedentes criminais × S3 (LocalStack) + MySQL reais:
 * criar, substituir, recusar e apagar — sempre sem órfão e sem referência quebrada.
 */
const TAG = `e2e-media-${Date.now()}`;
const png = (name: string) => ({ name, mimeType: "image/png", buffer: PNG_1X1 });
const pdf = (name: string) => ({ name, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });

let admin: string;
const mediaOf = (targetId: string) =>
  queryAll<{ url: string; storageKey: string | null }>("SELECT url, storageKey FROM media_items WHERE targetId = ?", [targetId]);
const objectsOf = (entity: string, id: string) => listObjects(`${uploadsPrefix()}${entity}/${id}/`);

test.describe.serial("Mídia por entidade × S3 — ao vivo", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
  });
  test.afterAll(async () => {
    await closeDb();
  });

  test.describe("evento", () => {
    let id: string;
    const body = (extra: object = {}) =>
      JSON.stringify({ title: TAG, date: "2026-12-01", location: "Local", description: "d", audience: "all", ...extra });

    test("[event.s3.01] criar com imagem: objeto e linha existem, chave por entidade", async ({ request }) => {
      const res = await request.post(`${API_URL}/events`, { headers: authHeaders(admin), multipart: { eventData: body(), file: png("e.png") } });
      expect(res.status()).toBe(201);
      id = ((await res.json()) as { id: string }).id;
      const rows = await mediaOf(id);
      expect(rows).toHaveLength(1);
      expect(await objectsOf("Event", id)).toEqual([rows[0].storageKey]);
      await expectNoOrphans();
      await expectNoBrokenRefs();
    });

    test("[event.s3.04] substituir a imagem remove a antiga só depois de gravar a nova", async ({ request }) => {
      const [before] = await mediaOf(id);
      const res = await request.patch(`${API_URL}/events/${id}`, { headers: authHeaders(admin), multipart: { eventData: body({ title: `${TAG}-2` }), file: png("n.png") } });
      expect(res.ok()).toBe(true);
      const rows = await mediaOf(id);
      expect(rows).toHaveLength(1);
      expect(rows[0].storageKey).not.toBe(before.storageKey);
      expect(await objectsOf("Event", id)).toEqual([rows[0].storageKey]);
      await expectNoOrphans();
      await expectNoBrokenRefs();
    });

    test("[event.s3.10] arquivo que não é imagem é recusado e o bucket não muda", async ({ request }) => {
      const before = await snapshotBucket();
      const rows = await mediaOf(id);
      const res = await request.patch(`${API_URL}/events/${id}`, { headers: authHeaders(admin), multipart: { eventData: body(), file: { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } } });
      expect([400, 413]).toContain(res.status());
      expect(await snapshotBucket()).toEqual(before);
      expect(await mediaOf(id)).toEqual(rows);
    });

    test("[event.s3.07] apagar o evento remove o objeto e a linha de mídia", async ({ request }) => {
      const res = await request.delete(`${API_URL}/events/${id}`, { headers: authHeaders(admin) });
      expect(res.status()).toBe(204);
      expect(await mediaOf(id)).toEqual([]);
      expect(await objectsOf("Event", id)).toEqual([]);
      await expectNoOrphans();
      await expectNoBrokenRefs();
    });
  });

  test.describe("antecedente criminal (PDF sensível)", () => {
    let id: string;
    const data = (extra: object = {}) => JSON.stringify({ name: TAG, ...extra });

    test("[background-checks.s3.01] criar com PDF estadual: objeto na pasta da entidade", async ({ request }) => {
      const res = await request.post(`${API_URL}/antecedentes-criminais`, { headers: authHeaders(admin), multipart: { atendenteData: data(), estadual: pdf("e.pdf") } });
      expect(res.status()).toBe(201);
      id = ((await res.json()) as { id: string }).id;
      const rows = await mediaOf(id);
      expect(rows).toHaveLength(1);
      expect(rows[0].storageKey).toMatch(/\/AtendenteEstadual\/[0-9a-f-]+\/[0-9a-f-]{36}\.pdf$/);
      await expectNoOrphans();
      await expectNoBrokenRefs();
    });

    test("[background-checks.s3.10] arquivo que não é PDF é recusado e nada muda", async ({ request }) => {
      const before = await snapshotBucket();
      const rows = await mediaOf(id);
      const res = await request.put(`${API_URL}/antecedentes-criminais/${id}`, {
        headers: authHeaders(admin),
        multipart: { atendenteData: data(), estadual: { name: "x.html", mimeType: "text/html", buffer: Buffer.from("<script>1</script>") } },
      });
      expect([400, 413]).toContain(res.status());
      expect(await snapshotBucket()).toEqual(before);
      expect(await mediaOf(id)).toEqual(rows);
    });

    test("[background-checks.s3.04] trocar o PDF: novo gravado, antigo removido", async ({ request }) => {
      const [before] = await mediaOf(id);
      const res = await request.put(`${API_URL}/antecedentes-criminais/${id}`, { headers: authHeaders(admin), multipart: { atendenteData: data(), estadual: pdf("n.pdf") } });
      expect(res.ok()).toBe(true);
      const rows = await mediaOf(id);
      expect(rows).toHaveLength(1);
      expect(rows[0].storageKey).not.toBe(before.storageKey);
      expect(await listObjects(`${uploadsPrefix()}AtendenteEstadual/${id}/`)).toEqual([rows[0].storageKey]);
      await expectNoOrphans();
      await expectNoBrokenRefs();
    });

    test("[background-checks.s3.07] apagar o cadastro remove PDFs e linhas", async ({ request }) => {
      const res = await request.delete(`${API_URL}/antecedentes-criminais/${id}`, { headers: authHeaders(admin) });
      expect(res.ok()).toBe(true);
      expect(await mediaOf(id)).toEqual([]);
      expect(await listObjects(`${uploadsPrefix()}AtendenteEstadual/${id}/`)).toEqual([]);
      await expectNoOrphans();
      await expectNoBrokenRefs();
    });
  });

  test.describe("integração", () => {
    let id: string;
    const data = (extra: object = {}) => JSON.stringify({ name: TAG, ...extra });
    const filesOf = () => queryAll<{ url: string; storageKey: string | null }>("SELECT url, storageKey FROM media_items WHERE targetId = ?", [id]);

    test("[integration.s3.01] criar com 2 fotos: 2 objetos e 2 linhas", async ({ request }) => {
      const res = await request.post(`${API_URL}/integrations`, {
        headers: authHeaders(admin),
        multipart: { integrationData: data(), "files[0]": png("a.png"), "files[1]": png("b.png") },
      });
      expect(res.status()).toBe(201);
      id = ((await res.json()) as { id: string }).id;
      const rows = await filesOf();
      expect(rows).toHaveLength(2);
      expect((await objectsOf("Integration", id)).sort()).toEqual(rows.map((r) => r.storageKey).sort());
      await expectNoOrphans();
      await expectNoBrokenRefs();
    });

    test("[integration.s3.02] 2ª foto inválida: nada novo no bucket e nenhuma integração criada", async ({ request }) => {
      const before = await snapshotBucket();
      const count = async () => (await queryAll<{ n: number }>("SELECT COUNT(*) AS n FROM integrations WHERE name = ?", [`${TAG}-bad`]))[0].n;
      const res = await request.post(`${API_URL}/integrations`, {
        headers: authHeaders(admin),
        multipart: { integrationData: data({ name: `${TAG}-bad` }), "files[0]": png("ok.png"), "files[1]": { name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") } },
      });
      expect([400, 413]).toContain(res.status());
      expect(await snapshotBucket()).toEqual(before);
      expect(await count()).toBe(0);
      await expectNoOrphans();
    });

    test("[integration.s3.07] apagar a integração remove objetos e linhas", async ({ request }) => {
      const res = await request.delete(`${API_URL}/integrations/${id}`, { headers: authHeaders(admin) });
      expect(res.ok()).toBe(true);
      expect(await filesOf()).toEqual([]);
      expect(await objectsOf("Integration", id)).toEqual([]);
      await expectNoOrphans();
      await expectNoBrokenRefs();
    });
  });
});
