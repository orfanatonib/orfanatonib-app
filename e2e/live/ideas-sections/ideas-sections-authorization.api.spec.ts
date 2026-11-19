import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/ideas-sections` (plano 30): sessão obrigatória; qualquer autenticado ENVIA ideia (POST), mas fila, detalhe, edição, anexo e exclusão são só admin; escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["idea_submission", "idea_moderation"] as const;

test.describe.serial("Seções de ideias — autorização", () => {
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

  test("[ideas-section.get.ideas-sections#perfil-anonimo] GET /ideas-sections como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-sections", undefined);
    expect([401]).toContain(res.status());
  });

  test("[ideas-section.get.ideas-sections#perfil-membro] GET /ideas-sections como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-sections", member);
    expect([403]).toContain(res.status());
  });

  test("[ideas-section.get.ideas-sections#perfil-lider] GET /ideas-sections como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-sections", leader);
    expect([403]).toContain(res.status());
  });

  test("[ideas-section.get.ideas-sections#perfil-admin] GET /ideas-sections como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-sections", admin);
    expect([200]).toContain(res.status());
  });

  test("[ideas-section.get.ideas-sections-id#perfil-anonimo] GET /ideas-sections/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/ideas-sections/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[ideas-section.get.ideas-sections-id#perfil-membro] GET /ideas-sections/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-sections/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[ideas-section.get.ideas-sections-id#perfil-lider] GET /ideas-sections/:id como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-sections/{BAD}", leader);
    expect([403]).toContain(res.status());
  });

  test("[ideas-section.get.ideas-sections-id#perfil-admin] GET /ideas-sections/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-sections/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[ideas-section.post.ideas-sections#perfil-anonimo] POST /ideas-sections como visitante: 401", async ({ request }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "POST", "/ideas-sections", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.post.ideas-sections#perfil-membro] POST /ideas-sections como membro: 400", async ({ request }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "POST", "/ideas-sections", member);
    expect([400]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.post.ideas-sections#perfil-lider] POST /ideas-sections como líder: 400", async ({ request }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "POST", "/ideas-sections", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.post.ideas-sections#perfil-admin] POST /ideas-sections como admin: 400", async ({ request }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "POST", "/ideas-sections", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.patch.ideas-sections-id#perfil-anonimo] PATCH /ideas-sections/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.patch.ideas-sections-id#perfil-membro] PATCH /ideas-sections/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.patch.ideas-sections-id#perfil-lider] PATCH /ideas-sections/:id como líder: 403", async ({ request }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.patch.ideas-sections-id#perfil-admin] PATCH /ideas-sections/:id como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#perfil-anonimo] PATCH /ideas-sections/:id/attach/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}/attach/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#perfil-membro] PATCH /ideas-sections/:id/attach/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}/attach/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#perfil-lider] PATCH /ideas-sections/:id/attach/:id como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}/attach/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.patch.ideas-sections-id-attach-pageid#perfil-admin] PATCH /ideas-sections/:id/attach/:id como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}/attach/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.delete.ideas-sections-id#perfil-anonimo] DELETE /ideas-sections/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "DELETE", "/ideas-sections/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.delete.ideas-sections-id#perfil-membro] DELETE /ideas-sections/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "DELETE", "/ideas-sections/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.delete.ideas-sections-id#perfil-lider] DELETE /ideas-sections/:id como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "DELETE", "/ideas-sections/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.delete.ideas-sections-id#perfil-admin] DELETE /ideas-sections/:id como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("ideas_sections");
    const res = await send(request, "DELETE", "/ideas-sections/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("ideas_sections")).toBe(before);
  });

  test("[ideas-section.get.ideas-sections#flag-desligada] GET /ideas-sections com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("ideas_sections");
    const res = await send(request, "GET", "/ideas-sections", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("ideas_sections")).toBe(before);
    await setFlags(request, true);
  });

  test("[ideas-section.post.ideas-sections#flag-desligada] POST /ideas-sections com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("ideas_sections");
    const res = await send(request, "POST", "/ideas-sections", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("ideas_sections")).toBe(before);
    await setFlags(request, true);
  });

  test("[ideas-section.patch.ideas-sections-id#flag-desligada] PATCH /ideas-sections/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("ideas_sections");
    const res = await send(request, "PATCH", "/ideas-sections/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("ideas_sections")).toBe(before);
    await setFlags(request, true);
  });

  test("[ideas-section.delete.ideas-sections-id#flag-desligada] DELETE /ideas-sections/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("ideas_sections");
    const res = await send(request, "DELETE", "/ideas-sections/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("ideas_sections")).toBe(before);
    await setFlags(request, true);
  });
});
