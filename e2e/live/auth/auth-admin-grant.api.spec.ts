import { API_URL } from "../../../playwright.live.config";
import { countRows, queryOne } from "../support/db";
import { authHeaders, expect, test } from "../support/live";
import { adminSession, createAccount, loginAccount, removeAccounts, uniqueEmail, type Account } from "./support";

/**
 * Ninguém vira admin pela API (plano 06, item 1): cadastro, `POST /users` e `PUT /users/:id` recusam
 * o papel `admin`, mesmo vindo de um admin autenticado; só o UPDATE direto no banco promove.
 * Cada negativo prova por SELECT que nada mudou.
 */
const roleOf = async (id: string): Promise<string | null> =>
  (await queryOne<{ role: string }>("SELECT role FROM users WHERE id = ?", [id]))?.role ?? null;

test.describe.serial("Auth — a API nunca concede admin", () => {
  let adminToken: string;
  let member: Account;
  let otherAdmin: Account;
  const created: string[] = [];

  test.beforeAll(async ({ request }) => {
    adminToken = (await adminSession(request)).accessToken;
    member = await createAccount(request, adminToken, "member");
    otherAdmin = await createAccount(request, adminToken, "admin");
    created.push(member.id, otherAdmin.id);
  });

  test.beforeEach(async ({ request }) => {
    adminToken = (await adminSession(request)).accessToken;
  });

  test.afterAll(async ({ request }) => {
    await removeAccounts(request, (await adminSession(request)).accessToken, created);
  });

  test("[auth.put.users-id#role-admin-recusado] PUT /users/:id com role admin por um admin: 400 e o papel no banco não muda", async ({ request }) => {
    const res = await request.put(`${API_URL}/users/${member.id}`, { headers: authHeaders(adminToken), data: { role: "admin" } });
    expect(res.status(), await res.text()).toBe(400);
    expect(await roleOf(member.id)).toBe("member");
  });

  test("[auth.put.users-id#role-admin-recusado] PUT /users/:id com role admin por um membro (auto-promoção): 403 e o papel no banco não muda", async ({ request }) => {
    const session = await loginAccount(request, member);
    const res = await request.put(`${API_URL}/users/${member.id}`, { headers: authHeaders(session.accessToken), data: { role: "admin" } });
    expect(res.status()).toBe(403);
    expect(await roleOf(member.id)).toBe("member");
  });

  test("[auth.post.users#role-admin-recusado] POST /users com role admin por um admin: 400 e COUNT(*) de users inalterado", async ({ request }) => {
    const before = await countRows("users");
    const res = await request.post(`${API_URL}/users`, {
      headers: authHeaders(adminToken),
      data: { name: "Novo Admin", email: uniqueEmail("novo-admin"), phone: "11999990000", password: "Aa1!senhaforte", role: "admin", active: true, completed: true },
    });
    expect(res.status(), await res.text()).toBe(400);
    expect(await countRows("users")).toBe(before);
  });

  test("[auth.put.users-id#admin-existente-segue-editavel] um admin existente pode ser editado (mesmo papel) e rebaixado; promover continua exigindo o banco", async ({ request }) => {
    const keep = await request.put(`${API_URL}/users/${otherAdmin.id}`, {
      headers: authHeaders(adminToken),
      data: { name: "Admin Renomeado", role: "admin" },
    });
    expect(keep.status(), await keep.text()).toBe(200);
    expect(await queryOne("SELECT name FROM users WHERE id = ?", [otherAdmin.id])).toMatchObject({ name: "Admin Renomeado" });
    expect(await roleOf(otherAdmin.id)).toBe("admin");

    const demote = await request.put(`${API_URL}/users/${otherAdmin.id}`, { headers: authHeaders(adminToken), data: { role: "member" } });
    expect(demote.status(), await demote.text()).toBe(200);
    expect(await roleOf(otherAdmin.id)).toBe("member");

    // Voltar a admin pela API também é recusado: só o banco promove.
    const again = await request.put(`${API_URL}/users/${otherAdmin.id}`, { headers: authHeaders(adminToken), data: { role: "admin" } });
    expect(again.status()).toBe(400);
    expect(await roleOf(otherAdmin.id)).toBe("member");
  });
});
