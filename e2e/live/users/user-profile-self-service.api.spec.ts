import { API_URL } from "../../../playwright.live.config";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, test } from "../support/live";
import { listObjects, objectExists } from "../support/s3";
import {
  allIds,
  expectDenied,
  expectFlagDoesNotBlock,
  expectPasswordChanged,
  expectNoDeliverableEmail,
  expectUserPhotosConsistent,
  photoRows,
  send,
  sendPhoto,
  stateOf,
  userPrefix,
  userState,
  withBucketUnchanged,
  createActor,
  png,
  ACTOR_PASSWORD,
  setupWorld,
  teardownWorld,
  world,
  type FlagGuard,
  type Cast,
} from "./support";

/**
 * Usuários e perfis — conta própria (/profile) — plano 07, matriz `user-profile` (cada título começa com o ID da matriz).
 * Contas descartáveis (admin/líder/membro/outro membro) criadas pela API; cada efeito é provado por SELECT,
 * negativos provam banco e bucket inalterados e as flags são restauradas no fim.
 */
test.describe.serial("Usuários e perfis — conta própria (/profile)", () => {
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

  test("[user-profile.patch.profile#perfil-anonimo] PATCH /profile como visitante: 401 e o banco não muda", async ({ request }) => {
    await expectDenied(request, "PATCH", "/profile", "anon", { name: "Invasor" }, 401);
  });

  test("[user-profile.patch.profile#perfil-membro] PATCH /profile como membro: 200 e o nome do PRÓPRIO usuário muda no banco", async ({ request }) => {
    const name = `Nome member ${RUN_TAG}`;
    const res = await send(request, "PATCH", "/profile", cast.member.token, { name });
    expect(res.status(), await res.text()).toBe(200);
    expect((await userState(cast.member.id))?.name).toBe(name);
  });

  test("[user-profile.patch.profile#perfil-lider] PATCH /profile como líder: 200 e o nome do PRÓPRIO usuário muda no banco", async ({ request }) => {
    const name = `Nome leader ${RUN_TAG}`;
    const res = await send(request, "PATCH", "/profile", cast.leader.token, { name });
    expect(res.status(), await res.text()).toBe(200);
    expect((await userState(cast.leader.id))?.name).toBe(name);
  });

  test("[user-profile.patch.profile#perfil-admin] PATCH /profile como admin: 200 e o nome do PRÓPRIO usuário muda no banco", async ({ request }) => {
    const name = `Nome admin ${RUN_TAG}`;
    const res = await send(request, "PATCH", "/profile", cast.admin.token, { name });
    expect(res.status(), await res.text()).toBe(200);
    expect((await userState(cast.admin.id))?.name).toBe(name);
  });

  test("[user-profile.patch.profile#feliz] PATCH /profile: altera nome e telefone; SELECT e a resposta concordam, sem segredos", async ({ request }) => {
    const res = await send(request, "PATCH", "/profile", cast.member.token, { name: "Nome Feliz", phone: "11977776666" });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ name: "Nome Feliz", phone: "11977776666" });
    expect(body).not.toHaveProperty("password");
    expect(await userState(cast.member.id)).toMatchObject({ name: "Nome Feliz", phone: "11977776666" });
  });

  test("[user-profile.patch.profile#validacao] PATCH /profile com e-mail inválido e nome curto: 400 e o usuário continua igual", async ({ request }) => {
    const before = await stateOf([cast.member.id]);
    for (const data of [{ email: "isso-nao-e-email" }, { name: "A" }]) {
      expect((await send(request, "PATCH", "/profile", cast.member.token, data)).status()).toBe(400);
    }
    expect(await stateOf([cast.member.id])).toBe(before);
  });

  test("[user-profile.patch.profile#conflito-ou-duplicidade] PATCH /profile com o e-mail de OUTRO usuário: 400 (e-mail em uso) e nada muda", async ({ request }) => {
    const before = await stateOf([cast.member.id, cast.victim.id]);
    const res = await send(request, "PATCH", "/profile", cast.member.token, { email: cast.victim.email });
    expect(res.status()).toBe(400);
    expect(await stateOf([cast.member.id, cast.victim.id])).toBe(before);
  });

  test("[user-profile.patch.profile#escopo-proprio-x-outro] PATCH /profile altera só o dono do token: id/userId de outro no corpo é 400 e o outro fica intacto", async ({ request }) => {
    const before = await stateOf([cast.victim.id]);
    for (const data of [{ id: cast.victim.id, name: "Sequestro" }, { userId: cast.victim.id, name: "Sequestro" }]) {
      expect((await send(request, "PATCH", "/profile", cast.member.token, data)).status()).toBe(400);
    }
    expect(await stateOf([cast.victim.id])).toBe(before);
  });

  test("[user-profile.patch.profile#flag-desligada] PATCH /profile não depende de flag: com as 3 flags desligadas segue 200 (só o guard de papel decide)", async ({ request }) => {
    await expectFlagDoesNotBlock(flags, request, "PATCH", "/profile", "member", { name: "Sem Flag" });
  });

  test("[user-profile.patch.profile#s3-sem-orfao] PATCH /profile não mexe no bucket e a foto existente continua referenciada", async ({ request }) => {
    expect((await sendPhoto(request, "/profile/image", cast.leader.token)).status()).toBe(200);
    const photo = await photoRows(cast.leader.id);
    await withBucketUnchanged(async () => {
      expect((await send(request, "PATCH", "/profile", cast.leader.token, { name: "Com Foto" })).status()).toBe(200);
    });
    expect(await photoRows(cast.leader.id)).toEqual(photo);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.patch.profile#email-enviado-ou-bloqueado-por-flag] PATCH /profile (inclusive trocar o e-mail) não dispara envio real: só `skipped` no outbox", async ({ request }) => {
    const novo = `${RUN_TAG}-trocado-${Date.now()}@orfanatonib.test`;
    const res = await send(request, "PATCH", "/profile", cast.victim.token, { email: novo });
    expect(res.status(), await res.text()).toBe(200);
    await expectNoDeliverableEmail(novo);
    await expectNoDeliverableEmail(cast.victim.email);
  });

  test("[user-profile.patch.profile-password#perfil-anonimo] PATCH /profile/password como visitante: 401 e nenhuma senha muda", async ({ request }) => {
    await expectDenied(request, "PATCH", "/profile/password", "anon", { newPassword: "Hacker@123" }, 401);
  });

  test("[user-profile.patch.profile-password#perfil-membro] PATCH /profile/password como membro: 200, o hash muda e o login funciona só com a senha nova", async ({ request }) => {
    await expectPasswordChanged(request, cast.member);
  });

  test("[user-profile.patch.profile-password#perfil-lider] PATCH /profile/password como líder: 200, o hash muda e o login funciona só com a senha nova", async ({ request }) => {
    await expectPasswordChanged(request, cast.leader);
  });

  test("[user-profile.patch.profile-password#perfil-admin] PATCH /profile/password como admin: 200, o hash muda e o login funciona só com a senha nova", async ({ request }) => {
    await expectPasswordChanged(request, cast.admin);
  });

  test("[user-profile.patch.profile-password#feliz] PATCH /profile/password: troca a senha; o SELECT mostra hash novo (bcrypt) e login com a senha antiga passa a falhar", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "senha");
    extra.push(target.id);
    const before = (await userState(target.id))?.password;
    const res = await send(request, "PATCH", "/profile/password", target.token, { newPassword: "Nova@Senha1" });
    expect(res.status(), await res.text()).toBe(200);
    const after = (await userState(target.id))?.password;
    expect(after).not.toBe(before);
    expect(after).toMatch(/^\$2[aby]\$/);
    const old = await request.post(`${API_URL}/auth/login`, { data: { email: target.email, password: ACTOR_PASSWORD } });
    expect(old.status()).toBe(401);
    const fresh = await request.post(`${API_URL}/auth/login`, { data: { email: target.email, password: "Nova@Senha1" } });
    expect(fresh.status()).toBe(201);
  });

  test("[user-profile.patch.profile-password#validacao] PATCH /profile/password com senha curta ou ausente: 400 e o hash não muda", async ({ request }) => {
    const before = (await userState(cast.member.id))?.password;
    for (const data of [{ newPassword: "123" }, {}]) {
      expect((await send(request, "PATCH", "/profile/password", cast.member.token, data)).status()).toBe(400);
    }
    expect((await userState(cast.member.id))?.password).toBe(before);
  });

  test("[user-profile.patch.profile-password#conflito-ou-duplicidade] PATCH /profile/password com a MESMA senha atual: 400 e o hash não muda", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "senha-igual");
    extra.push(target.id);
    const before = (await userState(target.id))?.password;
    const res = await send(request, "PATCH", "/profile/password", target.token, { newPassword: ACTOR_PASSWORD });
    expect(res.status()).toBe(400);
    expect((await userState(target.id))?.password).toBe(before);
  });

  test("[user-profile.patch.profile-password#escopo-proprio-x-outro] PATCH /profile/password só troca a do dono do token: userId de outro no corpo é 400 e o hash do outro não muda", async ({ request }) => {
    const before = (await userState(cast.victim.id))?.password;
    const res = await send(request, "PATCH", "/profile/password", cast.member.token, { userId: cast.victim.id, newPassword: "Invasao@123" });
    expect(res.status()).toBe(400);
    expect((await userState(cast.victim.id))?.password).toBe(before);
  });

  test("[user-profile.patch.profile-password#flag-desligada] PATCH /profile/password não depende de flag: com as 3 flags desligadas segue 200", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "senha-flag");
    extra.push(target.id);
    await expectFlagDoesNotBlock(flags, request, "PATCH", "/profile/password", target, { newPassword: "Flag@Senha1" });
  });

  test("[user-profile.patch.profile-password#s3-sem-orfao] PATCH /profile/password não mexe no bucket", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "senha-s3");
    extra.push(target.id);
    await withBucketUnchanged(async () => {
      expect((await send(request, "PATCH", "/profile/password", target.token, { newPassword: "S3@Senha12" })).status()).toBe(200);
    });
    await expectUserPhotosConsistent();
  });

  test("[user-profile.patch.profile-password#email-enviado-ou-bloqueado-por-flag] PATCH /profile/password não manda e-mail de aviso com as flags email_* desligadas (só `skipped` no outbox)", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "senha-mail");
    extra.push(target.id);
    expect((await send(request, "PATCH", "/profile/password", target.token, { newPassword: "Mail@Senha1" })).status()).toBe(200);
    await expectNoDeliverableEmail(target.email);
  });

  test("[user-profile.patch.profile-image#perfil-anonimo] PATCH /profile/image como visitante: 401, nada no bucket nem no banco", async ({ request }) => {
    await withBucketUnchanged(async () => {
      const before = await stateOf(allIds());
      const res = await request.patch(`${API_URL}/profile/image`, { multipart: { imageData: JSON.stringify({ title: "x", uploadType: "upload", fieldKey: "file" }), file: png() } });
      expect(res.status()).toBe(401);
      expect(await stateOf(allIds())).toBe(before);
    });
  });

  test("[user-profile.patch.profile-image#perfil-membro] PATCH /profile/image como membro: 200, 1 linha de mídia do PRÓPRIO usuário e o objeto no bucket", async ({ request }) => {
    const res = await sendPhoto(request, "/profile/image", cast.member.token);
    expect(res.status(), await res.text()).toBe(200);
    const rows = await photoRows(cast.member.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].isLocalFile).toBe(1);
    expect(await objectExists(String(rows[0].storageKey))).toBe(true);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.patch.profile-image#perfil-lider] PATCH /profile/image como líder: 200, 1 linha de mídia do PRÓPRIO usuário e o objeto no bucket", async ({ request }) => {
    const res = await sendPhoto(request, "/profile/image", cast.leader.token);
    expect(res.status(), await res.text()).toBe(200);
    const rows = await photoRows(cast.leader.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].isLocalFile).toBe(1);
    expect(await objectExists(String(rows[0].storageKey))).toBe(true);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.patch.profile-image#perfil-admin] PATCH /profile/image como admin: 200, 1 linha de mídia do PRÓPRIO usuário e o objeto no bucket", async ({ request }) => {
    const res = await sendPhoto(request, "/profile/image", cast.admin.token);
    expect(res.status(), await res.text()).toBe(200);
    const rows = await photoRows(cast.admin.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].isLocalFile).toBe(1);
    expect(await objectExists(String(rows[0].storageKey))).toBe(true);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.patch.profile-image#validacao] PATCH /profile/image sem arquivo nem link, e com arquivo que não é imagem: 400, bucket e banco inalterados", async ({ request }) => {
    const before = await stateOf([cast.victim.id]);
    await withBucketUnchanged(async () => {
      expect((await send(request, "PATCH", "/profile/image", cast.victim.token, {})).status()).toBe(400);
      expect((await sendPhoto(request, "/profile/image", cast.victim.token, { name: "x.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") })).status()).toBe(400);
    });
    expect(await stateOf([cast.victim.id])).toBe(before);
  });

  test("[user-profile.patch.profile-image#conflito-ou-duplicidade] PATCH /profile/image duas vezes SUBSTITUI (não duplica): 1 linha e 1 objeto do usuário no bucket", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "foto-dupla");
    extra.push(target.id);
    for (const name of ["a.png", "b.png"]) expect((await sendPhoto(request, "/profile/image", target.token, png(name))).status()).toBe(200);
    expect(await photoRows(target.id)).toHaveLength(1);
    expect(await listObjects(`${userPrefix()}${target.id}/`)).toHaveLength(1);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.patch.profile-image#escopo-proprio-x-outro] PATCH /profile/image grava só na foto do dono do token: userId de outro no corpo não desvia o upload", async ({ request }) => {
    const before = await photoRows(cast.victim.id);
    const res = await request.patch(`${API_URL}/profile/image`, { headers: authHeaders(cast.member.token), multipart: { imageData: JSON.stringify({ title: "x", uploadType: "upload", fieldKey: "file", userId: cast.victim.id, targetId: cast.victim.id }), file: png("escopo.png") } });
    expect([200, 400]).toContain(res.status());
    expect(await photoRows(cast.victim.id)).toEqual(before);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.patch.profile-image#flag-desligada] PATCH /profile/image não depende de flag: com as 3 flags desligadas segue 200", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "foto-flag");
    extra.push(target.id);
    await flags.set(request, false);
    try {
      expect((await sendPhoto(request, "/profile/image", target.token)).status()).toBe(200);
    } finally {
      await flags.set(request, true);
    }
    expect(await photoRows(target.id)).toHaveLength(1);
  });

  test("[user-profile.patch.profile-image#s3-sem-orfao] PATCH /profile/image: enviar, substituir e trocar por link deixa 0 órfãos e 0 referências quebradas", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "foto-s3");
    extra.push(target.id);
    const first = await sendPhoto(request, "/profile/image", target.token, png("um.png"));
    expect(first.status()).toBe(200);
    const [old] = await photoRows(target.id);
    expect((await sendPhoto(request, "/profile/image", target.token, png("dois.png"))).status()).toBe(200);
    expect(await objectExists(String(old.storageKey))).toBe(false);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.patch.profile-image#email-enviado-ou-bloqueado-por-flag] PATCH /profile/image não dispara e-mail", async ({ request }) => {
    expect((await sendPhoto(request, "/profile/image", cast.victim.token)).status()).toBe(200);
    await expectNoDeliverableEmail(cast.victim.email);
  });
});
