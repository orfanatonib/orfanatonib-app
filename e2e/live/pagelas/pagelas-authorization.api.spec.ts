import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/**
 * Autorização dos handlers de `/pagelas` (plano 19). Leitura em lote é de admin/líder; as
 * demais seguem o ESCOPO do ator (id inexistente ou fora do abrigo dá o mesmo 404). Escrita
 * recusada não altera o banco. Com `pagelas` e `sheltered_area` desligadas ⇒ 403 FEATURE_DISABLED.
 */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["pagelas_management", "sheltered_area"] as const;

test.describe.serial("Pagelas — autorização", () => {
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

  test("[pagela.get.pagelas#perfil-anonimo] GET /pagelas como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas", undefined);
    expect([401]).toContain(res.status());
  });

  test("[pagela.get.pagelas#perfil-membro] GET /pagelas como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas", member);
    expect([403]).toContain(res.status());
  });

  test("[pagela.get.pagelas#perfil-lider] GET /pagelas como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas", leader);
    expect([200]).toContain(res.status());
  });

  test("[pagela.get.pagelas#perfil-admin] GET /pagelas como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas", admin);
    expect([200]).toContain(res.status());
  });

  test("[pagela.get.pagelas-paginated#perfil-anonimo] GET /pagelas/paginated como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas/paginated", undefined);
    expect([401]).toContain(res.status());
  });

  test("[pagela.get.pagelas-paginated#perfil-membro] GET /pagelas/paginated como membro: 403/200", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas/paginated", member);
    expect([403, 200]).toContain(res.status());
  });

  test("[pagela.get.pagelas-paginated#perfil-lider] GET /pagelas/paginated como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas/paginated", leader);
    expect([200]).toContain(res.status());
  });

  test("[pagela.get.pagelas-paginated#perfil-admin] GET /pagelas/paginated como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas/paginated", admin);
    expect([200]).toContain(res.status());
  });

  test("[pagela.get.pagelas-id#perfil-anonimo] GET /pagelas/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[pagela.get.pagelas-id#perfil-membro] GET /pagelas/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[pagela.get.pagelas-id#perfil-lider] GET /pagelas/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[pagela.get.pagelas-id#perfil-admin] GET /pagelas/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/pagelas/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[pagela.post.pagelas#perfil-anonimo] POST /pagelas como visitante: 401", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "POST", "/pagelas", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.post.pagelas#perfil-membro] POST /pagelas como membro: 400", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "POST", "/pagelas", member);
    expect([400]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.post.pagelas#perfil-lider] POST /pagelas como líder: 400", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "POST", "/pagelas", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.post.pagelas#perfil-admin] POST /pagelas como admin: 400", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "POST", "/pagelas", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.patch.pagelas-id#perfil-anonimo] PATCH /pagelas/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "PATCH", "/pagelas/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.patch.pagelas-id#perfil-membro] PATCH /pagelas/:id como membro: 404", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "PATCH", "/pagelas/{BAD}", member);
    expect([404]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.patch.pagelas-id#perfil-lider] PATCH /pagelas/:id como líder: 404", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "PATCH", "/pagelas/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.patch.pagelas-id#perfil-admin] PATCH /pagelas/:id como admin: 404", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "PATCH", "/pagelas/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.delete.pagelas-id#perfil-anonimo] DELETE /pagelas/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "DELETE", "/pagelas/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.delete.pagelas-id#perfil-membro] DELETE /pagelas/:id como membro: 404", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "DELETE", "/pagelas/{BAD}", member);
    expect([404]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.delete.pagelas-id#perfil-lider] DELETE /pagelas/:id como líder: 404", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "DELETE", "/pagelas/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.delete.pagelas-id#perfil-admin] DELETE /pagelas/:id como admin: 404", async ({ request }) => {
    const before = await countRows("pagelas");
    const res = await send(request, "DELETE", "/pagelas/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("pagelas")).toBe(before);
  });

  test("[pagela.get.pagelas#flag-desligada] GET /pagelas com as flags de pagela desligadas: 403 FEATURE_DISABLED e nenhuma pagela muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("pagelas");
    const res = await send(request, "GET", "/pagelas", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("pagelas")).toBe(before);
    await setFlags(request, true);
  });

  test("[pagela.post.pagelas#flag-desligada] POST /pagelas com as flags de pagela desligadas: 403 FEATURE_DISABLED e nenhuma pagela muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("pagelas");
    const res = await send(request, "POST", "/pagelas", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("pagelas")).toBe(before);
    await setFlags(request, true);
  });

  test("[pagela.patch.pagelas-id#flag-desligada] PATCH /pagelas/:id com as flags de pagela desligadas: 403 FEATURE_DISABLED e nenhuma pagela muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("pagelas");
    const res = await send(request, "PATCH", "/pagelas/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("pagelas")).toBe(before);
    await setFlags(request, true);
  });

  test("[pagela.delete.pagelas-id#flag-desligada] DELETE /pagelas/:id com as flags de pagela desligadas: 403 FEATURE_DISABLED e nenhuma pagela muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("pagelas");
    const res = await send(request, "DELETE", "/pagelas/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("pagelas")).toBe(before);
    await setFlags(request, true);
  });
});
