import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Autorização dos handlers de `/shelters` (plano 13): cada perfil recebe o status do
 * seu direito; escrita recusada NÃO altera o banco; flag `shelter_management`
 * desligada ⇒ 403 FEATURE_DISABLED nas escritas, também sem alterar o banco.
 */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

test.describe.serial("Abrigos — autorização", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let shelterId = "";
  let flagBefore = 1;

  const send = (request: import("@playwright/test").APIRequestContext, verb: string, path: string, token?: string) =>
    request.fetch(`${API_URL}${path.replace("{ID}", shelterId).replace("{BAD}", BAD)}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" || verb === "DELETE" ? undefined : {},
    });

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    const row = await queryOne<{ id: string }>("SELECT id FROM shelters LIMIT 1");
    shelterId = row?.id ?? BAD;
    flagBefore =
      (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = 'shelter_management'"))?.enabled ?? 1;
  });

  test.afterAll(async ({ request }) => {
    await request.patch(`${API_URL}/feature-flags/shelter_management`, {
      headers: authHeaders(admin),
      data: { enabled: flagBefore === 1 },
    });
    await closeDb();
  });

  test("[shelter.get.shelters#perfil-anonimo] GET /shelters como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/shelters", undefined);
    expect([401]).toContain(res.status());
  });

  test("[shelter.get.shelters#perfil-membro] GET /shelters como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/shelters", member);
    expect([403]).toContain(res.status());
  });

  test("[shelter.get.shelters#perfil-lider] GET /shelters como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters", leader);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters#perfil-admin] GET /shelters como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters", admin);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-simple#perfil-anonimo] GET /shelters/simple como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/simple", undefined);
    expect([401]).toContain(res.status());
  });

  test("[shelter.get.shelters-simple#perfil-membro] GET /shelters/simple como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/simple", member);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-simple#perfil-lider] GET /shelters/simple como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/simple", leader);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-simple#perfil-admin] GET /shelters/simple como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/simple", admin);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-list#perfil-anonimo] GET /shelters/list como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/list", undefined);
    expect([401]).toContain(res.status());
  });

  test("[shelter.get.shelters-list#perfil-membro] GET /shelters/list como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/list", member);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-list#perfil-lider] GET /shelters/list como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/list", leader);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-list#perfil-admin] GET /shelters/list como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/list", admin);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-list-teams#perfil-anonimo] GET /shelters/list-teams como visitante: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/list-teams", undefined);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-list-teams#perfil-membro] GET /shelters/list-teams como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/list-teams", member);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-list-teams#perfil-lider] GET /shelters/list-teams como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/list-teams", leader);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-list-teams#perfil-admin] GET /shelters/list-teams como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/list-teams", admin);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-id#perfil-anonimo] GET /shelters/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/{ID}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[shelter.get.shelters-id#perfil-membro] GET /shelters/:id como membro: 200/403/404", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/{ID}", member);
    expect([200, 403, 404]).toContain(res.status());
  });

  test("[shelter.get.shelters-id#perfil-lider] GET /shelters/:id como líder: 200/404", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/{ID}", leader);
    expect([200, 404]).toContain(res.status());
  });

  test("[shelter.get.shelters-id#perfil-admin] GET /shelters/:id como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelters/{ID}", admin);
    expect([200]).toContain(res.status());
  });

  test("[shelter.get.shelters-id-teams-quantity#perfil-anonimo] GET /shelters/:id/teams-quantity como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/shelters/{ID}/teams-quantity", undefined);
    expect([401]).toContain(res.status());
  });

  test("[shelter.get.shelters-id-teams-quantity#perfil-membro] GET /shelters/:id/teams-quantity como membro: 200/403/404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/shelters/{ID}/teams-quantity", member);
    expect([200, 403, 404]).toContain(res.status());
  });

  test("[shelter.get.shelters-id-teams-quantity#perfil-lider] GET /shelters/:id/teams-quantity como líder: 200/404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/shelters/{ID}/teams-quantity", leader);
    expect([200, 404]).toContain(res.status());
  });

  test("[shelter.get.shelters-id-teams-quantity#perfil-admin] GET /shelters/:id/teams-quantity como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/shelters/{ID}/teams-quantity", admin);
    expect([200]).toContain(res.status());
  });

  test("[shelter.post.shelters#perfil-anonimo] POST /shelters como visitante: 401", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "POST", "/shelters", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.post.shelters#perfil-membro] POST /shelters como membro: 403", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "POST", "/shelters", member);
    expect([403]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.post.shelters#perfil-lider] POST /shelters como líder: 400/403", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "POST", "/shelters", leader);
    expect([400, 403]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.post.shelters#perfil-admin] POST /shelters como admin: 400", async ({ request }) => {
    const res = await send(request, "POST", "/shelters", admin);
    expect([400]).toContain(res.status());
  });

  test("[shelter.put.shelters-id#perfil-anonimo] PUT /shelters/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "PUT", "/shelters/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.put.shelters-id#perfil-membro] PUT /shelters/:id como membro: 403", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "PUT", "/shelters/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.put.shelters-id#perfil-lider] PUT /shelters/:id como líder: 400/403/404", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "PUT", "/shelters/{BAD}", leader);
    expect([400, 403, 404]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.put.shelters-id#perfil-admin] PUT /shelters/:id como admin: 400/404", async ({ request }) => {
    const res = await send(request, "PUT", "/shelters/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
  });

  test("[shelter.patch.shelters-id-media#perfil-anonimo] PATCH /shelters/:id/media como visitante: 401", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "PATCH", "/shelters/{BAD}/media", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.patch.shelters-id-media#perfil-membro] PATCH /shelters/:id/media como membro: 403", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "PATCH", "/shelters/{BAD}/media", member);
    expect([403]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.patch.shelters-id-media#perfil-lider] PATCH /shelters/:id/media como líder: 403/404/400", async ({
    request,
  }) => {
    const before = await countRows("shelters");
    const res = await send(request, "PATCH", "/shelters/{BAD}/media", leader);
    expect([403, 404, 400]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.patch.shelters-id-media#perfil-admin] PATCH /shelters/:id/media como admin: 404/400", async ({ request }) => {
    const res = await send(request, "PATCH", "/shelters/{BAD}/media", admin);
    expect([404, 400]).toContain(res.status());
  });

  test("[shelter.delete.shelters-id#perfil-anonimo] DELETE /shelters/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "DELETE", "/shelters/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.delete.shelters-id#perfil-membro] DELETE /shelters/:id como membro: 403", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "DELETE", "/shelters/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.delete.shelters-id#perfil-lider] DELETE /shelters/:id como líder: 403/404", async ({ request }) => {
    const before = await countRows("shelters");
    const res = await send(request, "DELETE", "/shelters/{BAD}", leader);
    expect([403, 404]).toContain(res.status());
    expect(await countRows("shelters")).toBe(before);
  });

  test("[shelter.delete.shelters-id#perfil-admin] DELETE /shelters/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "DELETE", "/shelters/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[shelter.post.shelters#flag-desligada] POST /shelters com shelter_management desligada: 403 FEATURE_DISABLED e nenhum abrigo muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("shelters");
    const res = await send(request, "POST", "/shelters", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("shelters")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });

  test("[shelter.put.shelters-id#flag-desligada] PUT /shelters/:id com shelter_management desligada: 403 FEATURE_DISABLED e nenhum abrigo muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("shelters");
    const res = await send(request, "PUT", "/shelters/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("shelters")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });

  test("[shelter.patch.shelters-id-media#flag-desligada] PATCH /shelters/:id/media com shelter_management desligada: 403 FEATURE_DISABLED e nenhum abrigo muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("shelters");
    const res = await send(request, "PATCH", "/shelters/{BAD}/media", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("shelters")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });

  test("[shelter.delete.shelters-id#flag-desligada] DELETE /shelters/:id com shelter_management desligada: 403 FEATURE_DISABLED e nenhum abrigo muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("shelters");
    const res = await send(request, "DELETE", "/shelters/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("shelters")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });
});
