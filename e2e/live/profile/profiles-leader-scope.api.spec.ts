import type { APIRequestContext } from "@playwright/test";
import { cleanupData } from "../support/keep-data";
import { queryAll, queryOne } from "../support/db";
import { API_URL } from "../../../playwright.live.config";
import { createShelter, deleteShelterApi } from "../shelters/support";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import { profileSeeds, removeProfiles, seedProfile, usersWithTag, type SeededProfile } from "./support";


test.describe.serial("Perfis: líder COM equipe vê só as pessoas das próprias equipes (API real)", () => {
  const tag = `e2e-pfl-${Date.now().toString(36)}`;
  let admin = "";
  let leader: Actor;
  let shelterId = "";
  let people: SeededProfile[] = [];
  let leaderProfileId = "";

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = await createActor(request, admin, "leader", `${tag}-lider`);
    shelterId = (await createShelter(request, admin, { name: `${tag}-abrigo`, teamsQuantity: 2 })).id;
    for (const seed of profileSeeds(tag).slice(2, 7)) people.push(await seedProfile(request, admin, seed));
    leaderProfileId = (await queryOne<{ id: string }>("SELECT id FROM leader_profiles WHERE user_id = ?", [leader.id]))!.id;
    const put = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId, teams: [1] }] });
    expect(put.ok(), await put.text()).toBe(true);
    // As três primeiras pessoas entram na equipe 1 do líder; as outras duas ficam sem equipe.
    for (const person of people.slice(0, 3)) {
      const profile = await queryOne<{ id: string }>("SELECT id FROM member_profiles WHERE user_id = ?", [person.id]);
      const res = await request.put(`${API_URL}/member-profiles/${profile!.id}`, { headers: authHeaders(admin), data: { shelterId, numberTeam: 1 } });
      expect(res.ok(), await res.text()).toBe(true);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupData(async () => {
      await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] }).catch(() => undefined);
      await removeProfiles(request, admin, people.map((person) => person.id));
      await deleteShelterApi(request, admin, shelterId);
      await removeActors(request, admin, [leader.id]);
      expect(await usersWithTag(tag)).toBe(0);
    });
  });

  const asLeader = async (request: APIRequestContext, query: string): Promise<{ items: Array<{ id: string }>; meta: { totalItems: number } }> => {
    const res = await request.get(`${API_URL}/profiles?${query}`, { headers: authHeaders(leader.token) });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as { items: Array<{ id: string }>; meta: { totalItems: number } };
  };

  test("o líder COM equipe lista só as 3 pessoas da equipe, batendo com o banco", async ({ request }) => {
    const scoped = await queryAll<{ id: string }>(
      `SELECT DISTINCT u.id AS id FROM users u JOIN member_profiles mp ON mp.user_id = u.id JOIN teams t ON t.id = mp.team_id
       JOIN leader_teams lt ON lt.team_id = t.id WHERE lt.leader_id = ? AND u.email LIKE ?`,
      [leaderProfileId, `%${tag}%`],
    );
    expect(scoped).toHaveLength(3);
    const body = await asLeader(request, `search=${encodeURIComponent(tag)}&page=1&limit=12`);
    expect(body.meta.totalItems).toBe(3);
    expect(body.items.map((item) => item.id).sort()).toEqual(scoped.map((row) => row.id).sort());
    for (const outsider of people.slice(3)) expect(body.items.map((item) => item.id)).not.toContain(outsider.id);
  });

  test("os filtros novos valem dentro do escopo do líder (contagem com dados pessoais e preferências)", async ({ request }) => {
    const inTeam = people.slice(0, 3);
    const female = inTeam.filter((person) => person.gender === "Feminino");
    const byGender = await asLeader(request, `search=${encodeURIComponent(tag)}&gender=Feminino&page=1`);
    expect(byGender.meta.totalItems).toBe(female.length);
    const month = Number(inTeam[0].birthDate.slice(5, 7));
    const expectedMonth = inTeam.filter((person) => Number(person.birthDate.slice(5, 7)) === month);
    const byMonth = await asLeader(request, `search=${encodeURIComponent(tag)}&birthMonth=${month}&page=1`);
    expect(byMonth.meta.totalItems).toBe(expectedMonth.length);
    const byTemperament = await asLeader(request, `search=${encodeURIComponent(tag)}&temperaments=${encodeURIComponent(inTeam[0].temperaments)}&page=1`);
    expect(byTemperament.meta.totalItems).toBe(inTeam.filter((person) => person.temperaments === inTeam[0].temperaments).length);
    const empty = await asLeader(request, `search=${encodeURIComponent(`${tag}-inexistente`)}&page=1`);
    expect(empty.meta.totalItems).toBe(0);
  });
});
