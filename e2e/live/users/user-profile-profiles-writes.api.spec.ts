import { expect, test } from "../support/live";
import {
  expectDenied,
  expectFlagBlocks,
  expectFlagDoesNotBlock,
  expectNotFoundUnchanged,
  expectNoDeliverableEmail,
  expectUserPhotosConsistent,
  personalRows,
  photoRows,
  preferenceRows,
  send,
  sendPhoto,
  stateOf,
  userState,
  withBucketUnchanged,
  createActor,
  FULL_PROFILE,
  BAD_ID,
  setupWorld,
  teardownWorld,
  world,
  type FlagGuard,
  type Cast,
} from "./support";

/**
 * Usuários e perfis — escrita de perfil completo (/profiles) — plano 07, matriz `user-profile` (cada título começa com o ID da matriz).
 * Contas descartáveis (admin/líder/membro/outro membro) criadas pela API; cada efeito é provado por SELECT,
 * negativos provam banco e bucket inalterados e as flags são restauradas no fim.
 */
test.describe.serial("Usuários e perfis — escrita de perfil completo (/profiles)", () => {
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

  test("[user-profile.put.profiles-id#nao-encontrado] PUT /profiles/:id de usuário inexistente: 404 e o banco não muda", async ({ request }) => {
    await expectNotFoundUnchanged(request, "PUT", `/profiles/${BAD_ID}`, { personalData: { gender: "F" } });
  });

  test("[user-profile.delete.profiles-id#nao-encontrado] DELETE /profiles/:id de usuário inexistente: 404 e o banco não muda", async ({ request }) => {
    await expectNotFoundUnchanged(request, "DELETE", `/profiles/${BAD_ID}`);
  });

  test("[user-profile.post.profiles#perfil-anonimo] POST /profiles como visitante: 401 e o banco não muda", async ({ request }) => {
    await expectDenied(request, "POST", "/profiles", "anon", FULL_PROFILE, 401);
  });

  test("[user-profile.post.profiles#perfil-membro] POST /profiles como membro: 201 no PRÓPRIO perfil (dados no banco)", async ({ request }) => {
    const res = await send(request, "POST", "/profiles", cast.member.token, FULL_PROFILE);
    expect(res.status(), await res.text()).toBe(201);
    expect((await personalRows(cast.member.id))).toHaveLength(1);
    expect((await personalRows(cast.member.id))[0].gender).toBe("F");
    expect((await preferenceRows(cast.member.id))[0].favoriteColor).toBe("azul");
  });

  test("[user-profile.post.profiles#perfil-lider] POST /profiles como líder: 201 no PRÓPRIO perfil (dados no banco)", async ({ request }) => {
    const res = await send(request, "POST", "/profiles", cast.leader.token, FULL_PROFILE);
    expect(res.status(), await res.text()).toBe(201);
    expect((await personalRows(cast.leader.id))).toHaveLength(1);
    expect((await personalRows(cast.leader.id))[0].gender).toBe("F");
    expect((await preferenceRows(cast.leader.id))[0].favoriteColor).toBe("azul");
  });

  test("[user-profile.post.profiles#perfil-admin] POST /profiles como admin: 201 no PRÓPRIO perfil (dados no banco)", async ({ request }) => {
    const res = await send(request, "POST", "/profiles", cast.admin.token, FULL_PROFILE);
    expect(res.status(), await res.text()).toBe(201);
    expect((await personalRows(cast.admin.id))).toHaveLength(1);
    expect((await personalRows(cast.admin.id))[0].gender).toBe("F");
    expect((await preferenceRows(cast.admin.id))[0].favoriteColor).toBe("azul");
  });

  test("[user-profile.post.profiles#feliz] POST /profiles: o membro cria o próprio perfil; SELECT prova as 2 linhas e a UI lê o mesmo dado", async ({ request }) => {
    const fresh = await createActor(request, seeded, "member", "fresh");
    extra.push(fresh.id);
    expect(await personalRows(fresh.id)).toHaveLength(0);
    const res = await send(request, "POST", "/profiles", fresh.token, FULL_PROFILE);
    expect(res.status(), await res.text()).toBe(201);
    const [p] = await personalRows(fresh.id);
    expect(p).toMatchObject({ gender: "F", gaLeaderName: "Líder GA" });
    expect(String(p.birthDate)).toBe("2001-05-10");
    expect((await preferenceRows(fresh.id))[0]).toMatchObject({ favoriteColor: "azul", favoriteFood: "pizza" });
    const me = (await (await send(request, "GET", "/profiles/me", fresh.token)).json()) as { personalData: { gender: string } };
    expect(me.personalData.gender).toBe("F");
  });

  test("[user-profile.post.profiles#validacao] POST /profiles com data de nascimento inválida: 400 e nenhuma linha gravada", async ({ request }) => {
    const fresh = await createActor(request, seeded, "member", "invalido");
    extra.push(fresh.id);
    const res = await send(request, "POST", "/profiles", fresh.token, { personalData: { birthDate: "nao-e-data" } });
    expect(res.status()).toBe(400);
    expect(await personalRows(fresh.id)).toHaveLength(0);
    expect(await preferenceRows(fresh.id)).toHaveLength(0);
  });

  test("[user-profile.post.profiles#conflito-ou-duplicidade] POST /profiles repetido NÃO duplica: continua 1 linha por tabela (atualiza)", async ({ request }) => {
    const fresh = await createActor(request, seeded, "member", "duplo");
    extra.push(fresh.id);
    for (const gender of ["F", "M"]) {
      const res = await send(request, "POST", "/profiles", fresh.token, { personalData: { gender }, preferences: { favoriteFood: gender } });
      expect(res.status(), await res.text()).toBe(201);
    }
    expect(await personalRows(fresh.id)).toHaveLength(1);
    expect((await personalRows(fresh.id))[0].gender).toBe("M");
    expect(await preferenceRows(fresh.id)).toHaveLength(1);
  });

  test("[user-profile.post.profiles#escopo-proprio-x-outro] POST /profiles não aceita escolher o dono: userId no corpo é 400 e o perfil do outro não muda", async ({ request }) => {
    const before = await stateOf([cast.victim.id]);
    const res = await send(request, "POST", "/profiles", cast.member.token, { userId: cast.victim.id, personalData: { gender: "M" } });
    expect(res.status()).toBe(400);
    expect(await stateOf([cast.victim.id])).toBe(before);
  });

  test("[user-profile.post.profiles#flag-desligada] POST /profiles com user_management e member_area desligadas: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management", "member_area"], "POST", "/profiles", "member", FULL_PROFILE);
  });

  test("[user-profile.post.profiles#s3-sem-orfao] POST /profiles não mexe no bucket: nenhum objeto novo, sem órfão nem referência quebrada", async ({ request }) => {
    await withBucketUnchanged(async () => {
      const res = await send(request, "POST", "/profiles", cast.member.token, FULL_PROFILE);
      expect(res.status()).toBe(201);
    });
    await expectUserPhotosConsistent();
  });

  test("[user-profile.post.profiles#email-enviado-ou-bloqueado-por-flag] POST /profiles não dispara e-mail: o outbox do usuário não tem envio real (flags email_* desligadas)", async ({ request }) => {
    const res = await send(request, "POST", "/profiles", cast.member.token, FULL_PROFILE);
    expect(res.status()).toBe(201);
    await expectNoDeliverableEmail(cast.member.email);
  });

  test("[user-profile.put.profiles-me#perfil-anonimo] PUT /profiles/me como visitante: 401 e o banco não muda", async ({ request }) => {
    await expectDenied(request, "PUT", "/profiles/me", "anon", { personalData: { gender: "M" }, preferences: { favoriteFood: "bolo" } }, 401);
  });

  test("[user-profile.put.profiles-me#perfil-membro] PUT /profiles/me como membro: 200 e grava no PRÓPRIO perfil", async ({ request }) => {
    const res = await send(request, "PUT", "/profiles/me", cast.member.token, { personalData: { gender: "M" }, preferences: { favoriteFood: "bolo" } });
    expect(res.status(), await res.text()).toBe(200);
    expect((await personalRows(cast.member.id))[0].gender).toBe("M");
    expect((await preferenceRows(cast.member.id))[0].favoriteFood).toBe("bolo");
  });

  test("[user-profile.put.profiles-me#perfil-lider] PUT /profiles/me como líder: 200 e grava no PRÓPRIO perfil", async ({ request }) => {
    const res = await send(request, "PUT", "/profiles/me", cast.leader.token, { personalData: { gender: "M" }, preferences: { favoriteFood: "bolo" } });
    expect(res.status(), await res.text()).toBe(200);
    expect((await personalRows(cast.leader.id))[0].gender).toBe("M");
    expect((await preferenceRows(cast.leader.id))[0].favoriteFood).toBe("bolo");
  });

  test("[user-profile.put.profiles-me#perfil-admin] PUT /profiles/me como admin: 200 e grava no PRÓPRIO perfil", async ({ request }) => {
    const res = await send(request, "PUT", "/profiles/me", cast.admin.token, { personalData: { gender: "M" }, preferences: { favoriteFood: "bolo" } });
    expect(res.status(), await res.text()).toBe(200);
    expect((await personalRows(cast.admin.id))[0].gender).toBe("M");
    expect((await preferenceRows(cast.admin.id))[0].favoriteFood).toBe("bolo");
  });

  test("[user-profile.put.profiles-me#feliz] PUT /profiles/me: altera dados pessoais e preferências; SELECT mostra o novo valor e a resposta o mesmo", async ({ request }) => {
    const res = await send(request, "PUT", "/profiles/me", cast.member.token, { personalData: { gender: "F", gaLeaderName: "Nova Líder" }, preferences: { favoriteColor: "verde" } });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as { personalData: { gaLeaderName: string }; preferences: { favoriteColor: string } };
    expect(body.personalData.gaLeaderName).toBe("Nova Líder");
    expect((await personalRows(cast.member.id))[0].gaLeaderName).toBe("Nova Líder");
    expect((await preferenceRows(cast.member.id))[0].favoriteColor).toBe(body.preferences.favoriteColor);
  });

  test("[user-profile.put.profiles-me#conflito-ou-duplicidade] PUT /profiles/me repetido é idempotente: continua 1 linha por tabela", async ({ request }) => {
    for (let i = 0; i < 2; i += 1) {
      expect((await send(request, "PUT", "/profiles/me", cast.leader.token, { personalData: { gender: "F" }, preferences: { favoriteFood: "x" } })).status()).toBe(200);
    }
    expect(await personalRows(cast.leader.id)).toHaveLength(1);
    expect(await preferenceRows(cast.leader.id)).toHaveLength(1);
  });

  test("[user-profile.put.profiles-me#escopo-proprio-x-outro] PUT /profiles/me grava só no dono do token: id/userId de outro no corpo é 400 e o outro fica intacto", async ({ request }) => {
    const before = await stateOf([cast.victim.id]);
    for (const data of [{ id: cast.victim.id, personalData: { gender: "M" } }, { userId: cast.victim.id, personalData: { gender: "M" } }]) {
      const res = await send(request, "PUT", "/profiles/me", cast.member.token, data);
      expect(res.status()).toBe(400);
    }
    expect(await stateOf([cast.victim.id])).toBe(before);
  });

  test("[user-profile.put.profiles-me#flag-desligada] PUT /profiles/me não depende de flag: com as 3 flags de usuários desligadas segue 200 (só o guard de papel decide)", async ({ request }) => {
    await expectFlagDoesNotBlock(flags, request, "PUT", "/profiles/me", "member", { personalData: { gender: "M" }, preferences: { favoriteFood: "bolo" } });
  });

  test("[user-profile.put.profiles-me#s3-sem-orfao] PUT /profiles/me não mexe no bucket e não deixa órfão", async ({ request }) => {
    await withBucketUnchanged(async () => {
      expect((await send(request, "PUT", "/profiles/me", cast.member.token, { preferences: { favoriteFood: "s3" } })).status()).toBe(200);
    });
    await expectUserPhotosConsistent();
  });

  test("[user-profile.put.profiles-me#email-enviado-ou-bloqueado-por-flag] PUT /profiles/me não dispara e-mail (nenhum envio real no outbox)", async ({ request }) => {
    expect((await send(request, "PUT", "/profiles/me", cast.member.token, { preferences: { favoriteFood: "mail" } })).status()).toBe(200);
    await expectNoDeliverableEmail(cast.member.email);
  });

  test("[user-profile.put.profiles-id#perfil-anonimo] PUT /profiles/:id como visitante: 401 e o banco não muda", async ({ request }) => {
    await expectDenied(request, "PUT", `/profiles/${cast.victim.id}`, "anon", { personalData: { gender: "M" }, preferences: { favoriteFood: "feijão" } }, 401);
  });

  test("[user-profile.put.profiles-id#perfil-membro] PUT /profiles/:id como membro: 403 e o perfil do outro não muda", async ({ request }) => {
    await expectDenied(request, "PUT", `/profiles/${cast.victim.id}`, "member", { personalData: { gender: "M" }, preferences: { favoriteFood: "feijão" } }, 403);
  });

  test("[user-profile.put.profiles-id#perfil-lider] PUT /profiles/:id como líder: 403 e o perfil do outro não muda", async ({ request }) => {
    await expectDenied(request, "PUT", `/profiles/${cast.victim.id}`, "leader", { personalData: { gender: "M" }, preferences: { favoriteFood: "feijão" } }, 403);
  });

  test("[user-profile.put.profiles-id#perfil-admin] PUT /profiles/:id como admin: 200 e o perfil de OUTRO usuário muda no banco", async ({ request }) => {
    const res = await send(request, "PUT", `/profiles/${cast.victim.id}`, cast.admin.token, { personalData: { gender: "M" }, preferences: { favoriteFood: "feijão" } });
    expect(res.status(), await res.text()).toBe(200);
    expect((await personalRows(cast.victim.id))[0].gender).toBe("M");
    expect((await preferenceRows(cast.victim.id))[0].favoriteFood).toBe("feijão");
  });

  test("[user-profile.put.profiles-id#feliz] PUT /profiles/:id: o admin completa o perfil de um membro; SELECT confirma as duas tabelas", async ({ request }) => {
    const res = await send(request, "PUT", `/profiles/${cast.victim.id}`, cast.admin.token, FULL_PROFILE);
    expect(res.status(), await res.text()).toBe(200);
    expect((await personalRows(cast.victim.id))[0]).toMatchObject({ gender: "F", gaLeaderName: "Líder GA" });
    expect((await preferenceRows(cast.victim.id))[0]).toMatchObject({ favoriteColor: "azul", whatMakesYouSmile: "música" });
  });

  test("[user-profile.put.profiles-id#validacao] PUT /profiles/:id com data inválida: 400 e o perfil continua como estava", async ({ request }) => {
    const before = await stateOf([cast.victim.id]);
    const res = await send(request, "PUT", `/profiles/${cast.victim.id}`, cast.admin.token, { personalData: { birthDate: "31/02/abc" } });
    expect(res.status()).toBe(400);
    expect(await stateOf([cast.victim.id])).toBe(before);
  });

  test("[user-profile.put.profiles-id#conflito-ou-duplicidade] PUT /profiles/:id repetido não duplica linhas de perfil", async ({ request }) => {
    for (let i = 0; i < 2; i += 1) {
      expect((await send(request, "PUT", `/profiles/${cast.victim.id}`, cast.admin.token, FULL_PROFILE)).status()).toBe(200);
    }
    expect(await personalRows(cast.victim.id)).toHaveLength(1);
    expect(await preferenceRows(cast.victim.id)).toHaveLength(1);
  });

  test("[user-profile.put.profiles-id#flag-desligada] PUT /profiles/:id com user_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "PUT", `/profiles/${cast.victim.id}`, "admin", { personalData: { gender: "M" }, preferences: { favoriteFood: "feijão" } });
  });

  test("[user-profile.put.profiles-id#s3-sem-orfao] PUT /profiles/:id não mexe no bucket e não deixa órfão", async ({ request }) => {
    await withBucketUnchanged(async () => {
      expect((await send(request, "PUT", `/profiles/${cast.victim.id}`, cast.admin.token, { preferences: { favoriteFood: "s3" } })).status()).toBe(200);
    });
    await expectUserPhotosConsistent();
  });

  test("[user-profile.put.profiles-id#email-enviado-ou-bloqueado-por-flag] PUT /profiles/:id não dispara e-mail para o usuário alterado", async ({ request }) => {
    expect((await send(request, "PUT", `/profiles/${cast.victim.id}`, cast.admin.token, { preferences: { favoriteFood: "mail" } })).status()).toBe(200);
    await expectNoDeliverableEmail(cast.victim.email);
  });

  test("[user-profile.delete.profiles-id#perfil-anonimo] DELETE /profiles/:id como visitante: 401 e o banco não muda", async ({ request }) => {
    await expectDenied(request, "DELETE", `/profiles/${cast.victim.id}`, "anon", undefined, 401);
  });

  test("[user-profile.delete.profiles-id#perfil-lider] DELETE /profiles/:id como líder: 403 e o perfil continua", async ({ request }) => {
    await expectDenied(request, "DELETE", `/profiles/${cast.victim.id}`, "leader", undefined, 403);
  });

  test("[user-profile.delete.profiles-id#perfil-admin] DELETE /profiles/:id como admin: 200, apaga dados pessoais e preferências e o usuário continua", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "del-perfil");
    extra.push(target.id);
    expect((await send(request, "PUT", `/profiles/${target.id}`, cast.admin.token, FULL_PROFILE)).status()).toBe(200);
    expect(await personalRows(target.id)).toHaveLength(1);
    const res = await send(request, "DELETE", `/profiles/${target.id}`, cast.admin.token);
    expect(res.status(), await res.text()).toBe(200);
    expect(await personalRows(target.id)).toHaveLength(0);
    expect(await preferenceRows(target.id)).toHaveLength(0);
    expect(await userState(target.id)).not.toBeNull();
  });

  test("[user-profile.delete.profiles-id#feliz] DELETE /profiles/:id: o admin apaga o perfil e a UI lê vazio depois (SELECT: 0 linhas, usuário mantido)", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "del-feliz");
    extra.push(target.id);
    await send(request, "POST", "/profiles", target.token, FULL_PROFILE);
    expect((await send(request, "DELETE", `/profiles/${target.id}`, cast.admin.token)).status()).toBe(200);
    const me = (await (await send(request, "GET", "/profiles/me", target.token)).json()) as { personalData?: unknown; preferences?: unknown };
    expect(me.personalData).toBeUndefined();
    expect(me.preferences).toBeUndefined();
    expect(await personalRows(target.id)).toHaveLength(0);
  });

  test("[user-profile.delete.profiles-id#flag-desligada] DELETE /profiles/:id com user_management desligada: 403 FEATURE_DISABLED e nada muda", async ({ request }) => {
    await expectFlagBlocks(flags, request, ["user_management"], "DELETE", `/profiles/${cast.victim.id}`, "admin");
  });

  test("[user-profile.delete.profiles-id#s3-sem-orfao] DELETE /profiles/:id não mexe no bucket (a foto é do usuário, não do perfil): sem órfão nem referência quebrada", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "del-s3");
    extra.push(target.id);
    expect((await sendPhoto(request, "/profile/image", target.token)).status()).toBe(200);
    await withBucketUnchanged(async () => {
      expect((await send(request, "DELETE", `/profiles/${target.id}`, cast.admin.token)).status()).toBe(200);
    });
    expect(await photoRows(target.id)).toHaveLength(1);
    await expectUserPhotosConsistent();
  });

  test("[user-profile.delete.profiles-id#email-enviado-ou-bloqueado-por-flag] DELETE /profiles/:id não dispara e-mail", async ({ request }) => {
    const target = await createActor(request, seeded, "member", "del-mail");
    extra.push(target.id);
    expect((await send(request, "DELETE", `/profiles/${target.id}`, cast.admin.token)).status()).toBe(200);
    await expectNoDeliverableEmail(target.email);
  });
});
