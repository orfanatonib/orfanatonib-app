import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { RUN_TAG } from "../support/factory";
import { LIVE_ACCOUNTS } from "../support/credentials";
import { authHeaders, expect, loginAs, test, type LoginResult } from "../support/live";
import { setFlag } from "./feed-fixtures";
import { makePng } from "./png";
import { outboxRows } from "../support/outbox";

/**
 * Notificações e reprovação de publicações (API, arquivos reais):
 *  - POST por membro avisa os admins (flag própria `email_image_shared_notification`), admin publicando não;
 *  - PATCH /image-sections/:id/reject: motivo obrigatório (400), só admin (403), idempotente,
 *    aprovada → 409, avisa o autor (flag `email_image_rejected_notification`) e some do feed;
 *  - GET /image-sections/mine: o autor vê o status e o motivo.
 * Prova de e-mail: linhas do `email_outbox` (o SMTP não faz parte do E2E). As flags são religadas aqui e restauradas.
 */
const VIDEO = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "assets", "visita.mp4"));
const FLAGS = ["email_delivery", "email_image_shared_notification", "email_image_rejected_notification", "photo_moderation", "shelter_photo_upload"] as const;
const ADMIN_EMAIL = LIVE_ACCOUNTS.admin.email;
const MEMBER_EMAIL = LIVE_ACCOUNTS.member.email;
const BASE = API_URL;

let admin: LoginResult;
let member: LoginResult;
const flagsBefore: Record<string, boolean> = {};
const created: string[] = [];

const flagEnabled = async (key: string) => ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 0) === 1;
const outboxFor = (templateKey: string, recipient: string, caption: string) =>
  outboxRows<{ status: string; html: string; text: string; subject: string }>("status, html, text, subject", "templateKey = ? AND recipient = ? AND text LIKE ?", [templateKey, recipient, `%${caption}%`],
  );

