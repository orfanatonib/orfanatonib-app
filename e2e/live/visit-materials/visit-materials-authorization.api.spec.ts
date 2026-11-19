import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/visit-material-pages` (plano 35): sessão obrigatória (visitante 401 em todos); qualquer perfil lê; escrita e troca do material da semana só admin (membro/líder 403); escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["visit_materials", "page_management"] as const;

test.describe.serial("Materiais de visita — autorização", () => {
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

  test("[visit-material.get.visit-material-pages#perfil-anonimo] GET /visit-material-pages como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages", undefined);
    expect([401]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages#perfil-membro] GET /visit-material-pages como membro: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages", member);
    expect([200]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages#perfil-lider] GET /visit-material-pages como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages", leader);
    expect([200]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages#perfil-admin] GET /visit-material-pages como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages", admin);
    expect([200]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages-current-material#perfil-anonimo] GET /visit-material-pages/current-material como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages/current-material", undefined);
    expect([401]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages-current-material#perfil-membro] GET /visit-material-pages/current-material como membro: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages/current-material", member);
    expect([200]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages-current-material#perfil-lider] GET /visit-material-pages/current-material como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages/current-material", leader);
    expect([200]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages-current-material#perfil-admin] GET /visit-material-pages/current-material como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages/current-material", admin);
    expect([200]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages-id#perfil-anonimo] GET /visit-material-pages/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages-id#perfil-membro] GET /visit-material-pages/:id como membro: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages-id#perfil-lider] GET /visit-material-pages/:id como líder: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[visit-material.get.visit-material-pages-id#perfil-admin] GET /visit-material-pages/:id como admin: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/visit-material-pages/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[visit-material.post.visit-material-pages#perfil-anonimo] POST /visit-material-pages como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.post.visit-material-pages#perfil-membro] POST /visit-material-pages como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages", member);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.post.visit-material-pages#perfil-lider] POST /visit-material-pages como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.post.visit-material-pages#perfil-admin] POST /visit-material-pages como admin: 400", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.patch.visit-material-pages-id#perfil-anonimo] PATCH /visit-material-pages/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "PATCH", "/visit-material-pages/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.patch.visit-material-pages-id#perfil-membro] PATCH /visit-material-pages/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "PATCH", "/visit-material-pages/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.patch.visit-material-pages-id#perfil-lider] PATCH /visit-material-pages/:id como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "PATCH", "/visit-material-pages/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.patch.visit-material-pages-id#perfil-admin] PATCH /visit-material-pages/:id como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "PATCH", "/visit-material-pages/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.delete.visit-material-pages-id#perfil-anonimo] DELETE /visit-material-pages/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "DELETE", "/visit-material-pages/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.delete.visit-material-pages-id#perfil-membro] DELETE /visit-material-pages/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "DELETE", "/visit-material-pages/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.delete.visit-material-pages-id#perfil-lider] DELETE /visit-material-pages/:id como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "DELETE", "/visit-material-pages/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.delete.visit-material-pages-id#perfil-admin] DELETE /visit-material-pages/:id como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "DELETE", "/visit-material-pages/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.post.visit-material-pages-current-material-id#perfil-anonimo] POST /visit-material-pages/current-material/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages/current-material/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.post.visit-material-pages-current-material-id#perfil-membro] POST /visit-material-pages/current-material/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages/current-material/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.post.visit-material-pages-current-material-id#perfil-lider] POST /visit-material-pages/current-material/:id como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages/current-material/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.post.visit-material-pages-current-material-id#perfil-admin] POST /visit-material-pages/current-material/:id como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages/current-material/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("visit_material_pages")).toBe(before);
  });

  test("[visit-material.get.visit-material-pages#flag-desligada] GET /visit-material-pages com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_material_pages");
    const res = await send(request, "GET", "/visit-material-pages", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_material_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[visit-material.post.visit-material-pages#flag-desligada] POST /visit-material-pages com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_material_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[visit-material.patch.visit-material-pages-id#flag-desligada] PATCH /visit-material-pages/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_material_pages");
    const res = await send(request, "PATCH", "/visit-material-pages/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_material_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[visit-material.delete.visit-material-pages-id#flag-desligada] DELETE /visit-material-pages/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_material_pages");
    const res = await send(request, "DELETE", "/visit-material-pages/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_material_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[visit-material.post.visit-material-pages-current-material-id#flag-desligada] POST /visit-material-pages/current-material/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("visit_material_pages");
    const res = await send(request, "POST", "/visit-material-pages/current-material/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("visit_material_pages")).toBe(before);
    await setFlags(request, true);
  });
});
