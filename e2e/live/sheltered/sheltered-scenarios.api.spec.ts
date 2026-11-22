import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { expectFeatureDisabled, withFlagsOff } from "../support/flags";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID, createShelter, deleteShelterApi, label, sheltersWithTag } from "../shelters/support";
import { createActor, removeActors, type Actor } from "../users/support";

/**
 * Cenários de `/sheltered` (acolhidos) por handler (plano 17 §7.3). Admin, líder semeado (lidera o abrigo A)
 * e um membro criado pela API (equipe do abrigo A) provam o escopo com dados próprios: o abrigo B é "dos outros".
 * Tudo é desfeito pela API e o `afterAll` confere 0 sobras.
 */
interface ShelteredBody {
  id: string;
  name: string;
  active: boolean;
  shelter: { id: string } | null;
  address?: { city: string } | null;
}

const ADDRESS = { street: "Rua Teste", number: "10", district: "Centro", city: "Manaus", state: "AM" };
const SHELTERED_FLAGS = ["sheltered_area", "sheltered_management"] as const;

test.describe.serial("Acolhidos — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let leaderProfileId = "";
  let member: Actor;
  let memberProfileId = "";
  let shelterA = "";
  let shelterB = "";
  const created: string[] = [];
  const shelters: string[] = [];

  const json = async <T>(response: APIResponse): Promise<T> => (await response.json()) as T;

  const send = (request: APIRequestContext, verb: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, token?: string, data?: unknown) =>
    request.fetch(`${API_URL}${path}`, {
      method: verb,
      headers: token ? authHeaders(token) : {},
      data: verb === "GET" || verb === "DELETE" ? undefined : (data ?? {}),
    });

  const createAs = async (request: APIRequestContext, token: string, body: Record<string, unknown>): Promise<APIResponse> => {
    const res = await send(request, "POST", "/sheltered", token, body);
    if (res.status() === 201) created.push(((await res.json()) as ShelteredBody).id);
    return res;
  };

  const make = async (request: APIRequestContext, name: string, shelterId: string | undefined = shelterA): Promise<ShelteredBody> => {
    const res = await createAs(request, admin, { name: label(name), gender: "M", shelterId, address: ADDRESS });
    expect(res.status(), await res.text()).toBe(201);
    return json<ShelteredBody>(res);
  };

  const rowOf = (id: string) =>
    queryOne<{ id: string; name: string; active: number; shelter_id: string | null; address_id: string | null }>(
      "SELECT id, name, active, shelter_id, address_id FROM sheltered WHERE id = ?",
      [id],
    );

  const withTag = async (tag: string): Promise<number> =>
    Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM sheltered WHERE name LIKE ?", [`%${tag}%`]))?.n ?? 0);

  const snapshot = async (): Promise<{ sheltered: number; addresses: number }> => ({
    sheltered: await countRows("sheltered", {}),
    addresses: await countRows("addresses", {}),
  });

  const idsOf = <T extends { id: string }>(items: T[]): string[] => items.map((item) => item.id);

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    leaderProfileId =
      (
        await queryOne<{ id: string }>(
          "SELECT lp.id AS id FROM leader_profiles lp JOIN users u ON u.id = lp.user_id WHERE u.email = 'e2e.leader@orfanatonib.test'",
        )
      )?.id ?? "";
    member = await createActor(request, admin, "member", "membro-acolhidos");
    memberProfileId =
      (
        await queryOne<{ id: string }>(
          "SELECT p.id AS id FROM member_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?",
          [member.email],
        )
      )?.id ?? "";
    expect(leaderProfileId, "perfil do líder semeado").not.toBe("");
    expect(memberProfileId, "perfil do membro").not.toBe("");

    for (const name of ["acolhidos-a", "acolhidos-b"]) {
      const shelter = await createShelter(request, admin, { name: label(name), teamsQuantity: 1 });
      shelters.push(shelter.id);
    }
    [shelterA, shelterB] = shelters;
    // O líder semeado lidera o abrigo A; o membro está na equipe 1 do abrigo A. O abrigo B é "dos outros".
    const lead = await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, {
      headers: authHeaders(admin),
      data: [{ shelterId: shelterA, teams: [1] }],
    });
    expect(lead.status(), await lead.text()).toBe(200);
    const placed = await request.put(`${API_URL}/member-profiles/${memberProfileId}`, {
      headers: authHeaders(admin),
      data: { shelterId: shelterA, numberTeam: 1 },
    });
    expect(placed.status(), await placed.text()).toBe(200);
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await request.delete(`${API_URL}/sheltered/${id}`, { headers: authHeaders(admin) });
    await request.put(`${API_URL}/leader-profiles/${leaderProfileId}`, { headers: authHeaders(admin), data: [] });
    for (const id of shelters) await deleteShelterApi(request, admin, id);
    await removeActors(request, admin, [member.id]);
    expect(await withTag(RUN_TAG), "a limpeza deixou acolhidos do E2E").toBe(0);
    expect(await sheltersWithTag(RUN_TAG), "a limpeza deixou abrigos do E2E").toBe(0);
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /sheltered

  test("[sheltered.post.sheltered#feliz] admin cria com abrigo e endereço: linha, vínculo e endereço batem com o banco", async ({ request }) => {
    const body = await make(request, "post-feliz");
    expect(body.shelter?.id).toBe(shelterA);
    expect(body.address?.city).toBe("Manaus");
    const row = await rowOf(body.id);
    expect(row).toMatchObject({ name: label("post-feliz"), shelter_id: shelterA });
    expect(row?.address_id).not.toBeNull();
    expect(Number(row?.active)).toBe(1);
  });

  test("[sheltered.post.sheltered#validacao] sem nome, gênero inválido e data inválida: 400 e nada gravado", async ({ request }) => {
    const before = await snapshot();
    for (const body of [
      { gender: "M" },
      { name: label("v1"), gender: "X" },
      { name: label("v2"), gender: "F", birthDate: "ontem" },
      { name: "a", gender: "F" },
    ]) {
      const res = await send(request, "POST", "/sheltered", admin, body);
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    expect(await snapshot()).toEqual(before);
  });

  test("[sheltered.post.sheltered#conflito-ou-duplicidade] dois acolhidos com os mesmos dados são aceitos (homônimos existem): duas linhas, ids distintos", async ({
    request,
  }) => {
    const first = await make(request, "post-homonimo");
    const second = await make(request, "post-homonimo");
    expect(second.id).not.toBe(first.id);
    expect(await withTag(label("post-homonimo"))).toBe(2);
  });

  test("[sheltered.post.sheltered#falha-do-colaborador-sem-efeito-parcial] abrigo inexistente (com endereço no corpo): 404 e nem o acolhido nem o endereço são gravados", async ({
    request,
  }) => {
    const before = await snapshot();
    const res = await createAs(request, admin, { name: label("post-colaborador"), gender: "F", shelterId: BAD_ID, address: ADDRESS });
    expect(res.status(), await res.text()).toBe(404);
    expect(await snapshot()).toEqual(before);
  });

  test("[sheltered.post.sheltered#escopo-proprio-x-outro] líder e membro criam só em abrigo que alcançam; abrigo alheio é 404 e sem abrigo é 400 — nunca gravam e respondem erro", async ({
    request,
  }) => {
    for (const token of [leader, member.token]) {
      const own = await createAs(request, token, { name: label("post-escopo-meu"), gender: "M", shelterId: shelterA });
      expect(own.status(), await own.text()).toBe(201);
      expect(((await json<ShelteredBody>(own)).shelter?.id)).toBe(shelterA);
    }
    const before = await snapshot();
    for (const token of [leader, member.token]) {
      const foreign = await createAs(request, token, { name: label("post-escopo-alheio"), gender: "M", shelterId: shelterB });
      expect(foreign.status()).toBe(404);
      const loose = await createAs(request, token, { name: label("post-escopo-solto"), gender: "M" });
      expect(loose.status(), await loose.text()).toBe(400);
    }
    expect(await snapshot()).toEqual(before);
    expect(await withTag(label("post-escopo-alheio"))).toBe(0);
    expect(await withTag(label("post-escopo-solto"))).toBe(0);
  });

  // ---------------------------------------------------------------- GET

  test("[sheltered.get.sheltered#feliz] admin lista com o envelope paginado e filtra por abrigo: a contagem bate com o banco", async ({ request }) => {
    await make(request, "get-lista-1");
    await make(request, "get-lista-2");
    const res = await send(request, "GET", `/sheltered?page=1&limit=100&shelterId=${shelterA}&searchString=${encodeURIComponent(label("get-lista"))}`, admin);
    expect(res.status()).toBe(200);
    const body = await json<{ data: ShelteredBody[]; meta: { page: number; totalItems: number } }>(res);
    expect(body.meta.page).toBe(1);
    expect(body.meta.totalItems).toBe(await withTag(label("get-lista")));
    expect(body.data).toHaveLength(2);
  });

  test("[sheltered.get.sheltered#escopo-proprio-x-outro] líder e membro só listam acolhidos do abrigo que alcançam", async ({ request }) => {
    const mine = await make(request, "get-escopo-meu", shelterA);
    const theirs = await make(request, "get-escopo-deles", shelterB);
    for (const token of [leader, member.token]) {
      const res = await send(request, "GET", "/sheltered?page=1&limit=100", token);
      expect(res.status()).toBe(200);
      const ids = idsOf((await json<{ data: ShelteredBody[] }>(res)).data);
      expect(ids).toContain(mine.id);
      expect(ids).not.toContain(theirs.id);
    }
  });

  test("[sheltered.get.sheltered-id#feliz] detalhe bate com o banco (nome, abrigo, endereço)", async ({ request }) => {
    const created = await make(request, "get-detalhe");
    const res = await send(request, "GET", `/sheltered/${created.id}`, admin);
    expect(res.status()).toBe(200);
    const body = await json<ShelteredBody>(res);
    expect(body.name).toBe((await rowOf(created.id))?.name);
    expect(body.shelter?.id).toBe((await rowOf(created.id))?.shelter_id);
    expect(body.address?.city).toBe("Manaus");
  });

  test("[sheltered.get.sheltered-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await send(request, "GET", `/sheltered/${BAD_ID}`, admin)).status()).toBe(404);
  });

  test("[sheltered.get.sheltered-id#escopo-proprio-x-outro] acolhido de abrigo alheio é 404 para líder e membro (nunca revela que existe); o do próprio abrigo é 200", async ({
    request,
  }) => {
    const mine = await make(request, "get-id-meu", shelterA);
    const theirs = await make(request, "get-id-deles", shelterB);
    for (const token of [leader, member.token]) {
      expect((await send(request, "GET", `/sheltered/${mine.id}`, token)).status()).toBe(200);
      expect((await send(request, "GET", `/sheltered/${theirs.id}`, token)).status()).toBe(404);
    }
  });

  test("[sheltered.get.sheltered-simple#feliz] a lista simples traz id, abrigo e status batendo com o banco", async ({ request }) => {
    const created = await make(request, "get-simple");
    const res = await send(request, "GET", `/sheltered/simple?page=1&limit=100&searchString=${encodeURIComponent(label("get-simple"))}`, admin);
    expect(res.status()).toBe(200);
    const body = await json<{ data: Array<{ id: string; shelterId: string | null; active: boolean }> }>(res);
    const item = body.data.find((entry) => entry.id === created.id);
    expect(item?.shelterId).toBe((await rowOf(created.id))?.shelter_id);
    expect(item?.active).toBe(Number((await rowOf(created.id))?.active) === 1);
  });

  test("[sheltered.get.sheltered-simple#escopo-proprio-x-outro] a lista simples de líder e membro não traz acolhido de abrigo alheio", async ({ request }) => {
    const mine = await make(request, "get-simple-meu", shelterA);
    const theirs = await make(request, "get-simple-deles", shelterB);
    for (const token of [leader, member.token]) {
      const res = await send(request, "GET", `/sheltered/simple?page=1&limit=100&searchString=${encodeURIComponent(label("get-simple-"))}`, token);
      expect(res.status()).toBe(200);
      const ids = idsOf((await json<{ data: ShelteredBody[] }>(res)).data);
      expect(ids).toContain(mine.id);
      expect(ids).not.toContain(theirs.id);
    }
  });

  test("[sheltered.get.sheltered-id#flag-desligada] [sheltered.get.sheltered-simple#flag-desligada] com sheltered_area e sheltered_management desligadas: 403 FEATURE_DISABLED (a lista também)", async ({
    request,
  }) => {
    const created = await make(request, "get-flag");
    await withFlagsOff(request, admin, SHELTERED_FLAGS, async () => {
      for (const path of ["/sheltered", "/sheltered/simple", `/sheltered/${created.id}`]) {
        await expectFeatureDisabled(await send(request, "GET", path, admin));
      }
    });
    expect((await send(request, "GET", `/sheltered/${created.id}`, admin)).status()).toBe(200);
  });

  // ---------------------------------------------------------------- PUT /sheltered/:id

  test("[sheltered.put.sheltered-id#feliz] admin altera nome, abrigo e endereço: o banco reflete (e o endereço é o mesmo registro)", async ({ request }) => {
    const created = await make(request, "put-feliz", shelterA);
    const addressBefore = (await rowOf(created.id))?.address_id;
    const res = await send(request, "PUT", `/sheltered/${created.id}`, admin, {
      name: label("put-feliz-novo"),
      shelterId: shelterB,
      address: { city: "Belém" },
    });
    expect(res.status(), await res.text()).toBe(200);
    const row = await rowOf(created.id);
    expect(row).toMatchObject({ name: label("put-feliz-novo"), shelter_id: shelterB, address_id: addressBefore });
    expect((await queryOne<{ city: string }>("SELECT city FROM addresses WHERE id = ?", [addressBefore ?? ""]))?.city).toBe("Belém");
  });

  test("[sheltered.put.sheltered-id#validacao] nome curto, gênero, data, active texto e `null` em coluna NOT NULL: 400 (nunca 500) e o acolhido fica como estava", async ({ request }) => {
    const created = await make(request, "put-validacao");
    for (const body of [
      { name: "a" },
      { gender: "X" },
      { birthDate: "ontem" },
      { active: "talvez" },
      { name: null },
      { gender: null },
      { active: null },
    ]) {
      const res = await send(request, "PUT", `/sheltered/${created.id}`, admin, body);
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    expect(await rowOf(created.id)).toMatchObject({ name: label("put-validacao"), shelter_id: shelterA });
  });

  test("[sheltered.put.sheltered-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await send(request, "PUT", `/sheltered/${BAD_ID}`, admin, { name: label("put-fantasma") })).status()).toBe(404);
    expect(await withTag(label("put-fantasma"))).toBe(0);
  });

  test("[sheltered.put.sheltered-id#conflito-ou-duplicidade] renomear para o nome de outro acolhido é aceito (homônimos): os dois existem", async ({
    request,
  }) => {
    const first = await make(request, "put-conflito-a");
    const second = await make(request, "put-conflito-b");
    const res = await send(request, "PUT", `/sheltered/${second.id}`, admin, { name: label("put-conflito-a") });
    expect(res.status(), await res.text()).toBe(200);
    expect((await rowOf(first.id))?.name).toBe(label("put-conflito-a"));
    expect((await rowOf(second.id))?.name).toBe(label("put-conflito-a"));
  });

  test("[sheltered.put.sheltered-id#escopo-proprio-x-outro] líder e membro: acolhido alheio é 404; não movem para abrigo alheio (404) nem soltam do abrigo (400); no próprio abrigo editam", async ({
    request,
  }) => {
    const mine = await make(request, "put-escopo-meu", shelterA);
    const theirs = await make(request, "put-escopo-deles", shelterB);
    for (const token of [leader, member.token]) {
      expect((await send(request, "PUT", `/sheltered/${theirs.id}`, token, { name: label("put-invadido") })).status()).toBe(404);
      expect((await send(request, "PUT", `/sheltered/${mine.id}`, token, { shelterId: shelterB })).status()).toBe(404);
      const detach = await send(request, "PUT", `/sheltered/${mine.id}`, token, { shelterId: null });
      expect(detach.status(), await detach.text()).toBe(400);
    }
    expect(await rowOf(mine.id)).toMatchObject({ name: label("put-escopo-meu"), shelter_id: shelterA });
    expect((await rowOf(theirs.id))?.name).toBe(label("put-escopo-deles"));

    const own = await send(request, "PUT", `/sheltered/${mine.id}`, leader, { name: label("put-escopo-editado") });
    expect(own.status(), await own.text()).toBe(200);
    expect((await rowOf(mine.id))?.name).toBe(label("put-escopo-editado"));
  });

  test("[sheltered.put.sheltered-id#falha-do-colaborador-sem-efeito-parcial] abrigo inexistente junto de outras mudanças: 404 e nada é gravado (nome, endereço e abrigo intactos)", async ({
    request,
  }) => {
    const created = await make(request, "put-colaborador");
    const before = await rowOf(created.id);
    const res = await send(request, "PUT", `/sheltered/${created.id}`, admin, {
      name: label("put-nao-grava"),
      shelterId: BAD_ID,
      address: { city: "Nao grava" },
    });
    expect(res.status(), await res.text()).toBe(404);
    expect(await rowOf(created.id)).toEqual(before);
    expect((await queryOne<{ city: string }>("SELECT city FROM addresses WHERE id = ?", [before?.address_id ?? ""]))?.city).toBe("Manaus");
  });

  // ---------------------------------------------------------------- PATCH /sheltered/:id/status

  test("[sheltered.patch.sheltered-id-status#feliz] desativa e reativa: a coluna active reflete e nada mais muda", async ({ request }) => {
    const created = await make(request, "patch-feliz");
    const off = await send(request, "PATCH", `/sheltered/${created.id}/status`, admin, { active: false });
    expect(off.status(), await off.text()).toBe(200);
    expect(await rowOf(created.id)).toMatchObject({ name: label("patch-feliz"), shelter_id: shelterA });
    expect(Number((await rowOf(created.id))?.active)).toBe(0);
    expect((await send(request, "PATCH", `/sheltered/${created.id}/status`, admin, { active: true })).status()).toBe(200);
    expect(Number((await rowOf(created.id))?.active)).toBe(1);
  });

  test("[sheltered.patch.sheltered-id-status#validacao] active ausente ou não booleano: 400 e o status não muda", async ({ request }) => {
    const created = await make(request, "patch-validacao");
    for (const body of [{}, { active: "talvez" }, { active: 5 }]) {
      const res = await send(request, "PATCH", `/sheltered/${created.id}/status`, admin, body);
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
    expect(Number((await rowOf(created.id))?.active)).toBe(1);
  });

  test("[sheltered.patch.sheltered-id-status#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    expect((await send(request, "PATCH", `/sheltered/${BAD_ID}/status`, admin, { active: false })).status()).toBe(404);
  });

  test("[sheltered.patch.sheltered-id-status#conflito-ou-duplicidade] repetir o mesmo status é idempotente: 200 nas duas e uma só linha", async ({ request }) => {
    const created = await make(request, "patch-idempotente");
    for (let i = 0; i < 2; i += 1) {
      const res = await send(request, "PATCH", `/sheltered/${created.id}/status`, admin, { active: false });
      expect(res.status(), await res.text()).toBe(200);
    }
    expect(Number((await rowOf(created.id))?.active)).toBe(0);
    expect(await withTag(label("patch-idempotente"))).toBe(1);
  });

  test("[sheltered.patch.sheltered-id-status#escopo-proprio-x-outro] líder e membro mudam o status só do próprio abrigo; o alheio é 404 e não muda", async ({ request }) => {
    const mine = await make(request, "patch-escopo-meu", shelterA);
    const theirs = await make(request, "patch-escopo-deles", shelterB);
    for (const token of [leader, member.token]) {
      expect((await send(request, "PATCH", `/sheltered/${theirs.id}/status`, token, { active: false })).status()).toBe(404);
    }
    expect(Number((await rowOf(theirs.id))?.active)).toBe(1);
    expect((await send(request, "PATCH", `/sheltered/${mine.id}/status`, leader, { active: false })).status()).toBe(200);
    expect(Number((await rowOf(mine.id))?.active)).toBe(0);
  });

  test("[sheltered.patch.sheltered-id-status#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhum acolhido muda de status", async ({ request }) => {
    const created = await make(request, "patch-colaborador");
    const res = await send(request, "PATCH", "/sheltered/nao-e-uuid/status", admin, { active: false });
    expect(res.status()).toBe(400);
    expect(Number((await rowOf(created.id))?.active)).toBe(1);
  });

  // ---------------------------------------------------------------- DELETE /sheltered/:id

  test("[sheltered.delete.sheltered-id#feliz] admin remove: o acolhido some do banco e o GET passa a 404", async ({ request }) => {
    const created = await make(request, "delete-feliz");
    const res = await send(request, "DELETE", `/sheltered/${created.id}`, admin);
    expect(res.status()).toBe(200);
    expect(await rowOf(created.id)).toBeNull();
    expect((await send(request, "GET", `/sheltered/${created.id}`, admin)).status()).toBe(404);
  });

  test("[sheltered.delete.sheltered-id#nao-encontrado] uuid inexistente: 404 e nada some", async ({ request }) => {
    const before = await snapshot();
    expect((await send(request, "DELETE", `/sheltered/${BAD_ID}`, admin)).status()).toBe(404);
    expect(await snapshot()).toEqual(before);
  });

  test("[sheltered.delete.sheltered-id#escopo-proprio-x-outro] líder e membro não removem acolhido de abrigo alheio (404); o do próprio abrigo eles removem", async ({
    request,
  }) => {
    const theirs = await make(request, "delete-escopo-deles", shelterB);
    for (const token of [leader, member.token]) {
      expect((await send(request, "DELETE", `/sheltered/${theirs.id}`, token)).status()).toBe(404);
    }
    expect(await rowOf(theirs.id)).not.toBeNull();

    const mine = await make(request, "delete-escopo-meu", shelterA);
    expect((await send(request, "DELETE", `/sheltered/${mine.id}`, leader)).status()).toBe(200);
    expect(await rowOf(mine.id)).toBeNull();
  });

  test("[sheltered.delete.sheltered-id#falha-do-colaborador-sem-efeito-parcial] id malformado: 400 e nenhum acolhido some", async ({ request }) => {
    const created = await make(request, "delete-colaborador");
    const before = await snapshot();
    expect((await send(request, "DELETE", "/sheltered/nao-e-uuid", admin)).status()).toBe(400);
    expect(await snapshot()).toEqual(before);
    expect(await rowOf(created.id)).not.toBeNull();
  });
});
