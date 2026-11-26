import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { withFlagsOff } from "../support/flags";
import { authHeaders, expect, test } from "../support/live";
import { ACCENT_NAME, buildLaunchWorld, disposeLaunchWorld, LAUNCH_MEMBER_SEARCH, LAUNCH_SHELTERS, LAUNCH_TAG, launchShelterIds, type LaunchWorld } from "./list-support";

/**
 * `GET /attendance/leader/teams/members` com filtros no banco: search (abrigo, "Equipe N", descrição, membro, sem
 * acento), shelterId, sortBy shelterName|teamCount, order, page/limit; paginado POR ABRIGO. Sem parâmetros: a
 * hierarquia legada. Escopo do papel antes dos filtros (líder só as equipes dele; membro 403).
 */
interface Shelter {
  shelterId: string;
  shelterName: string;
  teams: Array<{ teamId: string; teamNumber: number; memberCount: number; members: Array<{ id: string; name: string }> }>;
}
interface Paged {
  data: Shelter[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number; orderBy?: string };
}

test.describe.serial("Presença · lançar — filtros da listagem no servidor", () => {
  let world: LaunchWorld;
  test.beforeAll(async ({ request }) => {
    world = await buildLaunchWorld(request);
  });
  test.afterAll(async ({ request }) => {
    await disposeLaunchWorld(request, world);
  });

  const get = (request: APIRequestContext, query: string, token: string | null = world?.cast.adminToken): Promise<APIResponse> =>
    request.get(`${API_URL}/attendance/leader/teams/members${query}`, { headers: token ? authHeaders(token) : {} });
  const paged = async (request: APIRequestContext, query: string, token: string | null = world.cast.adminToken): Promise<Paged> => {
    const res = await get(request, `?${query}`, token);
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()) as Paged;
  };
  const scoped = (extra = ""): string => `search=${encodeURIComponent(LAUNCH_TAG)}${extra ? `&${extra}` : ""}`;
  const names = (page: Paged): string[] => page.data.map((shelter) => shelter.shelterName);

  test("sem parâmetros: hierarquia legada (array de abrigos com equipes e membros)", async ({ request }) => {
    const res = await get(request, "");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Shelter[];
    expect(Array.isArray(body)).toBe(true);
    const cast = body.find((shelter) => shelter.shelterId === world.cast.shelterId);
    expect(cast?.teams.map((team) => team.teamNumber)).toEqual([1, 2]);
    expect(cast?.teams[0].members.map((member) => member.id).sort()).toEqual([world.cast.memberOne.id, world.cast.memberTwo.id].sort());
  });

  test("com page: envelope paginado por abrigo, total filtrado e orderBy padrão", async ({ request }) => {
    const page = await paged(request, scoped("page=1&limit=100"));
    expect(page.meta).toMatchObject({ page: 1, limit: 100, totalItems: LAUNCH_SHELTERS, totalPages: 1, orderBy: "shelterName" });
    expect(page.data.map((shelter) => shelter.shelterId)).toEqual(await launchShelterIds());
    const cast = page.data.find((shelter) => shelter.shelterId === world.cast.shelterId);
    expect(cast?.teams).toHaveLength(2);
  });

  test("search isolado: abrigo, Equipe N, membro e sem acento", async ({ request }) => {
    const byMember = await paged(request, `search=${encodeURIComponent(LAUNCH_MEMBER_SEARCH)}&shelterId=${world.cast.shelterId}&page=1`);
    expect(byMember.meta.totalItems).toBe(1);
    expect(byMember.data[0].shelterId).toBe(world.cast.shelterId);
    expect(byMember.data[0].teams.map((team) => team.teamNumber)).toEqual([1]);

    const team2 = await paged(request, `search=${encodeURIComponent("Equipe 2")}&shelterId=${world.cast.shelterId}&page=1`);
    expect(team2.data[0].teams.map((team) => team.teamNumber)).toEqual([2]);

    const accent = await paged(request, `search=${encodeURIComponent(`${LAUNCH_TAG}-x14 esperanca`)}&page=1`);
    expect(names(accent)).toEqual([ACCENT_NAME]);

    expect((await paged(request, `search=${encodeURIComponent(`${LAUNCH_TAG}%`)}&page=1`)).meta.totalItems).toBe(0);
    expect((await paged(request, `search=${encodeURIComponent("zzz-nao-existe-zzz")}&page=1`)).meta.totalItems).toBe(0);
  });

  test("shelterId isolado e combinado com a busca", async ({ request }) => {
    const only = await paged(request, `shelterId=${world.cast.shelterId}&page=1`);
    expect(only.data.map((shelter) => shelter.shelterId)).toEqual([world.cast.shelterId]);
    expect(only.meta.totalItems).toBe(1);
    const none = await paged(request, `shelterId=${world.cast.shelterId}&search=${encodeURIComponent(`${LAUNCH_TAG}-x14`)}&page=1`);
    expect(none.meta.totalItems).toBe(0);
  });

  test("sortBy shelterName ASC/DESC e teamCount: a ordem bate com o banco", async ({ request }) => {
    const asc = await paged(request, scoped("sortBy=shelterName&order=ASC&page=1&limit=100"));
    expect(asc.data.map((shelter) => shelter.shelterId)).toEqual(await launchShelterIds());
    const desc = await paged(request, scoped("sortBy=shelterName&order=DESC&page=1&limit=100"));
    expect(desc.data.map((shelter) => shelter.shelterId)).toEqual(await launchShelterIds("", [], "sh.name DESC, sh.id ASC"));
    const many = await paged(request, scoped("sortBy=teamCount&order=DESC&page=1&limit=100"));
    expect(many.data[0].shelterId).toBe(world.cast.shelterId);
    expect(many.meta.orderBy).toBe("teamCount");
    const few = await paged(request, scoped("sortBy=teamCount&order=ASC&page=1&limit=100"));
    expect(few.data[few.data.length - 1].shelterId).toBe(world.cast.shelterId);
  });

  test("paginação: páginas 1 e 2 sem repetição, total por abrigo; fora do alcance vazia com total", async ({ request }) => {
    const p1 = await paged(request, scoped("sortBy=shelterName&order=ASC&page=1&limit=12"));
    const p2 = await paged(request, scoped("sortBy=shelterName&order=ASC&page=2&limit=12"));
    expect(p1.meta).toMatchObject({ totalItems: LAUNCH_SHELTERS, totalPages: 2, limit: 12 });
    expect(p1.data).toHaveLength(12);
    expect(p2.data).toHaveLength(LAUNCH_SHELTERS - 12);
    expect([...p1.data, ...p2.data].map((shelter) => shelter.shelterId)).toEqual(await launchShelterIds());
    const beyond = await paged(request, scoped("page=9&limit=12"));
    expect(beyond.data).toEqual([]);
    expect(beyond.meta.totalItems).toBe(LAUNCH_SHELTERS);
  });

  test("validação: sortBy, shelterId, page=0, limit=101, order, createdFrom e param desconhecido dão 400", async ({ request }) => {
    for (const query of ["sortBy=memberCount", "shelterId=x", "page=0", "limit=101", "order=UP", "createdFrom=2026-01-01", "foo=bar", `search=${"a".repeat(121)}`]) {
      expect((await get(request, `?${query}`)).status(), query).toBe(400);
    }
  });

  test("autorização: visitante 401, membro 403; líder só enxerga as equipes dele, também com filtros", async ({ request }) => {
    expect((await get(request, "?page=1", null)).status()).toBe(401);
    expect((await get(request, "?page=1", world.cast.memberOne.token)).status()).toBe(403);

    const one = await paged(request, scoped("page=1"), world.cast.leaderOne.token);
    expect(one.meta.totalItems).toBe(1);
    expect(one.data[0].teams.map((team) => team.teamId)).toEqual([world.cast.teamIds.one]);
    const two = await paged(request, scoped("page=1"), world.cast.leaderTwo.token);
    expect(two.data[0].teams.map((team) => team.teamId)).toEqual([world.cast.teamIds.two]);
    const elsewhere = await paged(request, `shelterId=${world.extraShelterIds[0]}&page=1`, world.cast.leaderOne.token);
    expect(elsewhere.meta.totalItems).toBe(0);
    const legacy = (await (await get(request, "", world.cast.leaderOne.token)).json()) as Shelter[];
    expect(legacy.flatMap((shelter) => shelter.teams.map((team) => team.teamId))).toEqual([world.cast.teamIds.one]);
  });

  test("flag attendance desligada: 403 FEATURE_DISABLED; ligada de novo, 200", async ({ request }) => {
    await withFlagsOff(request, world.cast.adminToken, ["attendance_control"], async () => {
      const res = await get(request, `?${scoped("page=1")}`);
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    });
    expect((await get(request, `?${scoped("page=1")}`)).status()).toBe(200);
  });
});
