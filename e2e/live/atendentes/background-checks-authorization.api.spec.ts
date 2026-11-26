import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/antecedentes-criminais` (plano 26; dado sensível): sessão obrigatória e só admin/líder (membro 403 em TODOS os handlers); escrita inválida ou recusada não grava; `criminal_records` desligada ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["criminal_records"] as const;

test.describe.serial("Antecedentes criminais — autorização", () => {
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

  test("[background-checks.get.antecedentes-criminais#perfil-anonimo] GET /antecedentes-criminais como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/antecedentes-criminais", undefined);
    expect([401]).toContain(res.status());
  });

  test("[background-checks.get.antecedentes-criminais#perfil-membro] GET /antecedentes-criminais como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/antecedentes-criminais", member);
    expect([403]).toContain(res.status());
  });

  test("[background-checks.get.antecedentes-criminais#perfil-lider] GET /antecedentes-criminais como líder: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/antecedentes-criminais", leader);
    expect([200]).toContain(res.status());
  });

  test("[background-checks.get.antecedentes-criminais#perfil-admin] GET /antecedentes-criminais como admin: 200", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/antecedentes-criminais", admin);
    expect([200]).toContain(res.status());
  });

  test("[background-checks.get.antecedentes-criminais-id#perfil-anonimo] GET /antecedentes-criminais/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/antecedentes-criminais/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[background-checks.get.antecedentes-criminais-id#perfil-membro] GET /antecedentes-criminais/:id como membro: 403", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/antecedentes-criminais/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[background-checks.get.antecedentes-criminais-id#perfil-lider] GET /antecedentes-criminais/:id como líder: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/antecedentes-criminais/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[background-checks.get.antecedentes-criminais-id#perfil-admin] GET /antecedentes-criminais/:id como admin: 404", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/antecedentes-criminais/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[background-checks.post.antecedentes-criminais#perfil-anonimo] POST /antecedentes-criminais como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "POST", "/antecedentes-criminais", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.post.antecedentes-criminais#perfil-membro] POST /antecedentes-criminais como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "POST", "/antecedentes-criminais", member);
    expect([403]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.post.antecedentes-criminais#perfil-lider] POST /antecedentes-criminais como líder: 400", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "POST", "/antecedentes-criminais", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.post.antecedentes-criminais#perfil-admin] POST /antecedentes-criminais como admin: 400", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "POST", "/antecedentes-criminais", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.put.antecedentes-criminais-id#perfil-anonimo] PUT /antecedentes-criminais/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "PUT", "/antecedentes-criminais/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.put.antecedentes-criminais-id#perfil-membro] PUT /antecedentes-criminais/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "PUT", "/antecedentes-criminais/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.put.antecedentes-criminais-id#perfil-lider] PUT /antecedentes-criminais/:id como líder: 400/404", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "PUT", "/antecedentes-criminais/{BAD}", leader);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.put.antecedentes-criminais-id#perfil-admin] PUT /antecedentes-criminais/:id como admin: 400/404", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "PUT", "/antecedentes-criminais/{BAD}", admin);
    expect([400, 404]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.delete.antecedentes-criminais-id#perfil-anonimo] DELETE /antecedentes-criminais/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "DELETE", "/antecedentes-criminais/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.delete.antecedentes-criminais-id#perfil-membro] DELETE /antecedentes-criminais/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "DELETE", "/antecedentes-criminais/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.delete.antecedentes-criminais-id#perfil-lider] DELETE /antecedentes-criminais/:id como líder: 404", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "DELETE", "/antecedentes-criminais/{BAD}", leader);
    expect([404]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.delete.antecedentes-criminais-id#perfil-admin] DELETE /antecedentes-criminais/:id como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("atendentes");
    const res = await send(request, "DELETE", "/antecedentes-criminais/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("atendentes")).toBe(before);
  });

  test("[background-checks.get.antecedentes-criminais#flag-desligada] GET /antecedentes-criminais com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("atendentes");
    const res = await send(request, "GET", "/antecedentes-criminais", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("atendentes")).toBe(before);
    await setFlags(request, true);
  });

  test("[background-checks.post.antecedentes-criminais#flag-desligada] POST /antecedentes-criminais com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("atendentes");
    const res = await send(request, "POST", "/antecedentes-criminais", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("atendentes")).toBe(before);
    await setFlags(request, true);
  });

  test("[background-checks.put.antecedentes-criminais-id#flag-desligada] PUT /antecedentes-criminais/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("atendentes");
    const res = await send(request, "PUT", "/antecedentes-criminais/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("atendentes")).toBe(before);
    await setFlags(request, true);
  });

  test("[background-checks.delete.antecedentes-criminais-id#flag-desligada] DELETE /antecedentes-criminais/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("atendentes");
    const res = await send(request, "DELETE", "/antecedentes-criminais/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("atendentes")).toBe(before);
    await setFlags(request, true);
  });
});
