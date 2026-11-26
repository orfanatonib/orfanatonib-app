import type { APIRequestContext, Page } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, seedBrowserSession } from "../support/live";
import { createShelter, deleteShelterApi } from "../shelters/support";
import { ACTOR_PASSWORD, createActor, removeActors, type Actor } from "../users/support";
import { loginAs } from "../support/live";
import { CLEANUP_ENABLED, KEEP_DATA, cleanupData } from "../support/keep-data";

/**
 * Suporte dos E2E da Área dos Acolhidos (`/area-dos-acolhidos`): monta pela API um abrigo com equipe,
 * líder e membro vinculados, um segundo abrigo (alheio) e uma massa de acolhidos; tudo é apagado no fim,
 * só com `E2E_CLEANUP=1` (por padrão a massa fica acumulada e o login/ids são impressos).
 */
export const P = "sheltered-area";
export const PG = "sheltered-pagelas";
export const PAGELA = "pagela";
export const DECISION = "sheltered-decision";
export const AREA_FLAGS = ["sheltered_area", "pagelas_management", "accepted_christs"] as const;
export const PAGE_SIZE = 10;

export const nameOf = (i: number): string => `${RUN_TAG}-acolhido-${String(i).padStart(2, "0")}`;
export const guardianOf = (i: number): string => `Resp ${RUN_TAG} ${String(i).padStart(2, "0")}`;
const PHONE_BASE = String(Date.now()).slice(-7);
export const phoneOf = (i: number): string => `92${PHONE_BASE}${String(i).padStart(2, "0")}`;

export interface MadeSheltered {
  id: string;
  name: string;
  i: number;
  gender: "M" | "F";
  active: boolean;
  /** Já aceitou Jesus (decisão registrada pela API). */
  accepted: boolean;
}

export interface AreaWorld {
  admin: string;
  shelterA: { id: string; name: string; teamId: string };
  shelterB: { id: string; name: string; teamId: string };
  leader: Actor;
  member: Actor;
  /** Membro de outra equipe (abrigo B). */
  outsider: Actor;
  idleLeader: Actor;
  idleMember: Actor;
  /** Perfis de membro (autor da pagela). */
  memberProfileId: string;
  outsiderProfileId: string;
  /** Acolhidos do abrigo A: 0..13. Par=M/ímpar=F; 11,12,13 inativos; 0,1,2 aceitaram Jesus. */
  made: MadeSheltered[];
  /** Acolhidos do abrigo B (nunca aparecem para a equipe A). */
  foreign: MadeSheltered[];
  actors: string[];
  shelters: string[];
  /** Acolhidos criados pela UI nos cenários (apagados no fim). */
  extraSheltered: string[];
}

export const COUNT_A = 14;
export const COUNT_B = 2;

async function profileId(table: "leader_profiles" | "member_profiles", userId: string): Promise<string> {
  const row = await queryOne<{ id: string }>(`SELECT id FROM ${table} WHERE user_id = ?`, [userId]);
  expect(row?.id, `perfil em ${table}`).toBeTruthy();
  return row!.id;
}

