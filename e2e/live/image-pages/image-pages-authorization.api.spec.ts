import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/image-pages` (plano 33): leitura aberta (galeria não pública só com sessão; id inexistente 404); escrita só admin (visitante 401, membro/líder 403); escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["page_management", "public_galleries", "shelter_feed"] as const;

test.describe.serial("Páginas de imagem — autorização", () => {
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

  test("[image-page.get.image-pages#perfil-anonimo] GET /image-pages como visitante: 200", async ({ request }) => {
    const res = await send(request, "GET", "/image-pages", undefined);
    expect([200]).toContain(res.status());
  });

  test("[image-page.get.image-pages#perfil-membro] GET /image-pages como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/image-pages", member);
    expect([200]).toContain(res.status());
  });

  test("[image-page.get.image-pages#perfil-lider] GET /image-pages como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/image-pages", leader);
    expect([200]).toContain(res.status());
  });

  test("[image-page.get.image-pages#perfil-admin] GET /image-pages como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/image-pages", admin);
    expect([200]).toContain(res.status());
  });

  test("[image-page.get.image-pages-id#perfil-anonimo] GET /image-pages/:id como visitante: 404", async ({ request }) => {
    const res = await send(request, "GET", "/image-pages/{BAD}", undefined);
    expect([404]).toContain(res.status());
  });

  test("[image-page.get.image-pages-id#perfil-membro] GET /image-pages/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/image-pages/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[image-page.get.image-pages-id#perfil-lider] GET /image-pages/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/image-pages/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[image-page.get.image-pages-id#perfil-admin] GET /image-pages/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/image-pages/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[image-page.get.image-pages-id-sections#perfil-anonimo] GET /image-pages/:id/sections como visitante: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/image-pages/{BAD}/sections", undefined);
    expect([404]).toContain(res.status());
  });

  test("[image-page.get.image-pages-id-sections#perfil-membro] GET /image-pages/:id/sections como membro: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/image-pages/{BAD}/sections", member);
    expect([404]).toContain(res.status());
  });

  test("[image-page.get.image-pages-id-sections#perfil-lider] GET /image-pages/:id/sections como líder: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/image-pages/{BAD}/sections", leader);
    expect([404]).toContain(res.status());
  });

  test("[image-page.get.image-pages-id-sections#perfil-admin] GET /image-pages/:id/sections como admin: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/image-pages/{BAD}/sections", admin);
    expect([404]).toContain(res.status());
  });

  test("[image-page.post.image-pages#perfil-anonimo] POST /image-pages como visitante: 401", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "POST", "/image-pages", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.post.image-pages#perfil-membro] POST /image-pages como membro: 403", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "POST", "/image-pages", member);
    expect([403]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.post.image-pages#perfil-lider] POST /image-pages como líder: 403", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "POST", "/image-pages", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.post.image-pages#perfil-admin] POST /image-pages como admin: 400", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "POST", "/image-pages", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.patch.image-pages-id#perfil-anonimo] PATCH /image-pages/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "PATCH", "/image-pages/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.patch.image-pages-id#perfil-membro] PATCH /image-pages/:id como membro: 403", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "PATCH", "/image-pages/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.patch.image-pages-id#perfil-lider] PATCH /image-pages/:id como líder: 403", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "PATCH", "/image-pages/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.patch.image-pages-id#perfil-admin] PATCH /image-pages/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "PATCH", "/image-pages/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.delete.image-pages-id#perfil-anonimo] DELETE /image-pages/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "DELETE", "/image-pages/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.delete.image-pages-id#perfil-membro] DELETE /image-pages/:id como membro: 403", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "DELETE", "/image-pages/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.delete.image-pages-id#perfil-lider] DELETE /image-pages/:id como líder: 403", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "DELETE", "/image-pages/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.delete.image-pages-id#perfil-admin] DELETE /image-pages/:id como admin: 404", async ({ request }) => {
    const before = await countRows("image_pages");
    const res = await send(request, "DELETE", "/image-pages/{BAD}", admin);
    expect(res.status()).toBe(404);
    expect(await countRows("image_pages")).toBe(before);
  });

  test("[image-page.get.image-pages#flag-desligada] GET /image-pages com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("image_pages");
    const res = await send(request, "GET", "/image-pages", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[image-page.post.image-pages#flag-desligada] POST /image-pages com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("image_pages");
    const res = await send(request, "POST", "/image-pages", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[image-page.patch.image-pages-id#flag-desligada] PATCH /image-pages/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("image_pages");
    const res = await send(request, "PATCH", "/image-pages/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[image-page.delete.image-pages-id#flag-desligada] DELETE /image-pages/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("image_pages");
    const res = await send(request, "DELETE", "/image-pages/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_pages")).toBe(before);
    await setFlags(request, true);
  });
});
