import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/visit-reports` (plano 24): sessão obrigatória; só admin/líder (membro 403); id inexistente ou de outra equipe é 404; escrita recusada/inválida não grava; `visit_reports` desligada ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["visit_reports"] as const;

test.describe.serial("Relatórios de visita — autorização", () => {
  let admin: string;
  let leader: string;
  let member: string;
  const before: Record<string, number> = {};

  const send = (request: import("@playwright/test").APIRequestContext, verb: string, path: string, token?: string) =>
    request.fetch(`${API_URL}${path.replace("{BAD}", BAD)}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" || verb === "DELETE" ? undefined : {},
    });

  const setFlags = async (request: import("@playwright/test").APIRequestContext, enabled: boolean | "restore") => {
    for (const key of FLAGS) {
      await request.patch(`${API_URL}/feature-flags/${key}`, {
        headers: authHeaders(admin),
        data: { enabled: enabled === "restore" ? before[key] === 1 : enabled },
      });
    }
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    for (const key of FLAGS) {
      before[key] =
        (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1;
    }
  });

  test.afterAll(async ({ request }) => {
    await setFlags(request, "restore");
    await closeDb();
  });

  test("[visit-report.get.visit-reports#perfil-anonimo] GET /visit-reports como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/visit-reports", undefined);
    expect([401]).toContain(res.status());
  });

  test("[visit-report.get.visit-reports#perfil-membro] GET /visit-reports como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/visit-reports", member);
    expect([403]).toContain(res.status());
  });

  test("[visit-report.get.visit-reports#perfil-lider] GET /visit-reports como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/visit-reports", leader);
    expect([200]).toContain(res.status());
  });

  test("[visit-report.get.visit-reports#perfil-admin] GET /visit-reports como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/visit-reports", admin);
    expect([200]).toContain(res.status());
  });

  test("[visit-report.get.visit-reports-id#perfil-anonimo] GET /visit-reports/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/visit-reports/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[visit-report.get.visit-reports-id#perfil-membro] GET /visit-reports/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/visit-reports/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[visit-report.get.visit-reports-id#perfil-lider] GET /visit-reports/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/visit-reports/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[visit-report.get.visit-reports-id#perfil-admin] GET /visit-reports/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/visit-reports/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[visit-report.post.visit-reports#perfil-anonimo] POST /visit-reports como visitante: 401", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "POST", "/visit-reports", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.post.visit-reports#perfil-membro] POST /visit-reports como membro: 403", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "POST", "/visit-reports", member);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.post.visit-reports#perfil-lider] POST /visit-reports como líder: 400", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "POST", "/visit-reports", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.post.visit-reports#perfil-admin] POST /visit-reports como admin: 400", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "POST", "/visit-reports", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.put.visit-reports-id#perfil-anonimo] PUT /visit-reports/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "PUT", "/visit-reports/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.put.visit-reports-id#perfil-membro] PUT /visit-reports/:id como membro: 403", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "PUT", "/visit-reports/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.put.visit-reports-id#perfil-lider] PUT /visit-reports/:id como líder: 404", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "PUT", "/visit-reports/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.put.visit-reports-id#perfil-admin] PUT /visit-reports/:id como admin: 404", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "PUT", "/visit-reports/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.delete.visit-reports-id#perfil-anonimo] DELETE /visit-reports/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "DELETE", "/visit-reports/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.delete.visit-reports-id#perfil-membro] DELETE /visit-reports/:id como membro: 403", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "DELETE", "/visit-reports/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.delete.visit-reports-id#perfil-lider] DELETE /visit-reports/:id como líder: 404", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "DELETE", "/visit-reports/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.delete.visit-reports-id#perfil-admin] DELETE /visit-reports/:id como admin: 404", async ({ request }) => {
    const before = await countRows("visit_reports");
    const res = await send(request, "DELETE", "/visit-reports/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("visit_reports")).toBe(before);
  });

  test("[visit-report.get.visit-reports#flag-desligada] GET /visit-reports com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_reports");
    const res = await send(request, "GET", "/visit-reports", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_reports")).toBe(before);
    await setFlags(request, true);
  });

  test("[visit-report.post.visit-reports#flag-desligada] POST /visit-reports com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_reports");
    const res = await send(request, "POST", "/visit-reports", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_reports")).toBe(before);
    await setFlags(request, true);
  });

  test("[visit-report.put.visit-reports-id#flag-desligada] PUT /visit-reports/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_reports");
    const res = await send(request, "PUT", "/visit-reports/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_reports")).toBe(before);
    await setFlags(request, true);
  });

  test("[visit-report.delete.visit-reports-id#flag-desligada] DELETE /visit-reports/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_reports");
    const res = await send(request, "DELETE", "/visit-reports/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_reports")).toBe(before);
    await setFlags(request, true);
  });
});
