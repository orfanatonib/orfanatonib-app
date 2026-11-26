import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { countRows, closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID, createShelter, deleteShelterApi, label } from "../shelters/support";
import { allReports, createRaw, deleteRaw, get, outboxTotal, payload, putRaw, reportRow, reportsOfSchedule, type ReportBody } from "./support";
import { CLEANUP_ENABLED } from "../support/keep-data";

/**
 * Cenários do plano 24 (`visit-report`): um relatório por agenda de visita; admin vê tudo e o líder só o das equipes
 * que lidera (fora do escopo é 404, não revela a agenda). Dois abrigos criados pelo cenário: o líder semeado lidera
 * o A e o B é "dos outros". Cada cenário cria os próprios dados pela API e prova o efeito por SELECT. Autorização por
 * perfil está em `visit-reports-authorization.api.spec.ts`.
 */
test.describe.serial("Relatórios de visita — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let leaderProfileId = "";
  let shelterA = "";
  let shelterB = "";
  let teamA = "";
  let teamB = "";
  const shelters: string[] = [];
  const schedules: string[] = [];
  const reports: string[] = [];
  let visitSeq = 0;

  const teamOf = async (shelterId: string): Promise<string> =>
    (await queryOne<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? ORDER BY numberTeam LIMIT 1", [shelterId]))?.id ?? "";

  /** Agenda nova (admin) na equipe pedida: cada relatório precisa da sua. */
  const newSchedule = async (request: APIRequestContext, teamId: string = teamA): Promise<string> => {
    const res = await request.post(`${API_URL}/shelter-schedules`, {
      headers: authHeaders(admin),
      data: { visitNumber: (visitSeq += 1) + 300, lessonContent: label("agenda-relatorio"), teamId, visitDate: "2026-12-01", meetingDate: "2026-12-02" },
    });
    expect(res.status(), await res.text()).toBe(201);
    const { id } = (await res.json()) as { id: string };
    schedules.push(id);
    return id;
  };

  /** Relatório criado pelo admin numa agenda nova. */
  const make = async (request: APIRequestContext, overrides: Partial<Parameters<typeof payload>[0]> = {}, teamId: string = teamA): Promise<ReportBody & { scheduleId: string }> => {
    const scheduleId = overrides.scheduleId ?? (await newSchedule(request, teamId));
    const res = await createRaw(request, admin, payload({ scheduleId, ...overrides }));
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as ReportBody;
    reports.push(body.id);
    return { ...body, scheduleId };
  };

  const schedulesWithTag = async (tag: string): Promise<number> =>
    Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM shelter_schedules WHERE lessonContent LIKE ?", [`%${tag}%`]))?.n ?? 0);

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
    for (const name of ["relatorio-a", "relatorio-b"]) {
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
    for (const id of reports) await deleteRaw(request, admin, id);
    for (const id of schedules) await request.delete(`${API_URL}/shelter-schedules/${id}`, { headers: authHeaders(admin) });
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    for (const id of shelters) await deleteShelterApi(request, admin, id);
    if (CLEANUP_ENABLED) expect(await schedulesWithTag(RUN_TAG), "a limpeza deixou agendas do E2E").toBe(0);
    // Só os do cenário: o RUN_TAG é do processo e cobre a massa que outros arquivos mantêm.
    for (const id of shelters) expect(await countRows("shelters", { id }), "a limpeza deixou um abrigo do cenário").toBe(0);
    await closeDb();
  });

  // ───────────────────────── POST ─────────────────────────
  test("[visit-report.post.visit-reports#feliz] admin cria o relatório: a linha bate com o banco, a agenda vem ligada e o líder da equipe também cria o dele", async ({ request }) => {
    const body = await make(request, { observation: "Visita ótima", teamMembersPresent: 7, shelteredHeardMessage: 12, caretakersHeardMessage: 4, shelteredDecisions: 3, caretakersDecisions: 2 });
    expect(await reportRow(body.id)).toMatchObject({
      teamMembersPresent: 7,
      shelteredHeardMessage: 12,
      caretakersHeardMessage: 4,
      shelteredDecisions: 3,
      caretakersDecisions: 2,
      observation: "Visita ótima",
      schedule_id: body.scheduleId,
    });
    const ownSchedule = await newSchedule(request);
    const byLeader = await createRaw(request, leader, payload({ scheduleId: ownSchedule }));
    expect(byLeader.status(), await byLeader.text()).toBe(201);
    reports.push(((await byLeader.json()) as ReportBody).id);
  });

  test("[visit-report.post.visit-reports#validacao] contagem ausente, negativa, fracionada, texto, acima do teto, agenda inválida, observação longa ou campo desconhecido: 400 e nada gravado", async ({ request }) => {
    const scheduleId = await newSchedule(request);
    const before = await allReports();
    const base = payload({ scheduleId });
    const bad: Array<[string, Record<string, unknown>]> = [
      ["sem scheduleId", { ...base, scheduleId: undefined }],
      ["scheduleId que não é uuid", { ...base, scheduleId: "nao-e-uuid" }],
      ["sem contagem", { ...base, teamMembersPresent: undefined }],
      ["contagem negativa", { ...base, shelteredHeardMessage: -1 }],
      ["contagem fracionada", { ...base, caretakersHeardMessage: 2.5 }],
      ["contagem texto", { ...base, shelteredDecisions: "muitas" }],
      ["contagem acima do teto", { ...base, caretakersDecisions: 3_000_000_000 }],
      ["observação acima do limite", { ...base, observation: "o".repeat(10_001) }],
      ["campo desconhecido", { ...base, id: BAD_ID }],
    ];
    for (const [title, body] of bad) {
      expect((await createRaw(request, admin, body)).status(), title).toBe(400);
    }
    expect(await allReports()).toBe(before);
    expect(await reportsOfSchedule(scheduleId)).toBe(0);
  });

  test("[visit-report.post.visit-reports#conflito-ou-duplicidade] segundo relatório da mesma agenda: 409; dois enviados ao mesmo tempo: só um fica", async ({ request }) => {
    const first = await make(request);
    const again = await createRaw(request, admin, payload({ scheduleId: first.scheduleId }));
    expect(again.status()).toBe(409);
    expect(await reportsOfSchedule(first.scheduleId)).toBe(1);

    const racing = await newSchedule(request);
    const results = await Promise.all([createRaw(request, admin, payload({ scheduleId: racing })), createRaw(request, admin, payload({ scheduleId: racing }))]);
    const statuses = results.map((res) => res.status()).sort();
    expect(statuses, "um criou e o outro recebeu 409 (nunca 500)").toEqual([201, 409]);
    for (const res of results) if (res.status() === 201) reports.push(((await res.json()) as ReportBody).id);
    expect(await reportsOfSchedule(racing)).toBe(1);
  });

  test("[visit-report.post.visit-reports#falha-do-colaborador-sem-efeito-parcial] agenda que não existe, ou de equipe que o líder não lidera: 404 e nenhum relatório é gravado", async ({ request }) => {
    const before = await allReports();
    expect((await createRaw(request, admin, payload({ scheduleId: BAD_ID }))).status()).toBe(404);
    const foreign = await newSchedule(request, teamB);
    expect((await createRaw(request, leader, payload({ scheduleId: foreign }))).status(), "equipe de outro abrigo não revela a agenda").toBe(404);
    expect(await reportsOfSchedule(foreign)).toBe(0);
    expect(await allReports()).toBe(before);
  });

  test("[visit-report.post.visit-reports#email-enviado-ou-bloqueado-por-flag] criar o relatório não manda e-mail: o outbox não muda", async ({ request }) => {
    const scheduleId = await newSchedule(request); // a agenda avisa a equipe (outro fluxo): mede só o relatório
    const before = await outboxTotal();
    await make(request, { scheduleId });
    expect(await outboxTotal()).toBe(before);
  });

  // ───────────────────────── GET ─────────────────────────
  test("[visit-report.get.visit-reports#feliz] a lista traz o relatório e os filtros por agenda, equipe e abrigo recortam só o que cabe", async ({ request }) => {
    const a = await make(request);
    const b = await make(request, {}, teamB);
    const all = (await (await get(request, admin, "/visit-reports")).json()) as ReportBody[];
    expect(all.map((item) => item.id)).toEqual(expect.arrayContaining([a.id, b.id]));
    const bySchedule = (await (await get(request, admin, `/visit-reports?scheduleId=${a.scheduleId}`)).json()) as ReportBody[];
    expect(bySchedule.map((item) => item.id)).toEqual([a.id]);
    const byTeam = (await (await get(request, admin, `/visit-reports?teamId=${teamB}`)).json()) as ReportBody[];
    expect(byTeam.map((item) => item.id)).toEqual([b.id]);
    const byShelter = (await (await get(request, admin, `/visit-reports?shelterId=${shelterA}`)).json()) as ReportBody[];
    expect(byShelter.map((item) => item.id)).toContain(a.id);
    expect(byShelter.map((item) => item.id), "o abrigo B não entra no recorte do A").not.toContain(b.id);
    const mine = (await (await get(request, leader, "/visit-reports")).json()) as ReportBody[];
    expect(mine.map((item) => item.id), "o líder só recebe o da equipe que lidera").toContain(a.id);
    expect(mine.map((item) => item.id)).not.toContain(b.id);
    const asLeaderForeign = (await (await get(request, leader, `/visit-reports?teamId=${teamB}`)).json()) as ReportBody[];
    expect(asLeaderForeign, "filtro por id nunca amplia o escopo").toEqual([]);
  });

  test("[visit-report.get.visit-reports-id#feliz] ler por id traz exatamente o que foi enviado; o líder lê o da própria equipe", async ({ request }) => {
    const sent = await make(request, { observation: "Texto exato", teamMembersPresent: 9 });
    for (const token of [admin, leader]) {
      const res = await get(request, token, `/visit-reports/${sent.id}`);
      expect(res.status()).toBe(200);
      expect(await res.json()).toMatchObject({ id: sent.id, teamMembersPresent: 9, observation: "Texto exato" });
    }
  });

  test("[visit-report.get.visit-reports-id#nao-encontrado] id que não existe, ou de equipe que o líder não lidera: 404; id malformado: 400", async ({ request }) => {
    const foreign = await make(request, {}, teamB);
    expect((await get(request, admin, `/visit-reports/${BAD_ID}`)).status()).toBe(404);
    expect((await get(request, leader, `/visit-reports/${foreign.id}`)).status()).toBe(404);
    expect((await get(request, admin, "/visit-reports/nao-e-uuid")).status()).toBe(400);
  });

  test("[visit-report.get.visit-reports-id#flag-desligada] com visit_reports desligada, ler por id: 403 FEATURE_DISABLED; religada, volta", async ({ request }) => {
    const sent = await make(request);
    await withFlagsOff(request, admin, ["visit_reports"], async () => {
      await expectFeatureDisabled(await get(request, admin, `/visit-reports/${sent.id}`));
    });
    expect((await get(request, admin, `/visit-reports/${sent.id}`)).status()).toBe(200);
  });

  // ───────────────────────── PUT ─────────────────────────
  test("[visit-report.put.visit-reports-id#feliz] edição parcial muda só o enviado e mantém o resto; a agenda não muda", async ({ request }) => {
    const sent = await make(request, { teamMembersPresent: 5, observation: "Antes" });
    const res = await putRaw(request, admin, sent.id, { teamMembersPresent: 8, observation: "Depois" });
    expect(res.status(), await res.text()).toBe(200);
    expect(await reportRow(sent.id)).toMatchObject({ teamMembersPresent: 8, observation: "Depois", shelteredHeardMessage: 10, schedule_id: sent.scheduleId });
    const byLeader = await putRaw(request, leader, sent.id, { caretakersDecisions: 6 });
    expect(byLeader.status(), "o líder da equipe edita").toBe(200);
    expect((await reportRow(sent.id))?.caretakersDecisions).toBe(6);
  });

  test("[visit-report.put.visit-reports-id#validacao] contagem negativa, fracionada, texto ou acima do teto, observação longa, campo desconhecido (inclusive trocar a agenda): 400 e o relatório não muda", async ({ request }) => {
    const sent = await make(request);
    const snapshot = await reportRow(sent.id);
    for (const body of [
      { teamMembersPresent: -1 },
      { shelteredHeardMessage: 1.5 },
      { caretakersHeardMessage: "muitas" },
      { shelteredDecisions: 3_000_000_000 },
      { observation: "o".repeat(10_001) },
      { scheduleId: await newSchedule(request) },
      { id: BAD_ID },
    ]) {
      expect((await putRaw(request, admin, sent.id, body)).status(), JSON.stringify(body)).toBe(400);
    }
    expect(await reportRow(sent.id)).toEqual(snapshot);
  });

  test("[visit-report.put.visit-reports-id#falha-do-colaborador-sem-efeito-parcial] uma mudança válida junto de outra recusada: nenhuma é aplicada", async ({ request }) => {
    const sent = await make(request);
    const snapshot = await reportRow(sent.id);
    const res = await putRaw(request, admin, sent.id, { observation: "Mudança válida", teamMembersPresent: -5 });
    expect(res.status()).toBe(400);
    expect(await reportRow(sent.id)).toEqual(snapshot);
  });

  test("[visit-report.put.visit-reports-id#nao-encontrado] id que não existe, ou de equipe que o líder não lidera: 404 sem mudar nada; malformado: 400", async ({ request }) => {
    const foreign = await make(request, {}, teamB);
    const snapshot = await reportRow(foreign.id);
    expect((await putRaw(request, admin, BAD_ID, { observation: "x" })).status()).toBe(404);
    expect((await putRaw(request, leader, foreign.id, { observation: "invasor" })).status()).toBe(404);
    expect((await putRaw(request, admin, "nao-e-uuid", { observation: "x" })).status()).toBe(400);
    expect(await reportRow(foreign.id)).toEqual(snapshot);
  });

  test("[visit-report.put.visit-reports-id#conflito-ou-duplicidade] repetir a mesma edição é idempotente e não cria outro relatório", async ({ request }) => {
    const sent = await make(request);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      expect((await putRaw(request, admin, sent.id, { observation: "Igual", shelteredDecisions: 4 })).status()).toBe(200);
    }
    expect(await reportRow(sent.id)).toMatchObject({ observation: "Igual", shelteredDecisions: 4 });
    expect(await reportsOfSchedule(sent.scheduleId)).toBe(1);
  });

  test("[visit-report.put.visit-reports-id#email-enviado-ou-bloqueado-por-flag] editar o relatório não manda e-mail: o outbox não muda", async ({ request }) => {
    const sent = await make(request);
    const before = await outboxTotal();
    expect((await putRaw(request, admin, sent.id, { observation: "Sem e-mail" })).status()).toBe(200);
    expect(await outboxTotal()).toBe(before);
  });

  // ───────────────────────── DELETE ─────────────────────────
  test("[visit-report.delete.visit-reports-id#feliz] apagar remove só o relatório pedido; a agenda continua e dá para criar outro", async ({ request }) => {
    const target = await make(request);
    const other = await make(request);
    const res = await deleteRaw(request, admin, target.id);
    expect(res.status()).toBe(204);
    expect(await reportRow(target.id)).toBeNull();
    expect((await reportRow(other.id))?.id, "o outro continua").toBe(other.id);
    expect(await queryOne("SELECT id FROM shelter_schedules WHERE id = ?", [target.scheduleId]), "a agenda continua").toBeTruthy();
    const again = await createRaw(request, admin, payload({ scheduleId: target.scheduleId }));
    expect(again.status(), "agora a agenda aceita um novo relatório").toBe(201);
    reports.push(((await again.json()) as ReportBody).id);
    reports.splice(reports.indexOf(target.id), 1);
  });

  test("[visit-report.delete.visit-reports-id#nao-encontrado] apagar o que não existe, já foi apagado ou é de outra equipe (líder): 404", async ({ request }) => {
    const gone = await make(request);
    expect((await deleteRaw(request, admin, gone.id)).status()).toBe(204);
    expect((await deleteRaw(request, admin, gone.id)).status()).toBe(404);
    expect((await deleteRaw(request, admin, BAD_ID)).status()).toBe(404);
    const foreign = await make(request, {}, teamB);
    expect((await deleteRaw(request, leader, foreign.id)).status()).toBe(404);
    expect((await reportRow(foreign.id))?.id, "o do outro abrigo continua").toBe(foreign.id);
    reports.splice(reports.indexOf(gone.id), 1);
  });

  test("[visit-report.delete.visit-reports-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhum relatório some", async ({ request }) => {
    await make(request);
    const before = await allReports();
    expect((await deleteRaw(request, admin, "nao-e-uuid")).status()).toBe(400);
    expect(await allReports()).toBe(before);
  });

  test("[visit-report.delete.visit-reports-id#email-enviado-ou-bloqueado-por-flag] apagar o relatório não manda e-mail: o outbox não muda", async ({ request }) => {
    const sent = await make(request);
    const before = await outboxTotal();
    expect((await deleteRaw(request, admin, sent.id)).status()).toBe(204);
    expect(await outboxTotal()).toBe(before);
    reports.splice(reports.indexOf(sent.id), 1);
  });
});
