import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import {
  BAD_ID,
  OVERSIZED_CITY,
  createShelter,
  createShelterRaw,
  deleteShelterApi,
  get,
  label,
  mediaCount,
  patchMediaRaw,
  putShelterRaw,
  routesCount,
  shelterRow,
  sheltersWithTag,
  snapshotDb,
  teamsCount,
  type ShelterBody,
} from "./support";

/**
 * Cenários de `/shelters` por handler (plano 13 §7.3): feliz, escopo, não encontrado,
 * validação, conflito, rollback e flag desligada. Cada cenário cria os próprios dados
 * pela API (prefixo RUN_TAG), prova o efeito por SELECT e o `afterAll` confere 0 sobras.
 * Os cenários de S3 estão em `shelters.s3.api.spec.ts`.
 */
const DIRECTORY_FLAGS = [
  "shelter_management",
  "sheltered_management",
  "sheltered_area",
  "pagelas",
  "attendance",
  "shelter_schedule",
  "visit_reports",
  "member_management",
  "leader_management",
  "user_management",
  "criminal_records",
  "shelter_feed",
  "shelter_photo_upload",
  "photo_moderation",
] as const;

test.describe.serial("Abrigos — cenários por handler", () => {
  let admin: string;
  let leader: string;
  let member: string;
  const created: string[] = [];

  const make = async (
    request: APIRequestContext,
    name: string,
    options: { teamsQuantity?: number } = {},
  ): Promise<ShelterBody> => {
    const shelter = await createShelter(request, admin, { name: label(name), teamsQuantity: options.teamsQuantity ?? 2 });
    created.push(shelter.id);
    return shelter;
  };

  const flagEnabled = async (key: string): Promise<boolean> =>
    ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;

  const withFlagsOff = async (
    request: APIRequestContext,
    keys: readonly string[],
    work: () => Promise<void>,
  ): Promise<void> => {
    const initial = new Map<string, boolean>();
    for (const key of keys) initial.set(key, await flagEnabled(key));
    try {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(admin), data: { enabled: false } });
      }
      await work();
    } finally {
      for (const key of keys) {
        await request.patch(`${API_URL}/feature-flags/${key}`, {
          headers: authHeaders(admin),
          data: { enabled: initial.get(key) ?? true },
        });
      }
    }
  };

  const expectFeatureDisabled = async (response: Awaited<ReturnType<typeof get>>): Promise<void> => {
    expect(response.status()).toBe(403);
    expect(JSON.stringify(await response.json())).toContain("FEATURE_DISABLED");
  };

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    member = (await loginAs(request, "member")).accessToken;
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) await deleteShelterApi(request, admin, id);
    expect(await sheltersWithTag(RUN_TAG), "a limpeza deixou abrigos do E2E").toBe(0);
    await closeDb();
  });

  // ---------------------------------------------------------------- POST /shelters

  test("[shelter.post.shelters#feliz] admin cria o abrigo: linha, equipes, rota e endereço batem com o banco", async ({ request }) => {
    const shelter = await make(request, "post-feliz", { teamsQuantity: 3 });
    expect(await shelterRow(shelter.id)).toMatchObject({ name: label("post-feliz"), teamsQuantity: 3 });
    expect(await teamsCount(shelter.id)).toBe(3);
    expect(await routesCount(shelter.id)).toBe(1);
    expect(shelter.address?.city).toBe("Manaus");
  });

  test("[shelter.post.shelters#validacao] payload sem campos válidos: 400 e nada gravado", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.post(`${API_URL}/shelters`, {
      headers: authHeaders(admin),
      multipart: { shelterData: JSON.stringify({ name: "x", teamsQuantity: 0 }) },
    });
    expect(res.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[shelter.post.shelters#conflito-ou-duplicidade] mesmo nome duas vezes: dois abrigos com rotas distintas", async ({ request }) => {
    const first = await make(request, "post-duplicado");
    const second = await make(request, "post-duplicado");
    expect(second.id).not.toBe(first.id);
    const routes = await queryOne<{ n: number }>(
      "SELECT COUNT(DISTINCT path) AS n FROM routes WHERE entityType = 'shelterPage' AND entityId IN (?, ?)",
      [first.id, second.id],
    );
    expect(Number(routes?.n)).toBe(2);
  });

  test("[shelter.post.shelters#escopo-proprio-x-outro] líder e membro não criam abrigo: 403 e banco inalterado", async ({ request }) => {
    const before = await snapshotDb();
    for (const token of [leader, member]) {
      const res = await createShelterRaw(request, token, { name: label("post-escopo") });
      expect(res.status()).toBe(403);
    }
    expect(await snapshotDb()).toEqual(before);
  });

  test("[shelter.post.shelters#rollback-de-transacao] [shelter.post.shelters#falha-do-colaborador-sem-efeito-parcial] falha real no banco (cidade acima de 255): nenhum abrigo, endereço, equipe, rota ou mídia", async ({
    request,
  }) => {
    const before = await snapshotDb();
    const res = await createShelterRaw(request, admin, {
      name: label("post-rollback"),
      teamsQuantity: 3,
      city: OVERSIZED_CITY,
      linkUrl: "https://example.com/rollback.png",
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await sheltersWithTag(label("post-rollback"))).toBe(0);
    expect(await snapshotDb()).toEqual(before);
  });

  // ---------------------------------------------------------------- GET (leituras)

  test("[shelter.get.shelters#feliz] [shelter.get.shelters-simple#feliz] [shelter.get.shelters-list#feliz] admin lista e a lista traz o abrigo criado", async ({
    request,
  }) => {
    const shelter = await make(request, "get-lista");
    const page = await get(request, admin, "/shelters?page=1&limit=100&searchString=" + encodeURIComponent(label("get-lista")));
    expect(page.status()).toBe(200);
    const body = (await page.json()) as { items: ShelterBody[]; total: number };
    expect(body.items.map((item) => item.id)).toContain(shelter.id);

    const simple = await get(request, admin, "/shelters/simple");
    expect(simple.status()).toBe(200);
    expect(((await simple.json()) as Array<{ id: string }>).map((item) => item.id)).toContain(shelter.id);

    const list = await get(request, admin, "/shelters/list");
    expect(list.status()).toBe(200);
    expect(((await list.json()) as Array<{ id: string }>).map((item) => item.id)).toContain(shelter.id);
  });

  test("[shelter.get.shelters-id#feliz] [shelter.get.shelters-id-teams-quantity#feliz] detalhe e quantidade de equipes batem com o banco", async ({
    request,
  }) => {
    const shelter = await make(request, "get-detalhe", { teamsQuantity: 2 });
    const one = await get(request, admin, `/shelters/${shelter.id}`);
    expect(one.status()).toBe(200);
    expect(((await one.json()) as ShelterBody).name).toBe((await shelterRow(shelter.id))?.name);

    const quantity = await get(request, admin, `/shelters/${shelter.id}/teams-quantity`);
    expect(quantity.status()).toBe(200);
    expect(await quantity.json()).toEqual({ id: shelter.id, teamsQuantity: await teamsCount(shelter.id) });
  });

  test("[shelter.get.shelters-list-teams#feliz] lista pública de equipes traz o abrigo criado, sem sessão", async ({ request }) => {
    const shelter = await make(request, "get-list-teams");
    const res = await get(request, undefined, "/shelters/list-teams");
    expect(res.status()).toBe(200);
    const text = JSON.stringify(await res.json());
    expect(text).toContain(shelter.id);
  });

  test("[shelter.get.shelters#escopo-proprio-x-outro] [shelter.get.shelters-simple#escopo-proprio-x-outro] [shelter.get.shelters-list#escopo-proprio-x-outro] líder não enxerga abrigo que não lidera", async ({
    request,
  }) => {
    const other = await make(request, "get-escopo");
    const page = await get(request, leader, "/shelters?page=1&limit=100");
    expect(page.status()).toBe(200);
    expect(((await page.json()) as { items: ShelterBody[] }).items.map((item) => item.id)).not.toContain(other.id);

    const simple = await get(request, leader, "/shelters/simple");
    expect(((await simple.json()) as Array<{ id: string }>).map((item) => item.id)).not.toContain(other.id);

    const list = await get(request, leader, "/shelters/list");
    expect(((await list.json()) as Array<{ id: string }>).map((item) => item.id)).not.toContain(other.id);
  });

  test("[shelter.get.shelters-id#escopo-proprio-x-outro] [shelter.get.shelters-id-teams-quantity#escopo-proprio-x-outro] líder pedindo abrigo alheio: 404 (nunca revela que existe)", async ({
    request,
  }) => {
    const other = await make(request, "get-escopo-id");
    for (const path of [`/shelters/${other.id}`, `/shelters/${other.id}/teams-quantity`]) {
      const res = await get(request, leader, path);
      expect(res.status()).toBe(404);
    }
  });

  test("[shelter.get.shelters-list-teams#escopo-proprio-x-outro] a lista pública é a mesma para visitante e admin", async ({ request }) => {
    const anonymous = JSON.stringify(await (await get(request, undefined, "/shelters/list-teams")).json());
    const asAdmin = JSON.stringify(await (await get(request, admin, "/shelters/list-teams")).json());
    expect(asAdmin).toBe(anonymous);
  });

  test("[shelter.get.shelters-id#nao-encontrado] [shelter.get.shelters-id-teams-quantity#nao-encontrado] uuid inexistente: 404", async ({
    request,
  }) => {
    expect((await get(request, admin, `/shelters/${BAD_ID}`)).status()).toBe(404);
    expect((await get(request, admin, `/shelters/${BAD_ID}/teams-quantity`)).status()).toBe(404);
  });

  test("[shelter.get.shelters#flag-desligada] [shelter.get.shelters-simple#flag-desligada] [shelter.get.shelters-list#flag-desligada] [shelter.get.shelters-id#flag-desligada] [shelter.get.shelters-id-teams-quantity#flag-desligada] com todas as flags do diretório desligadas: 403 FEATURE_DISABLED", async ({
    request,
  }) => {
    const shelter = await make(request, "get-flag");
    await withFlagsOff(request, DIRECTORY_FLAGS, async () => {
      for (const path of ["/shelters", "/shelters/simple", "/shelters/list", `/shelters/${shelter.id}`, `/shelters/${shelter.id}/teams-quantity`]) {
        await expectFeatureDisabled(await get(request, admin, path));
      }
    });
    expect((await get(request, admin, "/shelters/simple")).status()).toBe(200);
  });

  test("[shelter.get.shelters-list-teams#flag-desligada] com public_registration desligada: 403 FEATURE_DISABLED", async ({ request }) => {
    await withFlagsOff(request, ["public_registration"], async () => {
      await expectFeatureDisabled(await get(request, undefined, "/shelters/list-teams"));
    });
    expect((await get(request, undefined, "/shelters/list-teams")).status()).toBe(200);
  });

  // ---------------------------------------------------------------- PUT /shelters/:id

  test("[shelter.put.shelters-id#feliz] admin renomeia e reconcilia as equipes: o banco reflete", async ({ request }) => {
    const shelter = await make(request, "put-feliz", { teamsQuantity: 2 });
    const res = await putShelterRaw(request, admin, shelter.id, { name: label("put-feliz-novo"), teamsQuantity: 3 });
    expect(res.status(), await res.text()).toBe(200);
    expect(await shelterRow(shelter.id)).toMatchObject({ name: label("put-feliz-novo"), teamsQuantity: 3 });
    expect(await teamsCount(shelter.id)).toBe(3);
  });

  test("[shelter.put.shelters-id#validacao] quantidade de equipes inválida: 400 e abrigo intacto", async ({ request }) => {
    const shelter = await make(request, "put-validacao", { teamsQuantity: 2 });
    const res = await putShelterRaw(request, admin, shelter.id, { teamsQuantity: 0 });
    expect(res.status()).toBe(400);
    expect(await shelterRow(shelter.id)).toMatchObject({ name: label("put-validacao"), teamsQuantity: 2 });
    expect(await teamsCount(shelter.id)).toBe(2);
  });

  test("[shelter.put.shelters-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    const res = await putShelterRaw(request, admin, BAD_ID, { name: label("put-fantasma"), teamsQuantity: 1 });
    expect(res.status()).toBe(404);
    expect(await sheltersWithTag(label("put-fantasma"))).toBe(0);
  });

  test("[shelter.put.shelters-id#conflito-ou-duplicidade] renomear para o nome de outro abrigo: ambos existem e as rotas seguem distintas", async ({
    request,
  }) => {
    const first = await make(request, "put-conflito-a");
    const second = await make(request, "put-conflito-b");
    const res = await putShelterRaw(request, admin, second.id, { name: label("put-conflito-a"), teamsQuantity: 2 });
    expect(res.status(), await res.text()).toBe(200);
    expect((await shelterRow(first.id))?.name).toBe(label("put-conflito-a"));
    expect((await shelterRow(second.id))?.name).toBe(label("put-conflito-a"));
    const routes = await queryOne<{ n: number }>(
      "SELECT COUNT(DISTINCT path) AS n FROM routes WHERE entityType = 'shelterPage' AND entityId IN (?, ?)",
      [first.id, second.id],
    );
    expect(Number(routes?.n)).toBe(2);
  });

  test("[shelter.put.shelters-id#escopo-proprio-x-outro] líder e membro não alteram abrigo alheio: recusa e banco inalterado", async ({
    request,
  }) => {
    const shelter = await make(request, "put-escopo");
    for (const token of [leader, member]) {
      const res = await putShelterRaw(request, token, shelter.id, { name: label("put-invadido"), teamsQuantity: 2 });
      expect([403, 404]).toContain(res.status());
    }
    expect((await shelterRow(shelter.id))?.name).toBe(label("put-escopo"));
  });

  test("[shelter.put.shelters-id#rollback-de-transacao] [shelter.put.shelters-id#falha-do-colaborador-sem-efeito-parcial] falha real no banco: nome, equipes e endereço continuam como estavam", async ({
    request,
  }) => {
    const shelter = await make(request, "put-rollback", { teamsQuantity: 2 });
    const res = await putShelterRaw(request, admin, shelter.id, {
      name: label("put-rollback-novo"),
      teamsQuantity: 4,
      address: { city: OVERSIZED_CITY, state: "AM" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await shelterRow(shelter.id)).toMatchObject({ name: label("put-rollback"), teamsQuantity: 2 });
    expect(await teamsCount(shelter.id)).toBe(2);
    expect(await sheltersWithTag(label("put-rollback-novo"))).toBe(0);
  });

  // ---------------------------------------------------------------- PATCH /shelters/:id/media

  test("[shelter.patch.shelters-id-media#feliz] troca a foto por um link: a linha de mídia reflete", async ({ request }) => {
    const shelter = await make(request, "patch-feliz");
    const res = await patchMediaRaw(request, admin, shelter.id, { url: "https://cdn.exemplo/feliz.png" });
    expect(res.status(), await res.text()).toBe(200);
    expect(await mediaCount(shelter.id)).toBe(1);
    const row = await queryOne<{ url: string }>("SELECT url FROM media_items WHERE targetType = 'ShelterEntity' AND targetId = ?", [shelter.id]);
    expect(row?.url).toBe("https://cdn.exemplo/feliz.png");
  });

  test("[shelter.patch.shelters-id-media#validacao] sem nenhuma mídia: 400 e a foto atual permanece", async ({ request }) => {
    const shelter = await make(request, "patch-validacao");
    await patchMediaRaw(request, admin, shelter.id, { url: "https://cdn.exemplo/antes.png" });
    const res = await patchMediaRaw(request, admin, shelter.id, null);
    expect(res.status()).toBe(400);
    const row = await queryOne<{ url: string }>("SELECT url FROM media_items WHERE targetType = 'ShelterEntity' AND targetId = ?", [shelter.id]);
    expect(row?.url).toBe("https://cdn.exemplo/antes.png");
  });

  test("[shelter.patch.shelters-id-media#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    const res = await patchMediaRaw(request, admin, BAD_ID, { url: "https://cdn.exemplo/fantasma.png" });
    expect(res.status()).toBe(404);
    expect(await mediaCount(BAD_ID)).toBe(0);
  });

  test("[shelter.patch.shelters-id-media#conflito-ou-duplicidade] duas trocas seguidas deixam uma única mídia (a mais recente)", async ({
    request,
  }) => {
    const shelter = await make(request, "patch-conflito");
    await patchMediaRaw(request, admin, shelter.id, { url: "https://cdn.exemplo/um.png" });
    await patchMediaRaw(request, admin, shelter.id, { url: "https://cdn.exemplo/dois.png" });
    expect(await mediaCount(shelter.id)).toBe(1);
    const row = await queryOne<{ url: string }>("SELECT url FROM media_items WHERE targetType = 'ShelterEntity' AND targetId = ?", [shelter.id]);
    expect(row?.url).toBe("https://cdn.exemplo/dois.png");
  });

  test("[shelter.patch.shelters-id-media#escopo-proprio-x-outro] líder e membro não trocam a foto de abrigo alheio", async ({ request }) => {
    const shelter = await make(request, "patch-escopo");
    for (const token of [leader, member]) {
      const res = await patchMediaRaw(request, token, shelter.id, { url: "https://cdn.exemplo/invasor.png" });
      expect([403, 404]).toContain(res.status());
    }
    expect(await mediaCount(shelter.id)).toBe(0);
  });

  test("[shelter.patch.shelters-id-media#rollback-de-transacao] [shelter.patch.shelters-id-media#falha-do-colaborador-sem-efeito-parcial] mídia inválida: 4xx e a foto anterior permanece", async ({
    request,
  }) => {
    const shelter = await make(request, "patch-rollback");
    await patchMediaRaw(request, admin, shelter.id, { url: "https://cdn.exemplo/ficar.png" });
    const res = await request.patch(`${API_URL}/shelters/${shelter.id}/media`, {
      headers: authHeaders(admin),
      multipart: { mediaData: JSON.stringify({ title: "x", uploadType: "upload", isLocalFile: true, fieldKey: "inexistente" }) },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await mediaCount(shelter.id)).toBe(1);
    const row = await queryOne<{ url: string }>("SELECT url FROM media_items WHERE targetType = 'ShelterEntity' AND targetId = ?", [shelter.id]);
    expect(row?.url).toBe("https://cdn.exemplo/ficar.png");
  });

  // ---------------------------------------------------------------- DELETE /shelters/:id

  test("[shelter.delete.shelters-id#feliz] admin remove: abrigo, equipes, rota e mídia somem do banco", async ({ request }) => {
    const shelter = await make(request, "delete-feliz", { teamsQuantity: 2 });
    await patchMediaRaw(request, admin, shelter.id, { url: "https://cdn.exemplo/apagar.png" });
    const res = await request.delete(`${API_URL}/shelters/${shelter.id}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(200);
    expect(await shelterRow(shelter.id)).toBeNull();
    expect(await teamsCount(shelter.id)).toBe(0);
    expect(await routesCount(shelter.id)).toBe(0);
    expect(await mediaCount(shelter.id)).toBe(0);
  });

  test("[shelter.delete.shelters-id#nao-encontrado] uuid inexistente: 404", async ({ request }) => {
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/shelters/${BAD_ID}`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(404);
    expect(await snapshotDb()).toEqual(before);
  });

  test("[shelter.delete.shelters-id#escopo-proprio-x-outro] líder e membro não removem abrigo alheio: recusa e abrigo intacto", async ({
    request,
  }) => {
    const shelter = await make(request, "delete-escopo");
    for (const token of [leader, member]) {
      const res = await request.delete(`${API_URL}/shelters/${shelter.id}`, { headers: authHeaders(token) });
      expect([403, 404]).toContain(res.status());
    }
    expect(await shelterRow(shelter.id)).not.toBeNull();
    expect(await teamsCount(shelter.id)).toBe(2);
  });

  test("[shelter.delete.shelters-id#rollback-de-transacao] [shelter.delete.shelters-id#falha-do-colaborador-sem-efeito-parcial] remoção recusada (id malformado) não altera nada", async ({
    request,
  }) => {
    const shelter = await make(request, "delete-rollback");
    const before = await snapshotDb();
    const res = await request.delete(`${API_URL}/shelters/nao-e-uuid`, { headers: authHeaders(admin) });
    expect(res.status()).toBe(400);
    expect(await snapshotDb()).toEqual(before);
    expect(await shelterRow(shelter.id)).not.toBeNull();
  });
});
