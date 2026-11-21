import { API_URL } from "../../../playwright.live.config";
import { countRows } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, test } from "../support/live";
import { listObjects, objectExists } from "../support/s3";
import {
  allIds,
  expectDenied,
  expectFlagBlocks,
  expectNotFoundUnchanged,
  expectFeatureDisabled,
  expectNoDeliverableEmail,
  expectUserPhotosConsistent,
  newBody,
  newEmail,
  personalRows,
  photoRows,
  preferenceRows,
  send,
  sendPhoto,
  stateOf,
  userPrefix,
  userState,
  usersCount,
  withBucketUnchanged,
  createActor,
  png,
  FULL_PROFILE,
  ACTOR_PASSWORD,
  BAD_ID,
  setupWorld,
  teardownWorld,
  world,
  type FlagGuard,
  type Cast,
} from "./support";

/**
 * Usuários e perfis — escrita de usuários (/users) — plano 07, matriz `user-profile` (cada título começa com o ID da matriz).
 * Contas descartáveis (admin/líder/membro/outro membro) criadas pela API; cada efeito é provado por SELECT,
 * negativos provam banco e bucket inalterados e as flags são restauradas no fim.
 */
test.describe.serial("Usuários e perfis — escrita de usuários (/users)", () => {
  let cast: Cast;
  let seeded: string;
  let flags: FlagGuard;
  let extra: string[];

  test.beforeAll(async ({ request }) => {
    await setupWorld(request);
    ({ cast, seeded, flags, extra } = world);
  });

  test.afterAll(async ({ request }) => {
    await teardownWorld(request);
  });

  test("[user-profile.put.users-id#nao-encontrado] PUT /users/:id de usuário inexistente: 404 e o banco não muda", async ({ request }) => {
    await expectNotFoundUnchanged(request, "PUT", `/users/${BAD_ID}`, { name: "Fantasma" });
  });

  test("[user-profile.delete.users-id#nao-encontrado] DELETE /users/:id de usuário inexistente: 404 e o banco não muda", async ({ request }) => {
    await expectNotFoundUnchanged(request, "DELETE", `/users/${BAD_ID}`);
  });

  test("[user-profile.post.users#perfil-anonimo] POST /users como visitante: 401 e nenhum usuário criado", async ({ request }) => {
    await expectDenied(request, "POST", "/users", "anon", { name: `Novo E2E ${RUN_TAG}`, email: newEmail(), phone: "11999990000", password: ACTOR_PASSWORD, role: "member" }, 401);
  });

  test("[user-profile.post.users#perfil-lider] POST /users como líder: 403 e nenhum usuário criado", async ({ request }) => {
    await expectDenied(request, "POST", "/users", "leader", { name: `Novo E2E ${RUN_TAG}`, email: newEmail(), phone: "11999990000", password: ACTOR_PASSWORD, role: "member" }, 403);
  });

  test("[user-profile.post.users#perfil-admin] POST /users como admin: 201, linha em users com hash (nunca a senha) e perfil de membro criado", async ({ request }) => {
    const res = await send(request, "POST", "/users", cast.admin.token, { name: `Novo E2E ${RUN_TAG}`, email: newEmail(), phone: "11999990000", password: ACTOR_PASSWORD, role: "member" });
    expect(res.status(), await res.text()).toBe(201);
    const { id } = (await res.json()) as { id: string };
    extra.push(id);
    const row = await userState(id);
    expect(row?.role).toBe("member");
    expect(row?.password).not.toBe(ACTOR_PASSWORD);
    expect(row?.password).toMatch(/^\$2[aby]\$/);
    expect(await countRows("member_profiles", { user_id: id })).toBe(1);
  });

  test("[user-profile.post.users#feliz] POST /users: o admin cria um líder; SELECT prova usuário + perfil de líder, a resposta não traz segredos e o login do novo usuário funciona", async ({ request }) => {
    const email = newEmail();
    const res = await send(request, "POST", "/users", cast.admin.token, { name: "Líder Novo", email, phone: "11999990000", password: ACTOR_PASSWORD, role: "leader", active: true, completed: true });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    extra.push(String(body.id));
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("refreshToken");
    expect(await userState(String(body.id))).toMatchObject({ email, role: "leader", active: 1 });
    expect(await countRows("leader_profiles", { user_id: String(body.id) })).toBe(1);
    const login = await request.post(`${API_URL}/auth/login`, { data: { email, password: ACTOR_PASSWORD } });
    expect(login.status()).toBe(201);
  });

  test("[user-profile.post.users#validacao] POST /users com e-mail inválido, senha curta e papel desconhecido: 400 e nenhum usuário criado", async ({ request }) => {
    const before = await usersCount();
    for (const patch of [{ email: "nao-e-email" }, { password: "123" }, { role: "superuser" }, { name: undefined }]) {
      const res = await send(request, "POST", "/users", cast.admin.token, { ...JSON.parse(JSON.stringify(newBody())), ...patch });
      expect(res.status()).toBe(400);
    }
    expect(await usersCount()).toBe(before);
  });

  test("[user-profile.post.users#conflito-ou-duplicidade] POST /users com e-mail já cadastrado: recusado e continua 1 linha com o e-mail", async ({ request }) => {
    const before = await usersCount();
    const res = await send(request, "POST", "/users", cast.admin.token, { ...newBody(), email: cast.victim.email });
    expect([400, 409]).toContain(res.status());
    expect(await usersCount()).toBe(before);
    expect(await countRows("users", { email: cast.victim.email })).toBe(1);
  });

  test("[user-profile.post.users#flag-desligada] POST /users com user_management desligada: 403 FEATURE_DISABLED e nenhum usuário criado", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "POST", "/users", "admin", { name: `Novo E2E ${RUN_TAG}`, email: newEmail(), phone: "11999990000", password: ACTOR_PASSWORD, role: "member" });
  });

  test("[user-profile.post.users#s3-sem-orfao] POST /users não toca no bucket (a foto vem depois): nenhum objeto novo, 0 órfãos", async ({ request }) => {
    await withBucketUnchanged(async () => {
      const res = await send(request, "POST", "/users", cast.admin.token, { name: `Novo E2E ${RUN_TAG}`, email: newEmail(), phone: "11999990000", password: ACTOR_PASSWORD, role: "member" });
      expect(res.status()).toBe(201);
      extra.push(((await res.json()) as { id: string }).id);
    });
    await expectUserPhotosConsistent();
  });

  test("[user-profile.post.users#email-enviado-ou-bloqueado-por-flag] POST /users com as flags email_* desligadas: nenhum envio real para o novo usuário (só `skipped`)", async ({ request }) => {
    const email = newEmail();
    const res = await send(request, "POST", "/users", cast.admin.token, { ...newBody(), email });
    expect(res.status()).toBe(201);
    extra.push(((await res.json()) as { id: string }).id);
    await expectNoDeliverableEmail(email);
  });

  test("[user-profile.put.users-id#perfil-anonimo] PUT /users/:id como visitante: 401 e o usuário não muda", async ({ request }) => {
    await expectDenied(request, "PUT", `/users/${cast.victim.id}`, "anon", { name: "X" }, 401);
  });

  test("[user-profile.put.users-id#perfil-lider] PUT /users/:id como líder: 403 e o usuário não muda", async ({ request }) => {
    await expectDenied(request, "PUT", `/users/${cast.victim.id}`, "leader", { name: "X", role: "admin" }, 403);
  });

  test("[user-profile.put.users-id#perfil-admin] PUT /users/:id como admin: 200 e o nome do usuário muda no banco", async ({ request }) => {
    const res = await send(request, "PUT", `/users/${cast.victim.id}`, cast.admin.token, { name: "Renomeado pelo admin" });
    expect(res.status(), await res.text()).toBe(200);
    expect((await userState(cast.victim.id))?.name).toBe("Renomeado pelo admin");
  });

  test("[user-profile.put.users-id#feliz] PUT /users/:id: o admin muda nome, telefone e ativação; SELECT confirma e a resposta não traz segredos", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "edita");
    extra.push(target.id);
    const res = await send(request, "PUT", `/users/${target.id}`, cast.admin.token, { name: "Editado", phone: "11955554444", active: false });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty("password");
    expect(await userState(target.id)).toMatchObject({ name: "Editado", phone: "11955554444", active: 0 });
  });

  test("[user-profile.put.users-id#validacao] PUT /users/:id com papel desconhecido e campo fora do contrato: 400 e o usuário não muda", async ({ request }) => {
    const before = await stateOf([cast.victim.id]);
    for (const data of [{ role: "superuser" }, { active: "talvez" }, { id: BAD_ID }]) {
      expect((await send(request, "PUT", `/users/${cast.victim.id}`, cast.admin.token, data)).status()).toBe(400);
    }
    expect(await stateOf([cast.victim.id])).toBe(before);
  });

  test("[user-profile.put.users-id#conflito-ou-duplicidade] PUT /users/:id com o e-mail de OUTRO usuário: não duplica (recusado ou ignorado) e continua 1 linha por e-mail", async ({ request }) => {
    await send(request, "PUT", `/users/${cast.victim.id}`, cast.admin.token, { email: cast.member.email });
    expect(await countRows("users", { email: cast.member.email })).toBe(1);
  });

  test("[user-profile.put.users-id#flag-desligada] PUT /users/:id com user_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "PUT", `/users/${cast.victim.id}`, "admin", { name: "Bloqueado" });
  });

  test("[user-profile.put.users-id#s3-sem-orfao] PUT /users/:id mantém a foto do usuário referenciada e o bucket intacto", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "edita-foto");
    extra.push(target.id);
    expect((await sendPhoto(request, "/profile/image", target.token)).status()).toBe(200);
    const photo = await photoRows(target.id);
    await withBucketUnchanged(async () => {
      expect((await send(request, "PUT", `/users/${target.id}`, cast.admin.token, { name: "Com Foto" })).status()).toBe(200);
    });
    expect(await photoRows(target.id)).toEqual(photo);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.put.users-id#email-enviado-ou-bloqueado-por-flag] PUT /users/:id aprovando uma conta inativa: com a flag de e-mail desligada não há envio real (só `skipped`)", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "aprova");
    extra.push(target.id);
    expect((await send(request, "PUT", `/users/${target.id}`, cast.admin.token, { active: false })).status()).toBe(200);
    expect((await send(request, "PUT", `/users/${target.id}`, cast.admin.token, { active: true })).status()).toBe(200);
    await expectNoDeliverableEmail(target.email);
  });

  test("[user-profile.delete.users-id#perfil-anonimo] DELETE /users/:id como visitante: 401 e o usuário continua", async ({ request }) => {
    await expectDenied(request, "DELETE", `/users/${cast.victim.id}`, "anon", undefined, 401);
  });

  test("[user-profile.delete.users-id#perfil-lider] DELETE /users/:id como líder: 403 e o usuário continua", async ({ request }) => {
    await expectDenied(request, "DELETE", `/users/${cast.victim.id}`, "leader", undefined, 403);
  });

  test("[user-profile.delete.users-id#perfil-admin] DELETE /users/:id como admin: 200 e a linha de users some", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "del-admin");
    const res = await send(request, "DELETE", `/users/${target.id}`, cast.admin.token);
    expect(res.status(), await res.text()).toBe(200);
    expect(await countRows("users", { id: target.id })).toBe(0);
  });

  test("[user-profile.delete.users-id#feliz] DELETE /users/:id: o admin apaga membro com perfil e foto; SELECT: 0 linhas em users, member_profiles, personal_data, preferências e mídia", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "del-completo");
    await send(request, "POST", "/profiles", target.token, FULL_PROFILE);
    await sendPhoto(request, "/profile/image", target.token);
    expect(await countRows("member_profiles", { user_id: target.id })).toBe(1);
    const res = await send(request, "DELETE", `/users/${target.id}`, cast.admin.token);
    expect(res.status(), await res.text()).toBe(200);
    expect(await countRows("users", { id: target.id })).toBe(0);
    expect(await countRows("member_profiles", { user_id: target.id })).toBe(0);
    expect(await personalRows(target.id)).toHaveLength(0);
    expect(await preferenceRows(target.id)).toHaveLength(0);
    expect(await photoRows(target.id)).toHaveLength(0);
  });

  test("[user-profile.delete.users-id#flag-desligada] DELETE /users/:id com user_management desligada: 403 FEATURE_DISABLED e o usuário continua", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "DELETE", `/users/${cast.victim.id}`, "admin");
  });

  test("[user-profile.delete.users-id#s3-sem-orfao] DELETE /users/:id com foto: o objeto sai do bucket e a linha de mídia também (0 órfãos, 0 referências quebradas)", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "del-foto");
    expect((await sendPhoto(request, "/profile/image", target.token)).status()).toBe(200);
    const [photo] = await photoRows(target.id);
    expect(await objectExists(String(photo.storageKey))).toBe(true);
    expect((await send(request, "DELETE", `/users/${target.id}`, cast.admin.token)).status()).toBe(200);
    expect(await objectExists(String(photo.storageKey))).toBe(false);
    expect(await photoRows(target.id)).toHaveLength(0);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.delete.users-id#email-enviado-ou-bloqueado-por-flag] DELETE /users/:id não dispara e-mail para o usuário apagado", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "del-mail");
    expect((await send(request, "DELETE", `/users/${target.id}`, cast.admin.token)).status()).toBe(200);
    await expectNoDeliverableEmail(target.email);
  });

});
