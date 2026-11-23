import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { authHeaders, expect, loginAs } from "../support/live";
import { createShelter, deleteShelterApi } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";
import { cleanupData, CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Massa da listagem de agendamentos, toda criada pela API: dois abrigos do E2E (A com 2 equipes e B com 1),
 * 15 agendamentos (A·eq1: 10 com visita+reunião; A·eq2: 2 só de reunião; B·eq1: 3 só de visita),
 * um líder da equipe 1 do abrigo A, um líder sem equipe e um membro da equipe 1 do abrigo A.
 */
export const SCHEDULE_TOTAL = 15;

export interface ScheduleWorld {
  tag: string;
  adminToken: string;
  shelterA: { id: string; name: string; team1: string; team2: string };
  shelterB: { id: string; name: string; team1: string };
  /** Todos os agendamentos criados, na ordem de criação. */
  ids: string[];
  leader: Actor;
  idleLeader: Actor;
  member: Actor;
  special: { id: string; lesson: string };
  room: { id: string; room: string };
}

const pad = (n: number): string => String(n).padStart(2, "0");

async function profileId(table: "leader_profiles" | "member_profiles", userId: string): Promise<string> {
  const row = await queryOne<{ id: string }>(`SELECT id FROM ${table} WHERE user_id = ?`, [userId]);
  expect(row?.id, `perfil em ${table}`).toBeTruthy();
  return row!.id;
}

async function post(request: APIRequestContext, token: string, data: Record<string, unknown>): Promise<string> {
  const res = await request.post(`${API_URL}/shelter-schedules`, { headers: authHeaders(token), data });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

export async function buildScheduleWorld(request: APIRequestContext, tag: string): Promise<ScheduleWorld> {
  const adminToken = (await loginAs(request, "admin")).accessToken;
  const teamIds = async (shelterId: string): Promise<string[]> =>
    (await queryAll<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? ORDER BY numberTeam", [shelterId])).map((row) => row.id);

  const a = await createShelter(request, adminToken, { name: `${tag} Alfa`, teamsQuantity: 2 });
  const b = await createShelter(request, adminToken, { name: `${tag} Beta`, teamsQuantity: 1 });
  const [aTeam1, aTeam2] = await teamIds(a.id);
  const [bTeam1] = await teamIds(b.id);

  const ids: string[] = [];
  for (let n = 1; n <= 10; n += 1) {
    ids.push(
      await post(request, adminToken, {
        visitNumber: n,
        lessonContent: `${tag} lição ${n}`,
        teamId: aTeam1,
        visitDate: `2026-03-${pad(n)}`,
        meetingDate: `2026-03-${pad(n + 1)}`,
      }),
    );
  }
  const room = `Sala ${tag}`;
  let roomId = "";
  for (let n = 1; n <= 2; n += 1) {
    const id = await post(request, adminToken, {
      visitNumber: n,
      lessonContent: `${tag} reunião ${n}`,
      teamId: aTeam2,
      meetingDate: `2026-04-${pad(n)}`,
      ...(n === 1 ? { meetingRoom: room } : {}),
    });
    if (n === 1) roomId = id;
    ids.push(id);
  }
  const specialLesson = `${tag} especial`;
  let specialId = "";
  for (let n = 1; n <= 3; n += 1) {
    const id = await post(request, adminToken, {
      visitNumber: n,
      lessonContent: n === 2 ? specialLesson : `${tag} beta ${n}`,
      teamId: bTeam1,
      visitDate: `2026-05-${pad(n)}`,
    });
    if (n === 2) specialId = id;
    ids.push(id);
  }

  const leader = await createActor(request, adminToken, "leader", "ag-lider");
  const idleLeader = await createActor(request, adminToken, "leader", "ag-lider-ocioso");
  const member = await createActor(request, adminToken, "member", "ag-membro");
  const link = await request.put(`${API_URL}/leader-profiles/${await profileId("leader_profiles", leader.id)}`, {
    headers: authHeaders(adminToken),
    data: [{ shelterId: a.id, teams: [1] }],
  });
  expect(link.status(), await link.text()).toBe(200);
  const memberLink = await request.put(`${API_URL}/member-profiles/${await profileId("member_profiles", member.id)}`, {
    headers: authHeaders(adminToken),
    data: { shelterId: a.id, numberTeam: 1 },
  });
  expect(memberLink.status(), await memberLink.text()).toBe(200);

  return {
    tag,
    adminToken,
    shelterA: { id: a.id, name: a.name, team1: aTeam1, team2: aTeam2 },
    shelterB: { id: b.id, name: b.name, team1: bTeam1 },
    ids,
    leader,
    idleLeader,
    member,
    special: { id: specialId, lesson: specialLesson },
    room: { id: roomId, room },
  };
}

/** Por padrão a massa fica (acumula); só `E2E_CLEANUP=1` apaga e confere que não sobrou nada. */
export async function disposeScheduleWorld(request: APIRequestContext, world: ScheduleWorld | undefined): Promise<void> {
  if (!world) return;
  await cleanupData(async () => {
    await deleteShelterApi(request, world.adminToken, world.shelterA.id);
    await deleteShelterApi(request, world.adminToken, world.shelterB.id);
    await removeActors(request, world.adminToken, [world.leader.id, world.idleLeader.id, world.member.id]);
    const left = await queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM shelter_schedules s JOIN teams t ON t.id = s.team_id JOIN shelters sh ON sh.id = t.shelter_id WHERE sh.name LIKE ?",
      [`%${world.tag}%`],
    );
    if (CLEANUP_ENABLED) expect(Number(left?.n), "a limpeza deixou agendamentos do E2E").toBe(0);
  });
}

export interface ScheduleRow extends Record<string, unknown> {
  id: string;
}

/** Ids dos agendamentos do E2E (por trecho do nome do abrigo) na ordem do SQL pedido. */
export async function scheduleIds(tag: string, where = "", params: Array<string | number> = [], order = "sh.name ASC, t.numberTeam ASC, s.visitNumber ASC, s.id ASC"): Promise<string[]> {
  return (
    await queryAll<ScheduleRow>(
      `SELECT s.id AS id FROM shelter_schedules s JOIN teams t ON t.id = s.team_id JOIN shelters sh ON sh.id = t.shelter_id WHERE sh.name LIKE ? ${where} ORDER BY ${order}`,
      [`%${tag}%`, ...params],
    )
  ).map((row) => row.id);
}

export const EVENT_DATE_SQL = "LEFT(COALESCE(s.visitDate, s.meetingDate), 10)";
