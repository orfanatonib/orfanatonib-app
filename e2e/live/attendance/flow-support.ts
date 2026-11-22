import type { APIRequestContext } from "@playwright/test";
import { API_URL } from "../../../playwright.live.config";
import { authHeaders, expect, loginAs } from "../support/live";
import { RUN_TAG } from "../support/factory";
import { queryOne } from "../support/db";
import { createShelter, deleteShelterApi } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";

/**
 * Massa do fluxo abrigo → equipe → agendamento → presença, toda criada pela API:
 * um abrigo com duas equipes; um líder e dois membros na equipe 1; um líder e um
 * membro na equipe 2. Cada papel entra no sistema como conta real (login de verdade).
 */
export interface FlowCast {
  adminToken: string;
  shelterId: string;
  shelterName: string;
  teamIds: { one: string; two: string };
  leaderOne: Actor;
  leaderTwo: Actor;
  memberOne: Actor;
  memberTwo: Actor;
  memberThree: Actor;
  /** Perfis (não usuários) dos membros, para vincular/desvincular. */
  profileIds: Record<string, string>;
  actors: Actor[];
}

/** Data local `YYYY-MM-DD` deslocada em dias (negativo = passado). */
export function dayOffset(days: number): { iso: string; br: string } {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return { iso: `${year}-${month}-${day}`, br: `${day}/${month}/${year}` };
}

const profileOf = async (table: "leader_profiles" | "member_profiles", userId: string): Promise<string> => {
  const row = await queryOne<{ id: string }>(`SELECT id FROM ${table} WHERE user_id = ?`, [userId]);
  expect(row?.id, `perfil em ${table} do usuário ${userId}`).toBeTruthy();
  return row!.id;
};

export async function buildFlowCast(request: APIRequestContext, label: string): Promise<FlowCast> {
  const adminToken = (await loginAs(request, "admin")).accessToken;
  const shelterName = `${RUN_TAG}-${label}`;
  const shelter = await createShelter(request, adminToken, { name: shelterName, teamsQuantity: 2 });
  const teamRows = await Promise.all(
    [1, 2].map((n) => queryOne<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? AND numberTeam = ?", [shelter.id, n])),
  );
  const [one, two] = teamRows.map((row) => row?.id ?? "");
  expect(one && two, "as duas equipes nasceram com o abrigo").toBeTruthy();

  const leaderOne = await createActor(request, adminToken, "leader", `${label}-lider1`);
  const leaderTwo = await createActor(request, adminToken, "leader", `${label}-lider2`);
  const memberOne = await createActor(request, adminToken, "member", `${label}-membro1`);
  const memberTwo = await createActor(request, adminToken, "member", `${label}-membro2`);
  const memberThree = await createActor(request, adminToken, "member", `${label}-membro3`);
  const actors = [leaderOne, leaderTwo, memberOne, memberTwo, memberThree];

  for (const [leader, team] of [[leaderOne, 1], [leaderTwo, 2]] as const) {
    const id = await profileOf("leader_profiles", leader.id);
    const res = await request.put(`${API_URL}/leader-profiles/${id}`, {
      headers: authHeaders(adminToken),
      data: [{ shelterId: shelter.id, teams: [team] }],
    });
    expect(res.status(), await res.text()).toBe(200);
  }

  const profileIds: Record<string, string> = {};
  for (const [member, team] of [[memberOne, 1], [memberTwo, 1], [memberThree, 2]] as const) {
    const id = await profileOf("member_profiles", member.id);
    profileIds[member.id] = id;
    const res = await request.put(`${API_URL}/member-profiles/${id}`, {
      headers: authHeaders(adminToken),
      data: { shelterId: shelter.id, numberTeam: team },
    });
    expect(res.status(), await res.text()).toBe(200);
  }

  return {
    adminToken,
    shelterId: shelter.id,
    shelterName,
    teamIds: { one, two },
    leaderOne,
    leaderTwo,
    memberOne,
    memberTwo,
    memberThree,
    profileIds,
    actors,
  };
}

export interface ScheduleInput {
  teamId: string;
  visitNumber: number;
  visitDate?: string;
  meetingDate?: string;
  lesson: string;
}

export async function createSchedule(request: APIRequestContext, token: string, input: ScheduleInput): Promise<string> {
  const res = await request.post(`${API_URL}/shelter-schedules`, {
    headers: authHeaders(token),
    data: {
      visitNumber: input.visitNumber,
      lessonContent: input.lesson,
      teamId: input.teamId,
      ...(input.visitDate ? { visitDate: input.visitDate } : {}),
      ...(input.meetingDate ? { meetingDate: input.meetingDate } : {}),
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

/** Cascateia equipes e agendas, devolve membros/líderes ao estado sem vínculo e apaga as contas. */
export async function disposeFlowCast(request: APIRequestContext, cast: FlowCast): Promise<void> {
  await deleteShelterApi(request, cast.adminToken, cast.shelterId);
  await removeActors(request, cast.adminToken, cast.actors.map((actor) => actor.id));
}
