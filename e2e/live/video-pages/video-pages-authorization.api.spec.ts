import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { expectForbiddenWithoutSideEffects } from "../support/assertions";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/video-pages` (plano 34): leitura aberta (só páginas públicas para visitante; id inexistente 404); escrita só admin (visitante 401, membro/líder 403); escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["page_management", "public_videos", "training_videos"] as const;

test.describe.serial("Páginas de vídeo — autorização", () => {
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

  test("[video-page.get.video-pages#perfil-anonimo] GET /video-pages como visitante: 200", async ({ request }) => {
    const res = await send(request, "GET", "/video-pages", undefined);
    expect([200]).toContain(res.status());
  });

  test("[video-page.get.video-pages#perfil-membro] GET /video-pages como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/video-pages", member);
    expect([200]).toContain(res.status());
  });

  test("[video-page.get.video-pages#perfil-lider] GET /video-pages como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/video-pages", leader);
    expect([200]).toContain(res.status());
  });

  test("[video-page.get.video-pages#perfil-admin] GET /video-pages como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/video-pages", admin);
    expect([200]).toContain(res.status());
  });

  test("[video-page.get.video-pages-id#perfil-anonimo] GET /video-pages/:id como visitante: 404", async ({ request }) => {
    const res = await send(request, "GET", "/video-pages/{BAD}", undefined);
    expect([404]).toContain(res.status());
  });

  test("[video-page.get.video-pages-id#perfil-membro] GET /video-pages/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/video-pages/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[video-page.get.video-pages-id#perfil-lider] GET /video-pages/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/video-pages/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[video-page.get.video-pages-id#perfil-admin] GET /video-pages/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/video-pages/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[video-page.post.video-pages#perfil-anonimo] POST /video-pages como visitante: 401", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "POST", "/video-pages", undefined), [{ table: "videos_pages" }], [401]);
  });

  test("[video-page.post.video-pages#perfil-membro] POST /video-pages como membro: 403", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "POST", "/video-pages", member), [{ table: "videos_pages" }], [403]);
  });

  test("[video-page.post.video-pages#perfil-lider] POST /video-pages como líder: 403", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "POST", "/video-pages", leader), [{ table: "videos_pages" }], [403]);
  });

  test("[video-page.post.video-pages#perfil-admin] POST /video-pages como admin: 400", async ({ request }) => {
    const before = await countRows("videos_pages");
    const res = await send(request, "POST", "/video-pages", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("videos_pages")).toBe(before);
  });

  test("[video-page.patch.video-pages-id#perfil-anonimo] PATCH /video-pages/:id como visitante: 401", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "PATCH", "/video-pages/{BAD}", undefined), [{ table: "videos_pages" }], [401]);
  });

  test("[video-page.patch.video-pages-id#perfil-membro] PATCH /video-pages/:id como membro: 403", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "PATCH", "/video-pages/{BAD}", member), [{ table: "videos_pages" }], [403]);
  });

  test("[video-page.patch.video-pages-id#perfil-lider] PATCH /video-pages/:id como líder: 403", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "PATCH", "/video-pages/{BAD}", leader), [{ table: "videos_pages" }], [403]);
  });

  test("[video-page.patch.video-pages-id#perfil-admin] PATCH /video-pages/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("videos_pages");
    const res = await send(request, "PATCH", "/video-pages/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("videos_pages")).toBe(before);
  });

  test("[video-page.delete.video-pages-id#perfil-anonimo] DELETE /video-pages/:id como visitante: 401", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "DELETE", "/video-pages/{BAD}", undefined), [{ table: "videos_pages" }], [401]);
  });

  test("[video-page.delete.video-pages-id#perfil-membro] DELETE /video-pages/:id como membro: 403", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "DELETE", "/video-pages/{BAD}", member), [{ table: "videos_pages" }], [403]);
  });

  test("[video-page.delete.video-pages-id#perfil-lider] DELETE /video-pages/:id como líder: 403", async ({ request }) => {
    await expectForbiddenWithoutSideEffects(() => send(request, "DELETE", "/video-pages/{BAD}", leader), [{ table: "videos_pages" }], [403]);
  });

  test("[video-page.delete.video-pages-id#perfil-admin] DELETE /video-pages/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("videos_pages");
    const res = await send(request, "DELETE", "/video-pages/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("videos_pages")).toBe(before);
  });

  test("[video-page.get.video-pages#flag-desligada] GET /video-pages com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("videos_pages");
    const res = await send(request, "GET", "/video-pages", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("videos_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[video-page.post.video-pages#flag-desligada] POST /video-pages com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("videos_pages");
    const res = await send(request, "POST", "/video-pages", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("videos_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[video-page.patch.video-pages-id#flag-desligada] PATCH /video-pages/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("videos_pages");
    const res = await send(request, "PATCH", "/video-pages/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("videos_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[video-page.delete.video-pages-id#flag-desligada] DELETE /video-pages/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("videos_pages");
    const res = await send(request, "DELETE", "/video-pages/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("videos_pages")).toBe(before);
    await setFlags(request, true);
  });
});
