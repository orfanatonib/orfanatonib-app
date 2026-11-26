import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import { outboxStates } from "../support/outbox";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const TEMPLATE_KEY = "contact-received";

export interface ContactInput {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
}

export interface ContactBody {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
}

export const payload = (input: ContactInput): Record<string, unknown> => ({
  name: input.name,
  email: input.email ?? "pessoa.e2e@orfanatonib.test",
  phone: input.phone ?? "11999999999",
  message: input.message ?? "Mensagem da suíte de cenários",
});

export const createRaw = (request: APIRequestContext, token: string | undefined, body: Record<string, unknown>): Promise<APIResponse> =>
  request.post(`${API_URL}/contact`, { headers: token ? authHeaders(token) : {}, data: body });

/** O formulário é público: o recibo traz só `id` e `createdAt`. */
export async function create(request: APIRequestContext, input: ContactInput): Promise<{ id: string; createdAt: string }> {
  const response = await createRaw(request, undefined, payload(input));
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as { id: string; createdAt: string };
}

export const readRaw = (request: APIRequestContext, token: string, id: string): Promise<APIResponse> =>
  request.patch(`${API_URL}/contact/${id}/read`, { headers: authHeaders(token) });

export const deleteRaw = (request: APIRequestContext, token: string, id: string): Promise<APIResponse> =>
  request.delete(`${API_URL}/contact/${id}`, { headers: authHeaders(token) });

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const contactRow = (id: string) =>
  queryOne<{ id: string; name: string; email: string; phone: string; message: string; read: number }>(
    "SELECT id, name, email, phone, message, `read` FROM contacts WHERE id = ?",
    [id],
  );

export const contactsWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM contacts WHERE name LIKE ?", [`%${tag}%`]);

export const unreadInDb = (): Promise<number> => count("SELECT COUNT(*) AS n FROM contacts WHERE `read` = 0");
export const allContacts = (): Promise<number> => count("SELECT COUNT(*) AS n FROM contacts");

/** Avisos de "contato recebido" por status no outbox (com a flag de e-mail desligada no E2E, só `skipped`). */
export const outboxByStatus = (): Promise<Record<string, number>> => outboxStates(TEMPLATE_KEY);

export const label = (name: string): string => tagged(name);
