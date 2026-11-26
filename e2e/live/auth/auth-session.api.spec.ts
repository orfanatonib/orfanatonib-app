import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows } from "../support/db";
import { authHeaders, expect, test } from "../support/live";
import {
  ACCOUNT_PASSWORD,
  PROFILE_ROLE,
  adminSession,
  authSnapshot,
  createAccount,
  createProfileAccounts,
  expectNoDeliverableEmail,
  headersFor,
  jwtClaims,
  loginAccount,
  outboxFor,
  removeAccounts,
  userRow,
  withAuthFlagsOff,
  type Account,
  type Profile,
  type ProfileAccounts,
} from "./support";
import { directOutboxCount } from "../support/outbox";

/**
 * Sessão (plano 06): login, refresh, logout, me e google, por perfil
 * (anônimo/membro/líder/admin), com contas descartáveis criadas pela API, prova por SELECT
 * e negativos com o banco inalterado. Google: só os casos negativos — um ID token válido
 * só o Google assina, e o E2E não simula provedor.
 */
const BASE = API_URL;
const PROFILES: readonly Profile[] = ["anonimo", "membro", "lider", "admin"];

const LOGIN_PROFILE_IDS: Record<Profile, string> = {
  anonimo: "[auth.post.auth-login#perfil-anonimo]",
  membro: "[auth.post.auth-login#perfil-membro]",
  lider: "[auth.post.auth-login#perfil-lider]",
  admin: "[auth.post.auth-login#perfil-admin]",
};
const REFRESH_PROFILE_IDS: Record<Profile, string> = {
  anonimo: "[auth.post.auth-refresh#perfil-anonimo]",
  membro: "[auth.post.auth-refresh#perfil-membro]",
  lider: "[auth.post.auth-refresh#perfil-lider]",
  admin: "[auth.post.auth-refresh#perfil-admin]",
};
const LOGOUT_PROFILE_IDS: Record<Exclude<Profile, "anonimo">, string> = {
  membro: "[auth.post.auth-logout#perfil-membro]",
  lider: "[auth.post.auth-logout#perfil-lider]",
  admin: "[auth.post.auth-logout#perfil-admin]",
};
const ME_PROFILE_IDS: Record<Exclude<Profile, "anonimo">, string> = {
  membro: "[auth.get.auth-me#perfil-membro]",
  lider: "[auth.get.auth-me#perfil-lider]",
  admin: "[auth.get.auth-me#perfil-admin]",
};
const GOOGLE_PROFILE_IDS: Record<Profile, string> = {
  anonimo: "[auth.post.auth-google#perfil-anonimo]",
  membro: "[auth.post.auth-google#perfil-membro]",
  lider: "[auth.post.auth-google#perfil-lider]",
  admin: "[auth.post.auth-google#perfil-admin]",
};

