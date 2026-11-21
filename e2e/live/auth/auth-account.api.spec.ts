import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows } from "../support/db";
import { authHeaders, expect, test } from "../support/live";
import {
  ACCOUNT_PASSWORD,
  awaitResetTokens,
  completionTokenFor,
  settleBackgroundWork,
  NEW_PASSWORD,
  adminSession,
  authSnapshot,
  createAccount,
  createProfileAccounts,
  expectNoDeliverableEmail,
  headersFor,
  loginAccount,
  outboxFor,
  registerBody,
  registerPublic,
  removeAccounts,
  resetTokens,
  uniqueEmail,
  userByEmail,
  userRow,
  verificationTokens,
  withAuthFlagsOff,
  type Account,
  type Profile,
  type ProfileAccounts,
} from "./support";

/**
 * Contas e recuperação (plano 06): register, complete-register, verify-email,
 * resend-verification, forgot-password, reset-password/validate. Cada caso prova o efeito por
 * SELECT (`users`, `email_verification_tokens`, `password_reset_tokens`, `email_outbox`) e, nos negativos,
 * que o banco ficou igual. E-mail: as flags `email_*` ficam desligadas, então o aviso aparece
 * no outbox como `skipped` e nunca `pending`. Expiração de token não é forjável por API
 * (o banco do E2E é somente leitura): está em `email-verification-token.repository.spec.ts` e
 * `password-reset-token.repository.spec.ts` (API).
 */
const BASE = API_URL;
const PROFILES: readonly Profile[] = ["anonimo", "membro", "lider", "admin"];

const PROFILE_IDS: Record<string, Record<Profile, string>> = {
  register: {
    anonimo: "[auth.post.auth-register#perfil-anonimo]",
    membro: "[auth.post.auth-register#perfil-membro]",
    lider: "[auth.post.auth-register#perfil-lider]",
    admin: "[auth.post.auth-register#perfil-admin]",
  },
  complete: {
    anonimo: "[auth.post.auth-complete-register#perfil-anonimo]",
    membro: "[auth.post.auth-complete-register#perfil-membro]",
    lider: "[auth.post.auth-complete-register#perfil-lider]",
    admin: "[auth.post.auth-complete-register#perfil-admin]",
  },
  verify: {
    anonimo: "[auth.post.auth-verify-email#perfil-anonimo]",
    membro: "[auth.post.auth-verify-email#perfil-membro]",
    lider: "[auth.post.auth-verify-email#perfil-lider]",
    admin: "[auth.post.auth-verify-email#perfil-admin]",
  },
  resend: {
    anonimo: "[auth.post.auth-resend-verification#perfil-anonimo]",
    membro: "[auth.post.auth-resend-verification#perfil-membro]",
    lider: "[auth.post.auth-resend-verification#perfil-lider]",
    admin: "[auth.post.auth-resend-verification#perfil-admin]",
  },
  forgot: {
    anonimo: "[auth.post.auth-forgot-password#perfil-anonimo]",
    membro: "[auth.post.auth-forgot-password#perfil-membro]",
    lider: "[auth.post.auth-forgot-password#perfil-lider]",
    admin: "[auth.post.auth-forgot-password#perfil-admin]",
  },
  validate: {
    anonimo: "[auth.get.auth-reset-password-validate#perfil-anonimo]",
    membro: "[auth.get.auth-reset-password-validate#perfil-membro]",
    lider: "[auth.get.auth-reset-password-validate#perfil-lider]",
    admin: "[auth.get.auth-reset-password-validate#perfil-admin]",
  },
  reset: {
    anonimo: "[auth.post.auth-reset-password#perfil-anonimo]",
    membro: "[auth.post.auth-reset-password#perfil-membro]",
    lider: "[auth.post.auth-reset-password#perfil-lider]",
    admin: "[auth.post.auth-reset-password#perfil-admin]",
  },
};

const MSG = { invalidToken: 400 } as const;

