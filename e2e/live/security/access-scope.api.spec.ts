import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Correções de acesso/escopo da API, provadas contra a pilha real (API + MySQL).
 * Negativos provam por SELECT que NADA foi gravado. Sem mídia: não precisa de S3.
 */
const NIL = "00000000-0000-4000-8000-000000000000";
const TAG = `e2e-sec-${Date.now()}`;

test.describe.serial("Acesso e escopo — API ao vivo", () => {
  let admin: string;
  let leader: string;
  let member: string;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async () => {
    expect(await countRows("contacts", { name: TAG })).toBe(0);
    await closeDb();
  });

  test("[accepted-christ.post.accepted-christs#perfil-anonimo] POST /accepted-christs sem sessão é 401 e nada é gravado", async ({ request }) => {
    const before = await countRows("accepted_christs");
    const res = await request.post(`${API_URL}/accepted-christs`, { data: { shelteredId: NIL, decision: "ACCEPTED" } });
    expect(res.status()).toBe(401);
    expect(await countRows("accepted_christs")).toBe(before);
  });

  test("[accepted-christ.post.accepted-christs#validacao] acolhido inexistente é 404 e notes acima de 2000 é 400", async ({ request }) => {
    const missing = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(admin), data: { shelteredId: NIL, decision: "ACCEPTED" } });
    expect(missing.status()).toBe(404);
    const long = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(admin), data: { shelteredId: NIL, notes: "x".repeat(2001) } });
    expect(long.status()).toBe(400);
  });

  test("[contact.post.contact#validacao] POST /contact recusa campo fora do contrato (read/id) e e-mail inválido, sem gravar", async ({ request }) => {
    const base = { name: TAG, email: "e2e@orfanatonib.test", phone: "92999990000", message: "oi" };
    const extra = await request.post(`${API_URL}/contact`, { data: { ...base, read: true } });
    expect(extra.status()).toBe(400);
    const badMail = await request.post(`${API_URL}/contact`, { data: { ...base, email: "nao-e-email" } });
    expect(badMail.status()).toBe(400);
    expect(await countRows("contacts", { name: TAG })).toBe(0);
  });

  test("[contact.post.contact#feliz] POST /contact grava com read=false e o admin apaga", async ({ request }) => {
    const res = await request.post(`${API_URL}/contact`, {
      data: { name: TAG, email: "e2e@orfanatonib.test", phone: "92999990000", message: "mensagem e2e" },
    });
    expect(res.status()).toBe(201);
    const row = await queryOne<{ id: string; isRead: number | null; read: number | null }>(
      "SELECT id, `read` AS `read` FROM contacts WHERE name = ?",
      [TAG],
    );
    expect(row?.read).toBe(0);
    const del = await request.delete(`${API_URL}/contact/${row?.id}`, { headers: authHeaders(admin) });
    expect(del.ok()).toBe(true);
  });

  test("[image-section.get.image-sections#perfil-anonimo] /image-sections sem sessão é 401; membro é 403 na listagem; admin lista", async ({ request }) => {
    expect((await request.get(`${API_URL}/image-sections`)).status()).toBe(401);
    expect((await request.get(`${API_URL}/image-sections`, { headers: authHeaders(member) })).status()).toBe(403);
    expect((await request.get(`${API_URL}/image-sections`, { headers: authHeaders(admin) })).status()).toBe(200);
  });

  test("[image-section.delete.image-sections-id#perfil-membro] membro não apaga seção (403) e anônimo recebe 401", async ({ request }) => {
    expect((await request.delete(`${API_URL}/image-sections/${NIL}`)).status()).toBe(401);
    expect((await request.delete(`${API_URL}/image-sections/${NIL}`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[team.post.teams#perfil-membro] membro não cria equipe (403) e nada é gravado", async ({ request }) => {
    const before = await countRows("teams");
    const res = await request.post(`${API_URL}/teams`, { headers: authHeaders(member), data: { numberTeam: 999, shelterId: NIL } });
    expect(res.status()).toBe(403);
    expect(await countRows("teams")).toBe(before);
  });

  test("[team.post.teams#escopo-proprio-x-outro] líder não cria equipe em abrigo que não lidera", async ({ request }) => {
    const before = await countRows("teams");
    const res = await request.post(`${API_URL}/teams`, { headers: authHeaders(leader), data: { numberTeam: 999, shelterId: NIL } });
    expect([403, 404]).toContain(res.status());
    expect(await countRows("teams")).toBe(before);
  });

  test("[team.delete.teams-id#perfil-membro] membro não apaga equipe (403)", async ({ request }) => {
    expect((await request.delete(`${API_URL}/teams/${NIL}`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[pagela.get.pagelas#perfil-membro] listagem sem shelteredId é 403 para membro; anônimo 401", async ({ request }) => {
    expect((await request.get(`${API_URL}/pagelas/paginated`)).status()).toBe(401);
    expect((await request.get(`${API_URL}/pagelas/paginated`, { headers: authHeaders(member) })).status()).toBe(403);
  });

  test("[pagela.post.pagelas#escopo-proprio-x-outro] pagela para acolhido inexistente/fora do escopo é 404 e nada é gravado", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await request.post(`${API_URL}/pagelas`, {
      headers: authHeaders(member),
      data: { shelteredId: NIL, memberProfileId: NIL, referenceDate: "2026-11-02", visit: 1, present: true },
    });
    expect(res.status()).toBe(404);
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[dynamic-routes.get.routes#perfil-anonimo] GET /routes anônimo só traz rotas públicas", async ({ request }) => {
    const anon = (await (await request.get(`${API_URL}/routes`)).json()) as Array<{ public: boolean }>;
    expect(anon.every((r) => r.public === true)).toBe(true);
    const logged = (await (await request.get(`${API_URL}/routes`, { headers: authHeaders(admin) })).json()) as Array<{ public: boolean }>;
    expect(logged.length).toBeGreaterThanOrEqual(anon.length);
  });

  test("[feature-flags.get.feature-flags-check-key#perfil-anonimo] check de flag interna não vaza estado a anônimo", async ({ request }) => {
    const res = await request.get(`${API_URL}/feature-flags/check/email_delivery`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ key: "email_delivery", enabled: false });
  });

  test("[feature-flags.delete.feature-flags-key#perfil-admin] flag de fábrica não pode ser removida nem renomeada", async ({ request }) => {
    const before = await countRows("feature_flags", { key: "shelter_management" });
    const del = await request.delete(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin) });
    expect(del.status()).toBe(400);
    const ren = await request.patch(`${API_URL}/feature-flags/shelter_management`, { headers: authHeaders(admin), data: { key: "outro-nome" } });
    expect(ren.status()).toBe(400);
    expect(await countRows("feature_flags", { key: "shelter_management" })).toBe(before);
  });

  test("[visit-report.get.visit-reports#perfil-lider] líder com filtro de equipe alheia recebe lista vazia", async ({ request }) => {
    const res = await request.get(`${API_URL}/visit-reports?teamId=${NIL}`, { headers: authHeaders(leader) });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
