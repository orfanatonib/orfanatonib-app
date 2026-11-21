import { createHmac } from "node:crypto";

import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { countRows, expectRow, queryAll, queryOne } from "../support/db";
import { promoteToAdminInDb } from "../support/db-admin";
import { apiJwtSecret } from "../support/env";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, type LoginResult } from "../support/live";

/** Suporte dos E2E de autenticação: contas descartáveis criadas pela API e provas por SELECT. */

export const ACCOUNT_PASSWORD = "Aa1!senhaforte";
export const NEW_PASSWORD = "Bb2@novasenha";

export type AccountRole = "admin" | "leader" | "member";

export interface Account {
  id: string;
  email: string;
  password: string;
  role: AccountRole;
}

export const AUTH_FLAGS = ["public_registration", "google_login", "password_recovery"] as const;
export type AuthFlag = (typeof AUTH_FLAGS)[number];

let sequence = 0;
/** E-mail único e rastreável desta rodada (`<RUN_TAG>-<n>@orfanatonib.test`). */
export const uniqueEmail = (label = "auth"): string => `${RUN_TAG}-${label}-${(sequence += 1)}@orfanatonib.test`;

/** Corpo de um cadastro público válido. */
export const registerBody = (email: string, role: AccountRole = "member") => ({
  name: "Conta E2E Auth",
  email,
  phone: "11999990000",
  password: ACCOUNT_PASSWORD,
  role,
});

export async function adminSession(request: APIRequestContext): Promise<LoginResult> {
  return loginAs(request, "admin");
}

/** Cria a conta pelo cadastro de administração (já ativa; `completed` configurável). Admin: promovido direto no banco. */
export async function createAccount(
  request: APIRequestContext,
  adminToken: string,
  role: AccountRole,
  options: { completed?: boolean; label?: string } = {},
): Promise<Account> {
  const email = uniqueEmail(options.label ?? role);
  const res = await request.post(`${API_URL}/users`, {
    headers: authHeaders(adminToken),
    data: {
      name: `E2E ${role}`,
      email,
      phone: "11999990000",
      password: ACCOUNT_PASSWORD,
      // A API não cria admin: ele nasce membro e é promovido direto no banco.
      role: role === "admin" ? "member" : role,
      active: true,
      completed: options.completed ?? true,
      commonUser: false,
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { id: string };
  if (role === "admin") await promoteToAdminInDb(body.id);
  return { id: body.id, email, password: ACCOUNT_PASSWORD, role };
}

export async function loginAccount(request: APIRequestContext, account: Account): Promise<LoginResult> {
  const res = await request.post(`${API_URL}/auth/login`, { data: { email: account.email, password: account.password } });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { accessToken: string; refreshToken: string; user: { id: string } };
  return { accessToken: body.accessToken, refreshToken: body.refreshToken, userId: body.user.id };
}

/** Apaga as contas pela API e prova que não sobrou usuário nem token. */
export async function removeAccounts(request: APIRequestContext, adminToken: string, ids: readonly string[]): Promise<void> {
  for (const id of ids) {
    await request.delete(`${API_URL}/users/${id}`, { headers: authHeaders(adminToken) });
    expect(await countRows("users", { id }), `usuário ${id} removido`).toBe(0);
    expect(await countRows("email_verification_tokens", { userId: id })).toBe(0);
    expect(await countRows("password_reset_tokens", { userId: id })).toBe(0);
  }
}

export interface UserRow extends Record<string, unknown> {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  active: number;
  completed: number;
  password: string;
  refreshToken: string | null;
  emailVerifiedAt: string | null;
}

export const userRow = (id: string): Promise<UserRow> => expectRow<UserRow>("users", { id });

export const userByEmail = async (email: string): Promise<UserRow | null> =>
  queryOne<UserRow>("SELECT * FROM users WHERE email = ?", [email]);

/** Retrato das tabelas de autenticação, para provar que um negativo não mudou nada. */
export async function authSnapshot(): Promise<{ users: number; verification: number; reset: number; outbox: number }> {
  return {
    users: await countRows("users"),
    verification: await countRows("email_verification_tokens"),
    reset: await countRows("password_reset_tokens"),
    outbox: await countRows("email_outbox"),
  };
}

export async function verificationTokens(userId: string): Promise<Array<{ token: string; usedAt: string | null; expiresAt: string }>> {
  return queryAll("SELECT token, usedAt, expiresAt FROM email_verification_tokens WHERE userId = ? ORDER BY createdAt", [userId]);
}

export async function resetTokens(userId: string): Promise<Array<{ token: string; expiresAt: string }>> {
  return queryAll("SELECT token, expiresAt FROM password_reset_tokens WHERE userId = ? ORDER BY createdAt", [userId]);
}

/** Linhas do outbox para um destinatário (o SMTP não faz parte do E2E). */
export async function outboxFor(recipient: string, templateKey?: string): Promise<Array<{ templateKey: string; status: string }>> {
  return templateKey
    ? queryAll("SELECT templateKey, status FROM email_outbox WHERE recipient = ? AND templateKey = ?", [recipient, templateKey])
    : queryAll("SELECT templateKey, status FROM email_outbox WHERE recipient = ?", [recipient]);
}

/** Com as flags `email_*` desligadas nada fica pendente: o aviso vira `skipped`. */
export async function expectNoDeliverableEmail(recipient: string): Promise<void> {
  const rows = await outboxFor(recipient);
  expect(rows.filter((r) => r.status !== "skipped"), `nada além de skipped no outbox de ${recipient}`).toEqual([]);
}

export function jwtClaims(token: string): { sub: string; role: string; email: string } {
  const payload = token.split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub: string; role: string; email: string };
}

export async function setFlag(request: APIRequestContext, adminToken: string, key: AuthFlag, enabled: boolean): Promise<void> {
  const res = await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(adminToken), data: { enabled } });
  expect(res.ok(), await res.text()).toBeTruthy();
}

