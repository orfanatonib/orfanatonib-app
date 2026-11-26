import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID, createShelter, deleteShelterApi, label } from "../shelters/support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Cenários de `/shelter-schedules` por handler (plano 21 §7.3). Dois abrigos criados pelo cenário: o líder
 * semeado lidera a equipe do abrigo A e o abrigo B é "dos outros" — o escopo é provado com dados próprios.
 * Tudo é desfeito pela API e o `afterAll` confere 0 sobras (agendas, eventos, abrigos).
 */
interface ScheduleBody {
  id: string;
  visitNumber: number;
  visitDate?: string | null;
  meetingDate?: string | null;
  lessonContent: string;
  /** A equipe vem aninhada no abrigo (`shelter.team`). */
  shelter: { id: string; team: { id: string; numberTeam: number } };
}

const SCHEDULE_FLAGS = ["shelter_schedule", "member_area"] as const;

test.describe.serial("Agenda dos abrigos — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let leaderProfileId = "";
  let shelterA = "";
  let shelterB = "";
  let teamA = "";
  let teamB = "";
  const shelters: string[] = [];
  const created: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const send = (request: APIRequestContext, verb: "GET" | "POST" | "PUT" | "DELETE", path: string, token?: string, data?: unknown) =>
    request.fetch(`${API_URL}${path}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" || verb === "DELETE" ? undefined : (data ?? {}),
    });

  const teamOf = async (shelterId: string): Promise<string> =>
    (await queryOne<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? ORDER BY numberTeam LIMIT 1", [shelterId]))?.id ?? "";

  let visitSeq = 0;
  const make = async (
    request: APIRequestContext,
    lesson: string,
    options: { teamId?: string; visitNumber?: number; withDates?: boolean } = {},
  ): Promise<ScheduleBody> => {
    const res = await send(request, "POST", "/shelter-schedules", admin, {
      visitNumber: options.visitNumber ?? (visitSeq += 1) + 100,
      lessonContent: label(lesson),
      teamId: options.teamId ?? teamA,
      ...(options.withDates === false ? {} : { visitDate: "2026-12-01", meetingDate: "2026-12-02" }),
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = await json<ScheduleBody>(res);
    created.push(body.id);
    return body;
  };

  const rowOf = (id: string) =>
    queryOne<{
      id: string;
      visitNumber: number;
      visitDate: string | null;
      meetingDate: string | null;
      lessonContent: string;
      team_id: string;
    }>("SELECT id, visitNumber, visitDate, meetingDate, lessonContent, team_id FROM shelter_schedules WHERE id = ?", [id]);

  const eventsOf = (id: string): Promise<number> => countRows("events", { shelter_schedule_id: id });

  const schedulesWithTag = async (tag: string): Promise<number> =>
    Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM shelter_schedules WHERE lessonContent LIKE ?", [`%${tag}%`]))?.n ?? 0);

  const snapshot = async (): Promise<{ schedules: number; events: number }> => ({
    schedules: await countRows("shelter_schedules", {}),
    events: await countRows("events", {}),
  });

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    leaderProfileId =
      (
        await queryOne<{ id: string }>(
          "SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = 'e2e.leader@orfanatonib.test'",
        )
      )?.id ?? "";
    expect(leaderProfileId, "perfil do líder semeado").not.toBe("");
    for (const name of ["agenda-a", "agenda-b"]) {
      shelters.push((await createShelter(request, admin, { name: label(name), teamsQuantity: 1 })).id);
    }
    [shelterA, shelterB] = shelters;
    [teamA, teamB] = [await teamOf(shelterA), await teamOf(shelterB)];
    const lead = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, {
      headers: authHeaders(admin),
      data: [{ shelterId: shelterA, teams: [1] }],
    });
    expect(lead.status(), await lead.text()).toBe(200);
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await request.delete(`${API_URL}/shelter-schedules/${id}`, { headers: authHeaders(admin) });
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    for (const id of shelters) await deleteShelterApi(request, admin, id);
    if (CLEANUP_ENABLED) expect(await schedulesWithTag(RUN_TAG), "a limpeza deixou agendas do E2E").toBe(0);
    // Só os do cenário: o RUN_TAG é do processo e cobre a massa que outros arquivos mantêm.
    for (const id of shelters) expect(await countRows("shelters", { id }), "a limpeza deixou um abrigo do cenário").toBe(0);
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /shelter-schedules

  test("[shelter-schedule.post.shelter-schedules#feliz] admin cria com datas: a linha bate com o banco e nascem os dois eventos (visita e encontro)", async ({ request }) => {
    const body = await make(request, "post-feliz");
    expect(body.shelter.team.id).toBe(teamA);
    expect(body.shelter.id).toBe(shelterA);
    expect(await rowOf(body.id)).toMatchObject({ lessonContent: label("post-feliz"), visitDate: "2026-12-01", meetingDate: "2026-12-02", team_id: teamA });
    expect(await eventsOf(body.id)).toBe(2);
  });

  test("[shelter-schedule.post.shelter-schedules#validacao] data que não é data, lição vazia, visita 0 e equipe inválida: 400 e nada gravado", async ({ request }) => {
    const before = await snapshot();
    const base = { visitNumber: 90, lessonContent: label("validacao"), teamId: teamA };
    for (const body of [
      { ...base, visitDate: "ontem" },
      { ...base, meetingDate: "amanhã" },
      { ...base, lessonContent: "" },
      { ...base, visitNumber: 0 },
      { ...base, teamId: "nao-e-uuid" },
      { visitNumber: 91, teamId: teamA },
    ]) {
      const res = await send(request, "POST", "/shelter-schedules", admin, body);
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    expect(await snapshot()).toEqual(before);
  });

  test("[shelter-schedule.post.shelter-schedules#conflito-ou-duplicidade] mesmo número de visita na mesma equipe: 409 sem gravar; em outra equipe o número é livre", async ({
    request,
  }) => {
    await make(request, "post-conflito", { visitNumber: 7 });
    const before = await snapshot();
    const dup = await send(request, "POST", "/shelter-schedules", admin, { visitNumber: 7, lessonContent: label("post-conflito-2"), teamId: teamA });
    expect(dup.status(), await dup.text()).toBe(409);
    expect(await snapshot()).toEqual(before);
    const other = await make(request, "post-conflito-b", { visitNumber: 7, teamId: teamB });
    expect(other.shelter.team.id).toBe(teamB);
  });

  test("[shelter-schedule.post.shelter-schedules#falha-do-colaborador-sem-efeito-parcial] equipe inexistente: 404 e nem a agenda nem os eventos são gravados", async ({
    request,
  }) => {
    const before = await snapshot();
    const res = await send(request, "POST", "/shelter-schedules", admin, {
      visitNumber: 55,
      lessonContent: label("post-colaborador"),
      teamId: BAD_ID,
      visitDate: "2026-12-01",
      meetingDate: "2026-12-02",
    });
    expect(res.status(), await res.text()).toBe(404);
    expect(await snapshot()).toEqual(before);
  });

  // ---------------------------------------------------------------- GET /shelter-schedules

  test("[shelter-schedule.get.shelter-schedules#feliz] admin lista e a agenda criada vem com equipe e abrigo iguais aos do banco", async ({ request }) => {
    const created = await make(request, "get-lista");
    const res = await send(request, "GET", "/shelter-schedules", admin);
    expect(res.status()).toBe(200);
    const item = (await json<ScheduleBody[]>(res)).find((entry) => entry.id === created.id);
    expect(item?.shelter.team.id).toBe((await rowOf(created.id))?.team_id);
    expect(item?.shelter.id).toBe(shelterA);
    expect(item?.lessonContent).toBe(label("get-lista"));
  });

  test("[shelter-schedule.get.shelter-schedules#escopo-proprio-x-outro] o líder só vê a agenda da equipe que lidera; `?teamId=` de outra equipe não fura o escopo", async ({
    request,
  }) => {
    const mine = await make(request, "get-escopo-meu", { teamId: teamA });
    const theirs = await make(request, "get-escopo-deles", { teamId: teamB });
    const list = await json<ScheduleBody[]>(await send(request, "GET", "/shelter-schedules", leader));
    expect(list.map((entry) => entry.id)).toContain(mine.id);
    expect(list.map((entry) => entry.id)).not.toContain(theirs.id);

    const forced = await json<ScheduleBody[]>(await send(request, "GET", `/shelter-schedules?teamId=${teamB}`, leader));
    expect(forced.map((entry) => entry.id)).not.toContain(theirs.id);
  });

  test("[shelter-schedule.get.shelter-schedules#flag-desligada] com shelter_schedule e member_area desligadas: 403 FEATURE_DISABLED", async ({ request }) => {
    await withFlagsOff(request, admin, SCHEDULE_FLAGS, async () => {
      await expectFeatureDisabled(await send(request, "GET", "/shelter-schedules", admin));
    });
    expect((await send(request, "GET", "/shelter-schedules", admin)).status()).toBe(200);
  });

  // ---------------------------------------------------------------- PUT /shelter-schedules/:id

  test("[shelter-schedule.put.shelter-schedules-id#feliz] admin altera lição e datas: o banco reflete e os eventos continuam um por data", async ({ request }) => {
    const created = await make(request, "put-feliz");
    const res = await send(request, "PUT", `/shelter-schedules/${created.id}`, admin, {
      lessonContent: label("put-feliz-novo"),
      visitDate: "2026-12-10",
      meetingDate: "2026-12-11",
    });
    expect(res.status(), await res.text()).toBe(200);
    expect(await rowOf(created.id)).toMatchObject({ lessonContent: label("put-feliz-novo"), visitDate: "2026-12-10", meetingDate: "2026-12-11" });
    expect(await eventsOf(created.id)).toBe(2);
  });

  test("[shelter-schedule.put.shelter-schedules-id#validacao] data inválida, lição vazia/null, visita 0: 400 e a agenda fica como estava", async ({ request }) => {
    const created = await make(request, "put-validacao");
    const before = await rowOf(created.id);
    for (const body of [{ visitDate: "ontem" }, { meetingDate: "amanhã" }, { lessonContent: "" }, { lessonContent: null }, { visitNumber: 0 }]) {
      const res = await send(request, "PUT", `/shelter-schedules/${created.id}`, admin, body);
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    expect(await rowOf(created.id)).toEqual(before);
  });

  test("[shelter-schedule.put.shelter-schedules-id#nao-encontrado] uuid inexistente: 404 e nada é criado", async ({ request }) => {
    const before = await snapshot();
    expect((await send(request, "PUT", `/shelter-schedules/${BAD_ID}`, admin, { lessonContent: label("put-fantasma") })).status()).toBe(404);
    expect(await snapshot()).toEqual(before);
  });

  test("[shelter-schedule.put.shelter-schedules-id#conflito-ou-duplicidade] trocar para um número de visita que a equipe já tem: 409 e o número não muda; o próprio número é aceito", async ({
    request,
  }) => {
    const first = await make(request, "put-conflito-a", { visitNumber: 31 });
    await make(request, "put-conflito-b", { visitNumber: 32 });
    const res = await send(request, "PUT", `/shelter-schedules/${first.id}`, admin, { visitNumber: 32 });
    expect(res.status(), await res.text()).toBe(409);
    expect((await rowOf(first.id))?.visitNumber).toBe(31);
    expect((await send(request, "PUT", `/shelter-schedules/${first.id}`, admin, { visitNumber: 31, observation: "mesmo número" })).status()).toBe(200);
  });

  test("[shelter-schedule.put.shelter-schedules-id#falha-do-colaborador-sem-efeito-parcial] equipe de destino inexistente junto de outras mudanças: 404 e nada é gravado (agenda e eventos intactos)", async ({
    request,
  }) => {
    const created = await make(request, "put-colaborador");
    const before = await rowOf(created.id);
    const eventsBefore = await eventsOf(created.id);
    const res = await send(request, "PUT", `/shelter-schedules/${created.id}`, admin, {
      teamId: BAD_ID,
      lessonContent: label("put-nao-grava"),
      visitDate: "2027-01-01",
    });
    expect(res.status(), await res.text()).toBe(404);
    expect(await rowOf(created.id)).toEqual(before);
    expect(await eventsOf(created.id)).toBe(eventsBefore);
  });

  // ---------------------------------------------------------------- DELETE /shelter-schedules/:id

  test("[shelter-schedule.delete.shelter-schedules-id#feliz] admin remove: a agenda e os dois eventos somem do banco", async ({ request }) => {
    const created = await make(request, "delete-feliz");
    expect(await eventsOf(created.id)).toBe(2);
    const res = await send(request, "DELETE", `/shelter-schedules/${created.id}`, admin);
    expect(res.status()).toBe(204);
    expect(await rowOf(created.id)).toBeNull();
    expect(await eventsOf(created.id)).toBe(0);
  });

  test("[shelter-schedule.delete.shelter-schedules-id#nao-encontrado] uuid inexistente: 404 e nada some", async ({ request }) => {
    const before = await snapshot();
    expect((await send(request, "DELETE", `/shelter-schedules/${BAD_ID}`, admin)).status()).toBe(404);
    expect(await snapshot()).toEqual(before);
  });

  test("[shelter-schedule.delete.shelter-schedules-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhuma agenda nem evento some", async ({
    request,
  }) => {
    const created = await make(request, "delete-colaborador");
    const before = await snapshot();
    expect((await send(request, "DELETE", "/shelter-schedules/nao-e-uuid", admin)).status()).toBe(400);
    expect(await snapshot()).toEqual(before);
    expect(await rowOf(created.id)).not.toBeNull();
  });
});
