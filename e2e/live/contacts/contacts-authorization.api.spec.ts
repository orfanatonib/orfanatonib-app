import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/contact` (plano 38): o envio é público (corpo inválido ⇒ 400 sem gravar); caixa de entrada, marcar como lido e exclusão são só admin (visitante 401, membro/líder 403); escrita recusada não grava; flags desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["contact_form", "contact_management"] as const;

test.describe.serial("Contato — autorização", () => {
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

  test("[contact.get.contact#perfil-anonimo] GET /contact como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/contact", undefined);
    expect([401]).toContain(res.status());
  });

  test("[contact.get.contact#perfil-membro] GET /contact como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/contact", member);
    expect([403]).toContain(res.status());
  });

  test("[contact.get.contact#perfil-lider] GET /contact como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/contact", leader);
    expect([403]).toContain(res.status());
  });

  test("[contact.get.contact#perfil-admin] GET /contact como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/contact", admin);
    expect([200]).toContain(res.status());
  });

  test("[contact.post.contact#perfil-anonimo] POST /contact como visitante: 400", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "POST", "/contact", undefined);
    expect([400]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.post.contact#perfil-membro] POST /contact como membro: 400", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "POST", "/contact", member);
    expect([400]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.post.contact#perfil-lider] POST /contact como líder: 400", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "POST", "/contact", leader);
    expect([400]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.post.contact#perfil-admin] POST /contact como admin: 400", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "POST", "/contact", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.patch.contact-id-read#perfil-anonimo] PATCH /contact/:id/read como visitante: 401", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "PATCH", "/contact/{BAD}/read", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.patch.contact-id-read#perfil-membro] PATCH /contact/:id/read como membro: 403", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "PATCH", "/contact/{BAD}/read", member);
    expect([403]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.patch.contact-id-read#perfil-lider] PATCH /contact/:id/read como líder: 403", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "PATCH", "/contact/{BAD}/read", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.patch.contact-id-read#perfil-admin] PATCH /contact/:id/read como admin: 404", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "PATCH", "/contact/{BAD}/read", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.delete.contact-id#perfil-anonimo] DELETE /contact/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "DELETE", "/contact/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.delete.contact-id#perfil-membro] DELETE /contact/:id como membro: 403", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "DELETE", "/contact/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.delete.contact-id#perfil-lider] DELETE /contact/:id como líder: 403", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "DELETE", "/contact/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.delete.contact-id#perfil-admin] DELETE /contact/:id como admin: 404", async ({ request }) => {
    const before = await countRows("contacts");
    const res = await send(request, "DELETE", "/contact/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("contacts")).toBe(before);
  });

  test("[contact.get.contact#flag-desligada] GET /contact com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("contacts");
    const res = await send(request, "GET", "/contact", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("contacts")).toBe(before);
    await setFlags(request, true);
  });

  test("[contact.post.contact#flag-desligada] POST /contact com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("contacts");
    const res = await send(request, "POST", "/contact", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("contacts")).toBe(before);
    await setFlags(request, true);
  });

  test("[contact.patch.contact-id-read#flag-desligada] PATCH /contact/:id/read com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("contacts");
    const res = await send(request, "PATCH", "/contact/{BAD}/read", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("contacts")).toBe(before);
    await setFlags(request, true);
  });

  test("[contact.delete.contact-id#flag-desligada] DELETE /contact/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("contacts");
    const res = await send(request, "DELETE", "/contact/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("contacts")).toBe(before);
    await setFlags(request, true);
  });
});
