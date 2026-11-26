import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { promoteToAdminInDb } from "../support/db-admin";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs } from "../support/live";
import { PNG_1X1 } from "../support/media-scenarios";
import { expectBucketUnchanged, expectNoBrokenRefs, expectNoOrphans, snapshotBucket, uploadsPrefix } from "../support/s3";
import { outboxRows } from "../support/outbox";

/** Suporte dos E2E de usuários e perfis (plano 07): contas descartáveis criadas pela API, provas por SELECT. */

export const ACTOR_PASSWORD = "Aa1!senhaforte";
export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
/** Flags que governam `/users` e `/profiles` (`@FeatureFlag` dos controllers). */
export const USER_PROFILE_FLAGS = ["user_management", "member_area", "leader_management"] as const;

export type ActorRole = "admin" | "leader" | "member";

export interface Actor {
  id: string;
  email: string;
  role: ActorRole;
  token: string;
  refreshToken: string;
}

export interface Cast {
  /** Admin descartável (um admin de verdade, promovido no banco). */
  admin: Actor;
  leader: Actor;
  member: Actor;
  /** Outro membro: alvo das ações "de outro usuário". */
  victim: Actor;
}

let sequence = 0;
const emailOf = (label: string): string => `${RUN_TAG}-up-${label}-${(sequence += 1)}@orfanatonib.test`;

