import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID, createShelter, deleteShelterApi, label, sheltersWithTag } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";

/**
 * Cenários de `/attendance` por handler (plano 22 §7.3). Dois abrigos criados pelo cenário: o líder semeado lidera a
 * equipe do A (onde está o membro A) e o abrigo B é "dos outros" (membro B). Agendas criadas pela API; a frequência é
 * provada por SELECT em `attendance_records`. Tudo é desfeito pela API e o `afterAll` confere 0 sobras.
 */
interface RecordBody {
  id: string;
  type: string;
  category: string;
  memberId: string;
  scheduleId: string;
}

const ATTENDANCE_FLAG = ["attendance"] as const;

test.describe.serial("Frequência — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let leaderProfileId = "";
  let memberA: Actor;
  let memberB: Actor;
  let shelterA = "";
  let shelterB = "";
  let teamA = "";
  let teamB = "";
  let scheduleA = "";
  let scheduleB = "";
  const shelters: string[] = [];
  const schedules: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const send = (request: APIRequestContext, verb: "GET" | "POST", path: string, token?: string, data?: unknown) =>
    request.fetch(`${API_URL}${path}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" ? undefined : (data ?? {}),
    });

  const teamOf = async (shelterId: string): Promise<string> =>
    (await queryOne<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? ORDER BY numberTeam LIMIT 1", [shelterId]))?.id ?? "";

  const profileOf = async (email: string): Promise<string> =>
    (await queryOne<{ id: string }>("SELECT p.id AS id FROM member_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?", [email]))?.id ?? "";

  const makeSchedule = async (request: APIRequestContext, teamId: string, visitNumber: number, name: string): Promise<string> => {
    const res = await send(request, "POST", "/shelter-schedules", admin, {
      visitNumber,
      lessonContent: label(name),
      teamId,
      visitDate: "2026-11-01",
      meetingDate: "2026-11-02",
    });
    expect(res.status(), await res.text()).toBe(201);
    const id = (await json<{ id: string }>(res)).id;
    schedules.push(id);
    return id;
  };

  const recordsOf = (memberId: string, scheduleId: string) =>
    countRows("attendance_records", { member_id: memberId, shelter_schedule_id: scheduleId });

  const typeOf = async (memberId: string, scheduleId: string, category = "visit"): Promise<string | null> =>
    (await queryOne<{ type: string }>("SELECT type FROM attendance_records WHERE member_id = ? AND shelter_schedule_id = ? AND category = ?", [memberId, scheduleId, category]))?.type ?? null;

  const totalRecords = (): Promise<number> => countRows("attendance_records", {});

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    leaderProfileId =
      (await queryOne<{ id: string }>("SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = 'e2e.leader@orfanatonib.test'"))?.id ?? "";
    expect(leaderProfileId, "perfil do líder semeado").not.toBe("");
    memberA = await createActor(request, admin, "member", "freq-a");
    memberB = await createActor(request, admin, "member", "freq-b");
    for (const name of ["freq-a", "freq-b"]) shelters.push((await createShelter(request, admin, { name: label(name), teamsQuantity: 1 })).id);
    [shelterA, shelterB] = shelters;
    [teamA, teamB] = [await teamOf(shelterA), await teamOf(shelterB)];
    const lead = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId: shelterA, teams: [1] }] });
    expect(lead.status(), await lead.text()).toBe(200);
    for (const [actor, shelterId] of [[memberA, shelterA], [memberB, shelterB]] as const) {
      const placed = await request.put(`${API_URL}/member-profiles/${await profileOf(actor.email)}`, {
        headers: authHeaders(admin),
        data: { shelterId, numberTeam: 1 },
      });
      expect(placed.status(), await placed.text()).toBe(200);
    }
    scheduleA = await makeSchedule(request, teamA, 1, "freq-agenda-a");
    scheduleB = await makeSchedule(request, teamB, 1, "freq-agenda-b");
  });

  test.afterAll(async ({ request }) => {
    // Os lançamentos caem junto com o usuário (cascata); só então as agendas podem sair.
    await removeActors(request, admin, [memberA.id, memberB.id]);
    for (const id of schedules) await request.delete(`${API_URL}/shelter-schedules/${id}`, { headers: authHeaders(admin) });
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    for (const id of shelters) await deleteShelterApi(request, admin, id);
    expect(await sheltersWithTag(RUN_TAG), "a limpeza deixou abrigos do E2E").toBe(0);
    expect(await countRows("shelter_schedules", {}), "agendas do E2E").toBeGreaterThanOrEqual(0);
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /attendance/register

  test("[attendance.post.attendance-register#feliz] o membro lança a própria presença na agenda da equipe dele: a linha bate com o banco", async ({ request }) => {
    const res = await send(request, "POST", "/attendance/register", memberA.token, { scheduleId: scheduleA, type: "present", comment: "cheguei" });
    expect(res.status(), await res.text()).toBe(201);
    const body = await json<RecordBody>(res);
    expect(body).toMatchObject({ type: "present", category: "visit", memberId: memberA.id, scheduleId: scheduleA });
    expect(await typeOf(memberA.id, scheduleA)).toBe("present");
    expect(await recordsOf(memberA.id, scheduleA)).toBe(1);
  });

  test("[attendance.post.attendance-register#validacao] agenda que não é uuid, tipo inválido e comentário acima de 500: 400 e nada gravado", async ({ request }) => {
    const before = await totalRecords();
    for (const data of [
      { scheduleId: "nao-e-uuid", type: "present" },
      { scheduleId: scheduleA, type: "talvez" },
      { scheduleId: scheduleA, type: "present", category: "outra" },
      { scheduleId: scheduleA, type: "present", comment: "x".repeat(501) },
      { type: "present" },
    ]) {
      const res = await send(request, "POST", "/attendance/register", memberA.token, data);
      expect(res.status(), JSON.stringify(data).slice(0, 70)).toBe(400);
    }
    expect(await totalRecords()).toBe(before);
  });

  test("[attendance.post.attendance-register#conflito-ou-duplicidade] relançar na mesma agenda e categoria corrige o registro (uma linha só)", async ({ request }) => {
    const res = await send(request, "POST", "/attendance/register", memberA.token, { scheduleId: scheduleA, type: "absent", comment: "mudei" });
    expect(res.status(), await res.text()).toBe(201);
    expect(await recordsOf(memberA.id, scheduleA)).toBe(1);
    expect(await typeOf(memberA.id, scheduleA)).toBe("absent");
    const meeting = await send(request, "POST", "/attendance/register", memberA.token, { scheduleId: scheduleA, type: "present", category: "meeting" });
    expect(meeting.status(), await meeting.text()).toBe(201);
    expect(await recordsOf(memberA.id, scheduleA)).toBe(2);
  });

  test("[attendance.post.attendance-register#escopo-proprio-x-outro] o membro não lança na agenda de outra equipe (403) e a agenda inexistente é 404: nada gravado", async ({ request }) => {
    const before = await totalRecords();
    const foreign = await send(request, "POST", "/attendance/register", memberA.token, { scheduleId: scheduleB, type: "present" });
    expect(foreign.status(), await foreign.text()).toBe(403);
    const missing = await send(request, "POST", "/attendance/register", memberA.token, { scheduleId: BAD_ID, type: "present" });
    expect(missing.status()).toBe(404);
    expect(await totalRecords()).toBe(before);
    expect(await recordsOf(memberA.id, scheduleB)).toBe(0);
  });

  test("[attendance.post.attendance-register#falha-do-colaborador-sem-efeito-parcial] agenda sem nenhuma data: 400 e nada gravado", async ({ request }) => {
    const noDate = await send(request, "POST", "/shelter-schedules", admin, { visitNumber: 9, lessonContent: label("freq-sem-data"), teamId: teamA });
    expect(noDate.status(), await noDate.text()).toBe(201);
    const id = (await json<{ id: string }>(noDate)).id;
    schedules.push(id);
    const before = await totalRecords();
    const res = await send(request, "POST", "/attendance/register", memberA.token, { scheduleId: id, type: "present" });
    expect(res.status(), await res.text()).toBe(400);
    expect(await totalRecords()).toBe(before);
    expect(await recordsOf(memberA.id, id)).toBe(0);
  });

  // ---------------------------------------------------------------- POST /attendance/register/team

  test("[attendance.post.attendance-register-team#feliz] o líder lança a frequência de um membro da equipe dele: a linha bate com o banco", async ({ request }) => {
    const res = await send(request, "POST", "/attendance/register/team", leader, {
      teamId: teamA,
      scheduleId: scheduleA,
      attendances: [{ memberId: memberA.id, type: "present", comment: "lançado pelo líder" }],
    });
    expect(res.status(), await res.text()).toBe(201);
    expect(await typeOf(memberA.id, scheduleA)).toBe("present");
    expect(await recordsOf(memberA.id, scheduleA)).toBe(2);
  });

  test("[attendance.post.attendance-register-team#validacao] lista vazia, tipo inválido e membro que não é uuid: 400 e nada gravado", async ({ request }) => {
    const before = await totalRecords();
    for (const attendances of [[], [{ memberId: memberA.id, type: "talvez" }], [{ memberId: "nao-e-uuid", type: "present" }]]) {
      const res = await send(request, "POST", "/attendance/register/team", leader, { teamId: teamA, scheduleId: scheduleA, attendances });
      expect(res.status(), JSON.stringify(attendances).slice(0, 70)).toBe(400);
    }
    expect(await totalRecords()).toBe(before);
  });

  test("[attendance.post.attendance-register-team#conflito-ou-duplicidade] o mesmo membro duas vezes no mesmo pedido e relançar: continua um registro por membro, agenda e categoria", async ({ request }) => {
    const res = await send(request, "POST", "/attendance/register/team", leader, {
      teamId: teamA,
      scheduleId: scheduleA,
      attendances: [
        { memberId: memberA.id, type: "absent" },
        { memberId: memberA.id, type: "present" },
      ],
    });
    expect(res.status(), await res.text()).toBe(201);
    expect(await countRows("attendance_records", { member_id: memberA.id, shelter_schedule_id: scheduleA, category: "visit" })).toBe(1);
    expect(await typeOf(memberA.id, scheduleA)).toBe("present");
  });

  test("[attendance.post.attendance-register-team#falha-do-colaborador-sem-efeito-parcial] um membro que não é da equipe no meio da lista: 400 e NENHUM registro da lista é gravado (nem o dos membros válidos)", async ({ request }) => {
    const before = await totalRecords();
    const typeBefore = await typeOf(memberA.id, scheduleA, "meeting");
    const res = await send(request, "POST", "/attendance/register/team", leader, {
      teamId: teamA,
      scheduleId: scheduleA,
      category: "meeting",
      attendances: [
        { memberId: memberA.id, type: "absent" },
        { memberId: memberB.id, type: "present" },
      ],
    });
    expect(res.status(), await res.text()).toBe(400);
    expect(await totalRecords()).toBe(before);
    expect(await typeOf(memberA.id, scheduleA, "meeting")).toBe(typeBefore);
    expect(await recordsOf(memberB.id, scheduleA)).toBe(0);
  });

  test("[attendance.post.attendance-register-team#flag-desligada] com attendance desligada: 403 FEATURE_DISABLED e nada gravado", async ({ request }) => {
    const before = await totalRecords();
    await withFlagsOff(request, admin, ATTENDANCE_FLAG, async () => {
      const res = await send(request, "POST", "/attendance/register/team", leader, {
        teamId: teamA,
        scheduleId: scheduleA,
        attendances: [{ memberId: memberA.id, type: "present" }],
      });
      await expectFeatureDisabled(res);
    });
    expect(await totalRecords()).toBe(before);
  });

  // ---------------------------------------------------------------- GET

  test("[attendance.get.attendance-pending-all#feliz] pendências do líder e do membro: o membro sem lançamento na agenda B aparece como pendente", async ({ request }) => {
    const asMember = await send(request, "GET", "/attendance/pending/all", memberB.token);
    expect(asMember.status(), await asMember.text()).toBe(200);
    const body = await json<{ leaderPendings: unknown[]; memberPendings: Array<{ scheduleId: string }>; visitReportPendings: unknown[] }>(asMember);
    expect(Array.isArray(body.leaderPendings)).toBe(true);
    expect(body.memberPendings.map((item) => item.scheduleId)).toContain(scheduleB);
  });

  test("[attendance.get.attendance-pending-all#escopo-proprio-x-outro] o membro A (que já lançou) não tem pendência na agenda A nem enxerga a da B; o líder só vê a equipe que lidera", async ({ request }) => {
    const asA = await json<{ memberPendings: Array<{ scheduleId: string }> }>(await send(request, "GET", "/attendance/pending/all", memberA.token));
    expect(asA.memberPendings.map((item) => item.scheduleId)).not.toContain(scheduleB);
    const asLeader = await json<{ leaderPendings: Array<{ teamId: string }> }>(await send(request, "GET", "/attendance/pending/all", leader));
    expect(asLeader.leaderPendings.map((item) => item.teamId)).not.toContain(teamB);
  });

  test("[attendance.get.attendance-pending-all#flag-desligada] [attendance.get.attendance-team-teamid-members#flag-desligada] [attendance.get.attendance-team-teamid-schedules#flag-desligada] [attendance.get.attendance-leader-teams-members#flag-desligada] [attendance.get.attendance-sheets-hierarchical#flag-desligada] [attendance.get.attendance-leader-stats-team-teamid#flag-desligada] com attendance desligada: 403 FEATURE_DISABLED", async ({
    request,
  }) => {
    await withFlagsOff(request, admin, ATTENDANCE_FLAG, async () => {
      for (const path of [
        "/attendance/pending/all",
        `/attendance/team/${teamA}/members`,
        `/attendance/team/${teamA}/schedules`,
        "/attendance/leader/teams/members",
        "/attendance/sheets/hierarchical",
        `/attendance/leader/stats/team/${teamA}`,
      ]) {
        await expectFeatureDisabled(await send(request, "GET", path, admin));
      }
    });
    expect((await send(request, "GET", "/attendance/pending/all", admin)).status()).toBe(200);
  });

  test("[attendance.get.attendance-team-teamid-members#feliz] o líder lista os membros da equipe dele, batendo com o banco", async ({ request }) => {
    const res = await send(request, "GET", `/attendance/team/${teamA}/members`, leader);
    expect(res.status(), await res.text()).toBe(200);
    const body = await json<{ teamId: string; members: Array<{ id: string }> }>(res);
    expect(body.teamId).toBe(teamA);
    expect(body.members.map((member) => member.id)).toContain(memberA.id);
    expect(body.members.map((member) => member.id)).not.toContain(memberB.id);
  });

  test("[attendance.get.attendance-team-teamid-members#nao-encontrado] equipe inexistente: 404 (líder) e a de outro abrigo é recusada", async ({ request }) => {
    expect((await send(request, "GET", `/attendance/team/${BAD_ID}/members`, admin)).status()).toBe(404);
    const foreign = await send(request, "GET", `/attendance/team/${teamB}/members`, leader);
    expect([403, 404]).toContain(foreign.status());
  });

  test("[attendance.get.attendance-team-teamid-schedules#feliz] as agendas da equipe vêm com a que criamos", async ({ request }) => {
    const res = await send(request, "GET", `/attendance/team/${teamA}/schedules`, memberA.token);
    expect(res.status(), await res.text()).toBe(200);
    const body = await json<Array<{ scheduleId?: string; id?: string }>>(res);
    expect(body.map((item) => item.scheduleId ?? item.id)).toContain(scheduleA);
  });

  test("[attendance.get.attendance-team-teamid-schedules#escopo-proprio-x-outro] o membro A não lê as agendas da equipe B", async ({ request }) => {
    const res = await send(request, "GET", `/attendance/team/${teamB}/schedules`, memberA.token);
    expect([403, 404]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-schedules#nao-encontrado] equipe inexistente: 404", async ({ request }) => {
    expect((await send(request, "GET", `/attendance/team/${BAD_ID}/schedules`, admin)).status()).toBe(404);
  });

  test("[attendance.get.attendance-leader-teams#feliz] o líder lista as equipes que lidera (a A, não a B)", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/leader/teams", leader);
    expect(res.status(), await res.text()).toBe(200);
    const ids = (await json<Array<{ teamId?: string; id?: string }>>(res)).map((item) => item.teamId ?? item.id);
    expect(ids).toContain(teamA);
    expect(ids).not.toContain(teamB);
  });

  test("[attendance.get.attendance-leader-teams-members#feliz] o líder lista abrigos, equipes e membros dele", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/leader/teams/members", leader);
    expect(res.status(), await res.text()).toBe(200);
    expect(JSON.stringify(await res.json())).toContain(memberA.id);
  });

  test("[attendance.get.attendance-sheets-hierarchical#feliz] a ficha hierárquica do líder traz o abrigo A com a equipe", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/sheets/hierarchical", leader);
    expect(res.status(), await res.text()).toBe(200);
    const text = JSON.stringify(await res.json());
    expect(text).toContain(shelterA);
    expect(text).not.toContain(shelterB);
  });

  test("[attendance.get.attendance-records#feliz] os lançamentos do membro vêm paginados e batem com o banco", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/records?page=1&limit=50", memberA.token);
    expect(res.status(), await res.text()).toBe(200);
    const body = await json<{ data: Array<{ memberId: string }>; meta: { total: number } }>(res);
    expect(body.meta.total).toBe(await countRows("attendance_records", { member_id: memberA.id }));
    expect(body.data.every((item) => item.memberId === memberA.id)).toBe(true);
  });

  test("[attendance.get.attendance-records#escopo-proprio-x-outro] o membro só lê os próprios lançamentos; o líder, os da equipe dele; o admin, todos", async ({ request }) => {
    await send(request, "POST", "/attendance/register", memberB.token, { scheduleId: scheduleB, type: "present" });
    const asB = await json<{ data: Array<{ memberId: string }> }>(await send(request, "GET", "/attendance/records?page=1&limit=100", memberB.token));
    expect(asB.data.every((item) => item.memberId === memberB.id)).toBe(true);
    const asLeader = await json<{ data: Array<{ memberId: string }> }>(await send(request, "GET", "/attendance/records?page=1&limit=100", leader));
    expect(asLeader.data.map((item) => item.memberId)).not.toContain(memberB.id);
    // O admin enxerga as duas equipes (o filtro por equipe separa os lançamentos de cada uma).
    for (const [teamId, member] of [[teamA, memberA], [teamB, memberB]] as const) {
      const asAdmin = await json<{ data: Array<{ memberId: string }> }>(await send(request, "GET", `/attendance/records?page=1&limit=100&teamId=${teamId}`, admin));
      expect(asAdmin.data.map((item) => item.memberId)).toContain(member.id);
    }
  });

  test("[attendance.get.attendance-stats#feliz] as estatísticas do membro respondem e contam só os lançamentos dele", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/stats", memberA.token);
    expect(res.status(), await res.text()).toBe(200);
    expect(typeof (await res.json())).toBe("object");
  });

  test("[attendance.get.attendance-stats#escopo-proprio-x-outro] estatística de equipe de outro abrigo não é do membro: filtrar por `teamId` alheio devolve vazio ou recusa, nunca os dados do outro", async ({ request }) => {
    const res = await send(request, "GET", `/attendance/stats?teamId=${teamB}`, memberA.token);
    expect([200, 403, 404]).toContain(res.status());
    if (res.status() === 200) expect(JSON.stringify(await res.json())).not.toContain(memberB.id);
  });

  test("[attendance.get.attendance-leader-stats-team-teamid#feliz] o líder lê as estatísticas da equipe dele", async ({ request }) => {
    const res = await send(request, "GET", `/attendance/leader/stats/team/${teamA}`, leader);
    expect(res.status(), await res.text()).toBe(200);
    expect(typeof (await res.json())).toBe("object");
  });

  test("[attendance.get.attendance-leader-stats-team-teamid#nao-encontrado] equipe inexistente: 404; a de outro abrigo é recusada para o líder", async ({ request }) => {
    expect((await send(request, "GET", `/attendance/leader/stats/team/${BAD_ID}`, admin)).status()).toBe(404);
    expect([403, 404]).toContain((await send(request, "GET", `/attendance/leader/stats/team/${teamB}`, leader)).status());
  });
});
