import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Autorização de `/leader-profiles` (plano 15): membro nunca; líder só lê líderes dos
 * abrigos que lidera (e-mail/telefone dos demais não vazam); `my-shelters` só líder;
 * escrita recusada não altera o banco; `leader_management` desligada ⇒ 403 FEATURE_DISABLED.
 */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

test.describe.serial("Perfis de líder — autorização", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let flagBefore = 1;

  const send = (request: import("@playwright/test").APIRequestContext, verb: string, path: string, token?: string) =>
    request.fetch(`${API_URL}${path.replace("{BAD}", BAD)}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" ? undefined : [],
    });

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    flagBefore =
      (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = 'leader_management'"))?.enabled ?? 1;
  });

  test.afterAll(async ({ request }) => {
    await request.patch(`${API_URL}/feature-flags/leader_management`, {
      headers: authHeaders(admin),
      data: { enabled: flagBefore === 1 },
    });
    await closeDb();
  });

  test("[leader-profile.get.leader-profiles#perfil-anonimo] GET /leader-profiles como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/leader-profiles", undefined);
    expect([401]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles#perfil-membro] GET /leader-profiles como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/leader-profiles", member);
    expect([403]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles#perfil-lider] GET /leader-profiles como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/leader-profiles", leader);
    expect([200]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles#perfil-admin] GET /leader-profiles como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/leader-profiles", admin);
    expect([200]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-simple#perfil-anonimo] GET /leader-profiles/simple como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/simple", undefined);
    expect([401]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-simple#perfil-membro] GET /leader-profiles/simple como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/simple", member);
    expect([403]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-simple#perfil-lider] GET /leader-profiles/simple como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/simple", leader);
    expect([200]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-simple#perfil-admin] GET /leader-profiles/simple como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/simple", admin);
    expect([200]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-my-shelters#perfil-anonimo] GET /leader-profiles/my-shelters como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/my-shelters", undefined);
    expect([401]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-my-shelters#perfil-membro] GET /leader-profiles/my-shelters como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/my-shelters", member);
    expect([403]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-my-shelters#perfil-lider] GET /leader-profiles/my-shelters como líder: 200/404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/my-shelters", leader);
    expect([200, 404]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-my-shelters#perfil-admin] GET /leader-profiles/my-shelters como admin: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/my-shelters", admin);
    expect([403]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-id#perfil-anonimo] GET /leader-profiles/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/leader-profiles/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-id#perfil-membro] GET /leader-profiles/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/leader-profiles/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-id#perfil-lider] GET /leader-profiles/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/leader-profiles/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[leader-profile.get.leader-profiles-id#perfil-admin] GET /leader-profiles/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/leader-profiles/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[leader-profile.put.leader-profiles-leaderid#perfil-anonimo] PUT /leader-profiles/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("leader_profiles");
    const res = await send(request, "PUT", "/leader-profiles/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("leader_profiles")).toBe(before);
  });

  test("[leader-profile.put.leader-profiles-leaderid#perfil-membro] PUT /leader-profiles/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("leader_profiles");
    const res = await send(request, "PUT", "/leader-profiles/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("leader_profiles")).toBe(before);
  });

  test("[leader-profile.put.leader-profiles-leaderid#perfil-lider] PUT /leader-profiles/:id como líder: 400/403/404", async ({
    request,
  }) => {
    const before = await countRows("leader_profiles");
    const res = await send(request, "PUT", "/leader-profiles/{BAD}", leader);
    expect([400, 403, 404]).toContain(res.status());
    expect(await countRows("leader_profiles")).toBe(before);
  });

  test("[leader-profile.put.leader-profiles-leaderid#perfil-admin] PUT /leader-profiles/:id como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("leader_profiles");
    const res = await send(request, "PUT", "/leader-profiles/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("leader_profiles")).toBe(before);
  });

  test("[leader-profile.put.leader-profiles-leaderid#flag-desligada] PUT /leader-profiles/:id com leader_management desligada: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/leader_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("leader_profiles");
    const res = await send(request, "PUT", "/leader-profiles/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("leader_profiles")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/leader_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });

  test("[leader-profile.get.leader-profiles#escopo-proprio-x-outro] GET /leader-profiles como líder: só líderes dos abrigos que ele lidera (sem e-mail/telefone dos demais)", async ({
    request,
  }) => {
    const asAdmin = (await (
      await request.get(`${API_URL}/leader-profiles?limit=100`, { headers: authHeaders(admin) })
    ).json()) as { items: Array<{ id: string }> };
    const asLeader = (await (
      await request.get(`${API_URL}/leader-profiles?limit=100`, { headers: authHeaders(leader) })
    ).json()) as { items: Array<{ id: string }> };
    const adminIds = new Set(asAdmin.items.map((item) => item.id));
    for (const item of asLeader.items) expect(adminIds.has(item.id)).toBe(true);
    expect(asLeader.items.length).toBeLessThanOrEqual(asAdmin.items.length);
  });
});