export async function createActor(request: APIRequestContext, seededAdminToken: string, role: ActorRole, label: string = role): Promise<Actor> {
  const email = emailOf(label);
  const res = await request.post(`${API_URL}/users`, {
    headers: authHeaders(seededAdminToken),
    data: {
      name: `E2E ${label}`,
      email,
      phone: "11999990000",
      password: ACTOR_PASSWORD,
      role: role === "admin" ? "member" : role,
      active: true,
      completed: true,
      commonUser: false,
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const { id } = (await res.json()) as { id: string };
  if (role === "admin") await promoteToAdminInDb(id);
  const login = await request.post(`${API_URL}/auth/login`, { data: { email, password: ACTOR_PASSWORD } });
  expect(login.status(), await login.text()).toBe(201);
  const { accessToken, refreshToken } = (await login.json()) as { accessToken: string; refreshToken: string };
  return { id, email, role, token: accessToken, refreshToken };
}

export async function createCast(request: APIRequestContext): Promise<{ cast: Cast; seeded: string; all: Actor[] }> {
  const seeded = (await loginAs(request, "admin")).accessToken;
  const [admin, leader, member, victim] = [
    await createActor(request, seeded, "admin"),
    await createActor(request, seeded, "leader"),
    await createActor(request, seeded, "member"),
    await createActor(request, seeded, "member", "victim"),
  ];
  return { cast: { admin, leader, member, victim }, seeded, all: [admin, leader, member, victim] };
}

/** Apaga as contas pela API e prova que não sobrou linha de usuário. */
export async function removeActors(request: APIRequestContext, seededAdminToken: string, ids: readonly string[]): Promise<void> {
  for (const id of ids) {
    await request.delete(`${API_URL}/users/${id}`, { headers: authHeaders(seededAdminToken) });
    expect(await countRows("users", { id }), `usuário ${id} removido`).toBe(0);
    expect(await countRows("personal_data", { userId: id })).toBe(0);
    expect(await countRows("user_preferences", { userId: id })).toBe(0);
  }
}

export async function send(
  request: APIRequestContext,
  verb: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  token?: string,
  data?: unknown,
): Promise<APIResponse> {
  return request.fetch(`${API_URL}${path}`, {
    method: verb,
    headers: token ? authHeaders(token) : {},
    data: verb === "GET" || verb === "DELETE" ? undefined : (data ?? {}),
  });
}

/* ------------------------------ estado no banco ------------------------------ */

export interface UserState extends Record<string, unknown> {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  active: number;
  completed: number;
  password: string;
}

export const userState = (id: string): Promise<UserState | null> =>
  queryOne<UserState>("SELECT id, email, name, phone, role, active, completed, password FROM users WHERE id = ?", [id]);

export const personalRows = (userId: string) =>
  queryAll<{ gender: string | null; birthDate: string | null; gaLeaderName: string | null }>(
    "SELECT gender, birthDate, gaLeaderName FROM personal_data WHERE userId = ?",
    [userId],
  );

export const preferenceRows = (userId: string) =>
  queryAll<{ favoriteColor: string | null; favoriteFood: string | null; whatMakesYouSmile: string | null }>(
    "SELECT favoriteColor, favoriteFood, whatMakesYouSmile FROM user_preferences WHERE userId = ?",
    [userId],
  );

export const photoRows = (userId: string) =>
  queryAll<{ url: string; storageKey: string | null; isLocalFile: number }>(
    "SELECT url, storageKey, isLocalFile FROM media_items WHERE targetId = ? AND targetType = 'UserEntity'",
    [userId],
  );

/** Retrato do que as rotas de perfil/usuário gravam, para provar que um negativo não mudou nada. */
export async function stateOf(ids: readonly string[]): Promise<string> {
  const parts = [];
  for (const id of ids) parts.push([await userState(id), await personalRows(id), await preferenceRows(id), await photoRows(id)]);
  return JSON.stringify(parts);
}

/** Usuários criados/tentados por ESTA rodada (tag no e-mail ou no nome): imune a outras suítes mexendo em `users`. */
export const usersCount = async (): Promise<number> =>
  Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE email LIKE ? OR name LIKE ?", [`%${RUN_TAG}%`, `%${RUN_TAG}%`]))?.n ?? 0);

/** Todos os usuários do banco (só para comparar com listagens lidas no mesmo instante). */
export const allUsersCount = (): Promise<number> => countRows("users");

/* ------------------------------ asserções reutilizáveis ------------------------------ */

export async function expectFeatureDisabled(res: APIResponse): Promise<void> {
  expect(res.status(), await res.text()).toBe(403);
  expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
}

/** O e-mail do usuário não tem nenhum envio real pendente: só `skipped` (flags `email_*` desligadas no E2E). */
export async function expectNoDeliverableEmail(recipient: string): Promise<void> {
  const rows = await outboxRows<{ status: string }>("status", "recipient = ?", [recipient]);
  expect(rows.filter((r) => r.status !== "skipped"), `nada além de skipped no outbox de ${recipient}`).toEqual([]);
}

export const userPrefix = (): string => `${uploadsPrefix()}User/`;

/** Invariante de S3 escopado nas fotos de usuário: sem órfão e sem referência quebrada. */
export async function expectUserPhotosConsistent(): Promise<void> {
  await expectNoOrphans(userPrefix());
  await expectNoBrokenRefs(userPrefix());
}

export const png = (name = "foto.png") => ({ name, mimeType: "image/png", buffer: PNG_1X1 });

/** Envia a foto como multipart (o formato que a UI usa). */
export function sendPhoto(
  request: APIRequestContext,
  path: string,
  token: string,
  file: { name: string; mimeType: string; buffer: Buffer } = png(),
  title = "Foto",
): Promise<APIResponse> {
  return request.patch(`${API_URL}${path}`, {
    headers: authHeaders(token),
    multipart: { imageData: JSON.stringify({ title, uploadType: "upload", fieldKey: "file" }), file },
  });
}

/** Garante que uma ação que falha não deixou objeto novo no bucket. */
export async function withBucketUnchanged<T>(action: () => Promise<T>): Promise<T> {
  const before = await snapshotBucket();
  const result = await action();
  await expectBucketUnchanged(before);
  return result;
}

export const FULL_PROFILE = {
  personalData: { birthDate: "2001-05-10", gender: "F", gaLeaderName: "Líder GA", gaLeaderContact: "11988887777" },
  preferences: { favoriteColor: "azul", favoriteFood: "pizza", whatMakesYouSmile: "música" },
};

/** Flags: guarda o estado e restaura no fim (o `request` vem de cada teste: o do `beforeAll` não pode ser reaproveitado). */
export class FlagGuard {
  private readonly before = new Map<string, boolean>();

  constructor(private readonly adminToken: string) {}

  async capture(keys: readonly string[] = USER_PROFILE_FLAGS): Promise<void> {
    for (const key of keys) {
      const row = await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]);
      this.before.set(key, (row?.enabled ?? 1) === 1);
    }
  }

  async set(request: APIRequestContext, enabled: boolean, keys: readonly string[] = USER_PROFILE_FLAGS): Promise<void> {
    for (const key of keys) {
      const res = await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(this.adminToken), data: { enabled } });
      expect(res.ok(), await res.text()).toBeTruthy();
    }
  }

  async restore(request: APIRequestContext): Promise<void> {
    for (const [key, enabled] of this.before) {
      await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(this.adminToken), data: { enabled } });
    }
  }
}

/* ------------------------------ mundo compartilhado do arquivo ------------------------------ */

/** Estado do arquivo de spec em execução (os arquivos rodam em série; cada um recria o seu no `beforeAll`). */
export const world = {
  cast: undefined as unknown as Cast,
  seeded: "",
  flags: undefined as unknown as FlagGuard,
  extra: [] as string[],
};

export async function setupWorld(request: APIRequestContext): Promise<void> {
  const { cast, seeded } = await createCast(request);
  world.cast = cast;
  world.seeded = seeded;
  world.extra = [];
  world.flags = new FlagGuard(seeded);
  await world.flags.capture();
}