test.describe.serial("Auth — contas e recuperação por perfil", () => {
  let admin: string;
  let accounts: ProfileAccounts;
  const created: string[] = [];

  const track = (account: Account): Account => {
    created.push(account.id);
    return account;
  };
  const newPending = async (request: import("@playwright/test").APIRequestContext, headers: Record<string, string> = {}) =>
    track((await registerPublic(request, headers)).account);
  const newIncomplete = async (request: import("@playwright/test").APIRequestContext) =>
    track(await createAccount(request, admin, "member", { completed: false, label: "pendente" }));
  const verifyToken = async (userId: string) => (await verificationTokens(userId))[0].token;
  const forgot = (request: import("@playwright/test").APIRequestContext, email: string, headers: Record<string, string> = {}) =>
    request.post(`${BASE}/auth/forgot-password`, { headers, data: { email } });
  const resetToken = async (userId: string) => (await awaitResetTokens(userId))[0].token;

  test.beforeAll(async ({ request }) => {
    admin = (await adminSession(request)).accessToken;
    accounts = await createProfileAccounts(request, admin);
    created.push(accounts.member.id, accounts.leader.id, accounts.admin.id);
  });

  test.beforeEach(async ({ request }) => {
    admin = (await adminSession(request)).accessToken;
  });

  test.afterAll(async ({ request }) => {
    const token = (await adminSession(request)).accessToken;
    await removeAccounts(request, token, created);
    await closeDb();
  });

  /* ------------------------------ register ------------------------------ */

  test("[auth.post.auth-register#feliz] cadastro público: 201, conta inativa e sem e-mail confirmado no banco, com 1 token de verificação pendente", async ({ request }) => {
    const email = uniqueEmail("feliz");
    const res = await request.post(`${BASE}/auth/register`, { data: registerBody(email) });
    expect(res.status()).toBe(201);
    const body = (await res.json()) as { user: { id: string } };
    created.push(body.user.id);

    const row = await userRow(body.user.id);
    expect(row).toMatchObject({ email, role: "member", active: 0, completed: 1, emailVerifiedAt: null, refreshToken: null });
    expect(row.password).not.toBe(ACCOUNT_PASSWORD);
    const tokens = await verificationTokens(body.user.id);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].usedAt).toBeNull();
  });

  test("[auth.post.auth-register#validacao] cadastro inválido (e-mail ruim, senha curta, papel desconhecido, sem telefone): 400 e o banco não muda", async ({ request }) => {
    const before = await authSnapshot();
    const base = registerBody(uniqueEmail("invalido"));
    for (const data of [
      { ...base, email: "nao-e-email" },
      { ...base, password: "123" },
      { ...base, role: "superuser" },
      { ...base, phone: undefined },
    ]) {
      expect((await request.post(`${BASE}/auth/register`, { data })).status()).toBe(400);
    }
    expect(await authSnapshot()).toEqual(before);
  });

  test("[auth.post.auth-register#conflito-ou-duplicidade] e-mail já cadastrado: 409 e nenhum usuário nem token novo", async ({ request }) => {
    const existing = await newPending(request);
    const before = await authSnapshot();
    const res = await request.post(`${BASE}/auth/register`, { data: registerBody(existing.email) });
    expect(res.status()).toBe(409);
    expect(await authSnapshot()).toEqual(before);
  });

  test("[auth.post.auth-register#role-admin-recusado] cadastro com role admin (ou fora de member/leader): 400 e COUNT(*) de users inalterado", async ({ request }) => {
    const before = await authSnapshot();
    for (const role of ["admin", "ADMIN", "superuser", ""]) {
      const res = await request.post(`${BASE}/auth/register`, { data: registerBody(uniqueEmail("admin"), role as never) });
      expect(res.status(), `role=${role}`).toBe(400);
    }
    expect(await authSnapshot()).toEqual(before);
    expect(await countRows("users", { role: "admin", completed: 0 })).toBe(0);
  });

  for (const profile of PROFILES) {
    test(`${PROFILE_IDS.register[profile]} cadastro com a sessão de ${profile}: a conta nasce inativa (a sessão não aprova nem herda nada)`, async ({ request }) => {
      const headers = await headersFor(request, accounts, profile);
      const { account } = await registerPublic(request, headers);
      created.push(account.id);
      expect(await userRow(account.id)).toMatchObject({ role: "member", active: 0, emailVerifiedAt: null });
    });
  }

  test("[auth.post.auth-register#escopo-proprio-x-outro] cadastro com a sessão de B cria uma conta nova e não altera a linha de B", async ({ request }) => {
    const headers = await headersFor(request, accounts, "membro");
    const before = await userRow(accounts.member.id);
    const { account } = await registerPublic(request, headers);
    created.push(account.id);
    expect(account.id).not.toBe(accounts.member.id);
    const after = await userRow(accounts.member.id);
    expect({ ...after, refreshToken: null }).toEqual({ ...before, refreshToken: null });
  });

  test("[auth.post.auth-register#email-enviado-ou-bloqueado-por-flag] com as flags de e-mail desligadas o cadastro grava o aviso como skipped no outbox, nunca pending", async ({ request }) => {
    const { account } = await registerPublic(request);
    created.push(account.id);
    const rows = await outboxFor(account.email, "email-verification");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === "skipped")).toBe(true);
  });

  /* ------------------------------ complete-register ------------------------------ */

  const complete = (
    request: import("@playwright/test").APIRequestContext,
    data: Record<string, unknown>,
    headers: Record<string, string> = {},
  ) => request.post(`${BASE}/auth/complete-register`, { headers, data });
  const GENERIC_401 = "Sessão de cadastro inválida ou expirada. Entre com o Google novamente.";

  test("[auth.post.auth-complete-register#feliz] completar cadastro pendente com o token de conclusão: 201, conta completa com nome/telefone/senha novos e token de verificação criado", async ({ request }) => {
    const pending = await newIncomplete(request);
    const res = await complete(request, {
      completionToken: completionTokenFor(pending.id),
      name: "Nome Completo",
      phone: "11888880000",
      password: NEW_PASSWORD,
    });
    expect(res.status()).toBe(201);
    expect(await userRow(pending.id)).toMatchObject({ completed: 1, name: "Nome Completo", phone: "11888880000" });
    expect(await verificationTokens(pending.id)).toHaveLength(1);
    const login = await request.post(`${BASE}/auth/login`, { data: { email: pending.email, password: NEW_PASSWORD } });
    expect(login.status()).toBe(201);
  });

  test("[auth.post.auth-complete-register#validacao] sem token, sem telefone, senha curta ou com e-mail no corpo: 400 e a conta pendente não muda", async ({ request }) => {
    const pending = await newIncomplete(request);
    const token = completionTokenFor(pending.id);
    const before = await userRow(pending.id);
    for (const data of [
      { name: "X", phone: "11888880000" },
      { completionToken: token, name: "X" },
      { completionToken: token, name: "X", phone: "11888880000", password: "123" },
      // O e-mail deixou de ser identidade: mandá-lo é recusado, não ignorado.
      { completionToken: token, email: pending.email, name: "X", phone: "11888880000" },
    ]) {
      expect((await complete(request, data)).status()).toBe(400);
    }
    expect(await userRow(pending.id)).toEqual(before);
  });

  test("[auth.post.auth-complete-register#token-invalido] sem posse da identidade (só o e-mail, lixo, vazio): 401 genérico, igual para conta pendente, completa ou inexistente, e o banco não muda", async ({ request }) => {
    const pending = await newIncomplete(request);
    const done = await newPending(request);
    const snapshot = await authSnapshot();
    const before = [await userRow(pending.id), await userRow(done.id)];
    const bodies: unknown[] = [];
    for (const completionToken of ["lixo", "a.b.c", completionTokenFor("id-que-nao-existe"), completionTokenFor(done.id)]) {
      const res = await complete(request, { completionToken, name: "Takeover", phone: "11000000000", password: "Takeover@1" });
      expect(res.status()).toBe(401);
      const { category, error, message, statusCode } = (await res.json()) as Record<string, unknown>;
      bodies.push({ category, error, message, statusCode });
    }
    for (const body of bodies) expect(body).toEqual(bodies[0]);
    expect((bodies[0] as { message: string }).message).toBe(GENERIC_401);
    // Sabendo só o e-mail da conta pendente não se define a senha dela.
    expect((await complete(request, { email: pending.email, name: "Takeover", phone: "11000000000", password: "Takeover@1" })).status()).toBe(400);
    expect([await userRow(pending.id), await userRow(done.id)]).toEqual(before);
    expect(await authSnapshot()).toEqual(snapshot);
  });

  test("[auth.post.auth-complete-register#token-expirado] token expirado: 401 genérico e a conta pendente não muda", async ({ request }) => {
    const pending = await newIncomplete(request);
    const before = await userRow(pending.id);
    const res = await complete(request, {
      completionToken: completionTokenFor(pending.id, { ttlSeconds: -60 }),
      name: "Tarde Demais",
      phone: "11888880000",
      password: NEW_PASSWORD,
    });
    expect(res.status()).toBe(401);
    expect(((await res.json()) as { message: string }).message).toBe(GENERIC_401);
    expect(await userRow(pending.id)).toEqual(before);
  });

  test("[auth.post.auth-complete-register#token-reusado] o mesmo token usado duas vezes: o primeiro completa (201), o segundo é 401 e não altera nada", async ({ request }) => {
    const pending = await newIncomplete(request);
    const completionToken = completionTokenFor(pending.id);
    const first = await complete(request, { completionToken, name: "Primeiro Uso", phone: "11888880000", password: NEW_PASSWORD });
    expect(first.status()).toBe(201);
    const after = await userRow(pending.id);
    const tokensAfter = await verificationTokens(pending.id);

    const second = await complete(request, { completionToken, name: "Segundo Uso", phone: "11777770000", password: "Outra@12345" });
    expect(second.status()).toBe(401);
    expect(await userRow(pending.id)).toEqual(after);
    expect(await verificationTokens(pending.id)).toEqual(tokensAfter);
  });

  test("[auth.post.auth-complete-register#token-proposito-errado] JWT de sessão, token com outro propósito ou assinado com o segredo da sessão: 401 e a conta não muda", async ({ request }) => {
    const pending = await newIncomplete(request);
    const before = await userRow(pending.id);
    const sessionToken = (await loginAccount(request, accounts.member)).accessToken;
    for (const completionToken of [
      sessionToken,
      admin,
      completionTokenFor(pending.id, { purpose: "reset_password" }),
      completionTokenFor(pending.id, { withSessionSecret: true }),
    ]) {
      const res = await complete(request, { completionToken, name: "X Y", phone: "11888880000", password: NEW_PASSWORD });
      expect(res.status()).toBe(401);
    }
    expect(await userRow(pending.id)).toEqual(before);
  });

  test("[auth.post.auth-complete-register#conta-ativa] conta já ativa/completa: mesmo com um token assinado corretamente, 401 e nome/telefone/senha/papel não mudam", async ({ request }) => {
    const active = track(await createAccount(request, admin, "member", { label: "ativa" }));
    const before = await userRow(active.id);
    const res = await complete(request, {
      completionToken: completionTokenFor(active.id),
      name: "Sequestro",
      phone: "11000000000",
      password: "Takeover@1",
      role: "leader",
    });
    expect(res.status()).toBe(401);
    expect(await userRow(active.id)).toEqual(before);
    expect((await request.post(`${BASE}/auth/login`, { data: { email: active.email, password: ACCOUNT_PASSWORD } })).status()).toBe(201);
  });

  test("[auth.post.auth-complete-register#role-admin-recusado] role admin no complemento: 400 e a conta pendente continua pendente", async ({ request }) => {
    const pending = await newIncomplete(request);
    const before = await userRow(pending.id);
    const res = await complete(request, {
      completionToken: completionTokenFor(pending.id),
      name: "Quero Admin",
      phone: "11888880000",
      role: "admin",
    });
    expect(res.status()).toBe(400);
    expect(await userRow(pending.id)).toEqual(before);
  });

  for (const profile of PROFILES) {
    test(`${PROFILE_IDS.complete[profile]} completar cadastro com a sessão de ${profile}: efeito só na conta dona do token`, async ({ request }) => {
      const pending = await newIncomplete(request);
      const headers = await headersFor(request, accounts, profile);
      const res = await complete(request, { completionToken: completionTokenFor(pending.id), name: "Completo", phone: "11888880000" }, headers);
      expect(res.status()).toBe(201);
      expect(await userRow(pending.id)).toMatchObject({ completed: 1, name: "Completo" });
    });
  }

  test("[auth.post.auth-complete-register#escopo-proprio-x-outro] com a sessão de B, completar o cadastro de A só altera A; a linha de B não muda", async ({ request }) => {
    const pending = await newIncomplete(request);
    const headers = await headersFor(request, accounts, "membro");
    const before = await userRow(accounts.member.id);
    const res = await complete(request, { completionToken: completionTokenFor(pending.id), name: "Alvo", phone: "11888880000" }, headers);
    expect(res.status()).toBe(201);
    expect((await userRow(pending.id)).name).toBe("Alvo");
    const after = await userRow(accounts.member.id);
    expect({ ...after, refreshToken: null }).toEqual({ ...before, refreshToken: null });
  });

  test("[auth.post.auth-complete-register#conflito-ou-duplicidade] conta já completa não é 409 (isso revelaria o estado da conta): é o mesmo 401 genérico, sem escrita", async ({ request }) => {
    const done = await newPending(request);
    const before = await userRow(done.id);
    const res = await complete(request, { completionToken: completionTokenFor(done.id), name: "Outro Nome", phone: "11777770000", password: NEW_PASSWORD });
    expect(res.status()).toBe(401);
    expect(await userRow(done.id)).toEqual(before);
  });

  test("[auth.post.auth-complete-register#email-enviado-ou-bloqueado-por-flag] completar cadastro grava o aviso de verificação como skipped (flags desligadas)", async ({ request }) => {
    const pending = await newIncomplete(request);
    await complete(request, { completionToken: completionTokenFor(pending.id), name: "X Y", phone: "11888880000" });
    const rows = await outboxFor(pending.email, "email-verification");
    expect(rows.length).toBeGreaterThan(0);
    await expectNoDeliverableEmail(pending.email);
  });

  /* ------------------------------ verify-email ------------------------------ */

  test("[auth.post.auth-verify-email#feliz] confirmar o e-mail com o token do banco: 201, users.emailVerifiedAt preenchido e token marcado como usado", async ({ request }) => {
    const account = await newPending(request);
    const token = await verifyToken(account.id);
    const res = await request.post(`${BASE}/auth/verify-email`, { data: { token } });
    expect(res.status()).toBe(201);
    expect(await res.json()).toMatchObject({ verified: true, email: account.email });
    expect((await userRow(account.id)).emailVerifiedAt).not.toBeNull();
    expect((await verificationTokens(account.id))[0].usedAt).not.toBeNull();
  });

  test("[auth.post.auth-verify-email#validacao] sem token, token vazio ou desconhecido: 400 e o e-mail segue não confirmado", async ({ request }) => {
    const account = await newPending(request);
    const before = await authSnapshot();
    for (const data of [{}, { token: "" }, { token: "token-que-nao-existe" }]) {
      expect((await request.post(`${BASE}/auth/verify-email`, { data })).status()).toBe(400);
    }
    expect((await userRow(account.id)).emailVerifiedAt).toBeNull();
    expect(await authSnapshot()).toEqual(before);
  });

  test("[auth.post.auth-verify-email#conflito-ou-duplicidade] reuso do token já usado: 400 e emailVerifiedAt não muda", async ({ request }) => {
    const account = await newPending(request);
    const token = await verifyToken(account.id);
    await request.post(`${BASE}/auth/verify-email`, { data: { token } });
    const verifiedAt = (await userRow(account.id)).emailVerifiedAt;

    const reuse = await request.post(`${BASE}/auth/verify-email`, { data: { token } });
    expect(reuse.status()).toBe(MSG.invalidToken);
    expect((await userRow(account.id)).emailVerifiedAt).toBe(verifiedAt);
  });

  for (const profile of PROFILES) {
    test(`${PROFILE_IDS.verify[profile]} confirmar e-mail com a sessão de ${profile}: o efeito é na conta dona do token`, async ({ request }) => {
      const account = await newPending(request);
      const headers = await headersFor(request, accounts, profile);
      const res = await request.post(`${BASE}/auth/verify-email`, { headers, data: { token: await verifyToken(account.id) } });
      expect(res.status()).toBe(201);
      expect((await userRow(account.id)).emailVerifiedAt).not.toBeNull();
    });
  }

  test("[auth.post.auth-verify-email#escopo-proprio-x-outro] com a sessão de B, o token de A confirma só A; B continua como estava", async ({ request }) => {
    const account = await newPending(request);
    const headers = await headersFor(request, accounts, "lider");
    const before = (await userRow(accounts.leader.id)).emailVerifiedAt;
    await request.post(`${BASE}/auth/verify-email`, { headers, data: { token: await verifyToken(account.id) } });
    expect((await userRow(account.id)).emailVerifiedAt).not.toBeNull();
    expect((await userRow(accounts.leader.id)).emailVerifiedAt).toBe(before);
  });

  test("[auth.post.auth-verify-email#flag-desligada] com as 3 flags de autenticação desligadas a confirmação de e-mail continua funcionando", async ({ request }) => {
    const account = await newPending(request);
    const token = await verifyToken(account.id);
    await withAuthFlagsOff(request, admin, async () => {
      expect((await request.post(`${BASE}/auth/verify-email`, { data: { token } })).status()).toBe(201);
    });
    expect((await userRow(account.id)).emailVerifiedAt).not.toBeNull();
  });

  test("[auth.post.auth-verify-email#email-enviado-ou-bloqueado-por-flag] confirmar o e-mail não dispara nenhum e-mail novo", async ({ request }) => {
    const account = await newPending(request);
    const before = await outboxFor(account.email);
    await request.post(`${BASE}/auth/verify-email`, { data: { token: await verifyToken(account.id) } });
    expect(await outboxFor(account.email)).toEqual(before);
  });

  /* ------------------------------ resend-verification ------------------------------ */

  test("[auth.post.auth-resend-verification#feliz] reenvio: 201 e o token pendente antigo é trocado por um novo (1 pendente no banco)", async ({ request }) => {
    const account = await newPending(request);
    const old = await verifyToken(account.id);
    const res = await request.post(`${BASE}/auth/resend-verification`, { data: { email: account.email } });
    expect(res.status()).toBe(201);
    expect(await res.json()).toMatchObject({ verificationEmailSent: true });
    const tokens = await verificationTokens(account.id);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].token).not.toBe(old);
  });

  test("[auth.post.auth-resend-verification#validacao] e-mail inválido ou ausente: 400 e nenhuma linha muda", async ({ request }) => {
    const before = await authSnapshot();
    for (const data of [{}, { email: "nao-e-email" }]) {
      expect((await request.post(`${BASE}/auth/resend-verification`, { data })).status()).toBe(400);
    }
    expect(await authSnapshot()).toEqual(before);
  });

  test("[auth.post.auth-resend-verification#conflito-ou-duplicidade] conta já confirmada ou e-mail inexistente: mesma resposta e nenhum token novo (não revela quem existe)", async ({ request }) => {
    const account = await newPending(request);
    await request.post(`${BASE}/auth/verify-email`, { data: { token: await verifyToken(account.id) } });
    const before = await authSnapshot();

    const confirmed = await request.post(`${BASE}/auth/resend-verification`, { data: { email: account.email } });
    const unknown = await request.post(`${BASE}/auth/resend-verification`, { data: { email: uniqueEmail("ninguem") } });
    expect(confirmed.status()).toBe(unknown.status());
    expect(await confirmed.json()).toEqual(await unknown.json());
    expect(await authSnapshot()).toEqual(before);
  });

  for (const profile of PROFILES) {
    test(`${PROFILE_IDS.resend[profile]} reenvio com a sessão de ${profile}: 201 e o token novo é da conta do corpo`, async ({ request }) => {
      const account = await newPending(request);
      const headers = await headersFor(request, accounts, profile);
      const res = await request.post(`${BASE}/auth/resend-verification`, { headers, data: { email: account.email } });
      expect(res.status()).toBe(201);
      expect(await verificationTokens(account.id)).toHaveLength(1);
    });
  }

  test("[auth.post.auth-resend-verification#escopo-proprio-x-outro] com a sessão de B, o reenvio para o e-mail de A cria token só para A", async ({ request }) => {
    const account = await newPending(request);
    const headers = await headersFor(request, accounts, "membro");
    const memberTokens = await countRows("email_verification_tokens", { userId: accounts.member.id });
    await request.post(`${BASE}/auth/resend-verification`, { headers, data: { email: account.email } });
    expect(await verificationTokens(account.id)).toHaveLength(1);
    expect(await countRows("email_verification_tokens", { userId: accounts.member.id })).toBe(memberTokens);
  });

  test("[auth.post.auth-resend-verification#flag-desligada] com as 3 flags de autenticação desligadas o reenvio continua funcionando", async ({ request }) => {
    const account = await newPending(request);
    await withAuthFlagsOff(request, admin, async () => {
      expect((await request.post(`${BASE}/auth/resend-verification`, { data: { email: account.email } })).status()).toBe(201);
    });
  });

  test("[auth.post.auth-resend-verification#email-enviado-ou-bloqueado-por-flag] reenvio com a flag de e-mail desligada grava skipped no outbox e nada pending", async ({ request }) => {
    const account = await newPending(request);
    const before = (await outboxFor(account.email, "email-verification")).length;
    await request.post(`${BASE}/auth/resend-verification`, { data: { email: account.email } });
    const rows = await outboxFor(account.email, "email-verification");
    expect(rows.length).toBe(before + 1);
    await expectNoDeliverableEmail(account.email);
  });

  /* ------------------------------ forgot-password ------------------------------ */

  test("[auth.post.auth-forgot-password#feliz] pedir redefinição: 201 e 1 token com validade futura em password_reset_tokens", async ({ request }) => {
    const account = track(await createAccount(request, admin, "member"));
    const res = await forgot(request, account.email);
    expect(res.status()).toBe(201);
    const tokens = await awaitResetTokens(account.id);
    expect(tokens).toHaveLength(1);
    expect(new Date(tokens[0].expiresAt.replace(" ", "T") + "Z").getTime()).toBeGreaterThan(Date.now() - 24 * 3600_000);
  });

  test("[auth.post.auth-forgot-password#validacao] e-mail inválido ou ausente: 400 e nenhum token criado", async ({ request }) => {
    const before = await authSnapshot();
    for (const data of [{}, { email: "nao-e-email" }]) {
      expect((await request.post(`${BASE}/auth/forgot-password`, { data })).status()).toBe(400);
    }
    expect(await authSnapshot()).toEqual(before);
  });

  test("[auth.post.auth-forgot-password#conflito-ou-duplicidade] segundo pedido substitui o primeiro: 1 token no banco e o antigo deixa de valer", async ({ request }) => {
    const account = track(await createAccount(request, admin, "member"));
    await forgot(request, account.email);
    const first = await resetToken(account.id);
    await forgot(request, account.email);
    await expect.poll(async () => (await resetTokens(account.id))[0]?.token, { timeout: 15_000 }).not.toBe(first);
    const tokens = await resetTokens(account.id);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].token).not.toBe(first);
    expect((await request.get(`${BASE}/auth/reset-password/validate`, { params: { token: first } })).status()).toBe(400);
  });

  for (const profile of PROFILES) {
    test(`${PROFILE_IDS.forgot[profile]} pedir redefinição com a sessão de ${profile}: 201 e o token é da conta do corpo`, async ({ request }) => {
      const account = track(await createAccount(request, admin, "member"));
      const headers = await headersFor(request, accounts, profile);
      expect((await forgot(request, account.email, headers)).status()).toBe(201);
      expect(await awaitResetTokens(account.id)).toHaveLength(1);
    });
  }

  test("[auth.post.auth-forgot-password#escopo-proprio-x-outro] com a sessão de B, o pedido para A cria token só para A", async ({ request }) => {
    const account = track(await createAccount(request, admin, "member"));
    const headers = await headersFor(request, accounts, "lider");
    const before = await countRows("password_reset_tokens", { userId: accounts.leader.id });
    await forgot(request, account.email, headers);
    expect(await awaitResetTokens(account.id)).toHaveLength(1);
    expect(await countRows("password_reset_tokens", { userId: accounts.leader.id })).toBe(before);
  });

  test("[auth.post.auth-forgot-password#email-enviado-ou-bloqueado-por-flag] com as flags de e-mail desligadas o link vira skipped no outbox e nada pending", async ({ request }) => {
    const account = track(await createAccount(request, admin, "member"));
    await forgot(request, account.email);
    await awaitResetTokens(account.id);
    await expect.poll(async () => (await outboxFor(account.email, "password-reset")).length, { timeout: 15_000 }).toBeGreaterThan(0);
    const rows = await outboxFor(account.email, "password-reset");
    expect(rows.every((r) => r.status === "skipped")).toBe(true);
  });

  /* ------------------------------ reset-password/validate ------------------------------ */

  const issueResetToken = async (request: import("@playwright/test").APIRequestContext) => {
    const account = track(await createAccount(request, admin, "member"));
    expect((await forgot(request, account.email)).status()).toBe(201);
    return { account, token: await resetToken(account.id) };
  };

  test("[auth.get.auth-reset-password-validate#feliz] token válido: 200 com o e-mail da conta e a linha do token continua no banco", async ({ request }) => {
    const { account, token } = await issueResetToken(request);
    const res = await request.get(`${BASE}/auth/reset-password/validate`, { params: { token } });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ valid: true, email: account.email });
    expect(await resetTokens(account.id)).toHaveLength(1);
  });

  for (const profile of PROFILES) {
    test(`${PROFILE_IDS.validate[profile]} validar token com a sessão de ${profile}: 200 e o e-mail é o do dono do token`, async ({ request }) => {
      const { account, token } = await issueResetToken(request);
      const headers = await headersFor(request, accounts, profile);
      const res = await request.get(`${BASE}/auth/reset-password/validate`, { headers, params: { token } });
      expect(res.status()).toBe(200);
      expect(((await res.json()) as { email: string }).email).toBe(account.email);
    });
  }

  test("[auth.get.auth-reset-password-validate#escopo-proprio-x-outro] com a sessão de B, validar o token de A revela só o e-mail de A e não altera nada", async ({ request }) => {
    const { account, token } = await issueResetToken(request);
    const headers = await headersFor(request, accounts, "membro");
    const before = await authSnapshot();
    const res = await request.get(`${BASE}/auth/reset-password/validate`, { headers, params: { token } });
    expect(((await res.json()) as { email: string }).email).toBe(account.email);
    expect(await authSnapshot()).toEqual(before);
  });

  /* ------------------------------ reset-password ------------------------------ */

  test("[auth.post.auth-reset-password#feliz] redefinir: 201, a senha nova loga e a antiga não, e o token some do banco", async ({ request }) => {
    const { account, token } = await issueResetToken(request);
    const res = await request.post(`${BASE}/auth/reset-password`, { data: { token, newPassword: NEW_PASSWORD } });
    expect(res.status()).toBe(201);
    expect(await resetTokens(account.id)).toHaveLength(0);
    expect((await request.post(`${BASE}/auth/login`, { data: { email: account.email, password: NEW_PASSWORD } })).status()).toBe(201);
    expect((await request.post(`${BASE}/auth/login`, { data: { email: account.email, password: ACCOUNT_PASSWORD } })).status()).toBe(401);
  });

  test("[auth.post.auth-reset-password#validacao] senha curta, sem senha ou sem token: 400 e o token continua válido com a senha antiga", async ({ request }) => {
    const { account, token } = await issueResetToken(request);
    const hash = (await userRow(account.id)).password;
    for (const data of [
      { token, newPassword: "123" },
      { token },
      { newPassword: NEW_PASSWORD },
      { token: "token-desconhecido", newPassword: NEW_PASSWORD },
    ]) {
      expect((await request.post(`${BASE}/auth/reset-password`, { data })).status()).toBe(400);
    }
    expect(await resetTokens(account.id)).toHaveLength(1);
    expect((await userRow(account.id)).password).toBe(hash);
  });

  test("[auth.post.auth-reset-password#conflito-ou-duplicidade] token de uso único: o reuso dá 400 e a senha continua a definida na primeira vez", async ({ request }) => {
    const { account, token } = await issueResetToken(request);
    await request.post(`${BASE}/auth/reset-password`, { data: { token, newPassword: NEW_PASSWORD } });
    const hash = (await userRow(account.id)).password;

    const reuse = await request.post(`${BASE}/auth/reset-password`, { data: { token, newPassword: "Cc3#outrasenha" } });
    expect(reuse.status()).toBe(400);
    expect((await userRow(account.id)).password).toBe(hash);
    expect((await request.post(`${BASE}/auth/login`, { data: { email: account.email, password: NEW_PASSWORD } })).status()).toBe(201);
  });

  for (const profile of PROFILES) {
    test(`${PROFILE_IDS.reset[profile]} redefinir senha com a sessão de ${profile}: 201 e só a conta dona do token muda`, async ({ request }) => {
      const { account, token } = await issueResetToken(request);
      const headers = await headersFor(request, accounts, profile);
      const res = await request.post(`${BASE}/auth/reset-password`, { headers, data: { token, newPassword: NEW_PASSWORD } });
      expect(res.status()).toBe(201);
      expect((await request.post(`${BASE}/auth/login`, { data: { email: account.email, password: NEW_PASSWORD } })).status()).toBe(201);
    });
  }

  test("[auth.post.auth-reset-password#escopo-proprio-x-outro] com a sessão de B, o token de A troca a senha de A; a senha de B continua valendo", async ({ request }) => {
    const { account, token } = await issueResetToken(request);
    const headers = await headersFor(request, accounts, "membro");
    const hashB = (await userRow(accounts.member.id)).password;
    const res = await request.post(`${BASE}/auth/reset-password`, { headers, data: { token, newPassword: NEW_PASSWORD } });
    expect(res.status()).toBe(201);
    expect((await userRow(accounts.member.id)).password).toBe(hashB);
    expect((await loginAccount(request, accounts.member)).userId).toBe(accounts.member.id);
    expect((await userByEmail(account.email))?.id).toBe(account.id);
  });

  test("[auth.post.auth-reset-password#email-enviado-ou-bloqueado-por-flag] com as flags de e-mail desligadas o aviso 'senha alterada' vira skipped no outbox", async ({ request }) => {
    const { account, token } = await issueResetToken(request);
    await request.post(`${BASE}/auth/reset-password`, { data: { token, newPassword: NEW_PASSWORD } });
    const rows = await outboxFor(account.email, "password-changed");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === "skipped")).toBe(true);
  });

  test("[auth.post.auth-forgot-password#resposta-identica] e-mail existente e inexistente: mesmo status, mesmo corpo, tempo parecido; só a conta existente ganha token", async ({ request }) => {
    const account = track(await createAccount(request, admin, "member"));
    const before = await countRows("password_reset_tokens");

    const t0 = Date.now();
    const known = await forgot(request, account.email);
    const knownMs = Date.now() - t0;
    const t1 = Date.now();
    const unknown = await forgot(request, uniqueEmail("fantasma"));
    const unknownMs = Date.now() - t1;

    expect(known.status()).toBe(201);
    expect(unknown.status()).toBe(known.status());
    expect(await unknown.json()).toEqual(await known.json());
    // Não espera o envio: nenhuma das duas respostas fica refém do e-mail.
    expect(Math.abs(knownMs - unknownMs)).toBeLessThan(1_500);

    await awaitResetTokens(account.id);
    await settleBackgroundWork();
    expect(await countRows("password_reset_tokens")).toBe(before + 1);
  });

  test("[auth.post.auth-forgot-password#resposta-identica] conta Google pendente (sem cadastro completo): a mesma resposta e nenhum token", async ({ request }) => {
    const pending = await newIncomplete(request);
    const res = await forgot(request, pending.email);
    expect(res.status()).toBe(201);
    await settleBackgroundWork();
    expect(await resetTokens(pending.id)).toHaveLength(0);
  });

  test("[auth.post.auth-resend-verification#resposta-identica] reenvio: e-mail existente e inexistente respondem igual", async ({ request }) => {
    const account = await newPending(request);
    const known = await request.post(`${BASE}/auth/resend-verification`, { data: { email: account.email } });
    const unknown = await request.post(`${BASE}/auth/resend-verification`, { data: { email: uniqueEmail("fantasma") } });
    expect(unknown.status()).toBe(known.status());
    expect(await unknown.json()).toEqual(await known.json());
  });
});
