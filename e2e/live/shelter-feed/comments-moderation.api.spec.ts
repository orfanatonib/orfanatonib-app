import { randomUUID } from "node:crypto";

import { API_URL } from "../../../playwright.live.config";
import { LIVE_ACCOUNTS } from "../support/credentials";
import { RUN_TAG } from "../support/factory";
import { closeDb, countRows, queryOne } from "../support/db";
import { authHeaders, expect, loginAs, test } from "../support/live";
import { createFeedSection, createGallery, readFeed, removeGallery, removeSection, setFlag } from "./feed-fixtures";
import {
  COMMENT_STATUS,
  approveComment,
  commentBody,
  commentItemUrl,
  commentsUrl,
  listComments,
  moderationUrl,
  postComment,
  rejectComment,
} from "./comments-moderation-helpers";
import { outboxCountFor } from "../support/outbox";

/** Marca só desta spec: o RUN_TAG é do processo e outras specs do feed também o usam. */
const TAG = `${RUN_TAG}-moderacao`;

/**
 * Moderação de comentários do feed (plano 36): todo comentário nasce PENDENTE, o admin aprova ou
 * reprova (motivo obrigatório) e só o aprovado aparece para todos. API + MySQL reais; dados próprios
 * (galeria e publicação criadas pela API) e limpos no fim. O envio de e-mail fica desligado no local
 * (`email_delivery`): o que se prova é a decisão de enviar, gravada no `email_outbox` como `skipped`.
 */
const FLAGS = ["shelter_feed", "shelter_feed_comments"] as const;
const PENDING_TEMPLATE = "feed-comment-pending";
const APPROVED_TEMPLATE = "feed-comment-approved";
const REJECTED_TEMPLATE = "feed-comment-rejected";