test.describe.serial("Auth — sessão por perfil", () => {
  let admin: string;
  let accounts: ProfileAccounts;
  let victim: Account;
  const created: string[] = [];

  test.beforeAll(async ({ request }) => {
    admin = (await adminSession(request)).accessToken;
    accounts = await createProfileAccounts(request, admin);
    victim = await createAccount(request, admin, "member", { label: "alvo" });
    created.push(accounts.member.id, accounts.leader.id, accounts.admin.id, victim.id);
  });

  test.beforeEach(async ({ request }) => {
    admin = (await adminSession(request)).accessToken;
  });

  test.afterAll(async ({ request }) => {
    const token = (await adminSession(request)).accessToken;
    await removeAccounts(request, token, created);
    await closeDb();
  });

  /* ------------------------------ login ------------------------------ */

  test("[auth.post.auth-login#feliz] login válido: 200 com tokens e o refresh gravado em users.refreshToken", async ({ request }) => {
    const res = await request.post(`${BASE}/auth/login`, { data: { email: victim.email, password: ACCOUNT_PASSWORD } });
    expect(res.status()).toBe(201);
    const body = (await res.json()) as { accessToken: string; refreshToken: string; user: { id: string; role: string } };
    expect(body.user.id).toBe(victim.id);
    expect(jwtClaims(body.accessToken)).toMatchObject({ sub: victim.id, role: "member" });
    expect((await userRow(victim.id)).refreshToken).toBe(body.refreshToken);
  });

  for (const profile of PROFILES) {
    test(`${LOGIN_PROFILE_IDS[profile]} login de ${profile}: o papel do token é o da conta e o banco guarda o refresh`, async ({ request }) => {
      const account = accounts[profile === "anonimo" ? "member" : PROFILE_ROLE[profile]];
      const res = await request.post(`${BASE}/auth/login`, { data: { email: account.email, password: account.password } });
      expect(res.status()).toBe(201);
      const body = (await res.json()) as { accessToken: string; refreshToken: string };
      expect(jwtClaims(body.accessToken).role).toBe(account.role);
      expect((await userRow(account.id)).refreshToken).toBe(body.refreshToken);
    });
  }

  test("[auth.post.auth-login#conflito-ou-duplicidade] segundo login da mesma conta substitui a sessão: o refresh antigo deixa de valer e só há um em users.refreshToken", async ({ request }) => {
    const first = await loginAccount(request, victim);
    const second = await loginAccount(request, victim);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect((await userRow(victim.id)).refreshToken).toBe(second.refreshToken);

    const stale = await request.post(`${BASE}/auth/refresh`, { data: { refreshToken: first.refreshToken } });
    expect(stale.status()).toBe(401);
    expect((await userRow(victim.id)).refreshToken).toBe(second.refreshToken);
  });

  test("[auth.post.auth-login#escopo-proprio-x-outro] login de A com a sessão de B no cabeçalho devolve a sessão de A e não mexe no refresh de B", async ({ request }) => {
    const sessionB = await loginAccount(request, accounts.leader);
    const before = (await userRow(accounts.leader.id)).refreshToken;
    const res = await request.post(`${BASE}/auth/login`, {
      headers: authHeaders(sessionB.accessToken),
      data: { email: victim.email, password: ACCOUNT_PASSWORD },
    });
    expect(res.status()).toBe(201);
    expect(((await res.json()) as { user: { id: string } }).user.id).toBe(victim.id);
    expect((await userRow(accounts.leader.id)).refreshToken).toBe(before);
  });

  test("[auth.post.auth-login#flag-desligada] com as 3 flags de autenticação desligadas o login continua funcionando (não é flagueado)", async ({ request }) => {
    await withAuthFlagsOff(request, admin, async () => {
      const res = await request.post(`${BASE}/auth/login`, { data: { email: victim.email, password: ACCOUNT_PASSWORD } });
      expect(res.status()).toBe(201);
    });
  });

  test("[auth.post.auth-login#email-enviado-ou-bloqueado-por-flag] login não dispara e-mail: nenhuma linha nova no outbox da conta", async ({ request }) => {
    const before = await outboxFor(victim.email);
    await loginAccount(request, victim);
    expect(await outboxFor(victim.email)).toEqual(before);
    await expectNoDeliverableEmail(victim.email);
  });

  /* ------------------------------ refresh ------------------------------ */

  test("[auth.post.auth-refresh#feliz] refresh válido: 200, par novo e users.refreshToken passa a ser o novo", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const res = await request.post(`${BASE}/auth/refresh`, { data: { refreshToken: session.refreshToken } });
    expect(res.status()).toBe(201);
    const body = (await res.json()) as { accessToken: string; refreshToken: string };
    expect(body.refreshToken).not.toBe(session.refreshToken);
    expect((await userRow(victim.id)).refreshToken).toBe(body.refreshToken);
  });

  test("[auth.post.auth-refresh#validacao] refresh sem corpo: 401 e o refresh gravado não muda", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const res = await request.post(`${BASE}/auth/refresh`, { data: {} });
    expect([400, 401]).toContain(res.status());
    expect((await userRow(victim.id)).refreshToken).toBe(session.refreshToken);
  });

  test("[auth.post.auth-refresh#conflito-ou-duplicidade] reuso do refresh já rotacionado: 401 e a sessão vigente continua a mesma", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const rotated = await request.post(`${BASE}/auth/refresh`, { data: { refreshToken: session.refreshToken } });
    const current = ((await rotated.json()) as { refreshToken: string }).refreshToken;

    const reuse = await request.post(`${BASE}/auth/refresh`, { data: { refreshToken: session.refreshToken } });
    expect(reuse.status()).toBe(401);
    expect((await userRow(victim.id)).refreshToken).toBe(current);
  });

  for (const profile of PROFILES) {
    test(`${REFRESH_PROFILE_IDS[profile]} refresh de ${profile}: os claims do par novo mantêm o papel da conta`, async ({ request }) => {
      const account = accounts[profile === "anonimo" ? "member" : PROFILE_ROLE[profile]];
      const session = await loginAccount(request, account);
      const headers = profile === "anonimo" ? {} : authHeaders(session.accessToken);
      const res = await request.post(`${BASE}/auth/refresh`, { headers, data: { refreshToken: session.refreshToken } });
      expect(res.status()).toBe(201);
      const body = (await res.json()) as { accessToken: string; refreshToken: string };
      expect(jwtClaims(body.accessToken)).toMatchObject({ sub: account.id, role: account.role });
      expect((await userRow(account.id)).refreshToken).toBe(body.refreshToken);
    });
  }

  test("[auth.post.auth-refresh#escopo-proprio-x-outro] refresh de A com a sessão de B no cabeçalho renova A; o refresh de B no banco não muda", async ({ request }) => {
    const sessionA = await loginAccount(request, victim);
    const sessionB = await loginAccount(request, accounts.leader);
    const res = await request.post(`${BASE}/auth/refresh`, {
      headers: authHeaders(sessionB.accessToken),
      data: { refreshToken: sessionA.refreshToken },
    });
    expect(res.status()).toBe(201);
    expect(jwtClaims(((await res.json()) as { accessToken: string }).accessToken).sub).toBe(victim.id);
    expect((await userRow(accounts.leader.id)).refreshToken).toBe(sessionB.refreshToken);
  });

  test("[auth.post.auth-refresh#flag-desligada] com as 3 flags de autenticação desligadas o refresh continua funcionando", async ({ request }) => {
    const session = await loginAccount(request, victim);
    await withAuthFlagsOff(request, admin, async () => {
      const res = await request.post(`${BASE}/auth/refresh`, { data: { refreshToken: session.refreshToken } });
      expect(res.status()).toBe(201);
    });
  });

  test("[auth.post.auth-refresh#email-enviado-ou-bloqueado-por-flag] refresh não dispara e-mail", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const before = await outboxFor(victim.email);
    await request.post(`${BASE}/auth/refresh`, { data: { refreshToken: session.refreshToken } });
    expect(await outboxFor(victim.email)).toEqual(before);
  });

  /* ------------------------------ logout ------------------------------ */

  test("[auth.post.auth-logout#feliz] logout: 200, users.refreshToken vira NULL e o refresh deixa de renovar", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const res = await request.post(`${BASE}/auth/logout`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(201);
    expect((await userRow(victim.id)).refreshToken).toBeNull();
    const after = await request.post(`${BASE}/auth/refresh`, { data: { refreshToken: session.refreshToken } });
    expect(after.status()).toBe(401);
  });

  test("[auth.post.auth-logout#validacao] logout com token malformado: 401 e o refresh gravado não muda", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const res = await request.post(`${BASE}/auth/logout`, { headers: { Authorization: "Bearer isto.nao.e-jwt" } });
    expect(res.status()).toBe(401);
    expect((await userRow(victim.id)).refreshToken).toBe(session.refreshToken);
  });

  test("[auth.post.auth-logout#conflito-ou-duplicidade] logout repetido é idempotente: segue 200 e users.refreshToken segue NULL", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const headers = authHeaders(session.accessToken);
    expect((await request.post(`${BASE}/auth/logout`, { headers })).status()).toBe(201);
    expect((await request.post(`${BASE}/auth/logout`, { headers })).status()).toBe(201);
    expect((await userRow(victim.id)).refreshToken).toBeNull();
  });

  for (const profile of ["membro", "lider", "admin"] as const) {
    test(`${LOGOUT_PROFILE_IDS[profile]} logout de ${profile}: 200 e só o refresh da própria conta vira NULL`, async ({ request }) => {
      const account = accounts[PROFILE_ROLE[profile]];
      const session = await loginAccount(request, account);
      const res = await request.post(`${BASE}/auth/logout`, { headers: authHeaders(session.accessToken) });
      expect(res.status()).toBe(201);
      expect((await userRow(account.id)).refreshToken).toBeNull();
    });
  }

  test("[auth.post.auth-logout#escopo-proprio-x-outro] logout de A não encerra a sessão de B (refresh de B intacto no banco)", async ({ request }) => {
    const sessionA = await loginAccount(request, victim);
    const sessionB = await loginAccount(request, accounts.leader);
    expect((await request.post(`${BASE}/auth/logout`, { headers: authHeaders(sessionA.accessToken) })).status()).toBe(201);
    expect((await userRow(victim.id)).refreshToken).toBeNull();
    expect((await userRow(accounts.leader.id)).refreshToken).toBe(sessionB.refreshToken);
  });

  test("[auth.post.auth-logout#flag-desligada] com as 3 flags de autenticação desligadas o logout continua funcionando", async ({ request }) => {
    const session = await loginAccount(request, victim);
    await withAuthFlagsOff(request, admin, async () => {
      const res = await request.post(`${BASE}/auth/logout`, { headers: authHeaders(session.accessToken) });
      expect(res.status()).toBe(201);
    });
  });

  test("[auth.post.auth-logout#email-enviado-ou-bloqueado-por-flag] logout não dispara e-mail", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const before = await outboxFor(victim.email);
    await request.post(`${BASE}/auth/logout`, { headers: authHeaders(session.accessToken) });
    expect(await outboxFor(victim.email)).toEqual(before);
  });

  /* ------------------------------ me ------------------------------ */

  test("[auth.get.auth-me#feliz] GET /auth/me: 200 com os dados da conta, batendo com o banco e sem senha nem refresh token", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const res = await request.get(`${BASE}/auth/me`, { headers: authHeaders(session.accessToken) });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const row = await userRow(victim.id);
    expect(body).toMatchObject({ id: row.id, email: row.email, name: row.name, role: row.role });
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("refreshToken");
  });

  for (const profile of ["membro", "lider", "admin"] as const) {
    test(`${ME_PROFILE_IDS[profile]} GET /auth/me como ${profile}: devolve a própria conta com o papel certo`, async ({ request }) => {
      const account = accounts[PROFILE_ROLE[profile]];
      const session = await loginAccount(request, account);
      const res = await request.get(`${BASE}/auth/me`, { headers: authHeaders(session.accessToken) });
      expect(res.status()).toBe(200);
      expect(await res.json()).toMatchObject({ id: account.id, role: account.role });
    });
  }

  test("[auth.get.auth-me#escopo-proprio-x-outro] GET /auth/me devolve sempre a conta da sessão, mesmo com ?userId= de outra conta", async ({ request }) => {
    const session = await loginAccount(request, victim);
    const res = await request.get(`${BASE}/auth/me?userId=${accounts.admin.id}&id=${accounts.admin.id}`, {
      headers: authHeaders(session.accessToken),
    });
    expect(res.status()).toBe(200);
    expect(((await res.json()) as { id: string }).id).toBe(victim.id);
  });

  test("[auth.get.auth-me#flag-desligada] com as 3 flags de autenticação desligadas GET /auth/me continua funcionando", async ({ request }) => {
    const session = await loginAccount(request, victim);
    await withAuthFlagsOff(request, admin, async () => {
      expect((await request.get(`${BASE}/auth/me`, { headers: authHeaders(session.accessToken) })).status()).toBe(200);
    });
  });

  /* ------------------------------ google ------------------------------ */

  test("[auth.post.auth-google#validacao] POST /auth/google sem credencial: 400/401 e nenhum usuário criado", async ({ request }) => {
    const before = await authSnapshot();
    const res = await request.post(`${BASE}/auth/google`, { data: {} });
    expect([400, 401]).toContain(res.status());
    expect(await authSnapshot()).toEqual(before);
  });

  for (const profile of PROFILES) {
    test(`${GOOGLE_PROFILE_IDS[profile]} credencial Google inválida como ${profile}: 401, sem tokens e nenhum usuário criado`, async ({ request }) => {
      const headers = await headersFor(request, accounts, profile);
      const before = await countRows("users");
      const res = await request.post(`${BASE}/auth/google`, { headers, data: { token: "credencial-que-o-google-nao-assinou" } });
      expect(res.status()).toBe(401);
      expect(JSON.stringify(await res.json())).not.toContain("accessToken");
      expect(await countRows("users")).toBe(before);
    });
  }

  test("[auth.post.auth-google#escopo-proprio-x-outro] credencial inválida com a sessão de B: 401 e o refresh e a linha de B não mudam", async ({ request }) => {
    const sessionB = await loginAccount(request, accounts.leader);
    const before = await userRow(accounts.leader.id);
    const res = await request.post(`${BASE}/auth/google`, {
      headers: authHeaders(sessionB.accessToken),
      data: { token: "credencial-invalida" },
    });
    expect(res.status()).toBe(401);
    expect(await userRow(accounts.leader.id)).toEqual(before);
  });

  test("[auth.post.auth-google#conflito-ou-duplicidade] credencial inválida para o e-mail de uma conta existente: 401 e a conta não é tocada", async ({ request }) => {
    const before = await userRow(victim.id);
    const res = await request.post(`${BASE}/auth/google`, { data: { token: "x", email: victim.email } });
    expect([400, 401]).toContain(res.status());
    expect(await userRow(victim.id)).toEqual(before);
  });

  test("[auth.post.auth-google#email-enviado-ou-bloqueado-por-flag] credencial inválida não dispara e-mail", async ({ request }) => {
    const before = await directOutboxCount();
    await request.post(`${BASE}/auth/google`, { data: { token: "x" } });
    expect(await directOutboxCount()).toBe(before);
  });
});
