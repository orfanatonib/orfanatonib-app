import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/integrations` (plano 25): sessão obrigatória e só admin/líder (membro 403, em TODOS os handlers); escrita inválida ou recusada não grava; flag desligada ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["ministry_fair_integration"] as const;

test.describe.serial("Integração — autorização", () => {
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

  test("[integration.get.integrations#perfil-anonimo] GET /integrations como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/integrations", undefined);
    expect([401]).toContain(res.status());
  });

  test("[integration.get.integrations#perfil-membro] GET /integrations como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/integrations", member);
    expect([403]).toContain(res.status());
  });

  test("[integration.get.integrations#perfil-lider] GET /integrations como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/integrations", leader);
    expect([200]).toContain(res.status());
  });

  test("[integration.get.integrations#perfil-admin] GET /integrations como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/integrations", admin);
    expect([200]).toContain(res.status());
  });

  test("[integration.get.integrations-simple#perfil-anonimo] GET /integrations/simple como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/integrations/simple", undefined);
    expect([401]).toContain(res.status());
  });

  test("[integration.get.integrations-simple#perfil-membro] GET /integrations/simple como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/integrations/simple", member);
    expect([403]).toContain(res.status());
  });

  test("[integration.get.integrations-simple#perfil-lider] GET /integrations/simple como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/integrations/simple", leader);
    expect([200]).toContain(res.status());
  });

  test("[integration.get.integrations-simple#perfil-admin] GET /integrations/simple como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/integrations/simple", admin);
    expect([200]).toContain(res.status());
  });

  test("[integration.get.integrations-id#perfil-anonimo] GET /integrations/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/integrations/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[integration.get.integrations-id#perfil-membro] GET /integrations/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/integrations/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[integration.get.integrations-id#perfil-lider] GET /integrations/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/integrations/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[integration.get.integrations-id#perfil-admin] GET /integrations/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/integrations/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[integration.post.integrations#perfil-anonimo] POST /integrations como visitante: 401", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "POST", "/integrations", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.post.integrations#perfil-membro] POST /integrations como membro: 403", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "POST", "/integrations", member);
    expect([403]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.post.integrations#perfil-lider] POST /integrations como líder: 400", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "POST", "/integrations", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.post.integrations#perfil-admin] POST /integrations como admin: 400", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "POST", "/integrations", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.put.integrations-id#perfil-anonimo] PUT /integrations/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "PUT", "/integrations/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.put.integrations-id#perfil-membro] PUT /integrations/:id como membro: 403", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "PUT", "/integrations/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.put.integrations-id#perfil-lider] PUT /integrations/:id como líder: 400/404", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "PUT", "/integrations/{BAD}", leader);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.put.integrations-id#perfil-admin] PUT /integrations/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "PUT", "/integrations/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.delete.integrations-id#perfil-anonimo] DELETE /integrations/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("integrations");
    const res = await send(request, "DELETE", "/integrations/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.delete.integrations-id#perfil-membro] DELETE /integrations/:id como membro: 403", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "DELETE", "/integrations/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.delete.integrations-id#perfil-lider] DELETE /integrations/:id como líder: 404", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "DELETE", "/integrations/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.delete.integrations-id#perfil-admin] DELETE /integrations/:id como admin: 404", async ({ request }) => {
    const before = await countRows("integrations");
    const res = await send(request, "DELETE", "/integrations/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("integrations")).toBe(before);
  });

  test("[integration.get.integrations#flag-desligada] GET /integrations com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("integrations");
    const res = await send(request, "GET", "/integrations", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("integrations")).toBe(before);
    await setFlags(request, true);
  });

  test("[integration.post.integrations#flag-desligada] POST /integrations com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("integrations");
    const res = await send(request, "POST", "/integrations", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("integrations")).toBe(before);
    await setFlags(request, true);
  });

  test("[integration.put.integrations-id#flag-desligada] PUT /integrations/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("integrations");
    const res = await send(request, "PUT", "/integrations/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("integrations")).toBe(before);
    await setFlags(request, true);
  });

  test("[integration.delete.integrations-id#flag-desligada] DELETE /integrations/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("integrations");
    const res = await send(request, "DELETE", "/integrations/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("integrations")).toBe(before);
    await setFlags(request, true);
  });
});
