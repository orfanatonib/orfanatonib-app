import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Caminhos FELIZES do escopo por abrigo/equipe, com dados reais criados pela API:
 * o líder só age no abrigo que lidera; o membro só lança pagela no abrigo da sua equipe.
 * Tudo é criado no beforeAll e removido no afterAll (conferindo 0 linhas).
 */
const TAG = `e2e-scope-${Date.now()}`;
const address = { street: "Rua Teste", number: "10", district: "Centro", city: "Manaus", state: "AM" };

let admin: string;
let leader: string;
let member: string;
let leaderProfileId: string;
let memberProfileId: string;
let own: string; // abrigo que o líder lidera
let other: string; // abrigo alheio
let shelteredOwn: string;
let shelteredOther: string;
const cleanup: Array<(r: APIRequestContext) => Promise<void>> = [];
const failures: string[] = [];

async function createShelter(request: APIRequestContext, name: string): Promise<string> {
  const res = await request.post(`${API_URL}/shelters`, {
    headers: authHeaders(admin),
    multipart: { shelterData: JSON.stringify({ name, description: "e2e", teamsQuantity: 2, address }) },
  });
  expect(res.status()).toBe(201);
  const id = ((await res.json()) as { id: string }).id;
  cleanup.push(async (client) => { const r = await client.delete(`${API_URL}/shelters/${id}`, { headers: authHeaders(admin) }); if (!r.ok()) failures.push(`shelter ${r.status()} ${await r.text()}`); });
  return id;
}

async function createSheltered(request: APIRequestContext, name: string, shelterId: string): Promise<string> {
  const res = await request.post(`${API_URL}/sheltered`, {
    headers: authHeaders(admin),
    data: { name, gender: "M", shelterId },
  });
  expect(res.status(), await res.text()).toBe(201);
  const id = ((await res.json()) as { id: string }).id;
  cleanup.push(async (client) => { const r = await client.delete(`${API_URL}/sheltered/${id}`, { headers: authHeaders(admin) }); if (!r.ok()) failures.push(`sheltered ${r.status()} ${await r.text()}`); });
  return id;
}