export async function teardownWorld(request: APIRequestContext): Promise<void> {
  await world.flags.restore(request);
  const { admin, leader, member, victim } = world.cast;
  await removeActors(request, world.seeded, [...world.extra, admin.id, leader.id, member.id, victim.id]);
  await expectUserPhotosConsistent();
  await closeDb();
}

export type Who = "anon" | ActorRole | "victim";
export const tok = (who: Who): string | undefined => (who === "anon" ? undefined : world.cast[who].token);
export const allIds = (): string[] => {
  const { admin, leader, member, victim } = world.cast;
  return [admin.id, leader.id, member.id, victim.id];
};

export const newEmail = (): string => emailOf("novo");
export const newBody = () => ({ name: `Novo E2E ${RUN_TAG}`, email: newEmail(), phone: "11999990000", password: ACTOR_PASSWORD, role: "member" });

/** Lê uma rota GET e confere o status; respostas 200 nunca carregam hash de senha nem refresh token. */
export async function expectReadStatus(request: APIRequestContext, path: string, who: Who, status: number): Promise<void> {
  const res = await send(request, "GET", path, tok(who));
  expect(res.status(), await res.text()).toBe(status);
  if (status === 200) {
    const raw = JSON.stringify(await res.json());
    expect(raw).not.toContain("$2b$");
    expect(raw).not.toContain('"refreshToken"');
  }
}

export async function expectOwnProfile(request: APIRequestContext, path: string, who: ActorRole): Promise<void> {
  const body = (await (await send(request, "GET", path, tok(who))).json()) as { id: string; email: string };
  expect(body.id).toBe(world.cast[who].id);
  expect(body.email).toBe(world.cast[who].email);
}

/** Negativo de autorização: status esperado e NADA muda (usuários, perfis, fotos, bucket). */
export async function expectDenied(
  request: APIRequestContext,
  verb: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  who: Who,
  data: unknown,
  status: number,
): Promise<void> {
  const before = await stateOf(allIds());
  const total = await usersCount();
  await withBucketUnchanged(async () => {
    const res = await send(request, verb, path, tok(who), data);
    expect(res.status(), await res.text()).toBe(status);
  });
  expect(await stateOf(allIds())).toBe(before);
  expect(await usersCount()).toBe(total);
}

/** Rota com id inexistente (admin): 404 e o banco/bucket não mudam. */
export async function expectNotFoundUnchanged(
  request: APIRequestContext,
  verb: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  data?: unknown,
  photo = false,
): Promise<void> {
  const before = await stateOf(allIds());
  const total = await usersCount();
  await withBucketUnchanged(async () => {
    const res = photo ? await sendPhoto(request, path, world.cast.admin.token) : await send(request, verb, path, world.cast.admin.token, data);
    expect(res.status(), await res.text()).toBe(404);
  });
  expect(await stateOf(allIds())).toBe(before);
  expect(await usersCount()).toBe(total);
}

/** Desliga as flags da rota: 403 FEATURE_DISABLED e o banco não muda. As flags voltam no `finally`. */
export async function expectFlagBlocks(
  flags: FlagGuard,
  request: APIRequestContext,
  keys: readonly string[],
  verb: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  who: Who,
  data?: unknown,
): Promise<void> {
  const before = await stateOf(allIds());
  const total = await usersCount();
  await flags.set(request, false, keys);
  try {
    await expectFeatureDisabled(await send(request, verb, path, tok(who), data));
  } finally {
    await flags.set(request, true, keys);
  }
  expect(await stateOf(allIds())).toBe(before);
  expect(await usersCount()).toBe(total);
}

/** Rota sem `@FeatureFlag`: desligar todas as flags de usuários não a bloqueia (só o guard de papel decide). */
export async function expectFlagDoesNotBlock(
  flags: FlagGuard,
  request: APIRequestContext,
  verb: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  who: Who | Actor,
  data?: unknown,
): Promise<void> {
  const token = typeof who === "string" ? tok(who) : who.token;
  await flags.set(request, false);
  try {
    const res = await send(request, verb, path, token, data);
    expect(res.status(), await res.text()).toBe(200);
  } finally {
    await flags.set(request, true);
  }
}

/** Troca a senha do ator: o hash muda no banco e só a senha nova autentica. */
export async function expectPasswordChanged(request: APIRequestContext, actor: Actor): Promise<void> {
  const next = `Nova@${Date.now().toString(36)}x1`;
  const before = (await userState(actor.id))?.password;
  const res = await send(request, "PATCH", "/profile/password", actor.token, { newPassword: next });
  expect(res.status(), await res.text()).toBe(200);
  expect((await userState(actor.id))?.password).not.toBe(before);
  const login = await request.post(`${API_URL}/auth/login`, { data: { email: actor.email, password: next } });
  expect(login.status()).toBe(201);
}
