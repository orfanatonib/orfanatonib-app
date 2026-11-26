import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Autorização dos handlers de `/teams` (plano 14): membro nunca lê nem escreve (só
 * `my-teams`); líder só no próprio escopo; escrita recusada NÃO altera o banco;
 * `shelter_management` desligada ⇒ 403 FEATURE_DISABLED nas escritas.
 */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

test.describe.serial("Equipes — autorização", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let flagBefore = 1;

  const send = (request: import("@playwright/test").APIRequestContext, verb: string, path: string, token?: string) =>
    request.fetch(`${API_URL}${path.replace("{BAD}", BAD)}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" || verb === "DELETE" ? undefined : {},
    });

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
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

  test("[team.get.teams#perfil-anonimo] GET /teams como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/teams", undefined);
    expect([401]).toContain(res.status());
  });

  test("[team.get.teams#perfil-membro] GET /teams como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/teams", member);
    expect([403]).toContain(res.status());
  });

  test("[team.get.teams#perfil-lider] GET /teams como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/teams", leader);
    expect([200]).toContain(res.status());
  });

  test("[team.get.teams#perfil-admin] GET /teams como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/teams", admin);
    expect([200]).toContain(res.status());
  });

  test("[team.get.teams-my-teams#perfil-anonimo] GET /teams/my-teams como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/teams/my-teams", undefined);
    expect([401]).toContain(res.status());
  });

  test("[team.get.teams-my-teams#perfil-membro] GET /teams/my-teams como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/teams/my-teams", member);
    expect([200]).toContain(res.status());
  });

  test("[team.get.teams-my-teams#perfil-lider] GET /teams/my-teams como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/teams/my-teams", leader);
    expect([200]).toContain(res.status());
  });

  test("[team.get.teams-my-teams#perfil-admin] GET /teams/my-teams como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/teams/my-teams", admin);
    expect([200]).toContain(res.status());
  });

  test("[team.get.teams-by-shelter-shelterid#perfil-anonimo] GET /teams/by-shelter/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/teams/by-shelter/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[team.get.teams-by-shelter-shelterid#perfil-membro] GET /teams/by-shelter/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/teams/by-shelter/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[team.get.teams-by-shelter-shelterid#perfil-lider] GET /teams/by-shelter/:id como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/teams/by-shelter/{BAD}", leader);
    expect([403]).toContain(res.status());
  });

  test("[team.get.teams-by-shelter-shelterid#perfil-admin] GET /teams/by-shelter/:id como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/teams/by-shelter/{BAD}", admin);
    expect([200]).toContain(res.status());
  });

  test("[team.get.teams-id#perfil-anonimo] GET /teams/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/teams/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[team.get.teams-id#perfil-membro] GET /teams/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/teams/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[team.get.teams-id#perfil-lider] GET /teams/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/teams/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[team.get.teams-id#perfil-admin] GET /teams/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/teams/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[team.post.teams#perfil-anonimo] POST /teams como visitante: 401", async ({ request }) => {
    const before = await countRows("teams");
    const res = await send(request, "POST", "/teams", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("teams")).toBe(before);
  });

  test("[team.post.teams#perfil-membro] POST /teams como membro: 403", async ({ request }) => {
    const before = await countRows("teams");
    const res = await send(request, "POST", "/teams", member);
    expect([403]).toContain(res.status());
    expect(await countRows("teams")).toBe(before);
  });

  test("[team.post.teams#perfil-lider] POST /teams como líder: 400", async ({ request }) => {
    const res = await send(request, "POST", "/teams", leader);
    expect([400]).toContain(res.status());
  });

  test("[team.post.teams#perfil-admin] POST /teams como admin: 400", async ({ request }) => {
    const res = await send(request, "POST", "/teams", admin);
    expect([400]).toContain(res.status());
  });

  test("[team.put.teams-id#perfil-anonimo] PUT /teams/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("teams");
    const res = await send(request, "PUT", "/teams/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("teams")).toBe(before);
  });

  test("[team.put.teams-id#perfil-membro] PUT /teams/:id como membro: 403", async ({ request }) => {
    const before = await countRows("teams");
    const res = await send(request, "PUT", "/teams/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("teams")).toBe(before);
  });

  test("[team.put.teams-id#perfil-lider] PUT /teams/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "PUT", "/teams/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[team.put.teams-id#perfil-admin] PUT /teams/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "PUT", "/teams/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[team.delete.teams-id#perfil-anonimo] DELETE /teams/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("teams");
    const res = await send(request, "DELETE", "/teams/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("teams")).toBe(before);
  });

  test("[team.delete.teams-id#perfil-membro] DELETE /teams/:id como membro: 403", async ({ request }) => {
    const before = await countRows("teams");
    const res = await send(request, "DELETE", "/teams/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("teams")).toBe(before);
  });

  test("[team.delete.teams-id#perfil-lider] DELETE /teams/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "DELETE", "/teams/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[team.delete.teams-id#perfil-admin] DELETE /teams/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "DELETE", "/teams/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[team.post.teams#flag-desligada] POST /teams com shelter_management desligada: 403 FEATURE_DISABLED e nenhuma equipe muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("teams");
    const res = await send(request, "POST", "/teams", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("teams")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });

  test("[team.put.teams-id#flag-desligada] PUT /teams/:id com shelter_management desligada: 403 FEATURE_DISABLED e nenhuma equipe muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("teams");
    const res = await send(request, "PUT", "/teams/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("teams")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });

  test("[team.delete.teams-id#flag-desligada] DELETE /teams/:id com shelter_management desligada: 403 FEATURE_DISABLED e nenhuma equipe muda", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("teams");
    const res = await send(request, "DELETE", "/teams/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("teams")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { enabled: true } });
  });
});
