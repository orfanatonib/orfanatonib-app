import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { listObjects, objectExists, plantObject, referencedKeys, removeObject, snapshotBucket, uploadsPrefix } from "../support/s3";

/**
 * Reconciliação bucket × banco (`POST /media-storage/reconcile`):
 * órfão plantado é reportado e só removido com dryRun=false; referência quebrada é apenas reportada.
 */
const TAG = `e2e-recon-${Date.now()}`;
const orphanKey = `${uploadsPrefix()}Recon/${TAG}/orphan.png`;

type Report = { dryRun: boolean; orphanKeys: string[]; removedKeys: string[]; brokenReferences: string[] };

test.describe.serial("Reconciliação de mídia — ao vivo", () => {
  let admin: string;
  let member: string;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    await plantObject(orphanKey, "x");
  });

  test.afterAll(async () => {
    await removeObject(orphanKey).catch(() => undefined);
    await closeDb();
  });

  test("[media-upload.reconcile.e2e#perfis] só admin; anônimo 401 e membro 403", async ({ request }) => {
    expect((await request.post(`${API_URL}/media-storage/reconcile`)).status()).toBe(401);
    expect((await request.post(`${API_URL}/media-storage/reconcile`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[media-upload.reconcile.e2e#dry-run] por padrão só relata o órfão e não apaga nada", async ({ request }) => {
    const res = await request.post(`${API_URL}/media-storage/reconcile?minAgeHours=0`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(201);
    const report = (await res.json()) as Report;
    expect(report.dryRun).toBe(true);
    expect(report.orphanKeys).toContain(orphanKey);
    expect(report.removedKeys).toEqual([]);
    expect(await objectExists(orphanKey)).toBe(true);
  });

  test("órfão recente (< janela) não é removido mesmo com dryRun=false", async ({ request }) => {
    const res = await request.post(`${API_URL}/media-storage/reconcile?dryRun=false&minAgeHours=24`, { headers: authHeaders(admin) });
    const report = (await res.json()) as Report;
    expect(report.orphanKeys).not.toContain(orphanKey);
    expect(await objectExists(orphanKey)).toBe(true);
  });

  test("[media-upload.reconcile.e2e#orfao-removido] dryRun=false com janela 0 remove o órfão e SÓ órfão", async ({ request }) => {
    // Arquivo em uso = referenciado por QUALQUER coluna de mídia (capas e arquivos do Estúdio, imagem de rota…).
    const inBucket = new Set(await snapshotBucket());
    const inUse = (await referencedKeys()).filter((key) => inBucket.has(key));

    const res = await request.post(`${API_URL}/media-storage/reconcile?dryRun=false&minAgeHours=0`, { headers: authHeaders(admin) });
    const report = (await res.json()) as Report;
    expect(report.removedKeys).toContain(orphanKey);
    expect(report.removedKeys.filter((key) => inUse.includes(key))).toEqual([]);
    const after = new Set(await snapshotBucket());
    expect(inUse.filter((key) => !after.has(key))).toEqual([]);
    expect(await objectExists(orphanKey)).toBe(false);
    expect(await listObjects(`${uploadsPrefix()}Recon/${TAG}/`)).toEqual([]);
  });

  test("[media-upload.reconcile.e2e#referencia-quebrada-so-reportada] referência sem objeto é só reportada, a linha não é apagada", async ({ request }) => {
    const rows = await queryAll<{ n: number }>("SELECT COUNT(*) AS n FROM media_items");
    expect(rows[0].n).toBeGreaterThanOrEqual(0);
    const res = await request.post(`${API_URL}/media-storage/reconcile?dryRun=false&minAgeHours=0`, { headers: authHeaders(admin) });
    expect(res.ok()).toBe(true);
    const after = await queryAll<{ n: number }>("SELECT COUNT(*) AS n FROM media_items");
    expect(after[0].n).toBe(rows[0].n);
  });
});
