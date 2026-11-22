import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import { PNG_1X1, type TestFile } from "../support/media-scenarios";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const MEDIA_TARGET = "Event";
export type Audience = "all" | "members" | "leaders";

export const png = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });
/** Nome de arquivo acima dos 255 caracteres de `media_items.originalName`: o upload dá certo e a linha da mídia falha no banco. */
export const OVERSIZED_FILE_NAME = `${"f".repeat(300)}.png`;

export interface EventInput {
  title: string;
  date?: string;
  location?: string;
  description?: string;
  audience?: Audience;
  file?: TestFile;
}

export interface EventBody {
  id: string;
  title: string;
  date: string;
  audience: Audience;
  media?: { id: string; url: string } | null;
}

export function buildMultipart(input: EventInput): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  if (input.file) multipart.file = input.file;
  multipart.eventData = JSON.stringify({
    title: input.title,
    date: input.date ?? "2099-12-01",
    location: input.location ?? "Local do E2E",
    description: input.description ?? "Descrição do evento de teste",
    audience: input.audience ?? "all",
  });
  return multipart;
}

export const createRaw = (request: APIRequestContext, token: string, input: EventInput): Promise<APIResponse> =>
  request.post(`${API_URL}/events`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export async function create(request: APIRequestContext, token: string, input: EventInput): Promise<EventBody> {
  const response = await createRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as EventBody;
}

export const patchRaw = (
  request: APIRequestContext,
  token: string,
  id: string,
  data: Record<string, unknown>,
  file?: TestFile,
): Promise<APIResponse> => {
  const multipart: Record<string, string | TestFile> = { eventData: JSON.stringify(data) };
  if (file) multipart.file = file;
  return request.patch(`${API_URL}/events/${id}`, { headers: authHeaders(token), multipart });
};

export async function removeApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/events/${id}`, { headers: authHeaders(token) });
}

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const eventRow = (id: string) =>
  queryOne<{ id: string; title: string; date: string; location: string | null; audience: string }>(
    "SELECT id, title, date, location, audience FROM events WHERE id = ?",
    [id],
  );

export const eventsWithTag = (tag: string): Promise<number> => count("SELECT COUNT(*) AS n FROM events WHERE title LIKE ?", [`%${tag}%`]);

export const mediaCount = (id: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ? AND targetId = ?", [MEDIA_TARGET, id]);

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ events: number; media: number }> {
  return {
    events: await count("SELECT COUNT(*) AS n FROM events"),
    media: await count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ?", [MEDIA_TARGET]),
  };
}

/** Avisos de evento no outbox por estado (o envio é assíncrono; o que importa é o estado final). */
export const eventNoticeStates = async (): Promise<Record<string, number>> => {
  const rows = await queryAll<{ status: string; n: number }>(
    "SELECT status, COUNT(*) AS n FROM email_outbox WHERE templateKey = 'event-notice' GROUP BY status",
  );
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.n)]));
};

export const label = (name: string): string => tagged(name);
