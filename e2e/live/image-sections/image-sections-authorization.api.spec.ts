import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { BAD_ID as BAD, deleteRaw, patchRaw, png, sectionRow, submitRaw } from "./support";

/**
 * Autorização de `/image-sections` (plano 32): sessão obrigatória; qualquer autenticado ENVIA foto (POST: o envio real
 * devolve 201 e grava com o autor da sessão), mas fila, detalhe, edição e exclusão são só admin; escrita recusada não
 * grava; flags desligadas ⇒ 403 FEATURE_DISABLED (antes o POST gravava mesmo com a flag desligada). Id inexistente: 404.
 */
const FLAGS = ["shelter_photo_upload", "photo_moderation"] as const;

test.describe.serial("Seções de imagem — autorização", () => {
  let admin: string;
  let leader: string;
  let member: string;
  const before: Record<string, number> = {};
  const sent: string[] = [];
  let me: Record<"member" | "leader" | "admin", string> = { member: "", leader: "", admin: "" };

  /** Envio REAL como o perfil: 201, autor da sessão e a publicação só fica pública se quem enviou é admin. */
  const sendAs = async (
    request: import("@playwright/test").APIRequestContext,
    role: "member" | "leader" | "admin",
    token: string,
  ) => {
    const rowsBefore = await countRows("image_sections");
    const caption = `${RUN_TAG}-auth-${role}`;
    const res = await submitRaw(request, token, { caption, isPublic: true, media: [{ file: png(`${role}.png`) }] });
    expect(res.status(), await res.text()).toBe(201);
    const { id } = (await res.json()) as { id: string };
    sent.push(id);
    expect(await countRows("image_sections")).toBe(rowsBefore + 1);
    expect(await sectionRow(id)).toMatchObject({ caption, authorId: me[role], public: role === "admin" ? 1 : 0 });
  };

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
    const leaderLogin = await loginAs(request, "leader");
    const memberLogin = await loginAs(request, "member");
    const adminLogin = await loginAs(request, "admin");
    leader = leaderLogin.accessToken;
    member = memberLogin.accessToken;
    me = { member: memberLogin.userId, leader: leaderLogin.userId, admin: adminLogin.userId };
    for (const key of FLAGS) {
      before[key] =
        (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1;
    }
  });

  test.afterAll(async ({ request }) => {
    await setFlags(request, "restore");
    for (const id of sent) await deleteRaw(request, admin, id);
    expect(await countRows("image_sections", { caption: `${RUN_TAG}-auth-member` })).toBe(0);
    await closeDb();
  });

  test("[image-section.get.image-sections#perfil-anonimo] GET /image-sections como visitante: 401", async ({ request }) => {
    const res = await send(request, "GET", "/image-sections", undefined);
    expect([401]).toContain(res.status());
  });

  test("[image-section.get.image-sections#perfil-membro] GET /image-sections como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/image-sections", member);
    expect([403]).toContain(res.status());
  });

  test("[image-section.get.image-sections#perfil-lider] GET /image-sections como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/image-sections", leader);
    expect([403]).toContain(res.status());
  });

  test("[image-section.get.image-sections#perfil-admin] GET /image-sections como admin: 200", async ({ request }) => {
    const res = await send(request, "GET", "/image-sections", admin);
    expect([200]).toContain(res.status());
  });

  test("[image-section.get.image-sections-id#perfil-anonimo] GET /image-sections/:id como visitante: 401", async ({
    request,
  }) => {
    const res = await send(request, "GET", "/image-sections/{BAD}", undefined);
    expect([401]).toContain(res.status());
  });

  test("[image-section.get.image-sections-id#perfil-membro] GET /image-sections/:id como membro: 403", async ({ request }) => {
    const res = await send(request, "GET", "/image-sections/{BAD}", member);
    expect([403]).toContain(res.status());
  });

  test("[image-section.get.image-sections-id#perfil-lider] GET /image-sections/:id como líder: 403", async ({ request }) => {
    const res = await send(request, "GET", "/image-sections/{BAD}", leader);
    expect([403]).toContain(res.status());
  });

  test("[image-section.get.image-sections-id#perfil-admin] GET /image-sections/:id como admin: 404", async ({ request }) => {
    const res = await send(request, "GET", "/image-sections/{BAD}", admin);
    expect([404]).toContain(res.status());
  });

  test("[image-section.post.image-sections#perfil-anonimo] POST /image-sections como visitante: 401", async ({ request }) => {
    const before = await countRows("image_sections");
    const res = await send(request, "POST", "/image-sections", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.post.image-sections#perfil-membro] POST /image-sections como membro: 201, grava com o autor da sessão", async ({ request }) => {
    await sendAs(request, "member", member);
  });

  test("[image-section.post.image-sections#perfil-lider] POST /image-sections como líder: 201, grava com o autor da sessão", async ({ request }) => {
    await sendAs(request, "leader", leader);
  });

  test("[image-section.post.image-sections#perfil-admin] POST /image-sections como admin: 201, grava com o autor da sessão", async ({ request }) => {
    await sendAs(request, "admin", admin);
  });

  test("[image-section.patch.image-sections-id#perfil-anonimo] PATCH /image-sections/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("image_sections");
    const res = await send(request, "PATCH", "/image-sections/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.patch.image-sections-id#perfil-membro] PATCH /image-sections/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("image_sections");
    const res = await send(request, "PATCH", "/image-sections/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.patch.image-sections-id#perfil-lider] PATCH /image-sections/:id como líder: 403", async ({ request }) => {
    const before = await countRows("image_sections");
    const res = await send(request, "PATCH", "/image-sections/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.patch.image-sections-id#perfil-admin] PATCH /image-sections/:id como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("image_sections");
    // Corpo válido: o 404 vem de a publicação não existir (e não de um 400 de validação).
    const res = await patchRaw(request, admin, BAD, { caption: `${RUN_TAG}-auth-fantasma`, media: [{ url: undefined }] });
    expect(res.status()).toBe(404);
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.delete.image-sections-id#perfil-anonimo] DELETE /image-sections/:id como visitante: 401", async ({
    request,
  }) => {
    const before = await countRows("image_sections");
    const res = await send(request, "DELETE", "/image-sections/{BAD}", undefined);
    expect([401]).toContain(res.status());
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.delete.image-sections-id#perfil-membro] DELETE /image-sections/:id como membro: 403", async ({
    request,
  }) => {
    const before = await countRows("image_sections");
    const res = await send(request, "DELETE", "/image-sections/{BAD}", member);
    expect([403]).toContain(res.status());
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.delete.image-sections-id#perfil-lider] DELETE /image-sections/:id como líder: 403", async ({
    request,
  }) => {
    const before = await countRows("image_sections");
    const res = await send(request, "DELETE", "/image-sections/{BAD}", leader);
    expect([403]).toContain(res.status());
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.delete.image-sections-id#perfil-admin] DELETE /image-sections/:id como admin: 404", async ({
    request,
  }) => {
    const before = await countRows("image_sections");
    const res = await send(request, "DELETE", "/image-sections/{BAD}", admin);
    expect(res.status()).toBe(404);
    expect(await countRows("image_sections")).toBe(before);
  });

  test("[image-section.get.image-sections#flag-desligada] GET /image-sections com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("image_sections");
    const res = await send(request, "GET", "/image-sections", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_sections")).toBe(before);
    await setFlags(request, true);
  });

  test("[image-section.post.image-sections#flag-desligada] POST /image-sections com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("image_sections");
    const res = await send(request, "POST", "/image-sections", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_sections")).toBe(before);
    await setFlags(request, true);
  });

  test("[image-section.patch.image-sections-id#flag-desligada] PATCH /image-sections/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("image_sections");
    const res = await send(request, "PATCH", "/image-sections/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_sections")).toBe(before);
    await setFlags(request, true);
  });

  test("[image-section.delete.image-sections-id#flag-desligada] DELETE /image-sections/:id com as flags desligadas: 403 FEATURE_DISABLED e nada muda", async ({
    request,
  }) => {
    await setFlags(request, false);
    const before = await countRows("image_sections");
    const res = await send(request, "DELETE", "/image-sections/{BAD}", admin);
    expect(res.status()).toBe(403);
    expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
    expect(await countRows("image_sections")).toBe(before);
    await setFlags(request, true);
  });
});
