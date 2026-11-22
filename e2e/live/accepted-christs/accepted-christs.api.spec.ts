import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, expectRow, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * `POST /accepted-christs` ao vivo (plano 18): sessão obrigatória, validação do DTO, escopo
 * (cobertura de líder/membro/outro abrigo em `security/scoped-flows`), feliz com `SELECT` e
 * flag `accepted_christs` desligada ⇒ 403 FEATURE_DISABLED sem gravar nada.
 * Não há regra de unicidade: um acolhido pode ter várias decisões, então não existe cenário de conflito.
 */
const FLAG = "accepted_christs";
const MISSING = "00000000-0000-4000-8000-000000000000";

test.describe.serial("Aceitos a Cristo — API ao vivo", () => {
  let admin: string;
  let shelteredId = "";
  let shelterId = "";
  let flagBefore = 1;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    const shelter = await request.post(`${API_URL}/shelters`, {
      headers: authHeaders(admin),
      multipart: {
        shelterData: JSON.stringify({
          name: `E2E aceitos ${Date.now()}`,
          description: "e2e",
          teamsQuantity: 1,
          address: { street: "Rua Teste", number: "10", district: "Centro", city: "Manaus", state: "AM" },
        }),
      },
    });
    expect(shelter.status(), await shelter.text()).toBe(201);
    shelterId = ((await shelter.json()) as { id: string }).id;
    const sheltered = await request.post(`${API_URL}/sheltered`, {
      headers: authHeaders(admin),
      data: { name: "Acolhido E2E aceitos", gender: "M", shelterId },
    });
    expect(sheltered.status(), await sheltered.text()).toBe(201);
    shelteredId = ((await sheltered.json()) as { id: string }).id;
    flagBefore = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [FLAG]))?.enabled ?? 1;
  });

  test.afterAll(async ({ request }) => {
    await request.patch(`${API_URL}/feature-flags/${FLAG}`, { headers: authHeaders(admin), data: { enabled: flagBefore === 1 } });
    await request.delete(`${API_URL}/sheltered/${shelteredId}`, { headers: authHeaders(admin) });
    await request.delete(`${API_URL}/shelters/${shelterId}`, { headers: authHeaders(admin) });
    await closeDb();
  });

  test("[accepted-christ.post.accepted-christs#perfil-anonimo] sem sessão é 401 e nada é gravado", async ({ request }) => {
    const before = await countRows("accepted_christs");
    const res = await request.post(`${API_URL}/accepted-christs`, { data: { shelteredId, decision: "ACCEPTED" } });
    expect(res.status()).toBe(401);
    expect(await countRows("accepted_christs")).toBe(before);
  });

  test("[accepted-christ.post.accepted-christs#validacao] decisão inválida, id malformado e notas acima de 500 são 400 sem gravar", async ({
    request,
  }) => {
    const before = await countRows("accepted_christs");
    for (const data of [
      { shelteredId, decision: "TALVEZ" },
      { shelteredId: "nao-e-uuid", decision: "ACCEPTED" },
      { shelteredId, decision: "ACCEPTED", notes: "x".repeat(501) },
      {},
    ]) {
      const res = await request.post(`${API_URL}/accepted-christs`, { headers: authHeaders(admin), data });
      expect(res.status(), JSON.stringify(data).slice(0, 60)).toBe(400);
    }
    expect(await countRows("accepted_christs")).toBe(before);
  });

  test("acolhido inexistente é 404 e nada é gravado", async ({ request }) => {
    const before = await countRows("accepted_christs");
    const res = await request.post(`${API_URL}/accepted-christs`, {
      headers: authHeaders(admin),
      data: { shelteredId: MISSING, decision: "ACCEPTED" },
    });
    expect(res.status()).toBe(404);
    expect(await countRows("accepted_christs")).toBe(before);
  });

  test("[accepted-christ.post.accepted-christs#feliz] admin registra a decisão e a linha existe no banco com as notas", async ({
    request,
  }) => {
    const notes = `e2e ${Date.now()}`;
    const res = await request.post(`${API_URL}/accepted-christs`, {
      headers: authHeaders(admin),
      data: { shelteredId, decision: "ACCEPTED", notes },
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { id: string; shelteredId: string; decision: string; notes: string };
    expect(body).toMatchObject({ shelteredId, decision: "ACCEPTED", notes });
    const row = await expectRow<{ notes: string }>("accepted_christs", { id: body.id });
    expect(row.notes).toBe(notes);
  });

  test("[accepted-christ.post.accepted-christs#conflito-ou-duplicidade] o mesmo acolhido pode ter várias decisões: duas chamadas ⇒ duas linhas", async ({
    request,
  }) => {
    const before = await countRows("accepted_christs", { sheltered_id: shelteredId });
    for (let i = 0; i < 2; i++) {
      const res = await request.post(`${API_URL}/accepted-christs`, {
        headers: authHeaders(admin),
        data: { shelteredId, decision: "ACCEPTED" },
      });
      expect(res.status()).toBe(201);
    }
    expect(await countRows("accepted_christs", { sheltered_id: shelteredId })).toBe(before + 2);
  });

  test("[accepted-christ.post.accepted-christs#falha-do-colaborador-sem-efeito-parcial] acolhido que não existe (o colaborador recusa antes de gravar): 404 e nenhuma decisão é criada", async ({
    request,
  }) => {
    const before = await countRows("accepted_christs");
    const res = await request.post(`${API_URL}/accepted-christs`, {
      headers: authHeaders(admin),
      data: { shelteredId: MISSING, decision: "ACCEPTED", notes: "não pode ficar" },
    });
    expect(res.status()).toBe(404);
    expect(await countRows("accepted_christs")).toBe(before);
    expect(await countRows("accepted_christs", { notes: "não pode ficar" })).toBe(0);
  });

  test("[accepted-christ.post.accepted-christs#flag-desligada] com accepted_christs desligada: 403 FEATURE_DISABLED e nada é gravado", async ({
    request,
  }) => {
    await request.patch(`${API_URL}/feature-flags/${FLAG}`, { headers: authHeaders(admin), data: { enabled: false } });
    const before = await countRows("accepted_christs");
    const res = await request.post(`${API_URL}/accepted-christs`, {
      headers: authHeaders(admin),
      data: { shelteredId, decision: "ACCEPTED" },
    });
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("accepted_christs")).toBe(before);
    await request.patch(`${API_URL}/feature-flags/${FLAG}`, { headers: authHeaders(admin), data: { enabled: true } });
  });
});
