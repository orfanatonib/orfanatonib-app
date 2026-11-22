import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID, DIRECTORY_FLAGS, createShelter, deleteShelterApi, label, sheltersWithTag } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";

/**
 * Cenários de `/member-profiles` por handler (plano 16 §7.3). Dois membros criados pela API ficam em
 * abrigos diferentes; o líder semeado lidera só um deles, o que prova o escopo com dados próprios.
 * Tudo é desfeito pela API e o `afterAll` confere 0 sobras.
 */
interface MemberBody {
  id: string;
  user: { id: string; email: string };
  shelter?: { id: string; team?: { numberTeam: number } | null } | null;
}

const TEAM_EMAIL_TEMPLATE = "team-assignment-changed";

test.describe.serial("Perfis de membro — cenários por handler", () => {
  let admin: string;
  let seeded: string;
  let seededLeaderProfileId = "";
  let first: Actor;
  let second: Actor;
  /** Membro que nunca é alocado: é quem aparece em `/member-profiles/simple` (só lista quem está sem equipe). */
  let loose: Actor;
  let firstProfileId = "";
  let secondProfileId = "";
  let looseProfileId = "";
  const shelters: string[] = [];

  const profileOf = async (email: string, table: "member_profiles" | "leader_profiles"): Promise<string> =>
    (
      await queryOne<{ id: string }>(
        `SELECT p.id AS id FROM ${table} p JOIN users u ON u.id = p.user_id WHERE u.email = ?`,
        [email],
      )
    )?.id ?? "";

  const makeShelter = async (request: APIRequestContext, name: string, teamsQuantity = 2): Promise<string> => {
    const shelter = await createShelter(request, admin, { name: label(name), teamsQuantity });
    shelters.push(shelter.id);
    return shelter.id;
  };

  const put = (request: APIRequestContext, token: string | undefined, memberId: string, body: unknown) =>
    request.put(`${API_URL}/member-profiles/${memberId}`, { headers: token ? authHeaders(token) : {}, data: body });

  const get = (request: APIRequestContext, token: string | undefined, path: string) =>
    request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

  const teamIdOf = async (memberId: string): Promise<string | null> =>
    (await queryOne<{ team_id: string | null }>("SELECT team_id FROM member_profiles WHERE id = ?", [memberId]))?.team_id ?? null;

  const teamNumberOf = async (teamId: string | null): Promise<number | null> =>
    teamId ? Number((await queryOne<{ numberTeam: number }>("SELECT numberTeam FROM teams WHERE id = ?", [teamId]))?.numberTeam) : null;

  const teamsIn = (shelterId: string): Promise<number> => countRows("teams", { shelter_id: shelterId });

  const outbox = async (recipient: string): Promise<string[]> =>
    (
      await queryAll<{ status: string }>("SELECT status FROM email_outbox WHERE templateKey = ? AND recipient = ?", [
        TEAM_EMAIL_TEMPLATE,
        recipient,
      ])
    ).map((row) => row.status);

  const leadShelter = (request: APIRequestContext, shelterId: string) =>
    request.put(`${API_URL}/leader-profiles/${seededLeaderProfileId}`, {
      headers: authHeaders(admin),
      data: shelterId ? [{ shelterId, teams: [1] }] : [],
    });

  const idsOf = <T extends { id: string }>(items: T[]): string[] => items.map((item) => item.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    seeded = (await loginAs(request, "leader")).accessToken;
    seededLeaderProfileId = await profileOf("e2e.leader@orfanatonib.test", "leader_profiles");
    first = await createActor(request, admin, "member", "membro-um");
    second = await createActor(request, admin, "member", "membro-dois");
    loose = await createActor(request, admin, "member", "membro-solto");
    firstProfileId = await profileOf(first.email, "member_profiles");
    secondProfileId = await profileOf(second.email, "member_profiles");
    looseProfileId = await profileOf(loose.email, "member_profiles");
    expect(firstProfileId, "perfil do primeiro membro").not.toBe("");
    expect(secondProfileId, "perfil do segundo membro").not.toBe("");
  });

  test.afterAll(async ({ request }) => {
    await leadShelter(request, "");
    for (const id of shelters) await deleteShelterApi(request, admin, id);
    await removeActors(request, admin, [first.id, second.id, loose.id]);
    expect(await sheltersWithTag(RUN_TAG), "a limpeza deixou abrigos do E2E").toBe(0);
    expect(await countRows("leader_teams", { leader_id: seededLeaderProfileId }), "o líder semeado ficou preso a equipes").toBe(0);
    await closeDb();
  });

  // ---------------------------------------------------------------- PUT /member-profiles/:memberId

  test("[member-profile.put.member-profiles-memberid#feliz] admin aloca o membro numa equipe e depois o move: member_profiles.team_id reflete e a resposta traz a equipe", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-feliz");
    const res = await put(request, admin, firstProfileId, { shelterId, numberTeam: 1 });
    expect(res.status(), await res.text()).toBe(200);
    expect(await teamNumberOf(await teamIdOf(firstProfileId))).toBe(1);
    expect(((await res.json()) as MemberBody).shelter?.team?.numberTeam).toBe(1);

    const moved = await put(request, admin, firstProfileId, { shelterId, numberTeam: 2 });
    expect(moved.status(), await moved.text()).toBe(200);
    expect(await teamNumberOf(await teamIdOf(firstProfileId))).toBe(2);
    expect(((await moved.json()) as MemberBody).shelter?.team?.numberTeam).toBe(2);
  });

  test("[member-profile.put.member-profiles-memberid#feliz] número de equipe novo: a equipe é criada com o membro dentro", async ({ request }) => {
    const shelterId = await makeShelter(request, "put-equipe-nova", 1);
    const before = await teamsIn(shelterId);
    const res = await put(request, admin, secondProfileId, { shelterId, numberTeam: 6 });
    expect(res.status(), await res.text()).toBe(200);
    expect(await teamsIn(shelterId)).toBe(before + 1);
    expect(await teamNumberOf(await teamIdOf(secondProfileId))).toBe(6);
  });

  test("[member-profile.put.member-profiles-memberid#validacao] número 0, shelterId inválido e corpo vazio: 400 e o membro fica na equipe de antes", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-validacao");
    await put(request, admin, firstProfileId, { shelterId, numberTeam: 1 });
    const before = await teamIdOf(firstProfileId);
    for (const body of [{ shelterId, numberTeam: 0 }, { shelterId: "nao-e-uuid", numberTeam: 1 }, {}]) {
      const res = await put(request, admin, firstProfileId, body);
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    expect(await teamIdOf(firstProfileId)).toBe(before);
  });

  test("[member-profile.put.member-profiles-memberid#nao-encontrado] membro inexistente: 404", async ({ request }) => {
    const shelterId = await makeShelter(request, "put-nao-encontrado", 1);
    const res = await put(request, admin, BAD_ID, { shelterId, numberTeam: 1 });
    expect(res.status()).toBe(404);
  });

  test("[member-profile.put.member-profiles-memberid#conflito-ou-duplicidade] repetir o mesmo pedido: 200, nenhuma equipe duplicada e um único e-mail", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-repetido");
    const before = await outbox(second.email);
    expect((await put(request, admin, secondProfileId, { shelterId, numberTeam: 1 })).status()).toBe(200);
    const teams = await teamsIn(shelterId);
    const teamId = await teamIdOf(secondProfileId);

    const again = await put(request, admin, secondProfileId, { shelterId, numberTeam: 1 });
    expect(again.status(), await again.text()).toBe(200);
    expect(await teamIdOf(secondProfileId)).toBe(teamId);
    expect(await teamsIn(shelterId)).toBe(teams);
    expect((await outbox(second.email)).length - before.length).toBe(1);
  });

  test("[member-profile.put.member-profiles-memberid#falha-do-colaborador-sem-efeito-parcial] abrigo inexistente: 404 e o membro continua na equipe de antes (nenhuma equipe nova)", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-colaborador");
    await put(request, admin, firstProfileId, { shelterId, numberTeam: 1 });
    const before = await teamIdOf(firstProfileId);

    const res = await put(request, admin, firstProfileId, { shelterId: BAD_ID, numberTeam: 1 });
    expect(res.status(), await res.text()).toBe(404);
    expect(await teamIdOf(firstProfileId)).toBe(before);
    expect(await teamsIn(BAD_ID)).toBe(0);
  });

  test("[member-profile.put.member-profiles-memberid#rollback-de-transacao] membro inexistente com número de equipe novo: nenhuma equipe nasce no abrigo", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-rollback", 1);
    const before = await teamsIn(shelterId);
    const res = await put(request, admin, BAD_ID, { shelterId, numberTeam: 9 });
    expect(res.status()).toBe(404);
    expect(await teamsIn(shelterId)).toBe(before);
  });

  test("[member-profile.put.member-profiles-memberid#email-enviado-ou-bloqueado-por-flag] com a flag de e-mail desligada (E2E) o aviso fica `skipped`: nada além de skipped no outbox do membro", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-email");
    const before = await outbox(first.email);
    expect((await put(request, admin, firstProfileId, { shelterId, numberTeam: 1 })).status()).toBe(200);
    const after = await outbox(first.email);
    expect(after.length).toBe(before.length + 1);
    expect(after.every((status) => status === "skipped"), `outbox: ${after.join(",")}`).toBe(true);
  });

  // ---------------------------------------------------------------- GET (leituras e escopo)

  test("[member-profile.get.member-profiles#feliz] admin lista com o envelope paginado e o total bate com os membros de usuário ativo no banco", async ({ request }) => {
    const res = await get(request, admin, "/member-profiles?page=1&limit=100");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: MemberBody[]; total: number; page: number };
    expect(body.page).toBe(1);
    expect(idsOf(body.items)).toEqual(expect.arrayContaining([firstProfileId, secondProfileId]));
    // A listagem só traz membros cujo usuário está ativo.
    const active = await queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM member_profiles mp JOIN users u ON u.id = mp.user_id WHERE u.active = 1",
    );
    expect(body.total).toBe(Number(active?.n));
  });

  test("[member-profile.get.member-profiles-id#feliz] detalhe do membro bate com o banco (usuário e equipe)", async ({ request }) => {
    const shelterId = await makeShelter(request, "get-detalhe");
    await put(request, admin, firstProfileId, { shelterId, numberTeam: 2 });
    const res = await get(request, admin, `/member-profiles/${firstProfileId}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as MemberBody;
    expect(body.id).toBe(firstProfileId);
    expect(body.user.email).toBe(first.email);
    expect(body.shelter?.team?.numberTeam).toBe(await teamNumberOf(await teamIdOf(firstProfileId)));
  });

  test("[member-profile.get.member-profiles-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await get(request, admin, `/member-profiles/${BAD_ID}`)).status()).toBe(404);
  });

  test("[member-profile.get.member-profiles-simple#feliz] a lista simples traz os membros sem equipe (e só eles): o solto aparece, os alocados não", async ({ request }) => {
    const res = await get(request, admin, "/member-profiles/simple");
    expect(res.status()).toBe(200);
    const ids = ((await res.json()) as Array<{ memberProfileId: string }>).map((item) => item.memberProfileId);
    expect(ids).toContain(looseProfileId);
    expect(ids).not.toContain(firstProfileId);
    expect(ids).not.toContain(secondProfileId);
    expect(await teamIdOf(looseProfileId)).toBeNull();
  });

  test("[member-profile.get.member-profiles-simple#escopo-proprio-x-outro] [member-profile.get.member-profiles-id#escopo-proprio-x-outro] líder só vê membros dos abrigos que lidera; o membro de outro abrigo é 404", async ({
    request,
  }) => {
    const mine = await makeShelter(request, "get-escopo-meu");
    const theirs = await makeShelter(request, "get-escopo-deles");
    expect((await leadShelter(request, mine)).status()).toBe(200);
    await put(request, admin, firstProfileId, { shelterId: mine, numberTeam: 1 });
    await put(request, admin, secondProfileId, { shelterId: theirs, numberTeam: 1 });

    const page = (await (await get(request, seeded, "/member-profiles?page=1&limit=100")).json()) as { items: MemberBody[] };
    expect(idsOf(page.items)).toContain(firstProfileId);
    expect(idsOf(page.items)).not.toContain(secondProfileId);

    // O seletor do líder mostra quem ainda pode ser alocado; quem já tem equipe (do abrigo dele ou de outro) fica de fora.
    const simple = (await (await get(request, seeded, "/member-profiles/simple")).json()) as Array<{ memberProfileId: string }>;
    const simpleIds = simple.map((item) => item.memberProfileId);
    expect(simpleIds).toContain(looseProfileId);
    expect(simpleIds).not.toContain(firstProfileId);
    expect(simpleIds).not.toContain(secondProfileId);

    expect((await get(request, seeded, `/member-profiles/${firstProfileId}`)).status()).toBe(200);
    expect((await get(request, seeded, `/member-profiles/${secondProfileId}`)).status()).toBe(404);

    const foreignMove = await put(request, seeded, firstProfileId, { shelterId: theirs, numberTeam: 1 });
    expect(foreignMove.status()).toBe(403);
    expect(await teamNumberOf(await teamIdOf(firstProfileId))).toBe(1);
    await leadShelter(request, "");
  });

  test("[member-profile.get.member-profiles#flag-desligada] [member-profile.get.member-profiles-id#flag-desligada] [member-profile.get.member-profiles-simple#flag-desligada] com as flags do diretório desligadas: 403 FEATURE_DISABLED", async ({
    request,
  }) => {
    await withFlagsOff(request, admin, DIRECTORY_FLAGS, async () => {
      for (const path of ["/member-profiles", `/member-profiles/${firstProfileId}`, "/member-profiles/simple"]) {
        await expectFeatureDisabled(await get(request, admin, path));
      }
    });
    expect((await get(request, admin, "/member-profiles/simple")).status()).toBe(200);
  });
});
