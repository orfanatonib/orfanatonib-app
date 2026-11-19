import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/ideas-pages` (plano 31): leitura aberta (só páginas públicas para visitante; id não público dá 404); escrita só admin (visitante 401, membro/líder 403); escrita recusada não grava; `page_management` desligada ⇒ 403 FEATURE_DISABLED nas escritas. As leituras NÃO têm flag (decisão pendente do usuário). */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["page_management"] as const;

test.describe.serial("Páginas de ideias — autorização", () => {
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

  test("[ideas-page.get.ideas-pages#perfil-anonimo] GET /ideas-pages como visitante: 200", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-pages", undefined);
    expect([200]).toContain(res.status());
  });

  test("[ideas-page.get.ideas-pages#perfil-membro] GET /ideas-pages como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-pages", member);
    expect([200]).toContain(res.status());
  });

  test("[ideas-page.get.ideas-pages#perfil-lider] GET /ideas-pages como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-pages", leader);
    expect([200]).toContain(res.status());
  });

  test("[ideas-page.get.ideas-pages#perfil-admin] GET /ideas-pages como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-pages", admin);
    expect([200]).toContain(res.status());
  });

  test("[ideas-page.get.ideas-pages-id#perfil-anonimo] GET /ideas-pages/:id como visitante: 404", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-pages/{BAD}", undefined);
    expect([404]).toContain(res.status());
  });

  test("[ideas-page.get.ideas-pages-id#perfil-membro] GET /ideas-pages/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-pages/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[ideas-page.get.ideas-pages-id#perfil-lider] GET /ideas-pages/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-pages/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[ideas-page.get.ideas-pages-id#perfil-admin] GET /ideas-pages/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/ideas-pages/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[ideas-page.post.ideas-pages#perfil-anonimo] POST /ideas-pages como visitante: 401", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "POST", "/ideas-pages", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.post.ideas-pages#perfil-membro] POST /ideas-pages como membro: 403", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "POST", "/ideas-pages", member);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.post.ideas-pages#perfil-lider] POST /ideas-pages como líder: 403", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "POST", "/ideas-pages", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.post.ideas-pages#perfil-admin] POST /ideas-pages como admin: 400", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "POST", "/ideas-pages", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.patch.ideas-pages-id#perfil-anonimo] PATCH /ideas-pages/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "PATCH", "/ideas-pages/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.patch.ideas-pages-id#perfil-membro] PATCH /ideas-pages/:id como membro: 403", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "PATCH", "/ideas-pages/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.patch.ideas-pages-id#perfil-lider] PATCH /ideas-pages/:id como líder: 403", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "PATCH", "/ideas-pages/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.patch.ideas-pages-id#perfil-admin] PATCH /ideas-pages/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "PATCH", "/ideas-pages/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.delete.ideas-pages-id#perfil-anonimo] DELETE /ideas-pages/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "DELETE", "/ideas-pages/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.delete.ideas-pages-id#perfil-membro] DELETE /ideas-pages/:id como membro: 403", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "DELETE", "/ideas-pages/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.delete.ideas-pages-id#perfil-lider] DELETE /ideas-pages/:id como líder: 403", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "DELETE", "/ideas-pages/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.delete.ideas-pages-id#perfil-admin] DELETE /ideas-pages/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("ideas_pages");
    const res = await send(request, "DELETE", "/ideas-pages/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("ideas_pages")).toBe(before);
  });

  test("[ideas-page.post.ideas-pages#flag-desligada] POST /ideas-pages com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("ideas_pages");
    const res = await send(request, "POST", "/ideas-pages", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("ideas_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[ideas-page.patch.ideas-pages-id#flag-desligada] PATCH /ideas-pages/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("ideas_pages");
    const res = await send(request, "PATCH", "/ideas-pages/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("ideas_pages")).toBe(before);
    await setFlags(request, true);
  });

  test("[ideas-page.delete.ideas-pages-id#flag-desligada] DELETE /ideas-pages/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("ideas_pages");
    const res = await send(request, "DELETE", "/ideas-pages/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("ideas_pages")).toBe(before);
    await setFlags(request, true);
  });
});
