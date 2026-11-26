import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import { outboxStates } from "../support/outbox";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const TEMPLATE_KEY = "feedback-received";

export interface FeedbackInput {
  name: string;
  email?: string;
  rating?: number;
  comment?: string;
  category?: string;
}

export interface FeedbackBody {
  id: string;
  name: string;
  email?: string | null;
  rating: number;
  comment: string;
  category: string;
  read: boolean;
}

export const payload = (input: FeedbackInput): Record<string, unknown> => ({
  name: input.name,
  rating: input.rating ?? 5,
  comment: input.comment ?? "Comentário da suíte de cenários",
  category: input.category ?? "suggestion",
  ...(input.email ? { email: input.email } : {}),
});

export const createRaw = (request: APIRequestContext, token: string | undefined, body: Record<string, unknown>): Promise<APIResponse> =>
  request.post(`${API_URL}/site-feedbacks`, { headers: token ? authHeaders(token) : {}, data: body });

export async function create(request: APIRequestContext, token: string, input: FeedbackInput): Promise<FeedbackBody> {
  const response = await createRaw(request, token, payload(input));
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as FeedbackBody;
}

export const putRaw = (request: APIRequestContext, token: string, id: string, body: Record<string, unknown>): Promise<APIResponse> =>
  request.put(`${API_URL}/site-feedbacks/${id}`, { headers: authHeaders(token), data: body });

export const readRaw = (request: APIRequestContext, token: string, id: string): Promise<APIResponse> =>
  request.patch(`${API_URL}/site-feedbacks/${id}/read`, { headers: authHeaders(token) });

export const deleteRaw = (request: APIRequestContext, token: string, id: string): Promise<APIResponse> =>
  request.delete(`${API_URL}/site-feedbacks/${id}`, { headers: authHeaders(token) });

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const feedbackRow = (id: string) =>
  queryOne<{ id: string; name: string; email: string | null; rating: number; comment: string; category: string; read: number }>(
    "SELECT id, name, email, rating, comment, category, `read` FROM site_feedbacks WHERE id = ?",
    [id],
  );

export const feedbacksWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM site_feedbacks WHERE name LIKE ?", [`%${tag}%`]);

export const unreadInDb = (): Promise<number> => count("SELECT COUNT(*) AS n FROM site_feedbacks WHERE `read` = 0");
export const allFeedbacks = (): Promise<number> => count("SELECT COUNT(*) AS n FROM site_feedbacks");

/** Avisos de "feedback recebido" por status no outbox (com a flag de e-mail desligada no E2E, só `skipped`). */
export const outboxByStatus = (): Promise<Record<string, number>> => outboxStates(TEMPLATE_KEY);

export const label = (name: string): string => tagged(name);
