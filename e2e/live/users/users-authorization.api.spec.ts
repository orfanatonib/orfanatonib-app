import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Autorização de `/users`, `/profiles` e `/profile` (plano 07), com prova no banco:
 * quem não pode recebe 401/403 **e nada muda**; o admin lê usuário SEM hash de senha
 * nem refresh token (regressão do vazamento corrigido).
 */
test.describe.serial("Usuários e perfis — autorização", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let memberId: string;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    const m = await loginAs(request, "member");
    member = m.accessToken;
    memberId = (await queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", ["e2e.member@orfanatonib.test"]))!.id;
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("[user-profile.get.users#perfil-anonimo] GET /users sem sessão: 401", async ({ request }) => {
    expect((await request.get(`${API_URL}/users`)).status()).toBe(401);
  });

  test("[user-profile.get.users#perfil-membro] GET /users como membro: 403", async ({ request }) => {
    expect((await request.get(`${API_URL}/users`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[user-profile.get.users#perfil-lider] GET /users como líder: 403", async ({ request }) => {
    expect((await request.get(`${API_URL}/users`, { headers: authHeaders(leader) })).status()).toBe(403);
  });

  test("[user-profile.get.users#perfil-admin] GET /users como admin: 200 e nenhum item com senha ou refresh token", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/users`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    const raw = JSON.stringify(await res.json());
    expect(raw).not.toContain("$2b$");
    expect(raw).not.toContain('"refreshToken"');
    expect(raw).not.toContain('"password"');
  });

  test("[user-profile.get.users-id#perfil-admin] GET /users/:id como admin: 200 SEM password nem refreshToken", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/users/${memberId}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.email).toBe("e2e.member@orfanatonib.test");
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("refreshToken");
  });

  test("[user-profile.get.users-id#perfil-membro] GET /users/:id como membro: 403", async ({ request }) => {
    expect((await request.get(`${API_URL}/users/${memberId}`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[user-profile.put.users-id#perfil-membro] PUT /users/:id como membro: 403 e o papel no banco não muda (sem auto-promoção)", async ({
    request,
  }) => {
    const res = await request.put(`${API_URL}/users/${memberId}`, { headers: authHeaders(member), data: { role: "admin" } });
    expect(res.status()).toBe(403);
    const row = await queryOne<{ role: string }>("SELECT role FROM users WHERE id = ?", [memberId]);
    expect(row?.role).toBe("member");
  });

  test("[user-profile.post.users#perfil-membro] POST /users como membro: 403 e nenhum usuário criado", async ({ request }) => {
    const before = await countRows("users");
    const res = await request.post(`${API_URL}/users`, {
      headers: authHeaders(member),
      data: {
        email: `nao.cria.${Date.now()}@orfanatonib.test`,
        password: "Aa1!aaaaaa",
        name: "X",
        phone: "11999999999",
        role: "admin",
      },
    });
    expect(res.status()).toBe(403);
    expect(await countRows("users")).toBe(before);
  });

  test("[user-profile.delete.users-id#perfil-membro] DELETE /users/:id como membro: 403 e o usuário continua", async ({
    request,
  }) => {
    const res = await request.delete(`${API_URL}/users/${memberId}`, { headers: authHeaders(member) });
    expect(res.status()).toBe(403);
    expect(await countRows("users", { id: memberId })).toBe(1);
  });

  test("[user-profile.get.users-simple-for-select#perfil-membro] membro não lista usuários para seleção (403); líder e admin sim", async ({
    request,
  }) => {
    expect((await request.get(`${API_URL}/users/simple-for-select`, { headers: authHeaders(member) })).status()).toBe(403);
    for (const token of [leader, admin]) {
      const res = await request.get(`${API_URL}/users/simple-for-select`, { headers: authHeaders(token) });
      expect(res.status()).toBe(200);
      const rows = (await res.json()) as Array<Record<string, unknown>>;
      for (const row of rows) expect(Object.keys(row).sort()).toEqual(["email", "id", "name"]);
    }
  });

  test("[user-profile.get.profiles#perfil-membro] GET /profiles (listagem) como membro: 403; líder e admin: 200", async ({
    request,
  }) => {
    expect((await request.get(`${API_URL}/profiles`, { headers: authHeaders(member) })).status()).toBe(403);
    expect((await request.get(`${API_URL}/profiles`, { headers: authHeaders(leader) })).status()).toBe(200);
    expect((await request.get(`${API_URL}/profiles`, { headers: authHeaders(admin) })).status()).toBe(200);
  });

  test("[user-profile.get.profiles-me#feliz] GET /profiles/me: cada perfil lê o PRÓPRIO, sem segredos", async ({ request }) => {
    for (const [token, email] of [
      [admin, "e2e.admin@orfanatonib.test"],
      [leader, "e2e.leader@orfanatonib.test"],
      [member, "e2e.member@orfanatonib.test"],
    ] as const) {
      const res = await request.get(`${API_URL}/profiles/me`, { headers: authHeaders(token) });
      expect(res.status()).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.email).toBe(email);
      expect(body).not.toHaveProperty("password");
      expect(body).not.toHaveProperty("refreshToken");
    }
  });

  test("[user-profile.get.profiles-id#perfil-membro] GET /profiles/:id de outro usuário como membro: 403", async ({
    request,
  }) => {
    const adminId = (await queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", ["e2e.admin@orfanatonib.test"]))!.id;
    expect((await request.get(`${API_URL}/profiles/${adminId}`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[user-profile.put.profiles-me#validacao] PUT /profiles/me com campo fora do contrato: 400 e nada gravado", async ({
    request,
  }) => {
    const res = await request.put(`${API_URL}/profiles/me`, {
      headers: authHeaders(member),
      data: { personalData: { gender: "F" }, role: "admin" },
    });
    expect(res.status()).toBe(400);
    const row = await queryOne<{ role: string }>("SELECT role FROM users WHERE id = ?", [memberId]);
    expect(row?.role).toBe("member");
  });
});
