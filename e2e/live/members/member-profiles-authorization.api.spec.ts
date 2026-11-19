import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Autorização de `/member-profiles` (plano 16): membro nunca; líder lê só os membros
 * dos abrigos que lidera; escrita recusada não altera o banco; `member_management`
 * desligada ⇒ 403 FEATURE_DISABLED.
 */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

test.describe.serial("Perfis de membro — autorização", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let flagBefore = 1;

  const send = (request: import("@playwright/test").APIRequestContext, verb: string, path: string, token?: string) =>
    request.fetch(`${API_URL}${path.replace("{BAD}", BAD)}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" ? undefined : {},
    });

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    flagBefore =
      (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = 'member_management'"))?.enabled ?? 1;
  });

  test.afterAll(async ({ request }) => {
    await request.patch(`${API_URL}/feature-flags/member_management`, {
      headers: authHeaders(admin),
      data: { enabled: flagBefore === 1 },
    });
    await closeDb();
  });

  test("[member-profile.get.member-profiles#perfil-anonimo] GET /member-profiles como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/member-profiles", undefined);
    expect([401]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles#perfil-membro] GET /member-profiles como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/member-profiles", member);
    expect([403]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles#perfil-lider] GET /member-profiles como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/member-profiles", leader);
    expect([200]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles#perfil-admin] GET /member-profiles como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/member-profiles", admin);
    expect([200]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles-simple#perfil-anonimo] GET /member-profiles/simple como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/member-profiles/simple", undefined);
    expect([401]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles-simple#perfil-membro] GET /member-profiles/simple como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/member-profiles/simple", member);
    expect([403]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles-simple#perfil-lider] GET /member-profiles/simple como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/member-profiles/simple", leader);
    expect([200]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles-simple#perfil-admin] GET /member-profiles/simple como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/member-profiles/simple", admin);
    expect([200]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles-id#perfil-anonimo] GET /member-profiles/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/member-profiles/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles-id#perfil-membro] GET /member-profiles/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/member-profiles/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles-id#perfil-lider] GET /member-profiles/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/member-profiles/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[member-profile.get.member-profiles-id#perfil-admin] GET /member-profiles/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/member-profiles/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[member-profile.put.member-profiles-memberid#perfil-anonimo] PUT /member-profiles/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("member_profiles");
    const res = await send(request, "PUT", "/member-profiles/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("member_profiles")).toBe(before);
  });

  test("[member-profile.put.member-profiles-memberid#perfil-membro] PUT /member-profiles/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("member_profiles");
    const res = await send(request, "PUT", "/member-profiles/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("member_profiles")).toBe(before);
  });

  test("[member-profile.put.member-profiles-memberid#perfil-lider] PUT /member-profiles/:id como líder: 400/403/404", async ({
    request,
  }) => {
    const before = await countRows("member_profiles");
    const res = await send(request, "PUT", "/member-profiles/{BAD}", leader);
    expect([400, 403, 404]).toContain(res.status());
    expect(await countRows("member_profiles")).toBe(before);
  });

  test("[member-profile.put.member-profiles-memberid#perfil-admin] PUT /member-profiles/:id como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("member_profiles");
    const res = await send(request, "PUT", "/member-profiles/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("member_profiles")).toBe(before);
  });

  test("[member-profile.put.member-profiles-memberid#flag-desligada] PUT /member-profiles/:id com member_management desligada: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/member_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("member_profiles");
    const res = await send(request, "PUT", "/member-profiles/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("member_profiles")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/member_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });

  test("[member-profile.get.member-profiles#escopo-proprio-x-outro] GET /member-profiles como líder: só membros dos abrigos que ele lidera (subconjunto da leitura do admin)", async ({
    request,
  }) => {
    const asAdmin = (await (
      await request.get(`${API_URL}/member-profiles?limit=100`, { headers: authHeaders(admin) })
    ).json()) as { items: Array<{ id: string }> };
    const asLeader = (await (
      await request.get(`${API_URL}/member-profiles?limit=100`, { headers: authHeaders(leader) })
    ).json()) as { items: Array<{ id: string }> };
    const adminIds = new Set(asAdmin.items.map((item) => item.id));
    for (const item of asLeader.items) expect(adminIds.has(item.id)).toBe(true);
  });
});
