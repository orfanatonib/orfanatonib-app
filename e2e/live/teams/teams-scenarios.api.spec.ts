import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID, DIRECTORY_FLAGS, createShelter, deleteShelterApi, label } from "../shelters/support";
import { outboxCountFor } from "../support/outbox";

/**
 * Cenários de `/teams` por handler (plano 14 §7.3): feliz, escopo, não encontrado, validação,
 * conflito, falha do colaborador, flag desligada e e-mail. Cada cenário cria o próprio abrigo e as
 * próprias equipes pela API (prefixo RUN_TAG), prova o efeito por SELECT e o `afterAll` confere 0 sobras.
 */
interface TeamBody {
  id: string;
  numberTeam: number;
  description?: string | null;
  shelterId: string;
  leaders: Array<{ id: string }>;
}

const LEADER_EMAIL = "e2e.leader@orfanatonib.test";
const TEAM_EMAIL_TEMPLATE = "team-assignment-changed";

test.describe.serial("Equipes — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let member: string;
  let leaderProfileId = "";
  const shelters: string[] = [];
  const teams: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const makeShelter = async (request: APIRequestContext, name: string): Promise<string> => {
    const shelter = await createShelter(request, admin, { name: label(name), teamsQuantity: 1 });
    shelters.push(shelter.id);
    return shelter.id;
  };

  const postTeam = (request: APIRequestContext, token: string, body: Record<string, unknown>) =>
    request.post(`${API_URL}/teams`, { headers: authHeaders(token), data: body });

  const putTeam = (request: APIRequestContext, token: string, id: string, body: Record<string, unknown>) =>
    request.put(`${API_URL}/teams/${id}`, { headers: authHeaders(token), data: body });

  const deleteTeam = (request: APIRequestContext, token: string, id: string) =>
    request.delete(`${API_URL}/teams/${id}`, { headers: authHeaders(token) });

  const getAs = (request: APIRequestContext, token: string | undefined, path: string) =>
    request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

  const makeTeam = async (
    request: APIRequestContext,
    shelterId: string,
    numberTeam: number,
    extra: Record<string, unknown> = {},
  ): Promise<TeamBody> => {
    const response = await postTeam(request, admin, { numberTeam, shelterId, ...extra });
    expect(response.status(), await response.text()).toBe(201);
    const team = await json<TeamBody>(response);
    teams.push(team.id);
    return team;
  };

  /** Abrigo criado pelo cenário, com uma equipe liderada pelo líder do E2E: o "abrigo próprio" dele. */
  const makeLedShelter = async (request: APIRequestContext, name: string): Promise<{ shelterId: string; teamId: string }> => {
    const shelterId = await makeShelter(request, name);
    const team = await makeTeam(request, shelterId, 50, { leaderProfileIds: [leaderProfileId] });
    return { shelterId, teamId: team.id };
  };

  const teamsOfShelter = async (shelterId: string): Promise<number> => countRows("teams", { shelter_id: shelterId });

  const numbersOf = async (shelterId: string): Promise<number[]> => {
    const rows = await queryAll<{ numberTeam: number }>(
      "SELECT numberTeam FROM teams WHERE shelter_id = ? ORDER BY numberTeam",
      [shelterId],
    );
    return rows.map((row) => Number(row.numberTeam));
  };

  const leaderLinks = (teamId: string): Promise<number> => countRows("leader_teams", { team_id: teamId });

  const flagEnabled = async (key: string): Promise<boolean> =>
    ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;

  const withFlagsOff = async (request: APIRequestContext, keys: readonly string[], work: () => Promise<void>): Promise<void> => {
    const initial = new Map<string, boolean>();
    for (const key of keys) initial.set(key, await flagEnabled(key));
    try {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
      }
      await work();
    } finally {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, {
          headers: authHeaders(admin),
          data: { enabled: initial.get(key) ?? true },
        });
      }
    }
  };

  const expectFeatureDisabled = async (response: APIResponse): Promise<void> => {
    expect(response.status()).toBe(403);
    expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
  };

  const teamEmails = (): Promise<number> => outboxCountFor(TEAM_EMAIL_TEMPLATE);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    leaderProfileId =
      (
        await queryOne<{ id: string }>(
          "SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = ?",
          [LEADER_EMAIL],
        )
      )?.id ?? "";
    expect(leaderProfileId, "perfil de líder do E2E").not.toBe("");
  });

  test.afterAll(async ({ request }) => {
    for (const id of teams) await deleteTeam(request, admin, id);
    for (const id of shelters) await deleteShelterApi(request, admin, id);
    // Só os do cenário: o RUN_TAG é do processo e cobre a massa que outros arquivos mantêm.
    for (const id of shelters) expect(await countRows("shelters", { id }), "a limpeza deixou um abrigo do cenário").toBe(0);
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /teams

  test("[team.post.teams#validacao] sem número da equipe, número 0 e shelterId inválido: 400 e nada gravado", async ({ request }) => {
    const shelterId = await makeShelter(request, "post-validacao");
    const before = await teamsOfShelter(shelterId);
    for (const body of [{ shelterId }, { numberTeam: 0, shelterId }, { numberTeam: 2, shelterId: "nao-e-uuid" }]) {
      const res = await postTeam(request, admin, body);
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    expect(await teamsOfShelter(shelterId)).toBe(before);
  });

  test("[team.post.teams#conflito-ou-duplicidade] número já usado no mesmo abrigo: 409 e nenhuma equipe a mais; em outro abrigo o número é livre", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "post-conflito");
    const other = await makeShelter(request, "post-conflito-outro");
    await makeTeam(request, shelterId, 5);
    const before = await numbersOf(shelterId);
    const res = await postTeam(request, admin, { numberTeam: 5, shelterId });
    expect(res.status(), await res.text()).toBe(409);
    expect(await numbersOf(shelterId)).toEqual(before);

    const free = await makeTeam(request, other, 5);
    expect(free.numberTeam).toBe(5);
  });

  test("[team.post.teams#falha-do-colaborador-sem-efeito-parcial] líder inexistente no corpo: 404 e a equipe não é criada; abrigo inexistente: 400", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "post-colaborador");
    const before = await teamsOfShelter(shelterId);
    const missingLeader = await postTeam(request, admin, { numberTeam: 8, shelterId, leaderProfileIds: [BAD_ID] });
    expect(missingLeader.status(), await missingLeader.text()).toBe(404);
    const missingMember = await postTeam(request, admin, { numberTeam: 8, shelterId, memberProfileIds: [BAD_ID] });
    expect(missingMember.status(), await missingMember.text()).toBe(404);
    const missingShelter = await postTeam(request, admin, { numberTeam: 8, shelterId: BAD_ID });
    expect(missingShelter.status()).toBe(400);
    expect(await teamsOfShelter(shelterId)).toBe(before);
  });

  test("[team.post.teams#email-enviado-ou-bloqueado-por-flag] criar equipe não dispara e-mail (o aviso de troca de equipe é do perfil de membro)", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "post-email");
    const before = await teamEmails();
    await makeTeam(request, shelterId, 5, { leaderProfileIds: [leaderProfileId] });
    expect(await teamEmails()).toBe(before);
  });

  // ---------------------------------------------------------------- GET

  test("[team.get.teams#feliz] admin lista e a lista traz a equipe criada, com a mesma contagem do banco", async ({ request }) => {
    const shelterId = await makeShelter(request, "get-lista");
    const team = await makeTeam(request, shelterId, 6);
    const res = await getAs(request, admin, "/teams");
    expect(res.status()).toBe(200);
    const body = await json<TeamBody[]>(res);
    expect(body.find((item) => item.id === team.id)?.numberTeam).toBe(6);
    expect(body.filter((item) => item.shelterId === shelterId)).toHaveLength(await teamsOfShelter(shelterId));
  });

  test("[team.get.teams-id#feliz] detalhe da equipe bate com o banco", async ({ request }) => {
    const shelterId = await makeShelter(request, "get-detalhe");
    const team = await makeTeam(request, shelterId, 6, { description: "Equipe de teste" });
    const res = await getAs(request, admin, `/teams/${team.id}`);
    expect(res.status()).toBe(200);
    const body = await json<TeamBody>(res);
    expect(body).toMatchObject({ id: team.id, numberTeam: 6, shelterId });
    expect((await queryOne<{ description: string }>("SELECT description FROM teams WHERE id = ?", [team.id]))?.description).toBe(
      "Equipe de teste",
    );
  });

  test("[team.get.teams-by-shelter-shelterid#feliz] lista as equipes do abrigo, e só as dele", async ({ request }) => {
    const shelterId = await makeShelter(request, "get-por-abrigo");
    await makeTeam(request, shelterId, 6);
    const res = await getAs(request, admin, `/teams/by-shelter/${shelterId}`);
    expect(res.status()).toBe(200);
    const body = await json<TeamBody[]>(res);
    expect(body.map((item) => item.numberTeam).sort((a, b) => a - b)).toEqual(await numbersOf(shelterId));
    expect(body.every((item) => item.shelterId === shelterId)).toBe(true);
  });

  test("[team.get.teams-by-shelter-shelterid#nao-encontrado] abrigo inexistente: lista vazia 200 (não há abrigo para o admin 'não achar')", async ({
    request,
  }) => {
    const res = await getAs(request, admin, `/teams/by-shelter/${BAD_ID}`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
    expect(await teamsOfShelter(BAD_ID)).toBe(0);
  });

  test("[team.get.teams-my-teams#feliz] o líder vê as próprias equipes e só elas (no banco ele está em leader_teams)", async ({ request }) => {
    const led = await makeLedShelter(request, "get-my-feliz");
    const res = await getAs(request, leader, "/teams/my-teams");
    expect(res.status()).toBe(200);
    const body = await json<TeamBody[]>(res);
    expect(body.map((team) => team.id)).toContain(led.teamId);
    for (const team of body) {
      expect(await countRows("leader_teams", { team_id: team.id, leader_id: leaderProfileId })).toBe(1);
    }
  });

  test("[team.get.teams-my-teams#escopo-proprio-x-outro] equipe de abrigo alheio não aparece em my-teams do líder", async ({ request }) => {
    const shelterId = await makeShelter(request, "get-my-escopo");
    const other = await makeTeam(request, shelterId, 6);
    const body = await json<TeamBody[]>(await getAs(request, leader, "/teams/my-teams"));
    expect(body.map((team) => team.id)).not.toContain(other.id);
  });

  test("[team.get.teams#flag-desligada] [team.get.teams-id#flag-desligada] [team.get.teams-by-shelter-shelterid#flag-desligada] [team.get.teams-my-teams#flag-desligada] com todas as flags do diretório desligadas: 403 FEATURE_DISABLED", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "get-flag");
    const team = await makeTeam(request, shelterId, 6);
    await withFlagsOff(request, DIRECTORY_FLAGS, async () => {
      for (const path of ["/teams", `/teams/${team.id}`, `/teams/by-shelter/${shelterId}`, "/teams/my-teams"]) {
        await expectFeatureDisabled(await getAs(request, admin, path));
      }
    });
    expect((await getAs(request, admin, `/teams/${team.id}`)).status()).toBe(200);
  });

  // ---------------------------------------------------------------- PUT /teams/:id

  test("[team.put.teams-id#feliz] admin altera descrição e líderes: o banco reflete (descrição e leader_teams)", async ({ request }) => {
    const shelterId = await makeShelter(request, "put-feliz");
    const team = await makeTeam(request, shelterId, 6);
    const res = await putTeam(request, admin, team.id, { description: "Nova descrição", leaderProfileIds: [leaderProfileId] });
    expect(res.status(), await res.text()).toBe(200);
    expect((await queryOne<{ description: string }>("SELECT description FROM teams WHERE id = ?", [team.id]))?.description).toBe(
      "Nova descrição",
    );
    expect(await leaderLinks(team.id)).toBe(1);

    const cleared = await putTeam(request, admin, team.id, { leaderProfileIds: [] });
    expect(cleared.status()).toBe(200);
    expect(await leaderLinks(team.id)).toBe(0);
  });

  test("[team.put.teams-id#validacao] número 0 e líder que não é uuid: 400 e a equipe fica como estava", async ({ request }) => {
    const shelterId = await makeShelter(request, "put-validacao");
    const team = await makeTeam(request, shelterId, 6);
    for (const body of [{ numberTeam: 0 }, { leaderProfileIds: ["nao-e-uuid"] }]) {
      const res = await putTeam(request, admin, team.id, body);
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    expect((await numbersOf(shelterId)).includes(6)).toBe(true);
    expect(await leaderLinks(team.id)).toBe(0);
  });

  test("[team.put.teams-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    const res = await putTeam(request, admin, BAD_ID, { description: "x" });
    expect(res.status()).toBe(404);
  });

  test("[team.put.teams-id#conflito-ou-duplicidade] trocar para o número de outra equipe do abrigo: 409 e o número não muda; o próprio número é aceito", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-conflito");
    const first = await makeTeam(request, shelterId, 6);
    await makeTeam(request, shelterId, 7);
    const res = await putTeam(request, admin, first.id, { numberTeam: 7 });
    expect(res.status(), await res.text()).toBe(409);
    expect(await numbersOf(shelterId)).toEqual([1, 6, 7]);

    const same = await putTeam(request, admin, first.id, { numberTeam: 6, description: "mesmo número" });
    expect(same.status(), await same.text()).toBe(200);
  });

  test("[team.put.teams-id#escopo-proprio-x-outro] líder altera a equipe do próprio abrigo, mas não a de abrigo alheio; membro nunca", async ({
    request,
  }) => {
    const led = await makeLedShelter(request, "put-escopo-proprio");
    const ownTeam = await makeTeam(request, led.shelterId, 90);
    const own = await putTeam(request, leader, ownTeam.id, { description: "do líder" });
    expect(own.status(), await own.text()).toBe(200);

    const shelterId = await makeShelter(request, "put-escopo");
    const foreign = await makeTeam(request, shelterId, 6);
    for (const token of [leader, member]) {
      const res = await putTeam(request, token, foreign.id, { description: "invasor" });
      expect([403, 404]).toContain(res.status());
    }
    expect((await queryOne<{ description: string | null }>("SELECT description FROM teams WHERE id = ?", [foreign.id]))?.description).toBeNull();
  });

  test("[team.put.teams-id#falha-do-colaborador-sem-efeito-parcial] líder inexistente junto de outras mudanças: 404 e nada é gravado (descrição, número e vínculos intactos)", async ({
    request,
  }) => {
    const shelterId = await makeShelter(request, "put-colaborador");
    const team = await makeTeam(request, shelterId, 6, { leaderProfileIds: [leaderProfileId] });
    const res = await putTeam(request, admin, team.id, {
      numberTeam: 12,
      description: "não pode gravar",
      leaderProfileIds: [leaderProfileId, BAD_ID],
    });
    expect(res.status(), await res.text()).toBe(404);
    const row = await queryOne<{ numberTeam: number; description: string | null }>(
      "SELECT numberTeam, description FROM teams WHERE id = ?",
      [team.id],
    );
    expect(Number(row?.numberTeam)).toBe(6);
    expect(row?.description).toBeNull();
    expect(await leaderLinks(team.id)).toBe(1);
  });

  test("[team.put.teams-id#email-enviado-ou-bloqueado-por-flag] alterar equipe e líderes não dispara e-mail", async ({ request }) => {
    const shelterId = await makeShelter(request, "put-email");
    const team = await makeTeam(request, shelterId, 6);
    const before = await teamEmails();
    const res = await putTeam(request, admin, team.id, { leaderProfileIds: [leaderProfileId] });
    expect(res.status()).toBe(200);
    expect(await teamEmails()).toBe(before);
  });

  // ---------------------------------------------------------------- DELETE /teams/:id

  test("[team.delete.teams-id#feliz] admin remove: a equipe e os vínculos de líder somem, o perfil do líder permanece", async ({ request }) => {
    const shelterId = await makeShelter(request, "delete-feliz");
    const team = await makeTeam(request, shelterId, 6, { leaderProfileIds: [leaderProfileId] });
    expect(await leaderLinks(team.id)).toBe(1);
    const res = await deleteTeam(request, admin, team.id);
    expect(res.status()).toBe(200);
    expect(await countRows("teams", { id: team.id })).toBe(0);
    expect(await leaderLinks(team.id)).toBe(0);
    expect(await countRows("leader_profiles", { id: leaderProfileId })).toBe(1);
  });

  test("[team.delete.teams-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    const res = await deleteTeam(request, admin, BAD_ID);
    expect(res.status()).toBe(404);
  });

  test("[team.delete.teams-id#escopo-proprio-x-outro] líder remove a equipe do próprio abrigo, mas não a de abrigo alheio; membro nunca", async ({
    request,
  }) => {
    const led = await makeLedShelter(request, "delete-escopo-proprio");
    const own = await makeTeam(request, led.shelterId, 91);
    expect((await deleteTeam(request, leader, own.id)).status()).toBe(200);
    expect(await countRows("teams", { id: own.id })).toBe(0);

    const shelterId = await makeShelter(request, "delete-escopo");
    const foreign = await makeTeam(request, shelterId, 6);
    for (const token of [leader, member]) {
      expect([403, 404]).toContain((await deleteTeam(request, token, foreign.id)).status());
    }
    expect(await countRows("teams", { id: foreign.id })).toBe(1);
  });

  test("[team.delete.teams-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhuma equipe some", async ({ request }) => {
    const shelterId = await makeShelter(request, "delete-colaborador");
    await makeTeam(request, shelterId, 6);
    const before = await teamsOfShelter(shelterId);
    const res = await request.delete(`${API_URL}/teams/nao-e-uuid`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(400);
    expect(await teamsOfShelter(shelterId)).toBe(before);
  });

  test("[team.delete.teams-id#email-enviado-ou-bloqueado-por-flag] remover equipe não dispara e-mail", async ({ request }) => {
    const shelterId = await makeShelter(request, "delete-email");
    const team = await makeTeam(request, shelterId, 6, { leaderProfileIds: [leaderProfileId] });
    const before = await teamEmails();
    expect((await deleteTeam(request, admin, team.id)).status()).toBe(200);
    expect(await teamEmails()).toBe(before);
  });
});
