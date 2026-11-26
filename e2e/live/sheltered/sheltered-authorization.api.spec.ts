import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Autorização dos handlers de `/sheltered` (plano 17). O acesso é por ESCOPO (equipe/abrigo do
 * ator), não por papel: com id inexistente todo perfil autenticado recebe o mesmo 404/400 e
 * visitante recebe 401. Requisição recusada ou inválida não altera o banco. Com as duas flags
 * (`sheltered_area` e `sheltered_management`) desligadas, 403 FEATURE_DISABLED e banco intacto.
 */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["sheltered_area", "sheltered_management"] as const;

test.describe.serial("Acolhidos — autorização", () => {
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

  test("[sheltered.get.sheltered#perfil-anonimo] GET /sheltered como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered", undefined);
    expect([401]).toContain(res.status());
  });

  test("[sheltered.get.sheltered#perfil-membro] GET /sheltered como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered", member);
    expect([200]).toContain(res.status());
  });

  test("[sheltered.get.sheltered#perfil-lider] GET /sheltered como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered", leader);
    expect([200]).toContain(res.status());
  });

  test("[sheltered.get.sheltered#perfil-admin] GET /sheltered como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered", admin);
    expect([200]).toContain(res.status());
  });

  test("[sheltered.get.sheltered-simple#perfil-anonimo] GET /sheltered/simple como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered/simple", undefined);
    expect([401]).toContain(res.status());
  });

  test("[sheltered.get.sheltered-simple#perfil-membro] GET /sheltered/simple como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered/simple", member);
    expect([200]).toContain(res.status());
  });

  test("[sheltered.get.sheltered-simple#perfil-lider] GET /sheltered/simple como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered/simple", leader);
    expect([200]).toContain(res.status());
  });

  test("[sheltered.get.sheltered-simple#perfil-admin] GET /sheltered/simple como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered/simple", admin);
    expect([200]).toContain(res.status());
  });

  test("[sheltered.get.sheltered-id#perfil-anonimo] GET /sheltered/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[sheltered.get.sheltered-id#perfil-membro] GET /sheltered/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[sheltered.get.sheltered-id#perfil-lider] GET /sheltered/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[sheltered.get.sheltered-id#perfil-admin] GET /sheltered/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/sheltered/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[sheltered.post.sheltered#perfil-anonimo] POST /sheltered como visitante: 401", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "POST", "/sheltered", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.post.sheltered#perfil-membro] POST /sheltered como membro: 400", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "POST", "/sheltered", member);
    expect([400]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.post.sheltered#perfil-lider] POST /sheltered como líder: 400", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "POST", "/sheltered", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.post.sheltered#perfil-admin] POST /sheltered como admin: 400", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "POST", "/sheltered", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.put.sheltered-id#perfil-anonimo] PUT /sheltered/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "PUT", "/sheltered/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.put.sheltered-id#perfil-membro] PUT /sheltered/:id como membro: 404", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "PUT", "/sheltered/{BAD}", member);
    expect([404]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.put.sheltered-id#perfil-lider] PUT /sheltered/:id como líder: 404", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "PUT", "/sheltered/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.put.sheltered-id#perfil-admin] PUT /sheltered/:id como admin: 404", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "PUT", "/sheltered/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.patch.sheltered-id-status#perfil-anonimo] PATCH /sheltered/:id/status como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "PATCH", "/sheltered/{BAD}/status", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.patch.sheltered-id-status#perfil-membro] PATCH /sheltered/:id/status como membro: 400", async ({
    request,
  }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "PATCH", "/sheltered/{BAD}/status", member);
    expect([400]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.patch.sheltered-id-status#perfil-lider] PATCH /sheltered/:id/status como líder: 400", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "PATCH", "/sheltered/{BAD}/status", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.patch.sheltered-id-status#perfil-admin] PATCH /sheltered/:id/status como admin: 400", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "PATCH", "/sheltered/{BAD}/status", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.delete.sheltered-id#perfil-anonimo] DELETE /sheltered/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "DELETE", "/sheltered/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.delete.sheltered-id#perfil-membro] DELETE /sheltered/:id como membro: 404", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "DELETE", "/sheltered/{BAD}", member);
    expect([404]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.delete.sheltered-id#perfil-lider] DELETE /sheltered/:id como líder: 404", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "DELETE", "/sheltered/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.delete.sheltered-id#perfil-admin] DELETE /sheltered/:id como admin: 404", async ({ request }) => {
    const before = await countRows("sheltered");
    const res = await send(request, "DELETE", "/sheltered/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("sheltered")).toBe(before);
  });

  test("[sheltered.get.sheltered#flag-desligada] GET /sheltered com as flags de acolhidos desligadas: 403 FEATURE_DISABLED e nenhum acolhido muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("sheltered");
    const res = await send(request, "GET", "/sheltered", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("sheltered")).toBe(before);
    await setFlags(request, true);
  });

  test("[sheltered.post.sheltered#flag-desligada] POST /sheltered com as flags de acolhidos desligadas: 403 FEATURE_DISABLED e nenhum acolhido muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("sheltered");
    const res = await send(request, "POST", "/sheltered", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("sheltered")).toBe(before);
    await setFlags(request, true);
  });

  test("[sheltered.put.sheltered-id#flag-desligada] PUT /sheltered/:id com as flags de acolhidos desligadas: 403 FEATURE_DISABLED e nenhum acolhido muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("sheltered");
    const res = await send(request, "PUT", "/sheltered/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("sheltered")).toBe(before);
    await setFlags(request, true);
  });

  test("[sheltered.patch.sheltered-id-status#flag-desligada] PATCH /sheltered/:id/status com as flags de acolhidos desligadas: 403 FEATURE_DISABLED e nenhum acolhido muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("sheltered");
    const res = await send(request, "PATCH", "/sheltered/{BAD}/status", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("sheltered")).toBe(before);
    await setFlags(request, true);
  });

  test("[sheltered.delete.sheltered-id#flag-desligada] DELETE /sheltered/:id com as flags de acolhidos desligadas: 403 FEATURE_DISABLED e nenhum acolhido muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("sheltered");
    const res = await send(request, "DELETE", "/sheltered/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("sheltered")).toBe(before);
    await setFlags(request, true);
  });
});
