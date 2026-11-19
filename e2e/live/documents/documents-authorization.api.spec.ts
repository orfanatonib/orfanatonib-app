import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";

/** Autorização de `/documents` (plano 27): leitura exige sessão (visitante 401) e vale para qualquer perfil; escrita só admin (membro/líder 403); escrita recusada não grava; flags `documents_library`+`document_management` desligadas ⇒ 403 FEATURE_DISABLED. */
const BAD = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FLAGS = ["documents_library", "document_management"] as const;

test.describe.serial("Documentos — autorização", () => {
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

  test("[document.get.documents#perfil-anonimo] GET /documents como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/documents", undefined);
    expect([401]).toContain(res.status());
  });

  test("[document.get.documents#perfil-membro] GET /documents como membro: 200", async ({ request }) => {
    const res = await send(request, "GET", "/documents", member);
    expect([200]).toContain(res.status());
  });

  test("[document.get.documents#perfil-lider] GET /documents como líder: 200", async ({ request }) => {
    const res = await send(request, "GET", "/documents", leader);
    expect([200]).toContain(res.status());
  });

  test("[document.get.documents#perfil-admin] GET /documents como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/documents", admin);
    expect([200]).toContain(res.status());
  });

  test("[document.get.documents-id#perfil-anonimo] GET /documents/:id como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/documents/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[document.get.documents-id#perfil-membro] GET /documents/:id como membro: 404", async ({ request }) => {
    const res = await send(request, "GET", "/documents/{BAD}", member);
    expect([404]).toContain(res.status());
  });

  test("[document.get.documents-id#perfil-lider] GET /documents/:id como líder: 404", async ({ request }) => {
    const res = await send(request, "GET", "/documents/{BAD}", leader);
    expect([404]).toContain(res.status());
  });

  test("[document.get.documents-id#perfil-admin] GET /documents/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/documents/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[document.post.documents#perfil-anonimo] POST /documents como visitante: 401", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "POST", "/documents", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.post.documents#perfil-membro] POST /documents como membro: 403", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "POST", "/documents", member);
    expect([403]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.post.documents#perfil-lider] POST /documents como líder: 403", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "POST", "/documents", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.post.documents#perfil-admin] POST /documents como admin: 400", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "POST", "/documents", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.patch.documents-id#perfil-anonimo] PATCH /documents/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "PATCH", "/documents/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.patch.documents-id#perfil-membro] PATCH /documents/:id como membro: 403", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "PATCH", "/documents/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.patch.documents-id#perfil-lider] PATCH /documents/:id como líder: 403", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "PATCH", "/documents/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.patch.documents-id#perfil-admin] PATCH /documents/:id como admin: 400", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "PATCH", "/documents/{BAD}", admin);
    expect([400]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.delete.documents-id#perfil-anonimo] DELETE /documents/:id como visitante: 401", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "DELETE", "/documents/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.delete.documents-id#perfil-membro] DELETE /documents/:id como membro: 403", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "DELETE", "/documents/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.delete.documents-id#perfil-lider] DELETE /documents/:id como líder: 403", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "DELETE", "/documents/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.delete.documents-id#perfil-admin] DELETE /documents/:id como admin: 404", async ({ request }) => {
    const before = await countRows("documents");
    const res = await send(request, "DELETE", "/documents/{BAD}", admin);
    expect([404]).toContain(res.status());
    expect(await countRows("documents")).toBe(before);
  });

  test("[document.get.documents#flag-desligada] GET /documents com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("documents");
    const res = await send(request, "GET", "/documents", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("documents")).toBe(before);
    await setFlags(request, true);
  });

  test("[document.post.documents#flag-desligada] POST /documents com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("documents");
    const res = await send(request, "POST", "/documents", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("documents")).toBe(before);
    await setFlags(request, true);
  });

  test("[document.patch.documents-id#flag-desligada] PATCH /documents/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("documents");
    const res = await send(request, "PATCH", "/documents/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("documents")).toBe(before);
    await setFlags(request, true);
  });

  test("[document.delete.documents-id#flag-desligada] DELETE /documents/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("documents");
    const res = await send(request, "DELETE", "/documents/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("documents")).toBe(before);
    await setFlags(request, true);
  });
});
