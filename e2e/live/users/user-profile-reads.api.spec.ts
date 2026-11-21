import { queryOne } from "../support/db";
import { expect, test } from "../support/live";
import {
  expectFlagBlocks,
  expectFlagDoesNotBlock,
  expectNotFoundUnchanged,
  expectOwnProfile,
  expectReadStatus,
  personalRows,
  preferenceRows,
  send,
  userState,
  allUsersCount,
  FULL_PROFILE,
  BAD_ID,
  setupWorld,
  teardownWorld,
  world,
  type FlagGuard,
  type Cast,
} from "./support";

/**
 * Usuários e perfis — leituras (GET) — plano 07, matriz `user-profile` (cada título começa com o ID da matriz).
 * Contas descartáveis (admin/líder/membro/outro membro) criadas pela API; cada efeito é provado por SELECT,
 * negativos provam banco e bucket inalterados e as flags são restauradas no fim.
 */
test.describe.serial("Usuários e perfis — leituras (GET)", () => {
  let cast: Cast;
  let flags: FlagGuard;

  test.beforeAll(async ({ request }) => {
    await setupWorld(request);
    ({ cast, flags } = world);
  });

  test.afterAll(async ({ request }) => {
    await teardownWorld(request);
  });

  test("[user-profile.get.profile#perfil-anonimo] GET /profile como visitante: 401", async ({ request }) => {
    await expectReadStatus(request, "/profile", "anon", 401);
  });

  test("[user-profile.get.profile#perfil-membro] GET /profile como membro: 200", async ({ request }) => {
    await expectReadStatus(request, "/profile", "member", 200);
    await expectOwnProfile(request, "/profile", "member");
  });

  test("[user-profile.get.profile#perfil-lider] GET /profile como líder: 200", async ({ request }) => {
    await expectReadStatus(request, "/profile", "leader", 200);
    await expectOwnProfile(request, "/profile", "leader");
  });

  test("[user-profile.get.profile#perfil-admin] GET /profile como admin: 200", async ({ request }) => {
    await expectReadStatus(request, "/profile", "admin", 200);
    await expectOwnProfile(request, "/profile", "admin");
  });

  test("[user-profile.get.profiles-me#perfil-anonimo] GET /profiles/me como visitante: 401", async ({ request }) => {
    await expectReadStatus(request, "/profiles/me", "anon", 401);
  });

  test("[user-profile.get.profiles-me#perfil-membro] GET /profiles/me como membro: 200", async ({ request }) => {
    await expectReadStatus(request, "/profiles/me", "member", 200);
    await expectOwnProfile(request, "/profiles/me", "member");
  });

  test("[user-profile.get.profiles-me#perfil-lider] GET /profiles/me como líder: 200", async ({ request }) => {
    await expectReadStatus(request, "/profiles/me", "leader", 200);
    await expectOwnProfile(request, "/profiles/me", "leader");
  });

  test("[user-profile.get.profiles-me#perfil-admin] GET /profiles/me como admin: 200", async ({ request }) => {
    await expectReadStatus(request, "/profiles/me", "admin", 200);
    await expectOwnProfile(request, "/profiles/me", "admin");
  });

  test("[user-profile.get.profiles#perfil-anonimo] GET /profiles como visitante: 401", async ({ request }) => {
    await expectReadStatus(request, "/profiles", "anon", 401);
  });

  test("[user-profile.get.profiles#perfil-lider] GET /profiles como líder: 200", async ({ request }) => {
    await expectReadStatus(request, "/profiles", "leader", 200);
  });

  test("[user-profile.get.profiles#perfil-admin] GET /profiles como admin: 200", async ({ request }) => {
    await expectReadStatus(request, "/profiles", "admin", 200);
  });

  test("[user-profile.get.profiles-id#perfil-anonimo] GET /profiles/:id como visitante: 401", async ({ request }) => {
    await expectReadStatus(request, `/profiles/${cast.victim.id}`, "anon", 401);
  });

  test("[user-profile.get.profiles-id#perfil-lider] GET /profiles/:id como líder: 403", async ({ request }) => {
    await expectReadStatus(request, `/profiles/${cast.victim.id}`, "leader", 403);
  });

  test("[user-profile.get.profiles-id#perfil-admin] GET /profiles/:id como admin: 200", async ({ request }) => {
    await expectReadStatus(request, `/profiles/${cast.victim.id}`, "admin", 200);
  });

  test("[user-profile.get.users-simple#perfil-anonimo] GET /users/simple como visitante: 401", async ({ request }) => {
    await expectReadStatus(request, "/users/simple", "anon", 401);
  });

  test("[user-profile.get.users-simple#perfil-membro] GET /users/simple como membro: 403", async ({ request }) => {
    await expectReadStatus(request, "/users/simple", "member", 403);
  });

  test("[user-profile.get.users-simple#perfil-lider] GET /users/simple como líder: 403", async ({ request }) => {
    await expectReadStatus(request, "/users/simple", "leader", 403);
  });

  test("[user-profile.get.users-simple#perfil-admin] GET /users/simple como admin: 200", async ({ request }) => {
    await expectReadStatus(request, "/users/simple", "admin", 200);
  });

  test("[user-profile.get.users-simple-for-select#perfil-anonimo] GET /users/simple-for-select como visitante: 401", async ({ request }) => {
    await expectReadStatus(request, "/users/simple-for-select", "anon", 401);
  });

  test("[user-profile.get.users-simple-for-select#perfil-lider] GET /users/simple-for-select como líder: 200", async ({ request }) => {
    await expectReadStatus(request, "/users/simple-for-select", "leader", 200);
  });

  test("[user-profile.get.users-simple-for-select#perfil-admin] GET /users/simple-for-select como admin: 200", async ({ request }) => {
    await expectReadStatus(request, "/users/simple-for-select", "admin", 200);
  });

  test("[user-profile.get.users-id#perfil-anonimo] GET /users/:id como visitante: 401", async ({ request }) => {
    await expectReadStatus(request, `/users/${cast.victim.id}`, "anon", 401);
  });

  test("[user-profile.get.users-id#perfil-lider] GET /users/:id como líder: 403", async ({ request }) => {
    await expectReadStatus(request, `/users/${cast.victim.id}`, "leader", 403);
  });

  test("[user-profile.get.users-id-profile#perfil-anonimo] GET /users/:id/profile como visitante: 401", async ({ request }) => {
    await expectReadStatus(request, `/users/${cast.victim.id}/profile`, "anon", 401);
  });

  test("[user-profile.get.users-id-profile#perfil-membro] GET /users/:id/profile como membro: 403", async ({ request }) => {
    await expectReadStatus(request, `/users/${cast.victim.id}/profile`, "member", 403);
  });

  test("[user-profile.get.users-id-profile#perfil-lider] GET /users/:id/profile como líder: 403", async ({ request }) => {
    await expectReadStatus(request, `/users/${cast.victim.id}/profile`, "leader", 403);
  });

  test("[user-profile.get.users-id-profile#perfil-admin] GET /users/:id/profile como admin: 200", async ({ request }) => {
    await expectReadStatus(request, `/users/${cast.victim.id}/profile`, "admin", 200);
  });

  test("[user-profile.get.profile#feliz] GET /profile: o membro lê o PRÓPRIO usuário e o JSON bate com o SELECT, sem senha nem refresh token", async ({ request }) => {
    const res = await send(request, "GET", "/profile", cast.member.token);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const row = await userState(cast.member.id);
    expect(body).toMatchObject({ id: cast.member.id, email: row?.email, name: row?.name });
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("refreshToken");
  });

  test("[user-profile.get.profiles#feliz] GET /profiles: o admin lista, a paginação bate com o SELECT e nenhum item traz segredo", async ({ request }) => {
    const res = await send(request, "GET", "/profiles?limit=5&page=1", cast.admin.token);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: Array<Record<string, unknown>>; meta: { totalItems: number } };
    expect(body.items.length).toBeLessThanOrEqual(5);
    expect(body.meta.totalItems).toBeGreaterThanOrEqual(4);
    for (const item of body.items) { expect(item).not.toHaveProperty("password"); expect(item).not.toHaveProperty("refreshToken"); }
    const found = await send(request, "GET", `/profiles?q=${encodeURIComponent(cast.victim.email)}`, cast.admin.token);
    const hit = (await found.json()) as { items: Array<{ id: string }> };
    expect(hit.items.map((i) => i.id)).toEqual([cast.victim.id]);
  });

  test("[user-profile.get.profiles-id#feliz] GET /profiles/:id: o admin lê o perfil completo de outro usuário (dados gravados no banco)", async ({ request }) => {
    const put = await send(request, "PUT", `/profiles/${cast.victim.id}`, cast.admin.token, FULL_PROFILE);
    expect(put.status(), await put.text()).toBe(200);
    const res = await send(request, "GET", `/profiles/${cast.victim.id}`, cast.admin.token);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { id: string; personalData?: { gender?: string }; preferences?: { favoriteColor?: string } };
    expect(body.id).toBe(cast.victim.id);
    expect(body.personalData?.gender).toBe((await personalRows(cast.victim.id))[0].gender);
    expect(body.preferences?.favoriteColor).toBe((await preferenceRows(cast.victim.id))[0].favoriteColor);
  });

  test("[user-profile.get.users#feliz] GET /users: o admin pagina e o total bate com o SELECT", async ({ request }) => {
    const res = await send(request, "GET", "/users?page=1&limit=3", cast.admin.token);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: unknown[]; meta: { total: number } };
    expect(body.items.length).toBeLessThanOrEqual(3);
    const listable = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE LOWER(role) <> 'admin'");
    expect(body.meta.total).toBe(Number(listable?.n));
    const all = (await (await send(request, "GET", "/users?limit=100", cast.admin.token)).json()) as { items: Array<{ role: string }> };
    expect(all.items.every((u) => u.role !== "admin")).toBe(true);
  });

  test("[user-profile.get.users-simple#feliz] GET /users/simple: o admin recebe só id, nome e e-mail", async ({ request }) => {
    const res = await send(request, "GET", "/users/simple", cast.admin.token);
    expect(res.status()).toBe(200);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    expect(rows.length).toBe(await allUsersCount());
    for (const row of rows) expect(Object.keys(row).sort()).toEqual(["email", "id", "name"]);
  });

  test("[user-profile.get.users-simple-for-select#feliz] GET /users/simple-for-select: o líder recebe só id, nome e e-mail, na mesma contagem do banco", async ({ request }) => {
    const res = await send(request, "GET", "/users/simple-for-select", cast.leader.token);
    expect(res.status()).toBe(200);
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    expect(rows.length).toBe(await allUsersCount());
    for (const row of rows) expect(Object.keys(row).sort()).toEqual(["email", "id", "name"]);
  });

  test("[user-profile.get.users-id#feliz] GET /users/:id: o admin lê o usuário e o JSON bate com o SELECT (sem segredos)", async ({ request }) => {
    const res = await send(request, "GET", `/users/${cast.victim.id}`, cast.admin.token);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const row = await userState(cast.victim.id);
    expect(body).toMatchObject({ id: row?.id, email: row?.email, role: row?.role });
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("refreshToken");
  });

  test("[user-profile.get.users-id-profile#feliz] GET /users/:id/profile: o admin lê o usuário com os vínculos do perfil", async ({ request }) => {
    const res = await send(request, "GET", `/users/${cast.victim.id}/profile`, cast.admin.token);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ id: cast.victim.id, role: "member" });
    expect(body).not.toHaveProperty("password");
  });

  test("[user-profile.get.profiles-id#nao-encontrado] GET /profiles/:id de usuário inexistente: 404 e o banco não muda", async ({ request }) => {
    await expectNotFoundUnchanged(request, "GET", `/profiles/${BAD_ID}`);
  });

  test("[user-profile.get.users-id#nao-encontrado] GET /users/:id de usuário inexistente: 404 e o banco não muda", async ({ request }) => {
    await expectNotFoundUnchanged(request, "GET", `/users/${BAD_ID}`);
  });

  test("[user-profile.get.users-id-profile#nao-encontrado] GET /users/:id/profile de usuário inexistente: 404 e o banco não muda", async ({ request }) => {
    await expectNotFoundUnchanged(request, "GET", `/users/${BAD_ID}/profile`);
  });

  test("[user-profile.get.profile#escopo-proprio-x-outro] GET /profile devolve SEMPRE o dono do token: cada perfil vê o próprio e nunca o de outro", async ({ request }) => {
    for (const actor of [cast.member, cast.leader, cast.victim]) {
      const res = await send(request, "GET", "/profile", actor.token);
      expect(((await res.json()) as { id: string }).id).toBe(actor.id);
    }
  });

  test("[user-profile.get.profiles-me#escopo-proprio-x-outro] GET /profiles/me devolve SEMPRE o dono do token (não existe parâmetro para ler outro)", async ({ request }) => {
    for (const actor of [cast.member, cast.leader, cast.victim]) {
      const res = await send(request, "GET", "/profiles/me", actor.token);
      expect(((await res.json()) as { id: string }).id).toBe(actor.id);
    }
    const other = await send(request, "GET", `/profiles/me?userId=${cast.victim.id}`, cast.member.token);
    expect([200, 400]).toContain(other.status());
    if (other.status() === 200) expect(((await other.json()) as { id: string }).id).toBe(cast.member.id);
  });

  test("[user-profile.get.profiles#escopo-proprio-x-outro] GET /profiles como líder SEM equipe vinculada: não enxerga membros de outros abrigos (a lista não traz o membro alheio)", async ({ request }) => {
    const res = await send(request, "GET", `/profiles?q=${encodeURIComponent(cast.victim.email)}`, cast.leader.token);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: Array<{ id: string }> };
    expect(body.items.map((i) => i.id)).not.toContain(cast.victim.id);
    const admin = await send(request, "GET", `/profiles?q=${encodeURIComponent(cast.victim.email)}`, cast.admin.token);
    expect(((await admin.json()) as { items: Array<{ id: string }> }).items.map((i) => i.id)).toContain(cast.victim.id);
  });

  test("[user-profile.get.profiles#flag-desligada] GET /profiles com a flag user_management e leader_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management", "leader_management"], "GET", "/profiles", "admin");
  });

  test("[user-profile.get.profiles-id#flag-desligada] GET /profiles/:id com a flag user_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "GET", `/profiles/${cast.victim.id}`, "admin");
  });

  test("[user-profile.get.users#flag-desligada] GET /users com a flag user_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "GET", "/users", "admin");
  });

  test("[user-profile.get.users-simple#flag-desligada] GET /users/simple com a flag user_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "GET", "/users/simple", "admin");
  });

  test("[user-profile.get.users-id#flag-desligada] GET /users/:id com a flag user_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "GET", `/users/${cast.victim.id}`, "admin");
  });

  test("[user-profile.get.users-id-profile#flag-desligada] GET /users/:id/profile com a flag user_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "GET", `/users/${cast.victim.id}/profile`, "admin");
  });

  test("[user-profile.get.profile#flag-desligada] GET /profile não depende de flag: com user_management, member_area e leader_management desligadas segue 200 (só o guard de papel decide)", async ({ request }) => {
    await expectFlagDoesNotBlock(flags, request, "GET", "/profile", "member");
  });

  test("[user-profile.get.profiles-me#flag-desligada] GET /profiles/me não depende de flag: com user_management, member_area e leader_management desligadas segue 200 (só o guard de papel decide)", async ({ request }) => {
    await expectFlagDoesNotBlock(flags, request, "GET", "/profiles/me", "member");
  });

  test("[user-profile.get.users-simple-for-select#flag-desligada] GET /users/simple-for-select não depende de flag: com user_management, member_area e leader_management desligadas segue 200 (só o guard de papel decide)", async ({ request }) => {
    await expectFlagDoesNotBlock(flags, request, "GET", "/users/simple-for-select", "leader");
  });
});
