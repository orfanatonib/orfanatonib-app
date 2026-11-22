import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/attendance` (plano 22): sessão obrigatória; painéis de líder só admin/líder (membro 403); equipe fora do escopo do líder é 403; registro recusado/inválido não grava; `attendance` desligada ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["attendance"] as const;

test.describe.serial("Presença — autorização", () => {
  let admin: string;
  let leader: string;
  let member: string;
  const before: Record<string, number> = {};

  const send = (request: import("@playwright/test").APIRequestContext, verb: string, path: string, token?: string) =>
    request.fetch(`${API_URL}${path.replace("{BAD}", BAD)}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" || verb === "DELETE" ? undefined : {},
    });

  const setFlags = async (request: import("@playwright/test").APIRequestContext, enabled: boolean | "restore") => {
    for (const key of FLAGS) {
      await request.patch(`${API_URL}/feature-flags/${key}`, {
        headers: authHeaders(admin),
        data: { enabled: enabled === "restore" ? before[key] === 1 : enabled },
      });
    }
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
    for (const key of FLAGS) {
      before[key] =
        (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1;
    }
  });

  test.afterAll(async ({ request }) => {
    await setFlags(request, "restore");
    await closeDb();
  });

  test("[attendance.post.attendance-register#perfil-anonimo] POST /attendance/register como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("attendance_records")).toBe(before);
  });

  test("[attendance.post.attendance-register#perfil-membro] POST /attendance/register como membro: 400", async ({ request }) => {
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register", member);
    expect([400]).toContain(res.status());
    expect(await countRows("attendance_records")).toBe(before);
  });

  test("[attendance.post.attendance-register#perfil-lider] POST /attendance/register como líder: 400", async ({ request }) => {
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("attendance_records")).toBe(before);
  });

  test("[attendance.post.attendance-register#perfil-admin] POST /attendance/register como admin: 400", async ({ request }) => {
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("attendance_records")).toBe(before);
  });

  test("[attendance.post.attendance-register-team#perfil-anonimo] POST /attendance/register/team como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register/team", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("attendance_records")).toBe(before);
  });

  test("[attendance.post.attendance-register-team#perfil-membro] POST /attendance/register/team como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register/team", member);
    expect([403]).toContain(res.status());
    expect(await countRows("attendance_records")).toBe(before);
  });

  test("[attendance.post.attendance-register-team#perfil-lider] POST /attendance/register/team como líder: 400", async ({
    request,
  }) => {
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register/team", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("attendance_records")).toBe(before);
  });

  test("[attendance.post.attendance-register-team#perfil-admin] POST /attendance/register/team como admin: 400", async ({
    request,
  }) => {
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register/team", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("attendance_records")).toBe(before);
  });

  test("[attendance.get.attendance-pending-all#perfil-anonimo] GET /attendance/pending/all como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/pending/all", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-pending-all#perfil-membro] GET /attendance/pending/all como membro: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/pending/all", member);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-pending-all#perfil-lider] GET /attendance/pending/all como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/pending/all", leader);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-pending-all#perfil-admin] GET /attendance/pending/all como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/pending/all", admin);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-members#perfil-anonimo] GET /attendance/team/:id/members como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/team/{BAD}/members", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-members#perfil-membro] GET /attendance/team/:id/members como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/team/{BAD}/members", member);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-members#perfil-lider] GET /attendance/team/:id/members como líder: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/team/{BAD}/members", leader);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-members#perfil-admin] GET /attendance/team/:id/members como admin: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/team/{BAD}/members", admin);
    expect([404]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-schedules#perfil-anonimo] GET /attendance/team/:id/schedules como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/team/{BAD}/schedules", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-schedules#perfil-membro] GET /attendance/team/:id/schedules como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/team/{BAD}/schedules", member);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-schedules#perfil-lider] GET /attendance/team/:id/schedules como líder: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/team/{BAD}/schedules", leader);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-team-teamid-schedules#perfil-admin] GET /attendance/team/:id/schedules como admin: 404 para equipe inexistente (antes: 200 com lista vazia)", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/team/{BAD}/schedules", admin);
    expect([404]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-teams#perfil-anonimo] GET /attendance/leader/teams como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/teams", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-teams#perfil-membro] GET /attendance/leader/teams como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/teams", member);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-teams#perfil-lider] GET /attendance/leader/teams como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/teams", leader);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-teams#perfil-admin] GET /attendance/leader/teams como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/teams", admin);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-teams-members#perfil-anonimo] GET /attendance/leader/teams/members como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/teams/members", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-teams-members#perfil-membro] GET /attendance/leader/teams/members como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/teams/members", member);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-teams-members#perfil-lider] GET /attendance/leader/teams/members como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/teams/members", leader);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-teams-members#perfil-admin] GET /attendance/leader/teams/members como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/teams/members", admin);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-sheets-hierarchical#perfil-anonimo] GET /attendance/sheets/hierarchical como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/sheets/hierarchical", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-sheets-hierarchical#perfil-membro] GET /attendance/sheets/hierarchical como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/sheets/hierarchical", member);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-sheets-hierarchical#perfil-lider] GET /attendance/sheets/hierarchical como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/sheets/hierarchical", leader);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-sheets-hierarchical#perfil-admin] GET /attendance/sheets/hierarchical como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/sheets/hierarchical", admin);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-records#perfil-anonimo] GET /attendance/records como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/records", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-records#perfil-membro] GET /attendance/records como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/records", member);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-records#perfil-lider] GET /attendance/records como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/records", leader);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-records#perfil-admin] GET /attendance/records como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/records", admin);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-stats#perfil-anonimo] GET /attendance/stats como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/stats", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-stats#perfil-membro] GET /attendance/stats como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/stats", member);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-stats#perfil-lider] GET /attendance/stats como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/stats", leader);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-stats#perfil-admin] GET /attendance/stats como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/attendance/stats", admin);
    expect([200]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-stats-team-teamid#perfil-anonimo] GET /attendance/leader/stats/team/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/stats/team/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-stats-team-teamid#perfil-membro] GET /attendance/leader/stats/team/:id como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/stats/team/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-stats-team-teamid#perfil-lider] GET /attendance/leader/stats/team/:id como líder: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/stats/team/{BAD}", leader);
    expect([403]).toContain(res.status());
  });

  test("[attendance.get.attendance-leader-stats-team-teamid#perfil-admin] GET /attendance/leader/stats/team/:id como admin: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/attendance/leader/stats/team/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[attendance.post.attendance-register#flag-desligada] POST /attendance/register com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("attendance_records");
    const res = await send(request, "POST", "/attendance/register", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("attendance_records")).toBe(before);
    await setFlags(request, true);
  });

  test("[attendance.get.attendance-records#flag-desligada] GET /attendance/records com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("attendance_records");
    const res = await send(request, "GET", "/attendance/records", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("attendance_records")).toBe(before);
    await setFlags(request, true);
  });

  test("[attendance.get.attendance-stats#flag-desligada] GET /attendance/stats com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("attendance_records");
    const res = await send(request, "GET", "/attendance/stats", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("attendance_records")).toBe(before);
    await setFlags(request, true);
  });

  test("[attendance.get.attendance-leader-teams#flag-desligada] GET /attendance/leader/teams com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("attendance_records");
    const res = await send(request, "GET", "/attendance/leader/teams", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("attendance_records")).toBe(before);
    await setFlags(request, true);
  });
});