export async function postSheltered(
  request: APIRequestContext,
  token: string,
  body: Record<string, unknown>,
): Promise<string> {
  const res = await request.post(`${API_URL}/sheltered`, { headers: authHeaders(token), data: body });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

export async function linkMember(request: APIRequestContext, admin: string, userId: string, shelterId: string): Promise<void> {
  const res = await request.put(`${API_URL}/member-profiles/${await profileId("member_profiles", userId)}`, {
    headers: authHeaders(admin),
    data: { shelterId, numberTeam: 1 },
  });
  expect(res.status(), await res.text()).toBe(200);
}

export async function linkLeader(request: APIRequestContext, admin: string, userId: string, shelterId: string): Promise<void> {
  const res = await request.put(`${API_URL}/leader-profiles/${await profileId("leader_profiles", userId)}`, {
    headers: authHeaders(admin),
    data: [{ shelterId, teams: [1] }],
  });
  expect(res.status(), await res.text()).toBe(200);
}

export async function registerDecision(request: APIRequestContext, token: string, shelteredId: string): Promise<void> {
  const res = await request.post(`${API_URL}/accepted-christs`, {
    headers: authHeaders(token),
    data: { shelteredId, decision: "ACCEPTED", notes: "massa e2e" },
  });
  expect(res.status(), await res.text()).toBe(201);
}

export async function buildAreaWorld(request: APIRequestContext): Promise<AreaWorld> {
  const admin = (await loginAs(request, "admin")).accessToken;
  const world = { admin, actors: [], shelters: [], made: [], foreign: [], extraSheltered: [] } as unknown as AreaWorld;

  for (const slot of ["A", "B"] as const) {
    const name = `${RUN_TAG}-area-${slot}`;
    const shelter = await createShelter(request, admin, { name, teamsQuantity: 1 });
    world.shelters.push(shelter.id);
    const teamId = (await queryOne<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? ORDER BY numberTeam LIMIT 1", [shelter.id]))?.id ?? "";
    if (slot === "A") world.shelterA = { id: shelter.id, name, teamId };
    else world.shelterB = { id: shelter.id, name, teamId };
  }

  const make = async (role: "leader" | "member", label: string): Promise<Actor> => {
    const actor = await createActor(request, admin, role, label);
    world.actors.push(actor.id);
    return actor;
  };
  world.leader = await make("leader", "area-lider");
  world.member = await make("member", "area-membro");
  world.outsider = await make("member", "area-fora");
  world.idleLeader = await make("leader", "area-lider-ocioso");
  world.idleMember = await make("member", "area-membro-ocioso");
  await linkLeader(request, admin, world.leader.id, world.shelterA.id);
  await linkMember(request, admin, world.member.id, world.shelterA.id);
  await linkMember(request, admin, world.outsider.id, world.shelterB.id);
  world.memberProfileId = await profileId("member_profiles", world.member.id);
  world.outsiderProfileId = await profileId("member_profiles", world.outsider.id);

  const day = (i: number): string => `2015-03-${String(10 + i).padStart(2, "0")}`;
  const build = async (list: MadeSheltered[], shelterId: string, count: number, tag: string): Promise<void> => {
    for (let i = 0; i < count; i += 1) {
      const name = tag === "A" ? nameOf(i) : `${RUN_TAG}-alheio-${i}`;
      const active = !(tag === "A" && i >= 11);
      const accepted = tag === "A" && i < 3;
      const gender = i % 2 === 0 ? "M" : "F";
      const id = await postSheltered(request, admin, {
        name,
        gender,
        guardianName: tag === "A" ? guardianOf(i) : `Resp alheio ${RUN_TAG} ${i}`,
        guardianPhone: tag === "A" ? phoneOf(i) : `93${PHONE_BASE}${String(i).padStart(2, "0")}`,
        birthDate: day(i),
        joinedAt: "2024-06-10",
        shelterId,
        address: { street: `Rua ${i}`, number: String(i), district: "Centro", city: "Manaus", state: "AM" },
      });
      if (!active) {
        const res = await request.patch(`${API_URL}/sheltered/${id}/status`, { headers: authHeaders(admin), data: { active: false } });
        expect(res.status(), await res.text()).toBe(200);
      }
      if (accepted) await registerDecision(request, admin, id);
      list.push({ id, name, i, gender, active, accepted });
    }
  };
  await build(world.made, world.shelterA.id, COUNT_A, "A");
  await build(world.foreign, world.shelterB.id, COUNT_B, "B");
  return world;
}

/** Mantém a massa (padrão) e imprime como usá-la; com `E2E_CLEANUP=1` apaga tudo o que o cenário criou. */
export async function disposeAreaWorld(request: APIRequestContext, world: AreaWorld | undefined): Promise<void> {
  if (!world) return;
  if (KEEP_DATA) {
    const lines = [
      "",
      "=== Massa da Área dos Acolhidos mantida (E2E_CLEANUP=1 apaga) ===",
      `Abrigo A: ${world.shelterA.name} (${world.shelterA.id}); abrigo B: ${world.shelterB.name} (${world.shelterB.id})`,
      `Líder:  ${world.leader.email} / ${ACTOR_PASSWORD}`,
      `Membro: ${world.member.email} / ${ACTOR_PASSWORD}`,
      `Membro de outra equipe: ${world.outsider.email}; sem vínculo: ${world.idleLeader.email} / ${world.idleMember.email}`,
      `Acolhidos criados pela UI: ${world.extraSheltered.length}`,
      "Abra http://localhost:5173/area-dos-acolhidos",
      "",
    ];
    // eslint-disable-next-line no-console
    console.log(lines.join("\n"));
  }
  await cleanupData(async () => {
    for (const id of world.extraSheltered) {
      await request.delete(`${API_URL}/sheltered/${id}`, { headers: authHeaders(world.admin) });
    }
    for (const item of [...world.made, ...world.foreign]) {
      await request.delete(`${API_URL}/sheltered/${item.id}`, { headers: authHeaders(world.admin) });
    }
    for (const id of world.shelters) await deleteShelterApi(request, world.admin, id);
    await removeActors(request, world.admin, world.actors);
    const left = await queryAll<{ id: string }>("SELECT id FROM sheltered WHERE name LIKE ?", [`%${RUN_TAG}%`]);
    expect(left, "a limpeza deixou acolhidos do E2E").toEqual([]);
  });
  void CLEANUP_ENABLED;
  await closeDb();
}

export async function openAs(page: Page, actor: Pick<Actor, "token" | "refreshToken" | "id">, path = "/area-dos-acolhidos"): Promise<void> {
  await seedBrowserSession(page, { accessToken: actor.token, refreshToken: actor.refreshToken, userId: actor.id });
  await page.goto(path);
}

/** Ids dos cartões de acolhido visíveis. */
export async function cardIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const re = /^sheltered-area-card-([0-9a-f-]{36})$/;
    return Array.from(document.querySelectorAll("[data-testid]"))
      .map((el) => re.exec(el.getAttribute("data-testid") ?? "")?.[1])
      .filter((id): id is string => Boolean(id));
  });
}

export async function pickSelect(page: Page, testId: string, value: string): Promise<void> {
  await page.getByTestId(testId).getByRole("combobox").click();
  await page.getByTestId(`${testId}-option-${value}`).click();
}

export async function noHorizontalScroll(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

export const countWhere = async (sql: string, params: Array<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);
