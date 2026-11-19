import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/shelter-schedules` (plano 21): sessão obrigatória; leitura para qualquer perfil (escopada no serviço); escrita só admin/líder (membro 403); escrita recusada não altera o banco; `shelter_schedule` desligada ⇒ 403 FEATURE_DISABLED nas escritas. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["shelter_schedule"] as const;

test.describe.serial("Agenda de abrigo — autorização", () => {
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

  test("[shelter-schedule.get.shelter-schedules#perfil-anonimo] GET /shelter-schedules como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/shelter-schedules", undefined);
    expect([401]).toContain(res.status());
  });

  test("[shelter-schedule.get.shelter-schedules#perfil-membro] GET /shelter-schedules como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelter-schedules", member);
    expect([200]).toContain(res.status());
  });

  test("[shelter-schedule.get.shelter-schedules#perfil-lider] GET /shelter-schedules como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelter-schedules", leader);
    expect([200]).toContain(res.status());
  });

  test("[shelter-schedule.get.shelter-schedules#perfil-admin] GET /shelter-schedules como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/shelter-schedules", admin);
    expect([200]).toContain(res.status());
  });

  test("[shelter-schedule.post.shelter-schedules#perfil-anonimo] POST /shelter-schedules como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "POST", "/shelter-schedules", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.post.shelter-schedules#perfil-membro] POST /shelter-schedules como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "POST", "/shelter-schedules", member);
    expect([403]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.post.shelter-schedules#perfil-lider] POST /shelter-schedules como líder: 400", async ({ request }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "POST", "/shelter-schedules", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.post.shelter-schedules#perfil-admin] POST /shelter-schedules como admin: 400", async ({ request }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "POST", "/shelter-schedules", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.put.shelter-schedules-id#perfil-anonimo] PUT /shelter-schedules/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "PUT", "/shelter-schedules/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.put.shelter-schedules-id#perfil-membro] PUT /shelter-schedules/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "PUT", "/shelter-schedules/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.put.shelter-schedules-id#perfil-lider] PUT /shelter-schedules/:id como líder: 400/404", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "PUT", "/shelter-schedules/{BAD}", leader);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.put.shelter-schedules-id#perfil-admin] PUT /shelter-schedules/:id como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "PUT", "/shelter-schedules/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.delete.shelter-schedules-id#perfil-anonimo] DELETE /shelter-schedules/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "DELETE", "/shelter-schedules/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.delete.shelter-schedules-id#perfil-membro] DELETE /shelter-schedules/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "DELETE", "/shelter-schedules/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.delete.shelter-schedules-id#perfil-lider] DELETE /shelter-schedules/:id como líder: 404", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "DELETE", "/shelter-schedules/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.delete.shelter-schedules-id#perfil-admin] DELETE /shelter-schedules/:id como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("shelter_schedules");
    const res = await send(request, "DELETE", "/shelter-schedules/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("shelter_schedules")).toBe(before);
  });

  test("[shelter-schedule.post.shelter-schedules#flag-desligada] POST /shelter-schedules com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("shelter_schedules");
    const res = await send(request, "POST", "/shelter-schedules", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("shelter_schedules")).toBe(before);
    await setFlags(request, true);
  });

  test("[shelter-schedule.put.shelter-schedules-id#flag-desligada] PUT /shelter-schedules/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("shelter_schedules");
    const res = await send(request, "PUT", "/shelter-schedules/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("shelter_schedules")).toBe(before);
    await setFlags(request, true);
  });

  test("[shelter-schedule.delete.shelter-schedules-id#flag-desligada] DELETE /shelter-schedules/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("shelter_schedules");
    const res = await send(request, "DELETE", "/shelter-schedules/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("shelter_schedules")).toBe(before);
    await setFlags(request, true);
  });
});
