import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID, createShelter, deleteShelterApi, label, sheltersWithTag } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";

/**
 * Cenários de `/pagelas` por handler (plano 19 §7.3). Dois abrigos criados pelo cenário (o líder semeado lidera o A) com
 * um acolhido em cada, e um membro criado pela API como autor das pagelas. Pagela não envia e-mail: os cenários de e-mail
 * provam que o outbox não muda. Tudo é desfeito pela API e o `afterAll` confere 0 sobras.
 */
interface PagelaBody {
  id: string;
  shelteredId?: string;
  visit: number;
  year: number;
  present: boolean;
  notes?: string | null;
}

const PAGELA_FLAGS = ["pagelas_management", "sheltered_area"] as const;

test.describe.serial("Pagelas — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let leaderProfileId = "";
  let author: Actor;
  let authorProfileId = "";
  let shelterA = "";
  let shelterB = "";
  let shelteredA = "";
  let shelteredB = "";
  let visitSeq = 0;
  const shelters: string[] = [];
  const shelteredIds: string[] = [];
  const created: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const send = (request: APIRequestContext, verb: "GET" | "POST" | "PATCH" | "DELETE", path: string, token?: string, data?: unknown) =>
    request.fetch(`${API_URL}${path}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" || verb === "DELETE" ? undefined : (data ?? {}),
    });

  const makeSheltered = async (request: APIRequestContext, name: string, shelterId: string): Promise<string> => {
    const res = await send(request, "POST", "/sheltered", admin, { name: label(name), gender: "F", shelterId });
    expect(res.status(), await res.text()).toBe(201);
    const id = (await json<{ id: string }>(res)).id;
    shelteredIds.push(id);
    return id;
  };

  const body = (shelteredId: string, over: Record<string, unknown> = {}) => ({
    shelteredId,
    memberProfileId: authorProfileId,
    referenceDate: "2026-11-10",
    year: 2026,
    visit: (visitSeq += 1) + 40,
    present: true,
    notes: "anotação do E2E",
    ...over,
  });

  const make = async (request: APIRequestContext, shelteredId: string, over: Record<string, unknown> = {}): Promise<PagelaBody> => {
    const res = await send(request, "POST", "/pagelas", admin, body(shelteredId, over));
    expect(res.status(), await res.text()).toBe(201);
    const pagela = await json<PagelaBody>(res);
    created.push(pagela.id);
    return pagela;
  };

  const row = (id: string) =>
    queryOne<{ id: string; visit: number; year: number; present: number; notes: string | null; member_profile_id: string }>(
      "SELECT id, visit, year, present, notes, member_profile_id FROM pagelas WHERE id = ?",
      [id],
    );

  const total = (): Promise<number> => countRows("pagelas", {});
  const outbox = async (): Promise<number> => Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM email_outbox"))?.n ?? 0);
  const idsOf = <T extends { id: string }>(items: T[]): string[] => items.map((item) => item.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    leaderProfileId =
      (await queryOne<{ id: string }>("SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = 'e2e.leader@orfanatonib.test'"))?.id ?? "";
    expect(leaderProfileId, "perfil do líder semeado").not.toBe("");
    author = await createActor(request, admin, "member", "autor-pagela");
    authorProfileId = (await queryOne<{ id: string }>("SELECT p.id AS id FROM member_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?", [author.email]))?.id ?? "";
    for (const name of ["pagela-a", "pagela-b"]) shelters.push((await createShelter(request, admin, { name: label(name), teamsQuantity: 1 })).id);
    [shelterA, shelterB] = shelters;
    expect((await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [{ shelterId: shelterA, teams: [1] }] })).status()).toBe(200);
    shelteredA = await makeSheltered(request, "acolhido-a", shelterA);
    shelteredB = await makeSheltered(request, "acolhido-b", shelterB);
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await send(request, "DELETE", `/pagelas/${id}`, admin);
    for (const id of shelteredIds) await send(request, "DELETE", `/sheltered/${id}`, admin);
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    for (const id of shelters) await deleteShelterApi(request, admin, id);
    await removeActors(request, admin, [author.id]);
    expect(await sheltersWithTag(RUN_TAG), "a limpeza deixou abrigos do E2E").toBe(0);
    expect((await queryAll("SELECT id FROM pagelas WHERE sheltered_id IN (?, ?)", [shelteredA, shelteredB])).length, "pagelas do E2E").toBe(0);
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /pagelas

  test("[pagela.post.pagelas#feliz] admin cria a pagela: a linha bate com o banco (ano, visita, presença, nota)", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 1, notes: "primeira" });
    expect(await row(pagela.id)).toMatchObject({ visit: 1, year: 2026, present: 1, notes: "primeira", member_profile_id: authorProfileId });
  });

  test("[pagela.post.pagelas#validacao] acolhido/autor que não são uuid, data inválida, visita 0, presença que não é booleana e nota acima de 500: 400 e nada gravado", async ({ request }) => {
    const before = await total();
    for (const over of [
      { shelteredId: "nao-e-uuid" },
      { memberProfileId: "nao-e-uuid" },
      { referenceDate: "ontem" },
      { visit: 0 },
      { present: "talvez" },
      { notes: "x".repeat(501) },
    ]) {
      const res = await send(request, "POST", "/pagelas", admin, body(shelteredA, over));
      expect(res.status(), JSON.stringify(over)).toBe(400);
    }
    expect(await total()).toBe(before);
  });

  test("[pagela.post.pagelas#conflito-ou-duplicidade] segunda pagela do mesmo acolhido, ano e visita: 409 e só existe uma", async ({ request }) => {
    const first = await make(request, shelteredA, { visit: 2 });
    const before = await total();
    const dup = await send(request, "POST", "/pagelas", admin, body(shelteredA, { visit: 2 }));
    expect(dup.status(), await dup.text()).toBe(409);
    expect(await total()).toBe(before);
    expect(await countRows("pagelas", { sheltered_id: shelteredA, year: 2026, visit: 2 })).toBe(1);
    expect(first.id).toBeTruthy();
  });

  test("[pagela.post.pagelas#falha-do-colaborador-sem-efeito-parcial] [pagela.post.pagelas#rollback-de-transacao] autor ou acolhido inexistentes: erro (nunca 500) e nada gravado", async ({ request }) => {
    const before = await total();
    const missingAuthor = await send(request, "POST", "/pagelas", admin, body(shelteredA, { memberProfileId: BAD_ID }));
    expect([400, 404]).toContain(missingAuthor.status());
    const missingSheltered = await send(request, "POST", "/pagelas", admin, body(BAD_ID));
    expect(missingSheltered.status()).toBe(404);
    expect(await total()).toBe(before);
  });

  test("[pagela.post.pagelas#email-enviado-ou-bloqueado-por-flag] criar pagela não envia e-mail: o outbox não muda", async ({ request }) => {
    const before = await outbox();
    await make(request, shelteredA, { visit: 3 });
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(await outbox()).toBe(before);
  });

  // ---------------------------------------------------------------- GET

  test("[pagela.get.pagelas#feliz] [pagela.get.pagelas-id#feliz] [pagela.get.pagelas-paginated#feliz] lista simples, paginada e leitura por id batem com o banco", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 4 });
    const list = await send(request, "GET", `/pagelas?shelteredId=${shelteredA}&year=2026`, admin);
    expect(list.status(), await list.text()).toBe(200);
    expect(idsOf(await json<PagelaBody[]>(list))).toContain(pagela.id);

    const page = await send(request, "GET", `/pagelas/paginated?shelteredId=${shelteredA}&year=2026&page=1&limit=50`, admin);
    expect(page.status(), await page.text()).toBe(200);
    expect(idsOf((await json<{ items: PagelaBody[] }>(page)).items)).toContain(pagela.id);

    const one = await send(request, "GET", `/pagelas/${pagela.id}`, admin);
    expect(one.status()).toBe(200);
    expect((await json<PagelaBody>(one)).visit).toBe((await row(pagela.id))?.visit);
  });

  test("[pagela.get.pagelas#escopo-proprio-x-outro] [pagela.get.pagelas-paginated#escopo-proprio-x-outro] o líder só lê pagelas de acolhido do abrigo que lidera; o do abrigo B não aparece", async ({ request }) => {
    const mine = await make(request, shelteredA, { visit: 5 });
    const theirs = await make(request, shelteredB, { visit: 5 });
    const own = await send(request, "GET", `/pagelas?shelteredId=${shelteredA}&year=2026`, leader);
    expect(idsOf(await json<PagelaBody[]>(own))).toContain(mine.id);
    const foreign = await send(request, "GET", `/pagelas?shelteredId=${shelteredB}&year=2026`, leader);
    expect([200, 403, 404]).toContain(foreign.status());
    if (foreign.status() === 200) expect(idsOf(await json<PagelaBody[]>(foreign))).not.toContain(theirs.id);
    const page = await send(request, "GET", `/pagelas/paginated?shelteredId=${shelteredB}&year=2026&page=1&limit=50`, leader);
    expect([200, 403, 404]).toContain(page.status());
    if (page.status() === 200) expect(idsOf((await json<{ items: PagelaBody[] }>(page)).items)).not.toContain(theirs.id);
  });

  test("[pagela.get.pagelas-id#escopo-proprio-x-outro] pagela de acolhido de abrigo alheio é 404 para o líder (nunca revela que existe); a do próprio abrigo é 200", async ({ request }) => {
    const mine = await make(request, shelteredA, { visit: 6 });
    const theirs = await make(request, shelteredB, { visit: 6 });
    expect((await send(request, "GET", `/pagelas/${mine.id}`, leader)).status()).toBe(200);
    expect((await send(request, "GET", `/pagelas/${theirs.id}`, leader)).status()).toBe(404);
  });

  test("[pagela.get.pagelas-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await send(request, "GET", `/pagelas/${BAD_ID}`, admin)).status()).toBe(404);
  });

  test("[pagela.get.pagelas-id#flag-desligada] [pagela.get.pagelas-paginated#flag-desligada] com pagelas e sheltered_area desligadas: 403 FEATURE_DISABLED", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 7 });
    await withFlagsOff(request, admin, PAGELA_FLAGS, async () => {
      await expectFeatureDisabled(await send(request, "GET", `/pagelas/${pagela.id}`, admin));
      await expectFeatureDisabled(await send(request, "GET", `/pagelas/paginated?shelteredId=${shelteredA}`, admin));
    });
    expect((await send(request, "GET", `/pagelas/${pagela.id}`, admin)).status()).toBe(200);
  });

  // ---------------------------------------------------------------- PATCH /pagelas/:id

  test("[pagela.patch.pagelas-id#feliz] admin altera presença e nota: o banco reflete", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 8, present: true });
    const res = await send(request, "PATCH", `/pagelas/${pagela.id}`, admin, { present: false, notes: "mudou" });
    expect(res.status(), await res.text()).toBe(200);
    expect(await row(pagela.id)).toMatchObject({ present: 0, notes: "mudou" });
  });

  test("[pagela.patch.pagelas-id#validacao] visita 0, presença que não é booleana, data inválida e nota acima de 500: 400 e a pagela fica como estava", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 9 });
    const before = await row(pagela.id);
    for (const data of [{ visit: 0 }, { present: "talvez" }, { referenceDate: "ontem" }, { notes: "x".repeat(501) }]) {
      expect((await send(request, "PATCH", `/pagelas/${pagela.id}`, admin, data)).status(), JSON.stringify(data)).toBe(400);
    }
    expect(await row(pagela.id)).toEqual(before);
  });

  test("[pagela.patch.pagelas-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await send(request, "PATCH", `/pagelas/${BAD_ID}`, admin, { notes: "x" })).status()).toBe(404);
  });

  test("[pagela.patch.pagelas-id#conflito-ou-duplicidade] mudar a visita para uma que o acolhido já tem no ano: 409 e a visita não muda", async ({ request }) => {
    const first = await make(request, shelteredA, { visit: 10 });
    const second = await make(request, shelteredA, { visit: 11 });
    const res = await send(request, "PATCH", `/pagelas/${second.id}`, admin, { visit: first.visit });
    expect(res.status(), await res.text()).toBe(409);
    expect((await row(second.id))?.visit).toBe(11);
  });

  test("[pagela.patch.pagelas-id#escopo-proprio-x-outro] o líder altera a pagela do próprio abrigo, mas a de abrigo alheio é 404 e não muda", async ({ request }) => {
    const mine = await make(request, shelteredA, { visit: 12 });
    const theirs = await make(request, shelteredB, { visit: 12 });
    expect((await send(request, "PATCH", `/pagelas/${mine.id}`, leader, { notes: "do líder" })).status()).toBe(200);
    expect((await send(request, "PATCH", `/pagelas/${theirs.id}`, leader, { notes: "invasor" })).status()).toBe(404);
    expect((await row(theirs.id))?.notes).toBe("anotação do E2E");
  });

  test("[pagela.patch.pagelas-id#falha-do-colaborador-sem-efeito-parcial] [pagela.patch.pagelas-id#rollback-de-transacao] autor inexistente junto de outras mudanças: erro (nunca 500) e NADA é gravado (nota e presença intactas)", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 13, present: true });
    const before = await row(pagela.id);
    const res = await send(request, "PATCH", `/pagelas/${pagela.id}`, admin, { memberProfileId: BAD_ID, notes: "não grava", present: false });
    expect([400, 404]).toContain(res.status());
    expect(await row(pagela.id)).toEqual(before);
  });

  test("[pagela.patch.pagelas-id#email-enviado-ou-bloqueado-por-flag] alterar pagela não envia e-mail: o outbox não muda", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 14 });
    const before = await outbox();
    expect((await send(request, "PATCH", `/pagelas/${pagela.id}`, admin, { notes: "sem e-mail" })).status()).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(await outbox()).toBe(before);
  });

  // ---------------------------------------------------------------- DELETE

  test("[pagela.delete.pagelas-id#feliz] admin remove: a linha some e o GET passa a 404", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 15 });
    const res = await send(request, "DELETE", `/pagelas/${pagela.id}`, admin);
    expect(res.status()).toBeLessThan(300);
    expect(await row(pagela.id)).toBeNull();
    expect((await send(request, "GET", `/pagelas/${pagela.id}`, admin)).status()).toBe(404);
  });

  test("[pagela.delete.pagelas-id#nao-encontrado] uuid inexistente: 404 e nada some", async ({ request }) => {
    const before = await total();
    expect((await send(request, "DELETE", `/pagelas/${BAD_ID}`, admin)).status()).toBe(404);
    expect(await total()).toBe(before);
  });

  test("[pagela.delete.pagelas-id#escopo-proprio-x-outro] o líder remove a pagela do próprio abrigo, mas a de abrigo alheio é 404 e continua existindo", async ({ request }) => {
    const mine = await make(request, shelteredA, { visit: 16 });
    const theirs = await make(request, shelteredB, { visit: 16 });
    expect((await send(request, "DELETE", `/pagelas/${theirs.id}`, leader)).status()).toBe(404);
    expect(await row(theirs.id)).not.toBeNull();
    expect((await send(request, "DELETE", `/pagelas/${mine.id}`, leader)).status()).toBeLessThan(300);
    expect(await row(mine.id)).toBeNull();
  });

  test("[pagela.delete.pagelas-id#falha-do-colaborador-sem-efeito-parcial] [pagela.delete.pagelas-id#rollback-de-transacao] id malformado: 400 e nenhuma pagela some", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 17 });
    const before = await total();
    expect((await send(request, "DELETE", "/pagelas/nao-e-uuid", admin)).status()).toBe(400);
    expect(await total()).toBe(before);
    expect(await row(pagela.id)).not.toBeNull();
  });

  test("[pagela.delete.pagelas-id#email-enviado-ou-bloqueado-por-flag] remover pagela não envia e-mail: o outbox não muda", async ({ request }) => {
    const pagela = await make(request, shelteredA, { visit: 18 });
    const before = await outbox();
    expect((await send(request, "DELETE", `/pagelas/${pagela.id}`, admin)).status()).toBeLessThan(300);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(await outbox()).toBe(before);
  });
});
