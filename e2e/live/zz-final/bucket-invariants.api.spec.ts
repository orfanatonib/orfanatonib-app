import { API_URL } from "../../../playwright.live.config";
import { closeDb } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { expectNoBrokenRefs, expectNoOrphans } from "../support/s3";

/**
 * Roda por último (pasta `zz-final`): depois de TODOS os specs da suíte, o bucket
 * não pode ter objeto sem referência nem referência sem objeto, e a
 * reconciliação em dry-run não encontra nada com idade acima de 0 h.
 */
test.describe("Invariantes finais do bucket", () => {
  test.afterAll(async () => {
    await closeDb();
  });

  test("sem objeto órfão e sem referência quebrada depois da suíte inteira", async () => {
    await expectNoOrphans();
    await expectNoBrokenRefs();
  });

  test("reconciliação em dry-run não encontra órfãos nem referências quebradas", async ({ request }) => {
    const admin = (await loginAs(request, "admin")).accessToken;
    const res = await request.post(`${API_URL}/media-storage/reconcile?minAgeHours=0`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(201);
    const report = (await res.json()) as { orphanKeys: string[]; brokenReferences: string[] };
    expect(report.orphanKeys).toEqual([]);
    expect(report.brokenReferences).toEqual([]);
  });
});
