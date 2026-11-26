import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/informatives` (plano 28): leitura exige sessão (visitante 401), qualquer perfil lê; escrita só admin (membro/líder 403); escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["informative_banners", "informative_management"] as const;

test.describe.serial("Informativos — autorização", () => {
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

  test("[informative.get.informatives#perfil-anonimo] GET /informatives como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/informatives", undefined);
    expect([401]).toContain(res.status());
  });

  test("[informative.get.informatives#perfil-membro] GET /informatives como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/informatives", member);
    expect([200]).toContain(res.status());
  });

  test("[informative.get.informatives#perfil-lider] GET /informatives como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/informatives", leader);
    expect([200]).toContain(res.status());
  });

  test("[informative.get.informatives#perfil-admin] GET /informatives como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/informatives", admin);
    expect([200]).toContain(res.status());
  });

  test("[informative.get.informatives-id#perfil-anonimo] GET /informatives/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/informatives/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[informative.get.informatives-id#perfil-membro] GET /informatives/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/informatives/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[informative.get.informatives-id#perfil-lider] GET /informatives/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/informatives/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[informative.get.informatives-id#perfil-admin] GET /informatives/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/informatives/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[informative.post.informatives#perfil-anonimo] POST /informatives como visitante: 401", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "POST", "/informatives", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.post.informatives#perfil-membro] POST /informatives como membro: 403", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "POST", "/informatives", member);
    expect([403]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.post.informatives#perfil-lider] POST /informatives como líder: 403", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "POST", "/informatives", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.post.informatives#perfil-admin] POST /informatives como admin: 400", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "POST", "/informatives", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.patch.informatives-id#perfil-anonimo] PATCH /informatives/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "PATCH", "/informatives/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.patch.informatives-id#perfil-membro] PATCH /informatives/:id como membro: 403", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "PATCH", "/informatives/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.patch.informatives-id#perfil-lider] PATCH /informatives/:id como líder: 403", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "PATCH", "/informatives/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.patch.informatives-id#perfil-admin] PATCH /informatives/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "PATCH", "/informatives/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.delete.informatives-id#perfil-anonimo] DELETE /informatives/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("informatives");
    const res = await send(request, "DELETE", "/informatives/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.delete.informatives-id#perfil-membro] DELETE /informatives/:id como membro: 403", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "DELETE", "/informatives/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.delete.informatives-id#perfil-lider] DELETE /informatives/:id como líder: 403", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "DELETE", "/informatives/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.delete.informatives-id#perfil-admin] DELETE /informatives/:id como admin: 404", async ({ request }) => {
    const before = await countRows("informatives");
    const res = await send(request, "DELETE", "/informatives/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("informatives")).toBe(before);
  });

  test("[informative.get.informatives#flag-desligada] GET /informatives com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("informatives");
    const res = await send(request, "GET", "/informatives", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("informatives")).toBe(before);
    await setFlags(request, true);
  });

  test("[informative.post.informatives#flag-desligada] POST /informatives com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("informatives");
    const res = await send(request, "POST", "/informatives", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("informatives")).toBe(before);
    await setFlags(request, true);
  });

  test("[informative.patch.informatives-id#flag-desligada] PATCH /informatives/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("informatives");
    const res = await send(request, "PATCH", "/informatives/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("informatives")).toBe(before);
    await setFlags(request, true);
  });

  test("[informative.delete.informatives-id#flag-desligada] DELETE /informatives/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("informatives");
    const res = await send(request, "DELETE", "/informatives/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("informatives")).toBe(before);
    await setFlags(request, true);
  });
});
