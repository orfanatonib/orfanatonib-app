import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { createShelter } from "../shelters/support";
import { expectCards, openScreen, searchFor, selectFilter, type ListScreen } from "../support/admin-list-ui";
import { cleanupData } from "../support/keep-data";
import { authHeaders, expect, loginAs, seedBrowserSession, test } from "../support/live";
import { createActor, removeActors, type Actor } from "../users/support";
import { profileSeeds, removeProfiles, seedProfile, type SeededProfile } from "./support";
import { deleteShelterApi } from "../shelters/support";

const SCREEN: ListScreen = { p: "profiles", path: "/adm/perfis", endpoint: "/profiles" };
const { p } = SCREEN;

test.describe.serial("Perfis: líder COM equipe abre a tela e vê só as pessoas das próprias equipes (UI = API = SELECT)", () => {
  const tag = `e2e-pfu-${Date.now().toString(36)}`;
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
    // Três pessoas entram na equipe 1 do líder; as outras duas ficam sem equipe.
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
    });
  });

  const session = { get: () => ({ accessToken: leader.token, refreshToken: leader.refreshToken, userId: leader.id }) };

  test("o líder abre /adm/perfis, sem filtro de papel, e vê só as 3 pessoas da equipe (UI = API = SELECT)", async ({ page, request }) => {
    await seedBrowserSession(page, session.get());
    await openScreen(page, SCREEN);
    await expect(page.getByTestId(`${p}-manager`)).toBeVisible();
    await expect(page.getByTestId(`${p}-filter-role`)).toHaveCount(0);

    const reply = await searchFor(page, SCREEN, tag);
    const scoped = await queryAll<{ id: string }>(
      `SELECT DISTINCT u.id AS id FROM users u JOIN member_profiles mp ON mp.user_id = u.id JOIN teams t ON t.id = mp.team_id
       JOIN leader_teams lt ON lt.team_id = t.id WHERE lt.leader_id = ? AND u.email LIKE ?`,
      [leaderProfileId, `%${tag}%`],
    );
    expect(scoped).toHaveLength(3);
    expect(reply.body.meta?.totalItems).toBe(3);
    await expectCards(page, p, scoped.map((row) => row.id), false);
    for (const outsider of people.slice(3)) await expect(page.getByTestId(`${p}-card-${outsider.id}`)).toHaveCount(0);

    const api = await request.get(`${API_URL}/profiles?search=${encodeURIComponent(tag)}&page=1&limit=12`, { headers: authHeaders(leader.token) });
    const body = (await api.json()) as { items: Array<{ id: string }>; meta: { totalItems: number } };
    expect(body.meta.totalItems).toBe(3);
    expect(body.items.map((item) => item.id).sort()).toEqual(scoped.map((row) => row.id).sort());

    // Filtro do servidor dentro do escopo.
    const female = await selectFilter(page, SCREEN, "gender", "Feminino");
    expect(female.body.meta?.totalItems).toBe(people.slice(0, 3).filter((person) => person.gender === "Feminino").length);
  });

  test("o líder com busca sem resultado vê o vazio, não o aviso de equipe", async ({ page }) => {
    await seedBrowserSession(page, session.get());
    await openScreen(page, SCREEN);
    const reply = await searchFor(page, SCREEN, `${tag}-inexistente`);
    expect(reply.body.meta?.totalItems).toBe(0);
    await expect(page.getByTestId(`${p}-empty`)).toBeVisible();
    await expect(page.getByText("Nenhum abrigo vinculado")).toHaveCount(0);
  });
});
