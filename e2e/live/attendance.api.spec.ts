import { API_URL } from "../../playwright.live.config";
import { authHeaders, expect, loginAs, test } from "./support/live";

/**
 * Contratos de `/attendance` contra a API, o MySQL e a sessão reais.
 *
 * O módulo decide o que cada papel enxerga: um líder não pode lançar
 * frequência de equipe alheia, e um membro não alcança as telas de liderança.
 */
type Pendings = {
  leaderPendings: Array<{ teamId: string; pendings: unknown[] }>;
  memberPendings: unknown[];
  visitReportPendings: Array<{ pendings: Array<{ visitDateFormatted: string }> }>;
};

type LeaderTeam = { teamId: string; teamNumber: number; shelterName: string };

test.describe.serial("Frequência — API ao vivo", () => {
  let adminToken: string;
  let leaderToken: string;
  let memberToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = (await loginAs(request, "admin")).accessToken;
    leaderToken = (await loginAs(request, "leader")).accessToken;
    memberToken = (await loginAs(request, "member")).accessToken;
  });

  test("todas as rotas exigem autenticação", async ({ request }) => {
    for (const route of ["pending/all", "records", "stats", "leader/teams"]) {
      const response = await request.get(`${API_URL}/attendance/${route}`);
      expect(response.status(), route).toBe(401);
    }
  });

  test("as pendências vêm nas três listas que a tela consome", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/attendance/pending/all`, {
      headers: authHeaders(adminToken),
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as Pendings;
    expect(Array.isArray(body.leaderPendings)).toBe(true);
    expect(Array.isArray(body.memberPendings)).toBe(true);
    expect(Array.isArray(body.visitReportPendings)).toBe(true);
  });

  test("o admin não tem pendência pessoal de membro", async ({ request }) => {
    const response = await request.get(`${API_URL}/attendance/pending/all`, {
      headers: authHeaders(adminToken),
    });

    expect(((await response.json()) as Pendings).memberPendings).toEqual([]);
  });

  test("a data do relatório pendente não desloca pelo fuso", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/attendance/pending/all`, {
      headers: authHeaders(adminToken),
    });
    const body = (await response.json()) as Pendings;

    for (const team of body.visitReportPendings) {
      for (const pending of team.pendings) {
        expect(pending.visitDateFormatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      }
    }
  });

  test("membro não alcança as rotas de liderança", async ({ request }) => {
    for (const route of [
      "leader/teams",
      "leader/teams/members",
      "sheets/hierarchical",
    ]) {
      const response = await request.get(`${API_URL}/attendance/${route}`, {
        headers: authHeaders(memberToken),
      });
      expect(response.status(), route).toBe(403);
    }
  });

  test("membro alcança o próprio histórico e as próprias estatísticas", async ({
    request,
  }) => {
    for (const route of ["records", "stats"]) {
      const response = await request.get(`${API_URL}/attendance/${route}`, {
        headers: authHeaders(memberToken),
      });
      expect(response.status(), route).toBe(200);
    }
  });

  test("a hierarquia do líder já vem agrupada por abrigo", async ({
    request,
  }) => {
    const response = await request.get(
      `${API_URL}/attendance/leader/teams/members`,
      { headers: authHeaders(adminToken) },
    );

    expect(response.status()).toBe(200);
    const shelters = (await response.json()) as Array<{
      shelterId: string;
      teams: Array<{ teamId: string; members: unknown[] }>;
    }>;

    for (const shelter of shelters) {
      expect(shelter.shelterId).toBeTruthy();
      expect(Array.isArray(shelter.teams)).toBe(true);
    }
  });

  test("o endpoint duplicado foi removido", async ({ request }) => {
    // `leader/shelters-teams-members` chamava o mesmo método de
    // `leader/teams/members`, e nenhum código o consumia.
    const response = await request.get(
      `${API_URL}/attendance/leader/shelters-teams-members`,
      { headers: authHeaders(adminToken) },
    );

    expect(response.status()).toBe(404);
  });

  test("o histórico responde o envelope paginado que a tela consome", async ({
    request,
  }) => {
    const response = await request.get(
      `${API_URL}/attendance/records?page=1&limit=5`,
      { headers: authHeaders(adminToken) },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Object.keys(body.meta).sort()).toEqual([
      "hasNext",
      "hasPrev",
      "limit",
      "page",
      "total",
      "totalPages",
    ]);
    expect(body.meta.limit).toBe(5);
  });

  test("filtro inválido no histórico responde 400", async ({ request }) => {
    const response = await request.get(
      `${API_URL}/attendance/records?category=inexistente`,
      { headers: authHeaders(adminToken) },
    );

    expect(response.status()).toBe(400);
    expect((await response.json()).category).toBe("RULE");
  });

  test("id de equipe malformado responde 400", async ({ request }) => {
    const response = await request.get(
      `${API_URL}/attendance/team/nao-e-uuid/schedules`,
      { headers: authHeaders(adminToken) },
    );

    expect(response.status()).toBe(400);
  });

  test("o lançamento recusa payload sem os campos obrigatórios", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/attendance/register`, {
      headers: authHeaders(memberToken),
      data: { type: "present" },
    });

    expect(response.status()).toBe(400);
    const fields = ((await response.json()).details as Array<{ field: string }>)
      .map((detail) => detail.field);
    expect(fields).toContain("scheduleId");
  });

  test("membro não lança frequência em lote", async ({ request }) => {
    const response = await request.post(`${API_URL}/attendance/register/team`, {
      headers: authHeaders(memberToken),
      data: {
        teamId: "00000000-0000-4000-8000-000000000000",
        scheduleId: "00000000-0000-4000-8000-000000000001",
        attendances: [
          {
            memberId: "00000000-0000-4000-8000-000000000002",
            type: "present",
          },
        ],
      },
    });

    expect(response.status()).toBe(403);
  });

  test("as estatísticas trazem os seis números da tela", async ({ request }) => {
    const response = await request.get(`${API_URL}/attendance/stats`, {
      headers: authHeaders(leaderToken),
    });

    expect(response.status()).toBe(200);
    expect(Object.keys(await response.json()).sort()).toEqual([
      "absentCount",
      "attendanceRate",
      "pendingCount",
      "presentCount",
      "totalAttendanceRecords",
      "totalEvents",
    ]);
  });

  test("a folha hierárquica vem como abrigo → equipe → encontro", async ({
    request,
  }) => {
    const response = await request.get(
      `${API_URL}/attendance/sheets/hierarchical`,
      { headers: authHeaders(adminToken) },
    );

    expect(response.status()).toBe(200);
    const shelters = (await response.json()) as Array<{
      totalTeams: number;
      teams: Array<{ totalSchedules: number; schedules: unknown[] }>;
    }>;

    for (const shelter of shelters) {
      expect(shelter.totalTeams).toBe(shelter.teams.length);
    }
  });
});
