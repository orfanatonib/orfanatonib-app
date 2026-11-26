import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/meditations` (plano 29): leitura exige sessão (visitante 401), qualquer perfil lê; escrita só admin (membro/líder 403); escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["weekly_meditation", "meditation_management"] as const;

test.describe.serial("Meditações — autorização", () => {
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

  test("[meditation.get.meditations#perfil-anonimo] GET /meditations como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/meditations", undefined);
    expect([401]).toContain(res.status());
  });

  test("[meditation.get.meditations#perfil-membro] GET /meditations como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/meditations", member);
    expect([200]).toContain(res.status());
  });

  test("[meditation.get.meditations#perfil-lider] GET /meditations como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/meditations", leader);
    expect([200]).toContain(res.status());
  });

  test("[meditation.get.meditations#perfil-admin] GET /meditations como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/meditations", admin);
    expect([200]).toContain(res.status());
  });

  test("[meditation.get.meditations-this-week#perfil-anonimo] GET /meditations/this-week como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/meditations/this-week", undefined);
    expect([401]).toContain(res.status());
  });

  test("[meditation.get.meditations-this-week#perfil-membro] GET /meditations/this-week como membro: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/meditations/this-week", member);
    expect([200]).toContain(res.status());
  });

  test("[meditation.get.meditations-this-week#perfil-lider] GET /meditations/this-week como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/meditations/this-week", leader);
    expect([200]).toContain(res.status());
  });

  test("[meditation.get.meditations-this-week#perfil-admin] GET /meditations/this-week como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/meditations/this-week", admin);
    expect([200]).toContain(res.status());
  });

  test("[meditation.get.meditations-id#perfil-anonimo] GET /meditations/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/meditations/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[meditation.get.meditations-id#perfil-membro] GET /meditations/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/meditations/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[meditation.get.meditations-id#perfil-lider] GET /meditations/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/meditations/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[meditation.get.meditations-id#perfil-admin] GET /meditations/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/meditations/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[meditation.post.meditations#perfil-anonimo] POST /meditations como visitante: 401", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "POST", "/meditations", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.post.meditations#perfil-membro] POST /meditations como membro: 403", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "POST", "/meditations", member);
    expect([403]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.post.meditations#perfil-lider] POST /meditations como líder: 403", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "POST", "/meditations", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.post.meditations#perfil-admin] POST /meditations como admin: 400", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "POST", "/meditations", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.patch.meditations-id#perfil-anonimo] PATCH /meditations/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "PATCH", "/meditations/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.patch.meditations-id#perfil-membro] PATCH /meditations/:id como membro: 403", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "PATCH", "/meditations/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.patch.meditations-id#perfil-lider] PATCH /meditations/:id como líder: 403", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "PATCH", "/meditations/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.patch.meditations-id#perfil-admin] PATCH /meditations/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "PATCH", "/meditations/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.delete.meditations-id#perfil-anonimo] DELETE /meditations/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "DELETE", "/meditations/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.delete.meditations-id#perfil-membro] DELETE /meditations/:id como membro: 403", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "DELETE", "/meditations/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.delete.meditations-id#perfil-lider] DELETE /meditations/:id como líder: 403", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "DELETE", "/meditations/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.delete.meditations-id#perfil-admin] DELETE /meditations/:id como admin: 404", async ({ request }) => {
    const before = await countRows("meditations");
    const res = await send(request, "DELETE", "/meditations/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("meditations")).toBe(before);
  });

  test("[meditation.get.meditations#flag-desligada] GET /meditations com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("meditations");
    const res = await send(request, "GET", "/meditations", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("meditations")).toBe(before);
    await setFlags(request, true);
  });

  test("[meditation.post.meditations#flag-desligada] POST /meditations com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("meditations");
    const res = await send(request, "POST", "/meditations", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("meditations")).toBe(before);
    await setFlags(request, true);
  });

  test("[meditation.patch.meditations-id#flag-desligada] PATCH /meditations/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("meditations");
    const res = await send(request, "PATCH", "/meditations/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("meditations")).toBe(before);
    await setFlags(request, true);
  });

  test("[meditation.delete.meditations-id#flag-desligada] DELETE /meditations/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("meditations");
    const res = await send(request, "DELETE", "/meditations/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("meditations")).toBe(before);
    await setFlags(request, true);
  });
});
