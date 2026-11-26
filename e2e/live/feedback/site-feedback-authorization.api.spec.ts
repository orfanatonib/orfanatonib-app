import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/site-feedbacks` (plano 39): sessão obrigatória; qualquer autenticado ENVIA (corpo inválido 400 sem gravar); caixa, detalhe, edição, lido e exclusão só admin; escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["site_feedback", "feedback_management"] as const;

test.describe.serial("Avaliações do site — autorização", () => {
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

  test("[site-feedback.get.site-feedbacks#perfil-anonimo] GET /site-feedbacks como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/site-feedbacks", undefined);
    expect([401]).toContain(res.status());
  });

  test("[site-feedback.get.site-feedbacks#perfil-membro] GET /site-feedbacks como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/site-feedbacks", member);
    expect([403]).toContain(res.status());
  });

  test("[site-feedback.get.site-feedbacks#perfil-lider] GET /site-feedbacks como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/site-feedbacks", leader);
    expect([403]).toContain(res.status());
  });

  test("[site-feedback.get.site-feedbacks#perfil-admin] GET /site-feedbacks como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/site-feedbacks", admin);
    expect([200]).toContain(res.status());
  });

  test("[site-feedback.post.site-feedbacks#perfil-anonimo] POST /site-feedbacks como visitante: 401", async ({ request }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "POST", "/site-feedbacks", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.post.site-feedbacks#perfil-membro] POST /site-feedbacks como membro: 400", async ({ request }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "POST", "/site-feedbacks", member);
    expect([400]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.post.site-feedbacks#perfil-lider] POST /site-feedbacks como líder: 400", async ({ request }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "POST", "/site-feedbacks", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.post.site-feedbacks#perfil-admin] POST /site-feedbacks como admin: 400", async ({ request }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "POST", "/site-feedbacks", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.get.site-feedbacks-id#perfil-anonimo] GET /site-feedbacks/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/site-feedbacks/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[site-feedback.get.site-feedbacks-id#perfil-membro] GET /site-feedbacks/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/site-feedbacks/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[site-feedback.get.site-feedbacks-id#perfil-lider] GET /site-feedbacks/:id como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/site-feedbacks/{BAD}", leader);
    expect([403]).toContain(res.status());
  });

  test("[site-feedback.get.site-feedbacks-id#perfil-admin] GET /site-feedbacks/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/site-feedbacks/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[site-feedback.put.site-feedbacks-id#perfil-anonimo] PUT /site-feedbacks/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PUT", "/site-feedbacks/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.put.site-feedbacks-id#perfil-membro] PUT /site-feedbacks/:id como membro: 403", async ({ request }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PUT", "/site-feedbacks/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.put.site-feedbacks-id#perfil-lider] PUT /site-feedbacks/:id como líder: 403", async ({ request }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PUT", "/site-feedbacks/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.put.site-feedbacks-id#perfil-admin] PUT /site-feedbacks/:id como admin: 404", async ({ request }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PUT", "/site-feedbacks/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#perfil-anonimo] PATCH /site-feedbacks/:id/read como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PATCH", "/site-feedbacks/{BAD}/read", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#perfil-membro] PATCH /site-feedbacks/:id/read como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PATCH", "/site-feedbacks/{BAD}/read", member);
    expect([403]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#perfil-lider] PATCH /site-feedbacks/:id/read como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PATCH", "/site-feedbacks/{BAD}/read", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#perfil-admin] PATCH /site-feedbacks/:id/read como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PATCH", "/site-feedbacks/{BAD}/read", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.delete.site-feedbacks-id#perfil-anonimo] DELETE /site-feedbacks/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "DELETE", "/site-feedbacks/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.delete.site-feedbacks-id#perfil-membro] DELETE /site-feedbacks/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "DELETE", "/site-feedbacks/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.delete.site-feedbacks-id#perfil-lider] DELETE /site-feedbacks/:id como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "DELETE", "/site-feedbacks/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.delete.site-feedbacks-id#perfil-admin] DELETE /site-feedbacks/:id como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("site_feedbacks");
    const res = await send(request, "DELETE", "/site-feedbacks/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("site_feedbacks")).toBe(before);
  });

  test("[site-feedback.get.site-feedbacks#flag-desligada] GET /site-feedbacks com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("site_feedbacks");
    const res = await send(request, "GET", "/site-feedbacks", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("site_feedbacks")).toBe(before);
    await setFlags(request, true);
  });

  test("[site-feedback.post.site-feedbacks#flag-desligada] POST /site-feedbacks com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("site_feedbacks");
    const res = await send(request, "POST", "/site-feedbacks", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("site_feedbacks")).toBe(before);
    await setFlags(request, true);
  });

  test("[site-feedback.put.site-feedbacks-id#flag-desligada] PUT /site-feedbacks/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PUT", "/site-feedbacks/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("site_feedbacks")).toBe(before);
    await setFlags(request, true);
  });

  test("[site-feedback.patch.site-feedbacks-id-read#flag-desligada] PATCH /site-feedbacks/:id/read com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("site_feedbacks");
    const res = await send(request, "PATCH", "/site-feedbacks/{BAD}/read", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("site_feedbacks")).toBe(before);
    await setFlags(request, true);
  });

  test("[site-feedback.delete.site-feedbacks-id#flag-desligada] DELETE /site-feedbacks/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("site_feedbacks");
    const res = await send(request, "DELETE", "/site-feedbacks/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("site_feedbacks")).toBe(before);
    await setFlags(request, true);
  });
});
