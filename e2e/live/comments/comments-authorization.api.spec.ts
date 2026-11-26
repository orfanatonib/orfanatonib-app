import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/comments` (plano 37): publicados são públicos; qualquer autenticado ENVIA (POST); fila, detalhe, edição e exclusão são só admin; escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["comment_submission", "comment_moderation", "home_comments"] as const;

test.describe.serial("Comentários — autorização", () => {
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

  test("[comment.get.comments#perfil-anonimo] GET /comments como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/comments", undefined);
    expect([401]).toContain(res.status());
  });

  test("[comment.get.comments#perfil-membro] GET /comments como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/comments", member);
    expect([403]).toContain(res.status());
  });

  test("[comment.get.comments#perfil-lider] GET /comments como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/comments", leader);
    expect([403]).toContain(res.status());
  });

  test("[comment.get.comments#perfil-admin] GET /comments como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/comments", admin);
    expect([200]).toContain(res.status());
  });

  test("[comment.get.comments-published#perfil-anonimo] GET /comments/published como visitante: 200", async ({ request }) => {
    const res = await send(request, "GET", "/comments/published", undefined);
    expect([200]).toContain(res.status());
  });

  test("[comment.get.comments-published#perfil-membro] GET /comments/published como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/comments/published", member);
    expect([200]).toContain(res.status());
  });

  test("[comment.get.comments-published#perfil-lider] GET /comments/published como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/comments/published", leader);
    expect([200]).toContain(res.status());
  });

  test("[comment.get.comments-published#perfil-admin] GET /comments/published como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/comments/published", admin);
    expect([200]).toContain(res.status());
  });

  test("[comment.get.comments-id#perfil-anonimo] GET /comments/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/comments/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[comment.get.comments-id#perfil-membro] GET /comments/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/comments/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[comment.get.comments-id#perfil-lider] GET /comments/:id como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/comments/{BAD}", leader);
    expect([403]).toContain(res.status());
  });

  test("[comment.get.comments-id#perfil-admin] GET /comments/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/comments/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[comment.post.comments#perfil-anonimo] POST /comments como visitante: 401", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "POST", "/comments", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.post.comments#perfil-membro] POST /comments como membro: 400", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "POST", "/comments", member);
    expect([400]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.post.comments#perfil-lider] POST /comments como líder: 400", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "POST", "/comments", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.post.comments#perfil-admin] POST /comments como admin: 400", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "POST", "/comments", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.put.comments-id#perfil-anonimo] PUT /comments/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "PUT", "/comments/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.put.comments-id#perfil-membro] PUT /comments/:id como membro: 403", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "PUT", "/comments/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.put.comments-id#perfil-lider] PUT /comments/:id como líder: 403", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "PUT", "/comments/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.put.comments-id#perfil-admin] PUT /comments/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "PUT", "/comments/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.delete.comments-id#perfil-anonimo] DELETE /comments/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "DELETE", "/comments/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.delete.comments-id#perfil-membro] DELETE /comments/:id como membro: 403", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "DELETE", "/comments/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.delete.comments-id#perfil-lider] DELETE /comments/:id como líder: 403", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "DELETE", "/comments/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.delete.comments-id#perfil-admin] DELETE /comments/:id como admin: 404", async ({ request }) => {
    const before = await countRows("comments");
    const res = await send(request, "DELETE", "/comments/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("comments")).toBe(before);
  });

  test("[comment.get.comments#flag-desligada] GET /comments com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("comments");
    const res = await send(request, "GET", "/comments", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("comments")).toBe(before);
    await setFlags(request, true);
  });

  test("[comment.get.comments-published#flag-desligada] GET /comments/published com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("comments");
    const res = await send(request, "GET", "/comments/published", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("comments")).toBe(before);
    await setFlags(request, true);
  });

  test("[comment.post.comments#flag-desligada] POST /comments com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("comments");
    const res = await send(request, "POST", "/comments", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("comments")).toBe(before);
    await setFlags(request, true);
  });

  test("[comment.put.comments-id#flag-desligada] PUT /comments/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("comments");
    const res = await send(request, "PUT", "/comments/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("comments")).toBe(before);
    await setFlags(request, true);
  });

  test("[comment.delete.comments-id#flag-desligada] DELETE /comments/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("comments");
    const res = await send(request, "DELETE", "/comments/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("comments")).toBe(before);
    await setFlags(request, true);
  });
});