test.describe.serial("Escopo por abrigo — caminhos felizes ao vivo", () => {
  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    const l = await loginAs(request, "leader");
    const m = await loginAs(request, "member");
    leader = l.accessToken;
    member = m.accessToken;
    const meL = (await (await request.get(`${API_URL}/auth/me`, { headers: authHeaders(leader) })).json()) as { leaderProfile?: { id: string } };
    const meM = (await (await request.get(`${API_URL}/auth/me`, { headers: authHeaders(member) })).json()) as { memberProfile?: { id: string } };
    expect(meL.leaderProfile?.id, "a conta de líder precisa ter perfil de líder").toBeTruthy();
    expect(meM.memberProfile?.id, "a conta de membro precisa ter perfil de membro").toBeTruthy();
    leaderProfileId = meL.leaderProfile!.id;
    memberProfileId = meM.memberProfile!.id;

    own = await createShelter(request, `${TAG}-own`);
    other = await createShelter(request, `${TAG}-other`);
    // o líder passa a liderar a equipe 1 do abrigo "own"; o membro entra nessa equipe
    const a = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId: own, teams: [1] }] });
    expect(a.ok(), await a.text()).toBe(true);
    const b = await request.put(`${API_URL}/member-profiles/${memberProfileId}`, { headers: authHeaders(admin), data: { shelterId: own, numberTeam: 1 } });
    expect(b.ok(), await b.text()).toBe(true);
    shelteredOwn = await createSheltered(request, `${TAG}-A`, own);
    shelteredOther = await createSheltered(request, `${TAG}-B`, other);
  });

  test.afterAll(async ({ request }) => {
    // devolve o líder/membro a "sem equipe" antes de apagar os abrigos
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] }).catch(() => undefined);
    for (const undo of cleanup.reverse()) await undo(request).catch((e: unknown) => { failures.push(String(e)); });
    expect(failures, "falhas na limpeza").toEqual([]);
    // apagar o acolhido leva as decisões junto (sem linha órfã em accepted_christs)
    expect(await countRows("accepted_christs", { sheltered_id: shelteredOwn })).toBe(0);
    expect(await countRows("accepted_christs", { sheltered_id: shelteredOther })).toBe(0);
    expect(await countRows("shelters", { name: `${TAG}-own` })).toBe(0);
    expect(await countRows("shelters", { name: `${TAG}-other` })).toBe(0);
    await closeDb();
  });

  test("[team.post.teams#feliz] líder cria, atualiza e apaga equipe no abrigo que lidera", async ({ request }) => {
    const created = await request.post(`${API_URL}/teams`, { headers: authHeaders(leader), data: { numberTeam: 7, shelterId: own } });
    expect(created.status(), await created.text()).toBe(201);
    const id = ((await created.json()) as { id: string }).id;
    expect(await countRows("teams", { id })).toBe(1);

    const upd = await request.put(`${API_URL}/teams/${id}`, { headers: authHeaders(leader), data: { description: "atualizada" } });
    expect(upd.ok()).toBe(true);
    const del = await request.delete(`${API_URL}/teams/${id}`, { headers: authHeaders(leader) });
    expect(del.ok()).toBe(true);
    expect(await countRows("teams", { id })).toBe(0);
  });

  test("[team.get.teams#perfil-membro] [team.get.teams-by-shelter-shelterid#perfil-membro] membro não lê a visão administrativa de equipes (403)", async ({ request }) => {
    for (const path of ["/teams", `/teams/by-shelter/${own}`]) {
      const denied = await request.get(`${API_URL}${path}`, { headers: authHeaders(member) });
      expect(denied.status(), `membro em GET ${path}`).toBe(403);
    }
    const ownRows = await queryAll<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? LIMIT 1", [own]);
    expect((await request.get(`${API_URL}/teams/${ownRows[0].id}`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[team.get.teams-my-teams#perfil-membro] membro continua lendo as PRÓPRIAS equipes em /teams/my-teams", async ({ request }) => {
    const res = await request.get(`${API_URL}/teams/my-teams`, { headers: authHeaders(member) });
    expect(res.status()).toBe(200);
    const teams = (await res.json()) as Array<{ shelterId: string }>;
    expect(teams.map((t) => t.shelterId)).toContain(own);
  });

  test("[team.get.teams#escopo-proprio-x-outro] líder lista só as equipes do abrigo que lidera", async ({ request }) => {
    const list = await request.get(`${API_URL}/teams`, { headers: authHeaders(leader) });
    expect(list.status()).toBe(200);
    const shelterIds = ((await list.json()) as Array<{ shelterId: string }>).map((t) => t.shelterId);
    expect(shelterIds).toContain(own);
    expect(shelterIds).not.toContain(other);
  });

  test("[team.get.teams-by-shelter-shelterid#escopo-proprio-x-outro] líder lê by-shelter do abrigo que lidera e é negado no de outro", async ({ request }) => {
    expect((await request.get(`${API_URL}/teams/by-shelter/${own}`, { headers: authHeaders(leader) })).status()).toBe(200);
    expect((await request.get(`${API_URL}/teams/by-shelter/${other}`, { headers: authHeaders(leader) })).status()).toBe(403);
  });

  test("[team.get.teams-id#escopo-proprio-x-outro] líder lê a equipe do próprio abrigo e é negado na de outro", async ({ request }) => {
    const ownRows = await queryAll<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? LIMIT 1", [own]);
    const otherRows = await queryAll<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? LIMIT 1", [other]);
    expect((await request.get(`${API_URL}/teams/${ownRows[0].id}`, { headers: authHeaders(leader) })).status()).toBe(200);
    expect((await request.get(`${API_URL}/teams/${otherRows[0].id}`, { headers: authHeaders(leader) })).status()).toBe(403);
  });

  test("[team.get.teams#perfil-admin] [team.get.teams-id#perfil-admin] [team.get.teams-id#nao-encontrado] admin lê qualquer equipe; id inexistente é 404", async ({ request }) => {
    const otherRows = await queryAll<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? LIMIT 1", [other]);
    const all = await request.get(`${API_URL}/teams`, { headers: authHeaders(admin) });
    expect(all.status()).toBe(200);
    const shelterIds = ((await all.json()) as Array<{ shelterId: string }>).map((t) => t.shelterId);
    expect(shelterIds).toEqual(expect.arrayContaining([own, other]));
    expect((await request.get(`${API_URL}/teams/${otherRows[0].id}`, { headers: authHeaders(admin) })).status()).toBe(200);
    expect((await request.get(`${API_URL}/teams/00000000-0000-4000-8000-000000000000`, { headers: authHeaders(admin) })).status()).toBe(404);
  });

  test("[accepted-christ.post.accepted-christs#escopo-proprio-x-outro] [accepted-christ.post.accepted-christs#perfil-lider] líder registra decisão só de acolhido do abrigo que lidera; de outro abrigo é 404 e nada é gravado", async ({ request }) => {
    const before = await countRows("accepted_christs");

    const denied = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(leader), data: { shelteredId: shelteredOther, decision: "ACCEPTED" } });
    expect(denied.status()).toBe(404);
    expect(await countRows("accepted_christs")).toBe(before);

    // inexistente e fora do escopo são indistinguíveis (não revela o UUID)
    const missing = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(leader), data: { shelteredId: "00000000-0000-4000-8000-000000000000", decision: "ACCEPTED" } });
    expect(missing.status()).toBe(404);
    expect(await denied.text()).toContain("Acolhido não encontrado");

    const ok = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(leader), data: { shelteredId: shelteredOwn, decision: "ACCEPTED", notes: "e2e" } });
    expect(ok.status(), await ok.text()).toBe(201);
    const id = ((await ok.json()) as { id: string }).id;
    expect(await countRows("accepted_christs", { id })).toBe(1);
  });

  test("[accepted-christ.post.accepted-christs#perfil-membro] membro do abrigo registra a do próprio; a de outro abrigo é 404", async ({ request }) => {
    const before = await countRows("accepted_christs");
    const denied = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(member), data: { shelteredId: shelteredOther, decision: "ACCEPTED" } });
    expect(denied.status()).toBe(404);
    expect(await countRows("accepted_christs")).toBe(before);

    const ok = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(member), data: { shelteredId: shelteredOwn, decision: "ACCEPTED" } });
    expect(ok.status(), await ok.text()).toBe(201);
  });

  test("[accepted-christ.post.accepted-christs#perfil-admin] admin registra decisão de acolhido de qualquer abrigo", async ({ request }) => {
    const ok = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(admin), data: { shelteredId: shelteredOther, decision: "ACCEPTED" } });
    expect(ok.status(), await ok.text()).toBe(201);
  });

  test("[team.post.teams#escopo-proprio-x-outro] líder não cria nem apaga equipe de outro abrigo", async ({ request }) => {
    const before = await countRows("teams");
    const denied = await request.post(`${API_URL}/teams`, { headers: authHeaders(leader), data: { numberTeam: 8, shelterId: other } });
    expect([403, 404]).toContain(denied.status());
    expect(await countRows("teams")).toBe(before);

    const rows = await queryAll<{ id: string }>("SELECT id FROM teams WHERE shelter_id = ? LIMIT 1", [other]);
    const del = await request.delete(`${API_URL}/teams/${rows[0].id}`, { headers: authHeaders(leader) });
    expect([403, 404]).toContain(del.status());
    expect(await countRows("teams", { id: rows[0].id })).toBe(1);
  });

  test("[pagela.post.pagelas#feliz] membro lança pagela para acolhido do abrigo da sua equipe", async ({ request }) => {
    const res = await request.post(`${API_URL}/pagelas`, {
      headers: authHeaders(member),
      data: { shelteredId: shelteredOwn, memberProfileId, referenceDate: "2026-11-02", visit: 1, present: true },
    });
    expect(res.status(), await res.text()).toBe(201);
    const id = ((await res.json()) as { id: string }).id;
    cleanup.push(async (client) => { const r = await client.delete(`${API_URL}/pagelas/${id}`, { headers: authHeaders(admin) }); if (!r.ok()) failures.push(`pagela ${r.status()} ${await r.text()}`); });
    expect(await countRows("pagelas", { id })).toBe(1);
  });

  test("[pagela.post.pagelas#escopo-proprio-x-outro] membro não lança pagela para acolhido de outro abrigo (404, nada gravado)", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await request.post(`${API_URL}/pagelas`, {
      headers: authHeaders(member),
      data: { shelteredId: shelteredOther, memberProfileId, referenceDate: "2026-11-02", visit: 1, present: true },
    });
    expect(res.status()).toBe(404);
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.get.pagelas#perfil-lider] líder lista só pagelas dos abrigos que lidera; membro lê as do acolhido do seu abrigo e não as do alheio", async ({ request }) => {
    const mine = await request.get(`${API_URL}/pagelas/paginated`, { headers: authHeaders(leader) });
    expect(mine.status()).toBe(200);
    const items = ((await mine.json()) as { items: Array<{ sheltered: { id: string } }> }).items;
    expect(items.every((p) => p.sheltered.id !== shelteredOther)).toBe(true);
    expect(items.some((p) => p.sheltered.id === shelteredOwn)).toBe(true);

    const own200 = await request.get(`${API_URL}/pagelas/paginated?shelteredId=${shelteredOwn}`, { headers: authHeaders(member) });
    expect(own200.status()).toBe(200);
    const alien = await request.get(`${API_URL}/pagelas/paginated?shelteredId=${shelteredOther}`, { headers: authHeaders(member) });
    expect(alien.status()).toBe(404);
  });

  test("[member-profile.put.member-profiles-memberid#escopo-proprio-x-outro] líder só aloca membro em abrigo que lidera", async ({ request }) => {
    const res = await request.put(`${API_URL}/member-profiles/${memberProfileId}`, { headers: authHeaders(leader), data: { shelterId: other, numberTeam: 1 } });
    expect(res.status()).toBe(403);
    const ok = await request.put(`${API_URL}/member-profiles/${memberProfileId}`, { headers: authHeaders(leader), data: { shelterId: own, numberTeam: 1 } });
    expect(ok.ok(), await ok.text()).toBe(true);
  });

  test("[leader-profile.put.leader-profiles-leaderid#escopo-proprio-x-outro] líder não se realoca para abrigo alheio", async ({ request }) => {
    const res = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(leader), data: [{ shelterId: other, teams: [1] }] });
    expect(res.status()).toBe(403);
  });

  test("[leader-profile.put.leader-profiles-leaderid#validacao] corpo que não é lista é 400 (antes 500)", async ({ request }) => {
    const res = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: { shelterId: own, numberTeam: 1 } });
    expect(res.status()).toBe(400);
  });
});
