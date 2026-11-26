import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID, DIRECTORY_FLAGS, createShelter, deleteShelterApi, label } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";

/**
 * Cenários de `/leader-profiles` por handler (plano 15 §7.3). O líder semeado do E2E e um segundo
 * líder (criado pela API) lideram abrigos diferentes, criados pelo cenário: assim o escopo é provado
 * com dados próprios. Tudo é desfeito pela API e o `afterAll` confere 0 sobras.
 */
interface LeaderBody {
  id: string;
  user: { id: string; email: string };
  shelters?: Array<{ id: string; teams: Array<{ id: string; numberTeam: number }> }>;
}

const teamsOfBody = (body: LeaderBody): number => (body.shelters ?? []).reduce((sum, shelter) => sum + shelter.teams.length, 0);

const SEEDED_EMAIL = "e2e.leader@orfanatonib.test";

test.describe.serial("Perfis de líder — cenários por handler", () => {
  let admin: string;
  let seeded: string;
  let seededProfileId = "";
  let other: Actor;
  let otherProfileId = "";
  const shelters: string[] = [];

  const profileOf = async (email: string): Promise<string> =>
    (
      await queryOne<{ id: string }>(
        "SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = ?",
        [email],
      )
    )?.id ?? "";

  const makeShelter = async (request: APIRequestContext, name: string, teamsQuantity = 2): Promise<string> => {
    const shelter = await createShelter(request, admin, { name: label(name), teamsQuantity });
    shelters.push(shelter.id);
    return shelter.id;
  };

  const assign = (request: APIRequestContext, token: string, leaderId: string, body: unknown) =>
    request.put(`${API_URL}/leader-profiles/${leaderId}`, { headers: authHeaders(token), data: body });

  const get = (request: APIRequestContext, token: string | undefined, path: string) =>
    request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

  const linkedTeams = (leaderId: string): Promise<number> => countRows("leader_teams", { leader_id: leaderId });
  const teamsIn = (shelterId: string): Promise<number> => countRows("teams", { shelter_id: shelterId });

  const idsOf = <T extends { id: string }>(items: T[]): string[] => items.map((item) => item.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    seeded = (await loginAs(request, "leader")).accessToken;
    seededProfileId = await profileOf(SEEDED_EMAIL);
    expect(seededProfileId, "perfil do líder semeado").not.toBe("");
    other = await createActor(request, admin, "leader", "outro-lider");
    otherProfileId = await profileOf(other.email);
    expect(otherProfileId, "perfil do segundo líder").not.toBe("");
  });

  test.afterAll(async ({ request }) => {
    for (const id of shelters) await deleteShelterApi(request, admin, id);
    await removeActors(request, admin, [other.id]);
    // Só os do cenário: o RUN_TAG é do processo e cobre a massa que outros arquivos mantêm.
    for (const id of shelters) expect(await countRows("shelters", { id }), "a limpeza deixou um abrigo do cenário").toBe(0);
    expect(await linkedTeams(seededProfileId), "o líder semeado ficou preso a equipes").toBe(0);
    await closeDb();
  });

  // ---------------------------------------------------------------- PUT /leader-profiles/:leaderId

  test("[leader-profile.put.leader-profiles-leaderid#feliz] admin aloca o líder em equipes de dois abrigos e depois o move: leader_teams reflete só o último pedido", async ({
    request,
  }) => {
    const first = await makeShelter(request, "put-feliz-a");
    const second = await makeShelter(request, "put-feliz-b");
    const res = await assign(request, admin, seededProfileId, [
      { shelterId: first, teams: [1, 2] },
      { shelterId: second, teams: [1] },
    ]);
    expect(res.status(), await res.text()).toBe(200);
    expect(await linkedTeams(seededProfileId)).toBe(3);
    expect(teamsOfBody((await res.json()) as LeaderBody)).toBe(3);

    const moved = await assign(request, admin, seededProfileId, [{ shelterId: second, teams: [2] }]);
    expect(moved.status(), await moved.text()).toBe(200);
    expect(await linkedTeams(seededProfileId)).toBe(1);

    expect((await assign(request, admin, seededProfileId, [])).status()).toBe(200);
    expect(await linkedTeams(seededProfileId)).toBe(0);
  });

  test("[leader-profile.put.leader-profiles-leaderid#nao-encontrado] líder inexistente: 404 e nenhuma equipe criada nem vínculo alterado", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-nao-encontrado", 1);
    const before = await teamsIn(shelterId);
    const res = await assign(request, admin, BAD_ID, [{ shelterId, teams: [5] }]);
    expect(res.status()).toBe(404);
    expect(await teamsIn(shelterId)).toBe(before);
  });

  test("[leader-profile.put.leader-profiles-leaderid#conflito-ou-duplicidade] abrigo e número repetidos no pedido: a equipe é criada uma vez e o líder é ligado uma vez", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-duplicado", 1);
    const res = await assign(request, admin, seededProfileId, [
      { shelterId, teams: [3, 3] },
      { shelterId, teams: [3] },
    ]);
    expect(res.status(), await res.text()).toBe(200);
    expect(await teamsIn(shelterId)).toBe(2);
    expect(await countRows("teams", { shelter_id: shelterId, numberTeam: 3 })).toBe(1);
    expect(await linkedTeams(seededProfileId)).toBe(1);
    await assign(request, admin, seededProfileId, []);
  });

  test("[leader-profile.put.leader-profiles-leaderid#falha-do-colaborador-sem-efeito-parcial] abrigo inexistente: 404 e o líder continua nas equipes de antes (antes ficava sem nenhuma)", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-colaborador", 1);
    expect((await assign(request, admin, seededProfileId, [{ shelterId, teams: [1] }])).status()).toBe(200);
    expect(await linkedTeams(seededProfileId)).toBe(1);

    const res = await assign(request, admin, seededProfileId, [{ shelterId: BAD_ID, teams: [1] }]);
    expect(res.status(), await res.text()).toBe(404);
    expect(await linkedTeams(seededProfileId)).toBe(1);
    await assign(request, admin, seededProfileId, []);
  });

  test("[leader-profile.put.leader-profiles-leaderid#rollback-de-transacao] pedido válido + abrigo inexistente: nada do válido é gravado (equipe nova não nasce, vínculo antigo fica)", async ({
    request,
  }) => {
    const kept = await makeShelter(request, "put-rollback-a", 1);
    const fresh = await makeShelter(request, "put-rollback-b", 1);
    expect((await assign(request, admin, seededProfileId, [{ shelterId: kept, teams: [1] }])).status()).toBe(200);
    const teamsBefore = await teamsIn(fresh);

    const res = await assign(request, admin, seededProfileId, [
      { shelterId: fresh, teams: [7] },
      { shelterId: BAD_ID, teams: [1] },
    ]);
    expect(res.status(), await res.text()).toBe(404);
    expect(await teamsIn(fresh), "a equipe nova não pode ter nascido").toBe(teamsBefore);
    expect(await countRows("teams", { shelter_id: kept })).toBe(1);
    expect(await linkedTeams(seededProfileId)).toBe(1);
    await assign(request, admin, seededProfileId, []);
  });

  // ---------------------------------------------------------------- GET (leituras e escopo)

  test("[leader-profile.get.leader-profiles#feliz] admin lista com o envelope paginado e o total bate com o banco", async ({ request }) => {
    const res = await get(request, admin, "/leader-profiles?page=1&limit=100");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: LeaderBody[]; total: number; page: number };
    expect(body.page).toBe(1);
    // A listagem só traz líderes com usuário ativo.
    const active = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.active = 1");
    expect(body.total).toBe(Number(active?.n));
    // A massa acumulada passa de uma página: os dois líderes têm de aparecer ao percorrer a lista inteira.
    const seen = idsOf(body.items);
    for (let next = 2; (next - 1) * 100 < body.total; next += 1) {
      const more = (await (await get(request, admin, `/leader-profiles?page=${next}&limit=100`)).json()) as { items: LeaderBody[] };
      seen.push(...idsOf(more.items));
    }
    expect(seen).toEqual(expect.arrayContaining([seededProfileId, otherProfileId]));
    expect(new Set(seen).size).toBe(seen.length);
  });

  test("[leader-profile.get.leader-profiles-id#feliz] detalhe do líder bate com o banco (usuário e equipes)", async ({ request }) => {
    const shelterId = await makeShelter(request, "get-detalhe", 1);
    await assign(request, admin, otherProfileId, [{ shelterId, teams: [1] }]);
    const res = await get(request, admin, `/leader-profiles/${otherProfileId}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as LeaderBody;
    expect(body.id).toBe(otherProfileId);
    expect(body.user.email).toBe(other.email);
    expect(teamsOfBody(body)).toBe(await linkedTeams(otherProfileId));
    await assign(request, admin, otherProfileId, []);
  });

  test("[leader-profile.get.leader-profiles-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await get(request, admin, `/leader-profiles/${BAD_ID}`)).status()).toBe(404);
  });

  test("[leader-profile.get.leader-profiles#escopo-proprio-x-outro] [leader-profile.get.leader-profiles-simple#escopo-proprio-x-outro] [leader-profile.get.leader-profiles-id#escopo-proprio-x-outro] líder só vê quem atua nos abrigos que ele lidera; o outro líder é 404", async ({
    request,
  }) => {
    const mine = await makeShelter(request, "get-escopo-meu", 1);
    const theirs = await makeShelter(request, "get-escopo-deles", 1);
    await assign(request, admin, seededProfileId, [{ shelterId: mine, teams: [1] }]);
    await assign(request, admin, otherProfileId, [{ shelterId: theirs, teams: [1] }]);

    const page = (await (await get(request, seeded, "/leader-profiles?page=1&limit=100")).json()) as { items: LeaderBody[] };
    expect(idsOf(page.items)).toContain(seededProfileId);
    expect(idsOf(page.items)).not.toContain(otherProfileId);

    const simple = (await (await get(request, seeded, "/leader-profiles/simple")).json()) as Array<{ leaderProfileId?: string; id?: string }>;
    const simpleIds = simple.map((item) => item.leaderProfileId ?? item.id);
    expect(simpleIds).toContain(seededProfileId);
    expect(simpleIds).not.toContain(otherProfileId);

    expect((await get(request, seeded, `/leader-profiles/${seededProfileId}`)).status()).toBe(200);
    expect((await get(request, seeded, `/leader-profiles/${otherProfileId}`)).status()).toBe(404);

    await assign(request, admin, seededProfileId, []);
    await assign(request, admin, otherProfileId, []);
  });

  test("[leader-profile.get.leader-profiles-simple#feliz] admin recebe a lista simples com os dois líderes", async ({ request }) => {
    const res = await get(request, admin, "/leader-profiles/simple");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Array<{ leaderProfileId?: string; id?: string }>;
    const ids = body.map((item) => item.leaderProfileId ?? item.id);
    expect(ids).toEqual(expect.arrayContaining([seededProfileId, otherProfileId]));
  });

  test("[leader-profile.get.leader-profiles-my-shelters#feliz] o líder vê o abrigo que lidera, marcado como dele", async ({ request }) => {
    const shelterId = await makeShelter(request, "get-my-feliz", 1);
    await assign(request, admin, seededProfileId, [{ shelterId, teams: [1] }]);
    const res = await get(request, seeded, "/leader-profiles/my-shelters");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Array<{ id: string }>;
    expect(idsOf(body)).toContain(shelterId);
    expect(await countRows("leader_teams", { leader_id: seededProfileId })).toBe(1);
    await assign(request, admin, seededProfileId, []);
  });

  test("[leader-profile.get.leader-profiles-my-shelters#escopo-proprio-x-outro] cada líder vê só os próprios abrigos; admin e membro não usam a rota", async ({
    request,
  }) => {
    const mine = await makeShelter(request, "get-my-escopo-meu", 1);
    const theirs = await makeShelter(request, "get-my-escopo-deles", 1);
    await assign(request, admin, seededProfileId, [{ shelterId: mine, teams: [1] }]);
    await assign(request, admin, otherProfileId, [{ shelterId: theirs, teams: [1] }]);

    const seededView = (await (await get(request, seeded, "/leader-profiles/my-shelters")).json()) as Array<{ id: string }>;
    expect(idsOf(seededView)).toContain(mine);
    expect(idsOf(seededView)).not.toContain(theirs);

    const otherView = (await (await get(request, other.token, "/leader-profiles/my-shelters")).json()) as Array<{ id: string }>;
    expect(idsOf(otherView)).toContain(theirs);
    expect(idsOf(otherView)).not.toContain(mine);

    expect((await get(request, admin, "/leader-profiles/my-shelters")).status()).toBe(403);
    await assign(request, admin, seededProfileId, []);
    await assign(request, admin, otherProfileId, []);
  });

  test("[leader-profile.get.leader-profiles#flag-desligada] [leader-profile.get.leader-profiles-id#flag-desligada] [leader-profile.get.leader-profiles-simple#flag-desligada] [leader-profile.get.leader-profiles-my-shelters#flag-desligada] com as flags do diretório desligadas: 403 FEATURE_DISABLED", async ({
    request,
  }) => {
    await withFlagsOff(request, admin, DIRECTORY_FLAGS, async () => {
      for (const path of [
        "/leader-profiles",
        `/leader-profiles/${seededProfileId}`,
        "/leader-profiles/simple",
        "/leader-profiles/my-shelters",
      ]) {
        await expectFeatureDisabled(await get(request, admin, path));
      }
    });
    expect((await get(request, admin, "/leader-profiles/simple")).status()).toBe(200);
  });
});
