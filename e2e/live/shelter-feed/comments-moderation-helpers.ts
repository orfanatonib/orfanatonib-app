import { randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll } from "../support/db";
import { authHeaders } from "../support/live";

/** Estados do comentário, como a API devolve (espelha `FeedCommentStatus`). */
export const COMMENT_STATUS = { pending: "pending", approved: "approved", rejected: "rejected" } as const;

/** Corpo de `POST /feed-sections/:id/comments`: todo envio leva um `requestId` novo (idempotência). */
export const commentBody = (content: string, requestId: string = randomUUID()) => ({ content, requestId });

export const commentsUrl = (sectionId: string): string => `${API_URL}/feed-sections/${sectionId}/comments`;
export const commentItemUrl = (commentId: string): string => `${API_URL}/feed-section-comments/${commentId}`;
export const moderationUrl = `${API_URL}/feed-section-comments/moderation`;

export interface CommentView {
  id: string;
  content: string;
  status: string;
  moderationReason: string | null;
  isMine: boolean;
  canDelete: boolean;
  authorId: string | null;
}

/** Comenta e devolve o id (falha com a resposta da API se não for 201). */
export async function postComment(
  request: APIRequestContext,
  token: string,
  sectionId: string,
  content: string,
): Promise<string> {
  const res = await request.post(commentsUrl(sectionId), { headers: authHeaders(token), data: commentBody(content) });
  if (res.status() !== 201) throw new Error(`comentar falhou: ${res.status()} ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

export async function approveComment(request: APIRequestContext, adminToken: string, id: string) {
  return request.patch(`${commentItemUrl(id)}/approve`, { headers: authHeaders(adminToken) });
}

export async function rejectComment(request: APIRequestContext, adminToken: string, id: string, reason: string) {
  return request.patch(`${commentItemUrl(id)}/reject`, { headers: authHeaders(adminToken), data: { reason } });
}

/** Aprova pela API todo comentário ainda pendente da publicação (o fluxo antigo publicava direto). */
export async function approveAllPending(request: APIRequestContext, adminToken: string, sectionId: string): Promise<number> {
  const rows = await queryAll<{ id: string }>(
    "SELECT id FROM image_section_comments WHERE sectionId = ? AND status = 'pending'",
    [sectionId],
  );
  for (const row of rows) {
    const res = await approveComment(request, adminToken, row.id);
    if (!res.ok()) throw new Error(`aprovar ${row.id} falhou: ${res.status()}`);
  }
  return rows.length;
}

export async function listComments(
  request: APIRequestContext,
  token: string,
  sectionId: string,
  suffix = "",
): Promise<{ items: CommentView[]; total: number }> {
  const res = await request.get(`${commentsUrl(sectionId)}${suffix}`, { headers: authHeaders(token) });
  if (!res.ok()) throw new Error(`listar falhou: ${res.status()}`);
  return (await res.json()) as { items: CommentView[]; total: number };
}
