import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import { outboxStates } from "../support/outbox";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const TEMPLATE_KEY = "comment-received";

export interface CommentInput {
  name: string;
  comment?: string;
  shelter?: string;
  neighborhood?: string;
}

export interface CommentBody {
  id: string;
  name: string;
  comment: string;
  shelter: string;
  neighborhood: string;
  published: boolean;
}

export const payload = (input: CommentInput): Record<string, unknown> => ({
  name: input.name,
  comment: input.comment ?? "Comentário da suíte de cenários",
  shelter: input.shelter ?? "Clubinho Teste",
  neighborhood: input.neighborhood ?? "Centro",
});

export const createRaw = (request: APIRequestContext, token: string | undefined, body: Record<string, unknown>): Promise<APIResponse> =>
  request.post(`${API_URL}/comments`, { headers: token ? authHeaders(token) : {}, data: body });

export async function create(request: APIRequestContext, token: string, input: CommentInput): Promise<CommentBody> {
  const response = await createRaw(request, token, payload(input));
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as CommentBody;
}

export const putRaw = (request: APIRequestContext, token: string, id: string, body: Record<string, unknown>): Promise<APIResponse> =>
  request.put(`${API_URL}/comments/${id}`, { headers: authHeaders(token), data: body });

export const deleteRaw = (request: APIRequestContext, token: string, id: string): Promise<APIResponse> =>
  request.delete(`${API_URL}/comments/${id}`, { headers: authHeaders(token) });

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const commentRow = (id: string) =>
  queryOne<{ id: string; name: string; comment: string; shelter: string; neighborhood: string; published: number }>(
    "SELECT id, name, comment, shelter, neighborhood, published FROM comments WHERE id = ?",
    [id],
  );

export const commentsWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM comments WHERE name LIKE ?", [`%${tag}%`]);

export const pendingInDb = (): Promise<number> => count("SELECT COUNT(*) AS n FROM comments WHERE published = 0");
export const allComments = (): Promise<number> => count("SELECT COUNT(*) AS n FROM comments");

/** Avisos de "comentário recebido" por status no outbox (com a flag de e-mail desligada no E2E, só `skipped`). */
export const outboxByStatus = (): Promise<Record<string, number>> => outboxStates(TEMPLATE_KEY);

export const label = (name: string): string => tagged(name);
