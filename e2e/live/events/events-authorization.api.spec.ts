import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/events` (plano 20): leitura pública (filtrada por público no serviço); escrita só admin (visitante 401, membro/líder 403) e sem alterar o banco; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["event_management", "events_section"] as const;

test.describe.serial("Eventos — autorização", () => {
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

  test("[event.get.events#perfil-anonimo] GET /events como visitante: 200", async ({ request }) => {
    const res = await send(request, "GET", "/events", undefined);
    expect([200]).toContain(res.status());
  });

  test("[event.get.events#perfil-membro] GET /events como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/events", member);
    expect([200]).toContain(res.status());
  });

  test("[event.get.events#perfil-lider] GET /events como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/events", leader);
    expect([200]).toContain(res.status());
  });

  test("[event.get.events#perfil-admin] GET /events como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/events", admin);
    expect([200]).toContain(res.status());
  });

  test("[event.get.events-upcoming#perfil-anonimo] GET /events/upcoming como visitante: 200", async ({ request }) => {
    const res = await send(request, "GET", "/events/upcoming", undefined);
    expect([200]).toContain(res.status());
  });

  test("[event.get.events-upcoming#perfil-membro] GET /events/upcoming como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/events/upcoming", member);
    expect([200]).toContain(res.status());
  });

  test("[event.get.events-upcoming#perfil-lider] GET /events/upcoming como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/events/upcoming", leader);
    expect([200]).toContain(res.status());
  });

  test("[event.get.events-upcoming#perfil-admin] GET /events/upcoming como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/events/upcoming", admin);
    expect([200]).toContain(res.status());
  });

  test("[event.get.events-id#perfil-anonimo] GET /events/:id como visitante: 404", async ({ request }) => {
    const res = await send(request, "GET", "/events/{BAD}", undefined);
    expect([404]).toContain(res.status());
  });

  test("[event.get.events-id#perfil-membro] GET /events/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/events/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[event.get.events-id#perfil-lider] GET /events/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/events/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[event.get.events-id#perfil-admin] GET /events/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/events/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[event.post.events#perfil-anonimo] POST /events como visitante: 401", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "POST", "/events", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.post.events#perfil-membro] POST /events como membro: 403", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "POST", "/events", member);
    expect([403]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.post.events#perfil-lider] POST /events como líder: 403", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "POST", "/events", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.post.events#perfil-admin] POST /events como admin: 400", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "POST", "/events", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.patch.events-id#perfil-anonimo] PATCH /events/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "PATCH", "/events/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.patch.events-id#perfil-membro] PATCH /events/:id como membro: 403", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "PATCH", "/events/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.patch.events-id#perfil-lider] PATCH /events/:id como líder: 403", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "PATCH", "/events/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.patch.events-id#perfil-admin] PATCH /events/:id como admin: 400/404", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "PATCH", "/events/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.delete.events-id#perfil-anonimo] DELETE /events/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "DELETE", "/events/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.delete.events-id#perfil-membro] DELETE /events/:id como membro: 403", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "DELETE", "/events/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.delete.events-id#perfil-lider] DELETE /events/:id como líder: 403", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "DELETE", "/events/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.delete.events-id#perfil-admin] DELETE /events/:id como admin: 404", async ({ request }) => {
    const before = await countRows("events");
    const res = await send(request, "DELETE", "/events/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("events")).toBe(before);
  });

  test("[event.get.events#flag-desligada] GET /events com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("events");
    const res = await send(request, "GET", "/events", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("events")).toBe(before);
    await setFlags(request, true);
  });

  test("[event.post.events#flag-desligada] POST /events com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("events");
    const res = await send(request, "POST", "/events", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("events")).toBe(before);
    await setFlags(request, true);
  });

  test("[event.patch.events-id#flag-desligada] PATCH /events/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("events");
    const res = await send(request, "PATCH", "/events/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("events")).toBe(before);
    await setFlags(request, true);
  });

  test("[event.delete.events-id#flag-desligada] DELETE /events/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("events");
    const res = await send(request, "DELETE", "/events/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("events")).toBe(before);
    await setFlags(request, true);
  });
});