async function submit(request: APIRequestContext, token: string, caption: string): Promise<string> {
  const res = await request.post(`${BASE}/image-sections`, {
    headers: authHeaders(token),
    multipart: {
      sectionData: JSON.stringify({
        caption,
        description: "e2e",
        public: false,
        mediaItems: [
          { title: "f", description: "", uploadType: "upload", mediaType: "image", isLocalFile: true, fieldKey: "a", originalName: "a.png" },
          { title: "v", description: "", uploadType: "upload", mediaType: "video", isLocalFile: true, fieldKey: "v", originalName: "visita.mp4" },
        ],
      }),
      a: { name: "a.png", mimeType: "image/png", buffer: makePng(320, 240, 3) },
      v: { name: "visita.mp4", mimeType: "video/mp4", buffer: VIDEO },
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const id = ((await res.json()) as { id: string }).id;
  created.push(id);
  return id;
}

const reject = (request: APIRequestContext, token: string | undefined, id: string, body: unknown) =>
  request.patch(`${BASE}/image-sections/${id}/reject`, { headers: token ? authHeaders(token) : {}, data: body });

test.describe.serial("Publicação — aviso aos admins, reprovação e 'minhas publicações' (API)", () => {
  test.beforeAll(async ({ request }) => {
    admin = await loginAs(request, "admin");
    member = await loginAs(request, "member");
    for (const key of FLAGS) {
      flagsBefore[key] = await flagEnabled(key);
      await setFlag(request, admin.accessToken, key, true);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const id of created) {
      await request.delete(`${BASE}/image-sections/${id}`, { headers: authHeaders(admin.accessToken) });
      expect(await countRows("image_sections", { id })).toBe(0);
      expect(await countRows("media_items", { targetId: id })).toBe(0);
    }
    for (const key of FLAGS) await setFlag(request, admin.accessToken, key, flagsBefore[key]);
    await closeDb();
  });

  test("[t8.1#aviso] o membro publica: o admin recebe o e-mail (autor só nome, legenda, 1 foto e 1 vídeo, link da fila), sem dado pessoal", async ({ request }) => {
    const caption = `${RUN_TAG} aviso`;
    await submit(request, member.accessToken, caption);
    await expect.poll(async () => (await outboxFor("image-shared-notification", ADMIN_EMAIL, caption)).length, { timeout: 15_000 }).toBe(1);
    const [mail] = await outboxFor("image-shared-notification", ADMIN_EMAIL, caption);
    expect(mail.subject).toContain("aguardando aprovação");
    for (const body of [mail.html, mail.text]) {
      expect(body).toContain(caption);
      expect(body).toContain("1 foto e 1 vídeo");
      expect(body).toContain("/adm/fotos-abrigos");
      expect(body).not.toContain(MEMBER_EMAIL);
    }
    expect(mail.text).toMatch(/Enviado por: E2E \w\./); // nome público, nunca o e-mail
  });

  test("[t8.1#flag-off] com a flag própria desligada o e-mail NÃO é enviado (fica 'skipped' no outbox) e a publicação é criada", async ({ request }) => {
    await setFlag(request, admin.accessToken, "email_image_shared_notification", false);
    const caption = `${RUN_TAG} sem-flag`;
    const id = await submit(request, member.accessToken, caption);
    expect(await countRows("image_sections", { id })).toBe(1);
    await expect.poll(async () => (await outboxFor("image-shared-notification", ADMIN_EMAIL, caption)).length, { timeout: 15_000 }).toBe(1);
    expect((await outboxFor("image-shared-notification", ADMIN_EMAIL, caption)).map((m) => m.status)).toEqual(["skipped"]);
    await setFlag(request, admin.accessToken, "email_image_shared_notification", true);
  });

  test("[t8.1#admin-publica] o admin publicando não avisa ninguém", async ({ request }) => {
    const caption = `${RUN_TAG} do-admin`;
    await submit(request, admin.accessToken, caption);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect((await outboxFor("image-shared-notification", ADMIN_EMAIL, caption)).length).toBe(0);
  });

  test("[t8.2#reprovar] 400 sem motivo, 401/403 sem ser admin; com motivo: reprovada, autor avisado por e-mail e a publicação nunca entra no feed", async ({ request }) => {
    const caption = `${RUN_TAG} reprovar`;
    const id = await submit(request, member.accessToken, caption);
    expect(await queryOne("SELECT reviewStatus FROM image_sections WHERE id = ?", [id])).toMatchObject({ reviewStatus: "pending" });

    for (const body of [{}, { reason: "" }, { reason: "   " }, { reason: "x".repeat(501) }]) {
      expect((await reject(request, admin.accessToken, id, body)).status()).toBe(400);
    }
    expect((await reject(request, undefined, id, { reason: "x" })).status()).toBe(401);
    expect((await reject(request, member.accessToken, id, { reason: "x" })).status()).toBe(403);
    expect(await queryOne("SELECT reviewStatus, rejectionReason FROM image_sections WHERE id = ?", [id])).toMatchObject({ reviewStatus: "pending", rejectionReason: null });

    const reason = `A foto mostra o rosto de uma criança; envie sem rostos. ${RUN_TAG}`;
    const res = await reject(request, admin.accessToken, id, { reason });
    expect(res.status(), await res.text()).toBe(200);
    expect(await res.json()).toMatchObject({ reviewStatus: "rejected", rejectionReason: reason });
    const row = await queryOne<{ reviewStatus: string; rejectionReason: string; reviewedById: string; reviewedAt: string; pageId: string | null }>(
      "SELECT reviewStatus, rejectionReason, reviewedById, reviewedAt, pageId FROM image_sections WHERE id = ?",
      [id],
    );
    expect(row).toMatchObject({ reviewStatus: "rejected", rejectionReason: reason, reviewedById: admin.userId, pageId: null });
    expect(row!.reviewedAt).toBeTruthy();

    // E-mail ao autor, com o motivo.
    await expect.poll(async () => (await outboxFor("image-rejected-notification", MEMBER_EMAIL, reason)).length, { timeout: 15_000 }).toBe(1);
    const [mail] = await outboxFor("image-rejected-notification", MEMBER_EMAIL, reason);
    expect(mail.text).toContain(caption);
    expect(mail.text).toContain("/area-do-membro/imagens-abrigo");

    // Idempotente: repetir não muda o motivo nem reenvia o e-mail.
    const again = await reject(request, admin.accessToken, id, { reason: "outro motivo" });
    expect(again.status()).toBe(200);
    expect(await again.json()).toMatchObject({ rejectionReason: reason });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect((await outboxFor("image-rejected-notification", MEMBER_EMAIL, reason)).length).toBe(1);

    // Nenhum feed (nem de quem tem sessão) mostra: está sem galeria.
    const feed = await request.get(`${BASE}/image-pages`, { headers: authHeaders(admin.accessToken) });
    expect(feed.ok()).toBe(true);
    expect(JSON.stringify(await feed.json())).not.toContain(id);

    // O autor vê o status e o motivo; outro usuário não vê a publicação alheia.
    const mine = (await (await request.get(`${BASE}/image-sections/mine`, { headers: authHeaders(member.accessToken) })).json()) as Array<{ id: string; reviewStatus: string; rejectionReason: string | null; photoCount: number; videoCount: number }>;
    expect(mine.find((s) => s.id === id)).toMatchObject({ reviewStatus: "rejected", rejectionReason: reason, photoCount: 1, videoCount: 1 });
    const adminMine = (await (await request.get(`${BASE}/image-sections/mine`, { headers: authHeaders(admin.accessToken) })).json()) as Array<{ id: string }>;
    expect(adminMine.map((s) => s.id)).not.toContain(id);
    expect((await request.get(`${BASE}/image-sections/mine`)).status()).toBe(401);
  });

  test("[t8.2#flag-off] com a flag de reprovação desligada: reprova igual, mas nenhum e-mail sai (skipped)", async ({ request }) => {
    await setFlag(request, admin.accessToken, "email_image_rejected_notification", false);
    const id = await submit(request, member.accessToken, `${RUN_TAG} reprovar-sem-flag`);
    const reason = `sem flag ${RUN_TAG}`;
    expect((await reject(request, admin.accessToken, id, { reason })).status()).toBe(200);
    await expect.poll(async () => (await outboxFor("image-rejected-notification", MEMBER_EMAIL, reason)).length, { timeout: 15_000 }).toBe(1);
    expect((await outboxFor("image-rejected-notification", MEMBER_EMAIL, reason)).map((m) => m.status)).toEqual(["skipped"]);
    await setFlag(request, admin.accessToken, "email_image_rejected_notification", true);
  });

  test("[t8.2#aprovada-409] aprovada (anexada pelo admin) não pode mais ser reprovada: 409 e nada muda", async ({ request }) => {
    const id = await submit(request, member.accessToken, `${RUN_TAG} aprovada`);
    const page = await queryOne<{ id: string }>("SELECT id FROM image_pages ORDER BY createdAt LIMIT 1");
    const mediaItems = (await (await request.get(`${BASE}/image-sections/${id}`, { headers: authHeaders(admin.accessToken) })).json()) as { mediaItems: unknown[] };
    const approve = await request.patch(`${BASE}/image-sections/${id}`, {
      headers: authHeaders(admin.accessToken),
      multipart: { sectionData: JSON.stringify({ caption: `${RUN_TAG} aprovada`, description: "e2e", public: true, pageId: page!.id, mediaItems: mediaItems.mediaItems }) },
    });
    expect(approve.status(), await approve.text()).toBe(200);
    expect(await queryOne("SELECT reviewStatus, reviewedById FROM image_sections WHERE id = ?", [id])).toMatchObject({ reviewStatus: "approved", reviewedById: admin.userId });
    const res = await reject(request, admin.accessToken, id, { reason: "tarde demais" });
    expect(res.status()).toBe(409);
    expect(await queryOne("SELECT reviewStatus, rejectionReason FROM image_sections WHERE id = ?", [id])).toMatchObject({ reviewStatus: "approved", rejectionReason: null });
  });

  test("[t8.2#inexistente] reprovar id inexistente: 404; id inválido: 400", async ({ request }) => {
    expect((await reject(request, admin.accessToken, "00000000-0000-4000-8000-000000000000", { reason: "x" })).status()).toBe(404);
    expect((await reject(request, admin.accessToken, "nao-e-uuid", { reason: "x" })).status()).toBe(400);
  });
});