test.describe.serial("Comentários do feed — moderação", () => {
  let admin: string;
  let adminId: string;
  let leader: string;
  let member: string;
  let memberId: string;
  let pageId: string;
  let sectionId: string;
  const flagBefore: Record<string, boolean> = {};

  const outboxCount = (templateKey: string, recipient?: string) =>
    outboxCountFor(templateKey, recipient);
  const row = (id: string) =>
    queryOne<{ status: string; moderationReason: string | null; moderatedById: string | null; reviewedAt: string | null; requestId: string | null }>(
      "SELECT status, moderationReason, moderatedById, reviewedAt, requestId FROM image_section_comments WHERE id = ?",
      [id],
    );

  let approvedId: string;
  let rejectedId: string;
  const requestId = randomUUID();
  const approvedText = `${TAG} aprovado: que alegria!`;
  const rejectedText = `${TAG} reprovado: bênção!`;

  test.beforeAll(async ({ request }) => {
    const a = await loginAs(request, "admin");
    const l = await loginAs(request, "leader");
    const m = await loginAs(request, "member");
    admin = a.accessToken;
    adminId = a.userId;
    leader = l.accessToken;
    member = m.accessToken;
    memberId = m.userId;
    for (const key of FLAGS) {
      flagBefore[key] =
        ((await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [key]))?.enabled ?? 1) === 1;
      await setFlag(request, admin, key, true);
    }
    const gallery = await createGallery(request, admin, `${TAG} galeria moderação`, `${TAG} legada`);
    pageId = gallery.pageId;
    sectionId = await createFeedSection(request, member, admin, pageId, `${TAG} publicação`, true);
  });

  test.afterAll(async ({ request }) => {
    for (const key of FLAGS) await setFlag(request, admin, key, flagBefore[key]);
    await removeSection(request, admin, sectionId);
    await removeGallery(request, admin, pageId);
    expect(await countRows("image_pages", { id: pageId })).toBe(0);
    expect(await countRows("image_sections", { id: sectionId })).toBe(0);
    expect(await countRows("image_section_comments", { sectionId })).toBe(0);
    await closeDb();
  });

  test("[comments-moderation#visitante] sem sessão: 401 em mine, fila, contador, aprovar e reprovar", async ({ request }) => {
    const id = randomUUID();
    const calls = [
      await request.get(`${commentsUrl(sectionId)}/mine`),
      await request.get(moderationUrl),
      await request.get(`${moderationUrl}/pending-count`),
      await request.patch(`${commentItemUrl(id)}/approve`),
      await request.patch(`${commentItemUrl(id)}/reject`, { data: { reason: "x" } }),
    ];
    for (const res of calls) expect(res.status()).toBe(401);
    expect(await countRows("image_section_comments", { sectionId })).toBe(0);
  });

  test("[comments-moderation#nasce-pendente] membro comenta: 201 PENDENTE, requestId gravado, não aparece para os outros nem conta no feed", async ({ request }) => {
    const res = await request.post(commentsUrl(sectionId), { headers: authHeaders(member), data: commentBody(approvedText, requestId) });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ content: approvedText, status: COMMENT_STATUS.pending, isMine: true, moderationReason: null });
    approvedId = body.id;
    expect(await row(approvedId)).toMatchObject({ status: "pending", requestId, moderatedById: null, reviewedAt: null });

    expect((await listComments(request, leader, sectionId)).total).toBe(0); // todos veem só os aprovados
    expect((await listComments(request, admin, sectionId)).total).toBe(0); // nem o admin na lista pública
    const mine = await listComments(request, member, sectionId, "/mine");
    expect(mine.items.map((c) => [c.id, c.status])).toEqual([[approvedId, COMMENT_STATUS.pending]]);
    expect((await listComments(request, leader, sectionId, "/mine")).total).toBe(0); // "mine" é só do autor
    expect((await readFeed(request, pageId, leader)).find((s) => s.id === sectionId)?.commentCount).toBe(0);
  });

  test("[comments-moderation#idempotencia] mesmo requestId e texto: devolve o mesmo comentário; outro texto: 409; outro autor: comentário próprio", async ({ request }) => {
    const again = await request.post(commentsUrl(sectionId), { headers: authHeaders(member), data: commentBody(approvedText, requestId) });
    expect(again.status()).toBe(201);
    expect((await again.json()).id).toBe(approvedId);
    expect(await countRows("image_section_comments", { sectionId, authorId: memberId })).toBe(1);

    const reused = await request.post(commentsUrl(sectionId), { headers: authHeaders(member), data: commentBody(`${approvedText} (editado)`, requestId) });
    expect(reused.status()).toBe(409);
    expect(await countRows("image_section_comments", { sectionId, authorId: memberId })).toBe(1);

    // UNIQUE(authorId, requestId): o mesmo requestId de OUTRO usuário é um comentário diferente.
    const other = await request.post(commentsUrl(sectionId), { headers: authHeaders(leader), data: commentBody(`${TAG} do líder`, requestId) });
    expect(other.status()).toBe(201);
    expect((await other.json()).id).not.toBe(approvedId);
    expect((await request.post(commentsUrl(sectionId), { headers: authHeaders(member), data: { content: "sem requestId" } })).status()).toBe(400);
    expect((await request.post(commentsUrl(sectionId), { headers: authHeaders(member), data: { content: "x", requestId: "nao-uuid" } })).status()).toBe(400);
  });

  test("[comments-moderation#autorizacao] membro e líder não moderam: 403 e nada muda", async ({ request }) => {
    const before = await row(approvedId);
    for (const token of [member, leader]) {
      expect((await request.get(moderationUrl, { headers: authHeaders(token) })).status()).toBe(403);
      expect((await request.get(`${moderationUrl}/pending-count`, { headers: authHeaders(token) })).status()).toBe(403);
      expect((await approveComment(request, token, approvedId)).status()).toBe(403);
      expect((await rejectComment(request, token, approvedId, "motivo")).status()).toBe(403);
    }
    expect(await row(approvedId)).toEqual(before);
  });

  test("[comments-moderation#fila] admin: paginada, filtro por status, busca e contagens por status batem com o banco", async ({ request }) => {
    const get = async (query: string) => {
      const res = await request.get(`${moderationUrl}?${query}`, { headers: authHeaders(admin) });
      expect(res.status(), query).toBe(200);
      return (await res.json()) as {
        items: Array<{ id: string; status: string; content: string; authorId: string | null; post: { caption: string } | null }>;
        counts: Record<string, number>;
        total: number;
        page: number;
        limit: number;
      };
    };
    const found = await get(`status=pending&search=${encodeURIComponent(TAG)}&limit=50`);
    expect(found.items.map((i) => i.id)).toContain(approvedId);
    expect(found.items.every((i) => i.status === "pending")).toBe(true);
    const mineItem = found.items.find((i) => i.id === approvedId)!;
    expect(mineItem.authorId).toBe(memberId);
    expect(mineItem.post?.caption).toBe(`${TAG} publicação`);

    const paged = await get(`status=pending&search=${encodeURIComponent(TAG)}&limit=1&page=2`);
    expect(paged).toMatchObject({ page: 2, limit: 1, total: found.total });
    expect(paged.items).toHaveLength(1);

    expect((await get(`status=approved&search=${encodeURIComponent(TAG)}`)).total).toBe(0);
    expect((await get(`search=${encodeURIComponent(`${TAG} do líder`)}`)).total).toBe(1);
    expect((await get(`search=${encodeURIComponent(`${TAG} publicação`)}`)).total).toBe(2); // busca pela legenda da publicação

    for (const status of ["pending", "approved", "rejected"]) {
      expect(found.counts[status], status).toBe(await countRows("image_section_comments", { status }));
    }
    for (const bad of ["status=foo", "limit=0", "limit=51", "page=0"]) {
      expect((await request.get(`${moderationUrl}?${bad}`, { headers: authHeaders(admin) })).status(), bad).toBe(400);
    }
    const count = await request.get(`${moderationUrl}/pending-count`, { headers: authHeaders(admin) });
    expect(await count.json()).toEqual({ pending: await countRows("image_section_comments", { status: "pending" }) });
  });

  test("[comments-moderation#aprovar] admin aprova: 200, moderador no banco, vira público e conta no feed; repetir é idempotente; reprovar depois é 409", async ({ request }) => {
    const outboxBefore = await outboxCount(APPROVED_TEMPLATE, LIVE_ACCOUNTS.member.email);
    const res = await approveComment(request, admin, approvedId);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: approvedId, status: COMMENT_STATUS.approved });
    const decided = await row(approvedId);
    expect(decided).toMatchObject({ status: "approved", moderatedById: adminId, moderationReason: null });
    expect(decided?.reviewedAt).not.toBeNull();

    const publicList = await listComments(request, leader, sectionId);
    expect(publicList.items.map((c) => c.id)).toEqual([approvedId]);
    expect(publicList.items[0]).toMatchObject({ isMine: false, canDelete: false, authorId: null, moderationReason: null });
    expect((await readFeed(request, pageId, leader)).find((s) => s.id === sectionId)?.commentCount).toBe(1);
    expect((await listComments(request, member, sectionId, "/mine")).items[0].status).toBe(COMMENT_STATUS.approved);

    const again = await approveComment(request, admin, approvedId);
    expect(again.status()).toBe(200);
    expect(await row(approvedId)).toEqual(decided); // nada mudou na repetição

    const flip = await rejectComment(request, admin, approvedId, "mudei de ideia");
    expect(flip.status()).toBe(409);
    expect((await row(approvedId))?.status).toBe("approved");

    await expect.poll(() => outboxCount(APPROVED_TEMPLATE, LIVE_ACCOUNTS.member.email)).toBe(outboxBefore + 1); // um aviso só (a repetição não reenvia)
  });

  test("[comments-moderation#reprovar] admin reprova com motivo: obrigatório (400), autor vê o motivo, ninguém mais vê; aprovar depois é 409; repetir é idempotente", async ({ request }) => {
    rejectedId = await postComment(request, leader, sectionId, rejectedText);
    const pendingEmails = await outboxCount(PENDING_TEMPLATE);
    const rejectedEmails = await outboxCount(REJECTED_TEMPLATE, LIVE_ACCOUNTS.leader.email);

    for (const body of [{}, { reason: "   " }, { reason: "a".repeat(501) }]) {
      const res = await request.patch(`${commentItemUrl(rejectedId)}/reject`, { headers: authHeaders(admin), data: body });
      expect(res.status(), JSON.stringify(body).slice(0, 30)).toBe(400);
    }
    expect((await row(rejectedId))?.status).toBe("pending");

    const reason = `${TAG} fora do tema da visita`;
    const res = await rejectComment(request, admin, rejectedId, reason);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: COMMENT_STATUS.rejected, moderationReason: reason });
    expect(await row(rejectedId)).toMatchObject({ status: "rejected", moderationReason: reason, moderatedById: adminId });

    const mineAsAuthor = await listComments(request, leader, sectionId, "/mine");
    expect(mineAsAuthor.items.find((c) => c.id === rejectedId)).toMatchObject({ status: "rejected", moderationReason: reason });
    const publicList = await listComments(request, member, sectionId);
    expect(publicList.items.map((c) => c.id)).not.toContain(rejectedId);
    expect(JSON.stringify(publicList)).not.toContain(reason);
    expect((await listComments(request, member, sectionId, "/mine")).items.map((c) => c.id)).not.toContain(rejectedId);

    expect((await approveComment(request, admin, rejectedId)).status()).toBe(409);
    expect((await rejectComment(request, admin, rejectedId, reason)).status()).toBe(200); // idempotente
    expect((await row(rejectedId))?.status).toBe("rejected");
    expect((await request.patch(`${commentItemUrl(randomUUID())}/approve`, { headers: authHeaders(admin) })).status()).toBe(404);

    await expect.poll(() => outboxCount(REJECTED_TEMPLATE, LIVE_ACCOUNTS.leader.email)).toBe(rejectedEmails + 1);
    expect(await outboxCount(PENDING_TEMPLATE)).toBeGreaterThanOrEqual(pendingEmails); // aviso ao(s) admin(s) na chegada
  });

  test("[comments-moderation#email-pendente] a chegada de um comentário grava o aviso aos admins no outbox, sem o texto do comentário", async ({ request }) => {
    const admins = await countRows("users", { role: "admin", active: 1 });
    expect(admins).toBeGreaterThan(0);
    const before = await outboxCount(PENDING_TEMPLATE);
    const id = await postComment(request, member, sectionId, `${TAG} para o aviso`);
    await expect.poll(() => outboxCount(PENDING_TEMPLATE)).toBeGreaterThan(before);
    // O aviso ao admin não carrega o texto do comentário.
    const leaked = await queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM email_outbox WHERE templateKey = ? AND (html LIKE ? OR text LIKE ?)", [
      PENDING_TEMPLATE,
      `%${TAG} para o aviso%`,
      `%${TAG} para o aviso%`,
    ]);
    expect(Number(leaked?.total ?? 0)).toBe(0);
    await request.delete(commentItemUrl(id), { headers: authHeaders(admin) });
  });

  test("[comments-moderation#excluir] autor remove o seu (pendente ou reprovado); admin remove qualquer um; outro usuário: 403", async ({ request }) => {
    const mine = await postComment(request, admin, sectionId, `${TAG} do admin`);
    expect((await request.delete(commentItemUrl(mine), { headers: authHeaders(member) })).status()).toBe(403);
    expect(await countRows("image_section_comments", { id: mine })).toBe(1);
    expect((await request.delete(commentItemUrl(mine), { headers: authHeaders(admin) })).status()).toBe(204);

    expect((await request.delete(commentItemUrl(rejectedId), { headers: authHeaders(leader) })).status()).toBe(204); // autor remove o reprovado
    expect(await countRows("image_section_comments", { id: rejectedId })).toBe(0);
    expect((await request.delete(commentItemUrl(approvedId), { headers: authHeaders(admin) })).status()).toBe(204); // moderação remove o aprovado
    expect((await readFeed(request, pageId, leader)).find((s) => s.id === sectionId)?.commentCount).toBe(0);
    expect(await countRows("image_section_comments", { sectionId, authorId: memberId, status: "pending" })).toBeLessThanOrEqual(1);
  });

  test("[comments-moderation#flag] flag do recurso desligada: fila e decisões respondem 403 FEATURE_DISABLED", async ({ request }) => {
    const id = await postComment(request, member, sectionId, `${TAG} com flag`);
    await setFlag(request, admin, "shelter_feed_comments", false);
    try {
      for (const res of [
        await request.get(moderationUrl, { headers: authHeaders(admin) }),
        await request.get(`${moderationUrl}/pending-count`, { headers: authHeaders(admin) }),
        await approveComment(request, admin, id),
        await rejectComment(request, admin, id, "motivo"),
      ]) {
        expect(res.status()).toBe(403);
        expect(JSON.stringify(await res.json())).toContain("FEATURE_DISABLED");
      }
      expect((await row(id))?.status).toBe("pending");
    } finally {
      await setFlag(request, admin, "shelter_feed_comments", true);
    }
    // Sobra só o que o afterAll limpa pela cascata da publicação.
    expect(await countRows("image_section_comments", { sectionId })).toBeGreaterThan(0);
  });
});