export async function flagStates(): Promise<Record<AuthFlag, boolean>> {
  const out = {} as Record<AuthFlag, boolean>;
  for (const key of AUTH_FLAGS) {
    const row = await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]);
    expect(row, `flag ${key} no catálogo`).not.toBeNull();
    out[key] = row?.enabled === 1;
  }
  return out;
}

export async function bodyOf<T>(res: APIResponse): Promise<T> {
  return (await res.json()) as T;
}

export type Profile = "anonimo" | "membro" | "lider" | "admin";
export const PROFILE_ROLE: Record<Exclude<Profile, "anonimo">, AccountRole> = {
  membro: "member",
  lider: "leader",
  admin: "admin",
};

/** Contas descartáveis, uma por papel, criadas pelo admin no início do arquivo. */
export type ProfileAccounts = Record<AccountRole, Account>;

export async function createProfileAccounts(request: APIRequestContext, adminToken: string): Promise<ProfileAccounts> {
  return {
    member: await createAccount(request, adminToken, "member"),
    leader: await createAccount(request, adminToken, "leader"),
    admin: await createAccount(request, adminToken, "admin"),
  };
}

/** Cabeçalho de autorização de uma sessão real do perfil (anônimo = sem cabeçalho). */
export async function headersFor(
  request: APIRequestContext,
  accounts: ProfileAccounts,
  profile: Profile,
): Promise<Record<string, string>> {
  if (profile === "anonimo") return {};
  const session = await loginAccount(request, accounts[PROFILE_ROLE[profile]]);
  return authHeaders(session.accessToken);
}

/** Desliga as três flags de autenticação, executa e restaura o estado original (mesmo se falhar). */
export async function withAuthFlagsOff<T>(
  request: APIRequestContext,
  adminToken: string,
  action: () => Promise<T>,
): Promise<T> {
  const original = await flagStates();
  try {
    for (const key of AUTH_FLAGS) await setFlag(request, adminToken, key, false);
    return await action();
  } finally {
    for (const key of AUTH_FLAGS) await setFlag(request, adminToken, key, original[key]);
  }
}

/** Cadastra pelo endpoint público e devolve a conta (inativa, e-mail não confirmado). */
export async function registerPublic(
  request: APIRequestContext,
  headers: Record<string, string> = {},
  role: AccountRole = "member",
): Promise<{ account: Account; response: APIResponse }> {
  const email = uniqueEmail("reg");
  const response = await request.post(`${API_URL}/auth/register`, { headers, data: registerBody(email, role) });
  const text = await response.text();
  expect(response.status(), text).toBe(201);
  const body = JSON.parse(text) as { user: { id: string } };
  return { account: { id: body.user.id, email, password: ACCOUNT_PASSWORD, role }, response };
}

/* ------------------------------ token de conclusão do cadastro Google ------------------------------ */

const b64url = (value: object): string => Buffer.from(JSON.stringify(value)).toString("base64url");

export interface CompletionTokenOptions {
  /** Segundos até expirar (negativo = já expirado). Padrão: 900 (15 min), como a API. */
  ttlSeconds?: number;
  purpose?: string;
  /** Assina com o segredo da sessão em vez do derivado (token forjado). */
  withSessionSecret?: boolean;
}

/**
 * O que `POST /auth/google` devolveria a quem provou a posse da conta Google. O Google real não
 * entra nos E2E, então o teste assina o token com o mesmo segredo derivado da API
 * (HMAC-SHA256 de `JWT_SECRET` com o propósito) — a rota é exercitada de verdade, sem mock.
 */
export function completionTokenFor(userId: string, options: CompletionTokenOptions = {}): string {
  const purpose = options.purpose ?? "complete_register";
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({
    sub: userId,
    purpose,
    jti: `e2e-${now}-${Math.random().toString(36).slice(2)}`,
    iat: now,
    exp: now + (options.ttlSeconds ?? 900),
  })}`;
  const secret = options.withSessionSecret
    ? apiJwtSecret()
    : createHmac("sha256", apiJwtSecret()).update("complete_register").digest("hex");
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

/** `forgot-password` responde antes de processar: espera o token aparecer no banco. */
export async function awaitResetTokens(userId: string, count = 1): Promise<Array<{ token: string; expiresAt: string }>> {
  await expect.poll(async () => (await resetTokens(userId)).length, { timeout: 15_000 }).toBe(count);
  return resetTokens(userId);
}

/** Prova de ausência após uma resposta assíncrona: dá tempo ao processamento em segundo plano antes do SELECT. */
export const settleBackgroundWork = (ms = 2_000): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
