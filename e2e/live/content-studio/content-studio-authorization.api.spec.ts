import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização do Estúdio (planos 42/43): TUDO é só admin (visitante 401, membro/líder 403) com as flags ligadas durante a matriz; escrita recusada ou inválida não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. As flags voltam ao estado anterior no fim. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["content_studio", "content_studio_generation", "content_studio_review", "content_studio_provider_admin"] as const;

test.describe.serial("Estúdio — autorização", () => {
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
    await setFlags(request, true);
  });

  test.afterAll(async ({ request }) => {
    await setFlags(request, "restore");
    await closeDb();
  });

  test("[content-studio.get.content-studio-catalog#perfil-anonimo] GET /content-studio/catalog como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/catalog", undefined);
    expect([401]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-catalog#perfil-membro] GET /content-studio/catalog como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/catalog", member);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-catalog#perfil-lider] GET /content-studio/catalog como líder: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/catalog", leader);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-catalog#perfil-admin] GET /content-studio/catalog como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/catalog", admin);
    expect([200]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-packages#perfil-anonimo] GET /content-studio/packages como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/packages", undefined);
    expect([401]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-packages#perfil-membro] GET /content-studio/packages como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/packages", member);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-packages#perfil-lider] GET /content-studio/packages como líder: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/packages", leader);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-packages#perfil-admin] GET /content-studio/packages como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/packages", admin);
    expect([200]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-packages-id#perfil-anonimo] GET /content-studio/packages/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/packages/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-packages-id#perfil-membro] GET /content-studio/packages/:id como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/packages/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-packages-id#perfil-lider] GET /content-studio/packages/:id como líder: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/packages/{BAD}", leader);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-packages-id#perfil-admin] GET /content-studio/packages/:id como admin: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/packages/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-dashboard#perfil-anonimo] GET /content-studio/dashboard como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/dashboard", undefined);
    expect([401]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-dashboard#perfil-membro] GET /content-studio/dashboard como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/dashboard", member);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-dashboard#perfil-lider] GET /content-studio/dashboard como líder: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/dashboard", leader);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-dashboard#perfil-admin] GET /content-studio/dashboard como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/content-studio/dashboard", admin);
    expect([200]).toContain(res.status());
  });

  test("[content-studio.post.content-studio-packages#perfil-anonimo] POST /content-studio/packages como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages#perfil-membro] POST /content-studio/packages como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages#perfil-lider] POST /content-studio/packages como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages#perfil-admin] POST /content-studio/packages como admin: 400", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-archive#perfil-anonimo] POST /content-studio/packages/:id/archive como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/archive", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-archive#perfil-membro] POST /content-studio/packages/:id/archive como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/archive", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-archive#perfil-lider] POST /content-studio/packages/:id/archive como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/archive", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-archive#perfil-admin] POST /content-studio/packages/:id/archive como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/archive", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-submit-review#perfil-anonimo] POST /content-studio/packages/:id/submit-review como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/submit-review", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-submit-review#perfil-membro] POST /content-studio/packages/:id/submit-review como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/submit-review", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-submit-review#perfil-lider] POST /content-studio/packages/:id/submit-review como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/submit-review", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-submit-review#perfil-admin] POST /content-studio/packages/:id/submit-review como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/submit-review", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#perfil-anonimo] PATCH /content-studio/packages/:id/stages/:id/content como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "PATCH", "/content-studio/packages/{BAD}/stages/{BAD}/content", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#perfil-membro] PATCH /content-studio/packages/:id/stages/:id/content como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "PATCH", "/content-studio/packages/{BAD}/stages/{BAD}/content", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#perfil-lider] PATCH /content-studio/packages/:id/stages/:id/content como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "PATCH", "/content-studio/packages/{BAD}/stages/{BAD}/content", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.patch.content-studio-packages-packageid-stages-stageid-content#perfil-admin] PATCH /content-studio/packages/:id/stages/:id/content como admin: 400", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "PATCH", "/content-studio/packages/{BAD}/stages/{BAD}/content", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#perfil-anonimo] POST /content-studio/packages/:id/stages/:id/complete-production como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/complete-production", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#perfil-membro] POST /content-studio/packages/:id/stages/:id/complete-production como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/complete-production", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#perfil-lider] POST /content-studio/packages/:id/stages/:id/complete-production como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/complete-production", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-complete-production#perfil-admin] POST /content-studio/packages/:id/stages/:id/complete-production como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/complete-production", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#perfil-anonimo] POST /content-studio/packages/:id/stages/:id/approve como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/approve", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#perfil-membro] POST /content-studio/packages/:id/stages/:id/approve como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/approve", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#perfil-lider] POST /content-studio/packages/:id/stages/:id/approve como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/approve", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-approve#perfil-admin] POST /content-studio/packages/:id/stages/:id/approve como admin: 400", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/approve", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#perfil-anonimo] POST /content-studio/packages/:id/stages/:id/request-changes como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/request-changes", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#perfil-membro] POST /content-studio/packages/:id/stages/:id/request-changes como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/request-changes", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#perfil-lider] POST /content-studio/packages/:id/stages/:id/request-changes como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/request-changes", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-request-changes#perfil-admin] POST /content-studio/packages/:id/stages/:id/request-changes como admin: 400", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/request-changes", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#perfil-anonimo] POST /content-studio/packages/:id/review-comments/:id/resolve como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/review-comments/{BAD}/resolve", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#perfil-membro] POST /content-studio/packages/:id/review-comments/:id/resolve como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/review-comments/{BAD}/resolve", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#perfil-lider] POST /content-studio/packages/:id/review-comments/:id/resolve como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/review-comments/{BAD}/resolve", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-review-comments-commentid-resolve#perfil-admin] POST /content-studio/packages/:id/review-comments/:id/resolve como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/review-comments/{BAD}/resolve", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#perfil-anonimo] POST /content-studio/packages/:id/stages/:id/generations como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/generations", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#perfil-membro] POST /content-studio/packages/:id/stages/:id/generations como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/generations", member);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#perfil-lider] POST /content-studio/packages/:id/stages/:id/generations como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/generations", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#perfil-admin] POST /content-studio/packages/:id/stages/:id/generations como admin: 400", async ({
    request,
  }) => {
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/generations", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("content_packages")).toBe(before);
  });

  test("[content-studio.get.ai-management-providers#perfil-anonimo] GET /ai-management/providers como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/ai-management/providers", undefined);
    expect([401]).toContain(res.status());
  });

  test("[content-studio.get.ai-management-providers#perfil-membro] GET /ai-management/providers como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/ai-management/providers", member);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.ai-management-providers#perfil-lider] GET /ai-management/providers como líder: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/ai-management/providers", leader);
    expect([403]).toContain(res.status());
  });

  test("[content-studio.get.ai-management-providers#perfil-admin] GET /ai-management/providers como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/ai-management/providers", admin);
    expect([200]).toContain(res.status());
  });

  test("[content-studio.get.content-studio-catalog#flag-desligada] GET /content-studio/catalog com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("content_packages");
    const res = await send(request, "GET", "/content-studio/catalog", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("content_packages")).toBe(before);
    await setFlags(request, true);
  });

  test("[content-studio.post.content-studio-packages#flag-desligada] POST /content-studio/packages com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("content_packages")).toBe(before);
    await setFlags(request, true);
  });

  test("[content-studio.post.content-studio-packages-packageid-stages-stageid-generations#flag-desligada] POST /content-studio/packages/:id/stages/:id/generations com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("content_packages");
    const res = await send(request, "POST", "/content-studio/packages/{BAD}/stages/{BAD}/generations", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("content_packages")).toBe(before);
    await setFlags(request, true);
  });

  test("[content-studio.get.ai-management-providers#flag-desligada] GET /ai-management/providers com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("content_packages");
    const res = await send(request, "GET", "/ai-management/providers", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("content_packages")).toBe(before);
    await setFlags(request, true);
  });
});
