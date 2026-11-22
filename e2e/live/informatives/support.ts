import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const ROUTE_ENTITY = "Informative";
export const ROUTE_PREFIX = "informativo_";

export interface InformativeInput {
  title: string;
  description?: string;
  public?: boolean;
}

export interface InformativeBody {
  id: string;
  title: string;
  description: string;
  public: boolean;
}

export const payload = (input: InformativeInput): Record<string, unknown> => ({
  title: input.title,
  description: input.description ?? "Descrição do banner da suíte de cenários",
  public: input.public ?? true,
});

export const createRaw = (request: APIRequestContext, token: string | undefined, body: Record<string, unknown>): Promise<APIResponse> =>
  request.post(`${API_URL}/informatives`, { headers: token ? authHeaders(token) : {}, data: body });

export async function create(request: APIRequestContext, token: string, input: InformativeInput): Promise<InformativeBody> {
  const response = await createRaw(request, token, payload(input));
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as InformativeBody;
}

export const patchRaw = (request: APIRequestContext, token: string, id: string, body: Record<string, unknown>): Promise<APIResponse> =>
  request.patch(`${API_URL}/informatives/${id}`, { headers: authHeaders(token), data: body });

export const deleteRaw = (request: APIRequestContext, token: string, id: string): Promise<APIResponse> =>
  request.delete(`${API_URL}/informatives/${id}`, { headers: authHeaders(token) });

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const informativeRow = (id: string) =>
  queryOne<{ id: string; title: string; description: string; public: number; routeId: string | null }>(
    "SELECT id, title, description, `public`, routeId FROM informatives WHERE id = ?",
    [id],
  );

export const routeOf = (id: string) =>
  queryOne<{ id: string; title: string; subtitle: string; description: string; path: string; type: string; public: number; entityType: string; entityId: string }>(
    "SELECT id, title, subtitle, description, path, type, `public`, entityType, entityId FROM routes WHERE entityId = ? AND entityType = ?",
    [id, ROUTE_ENTITY],
  );

export const routesCount = (id: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM routes WHERE entityId = ? AND entityType = ?", [id, ROUTE_ENTITY]);

export const informativesWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM informatives WHERE title LIKE ?", [`%${tag}%`]);

export const routesWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM routes WHERE entityType = ? AND title LIKE ?", [ROUTE_ENTITY, `%${tag}%`]);

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ informatives: number; routes: number }> {
  return {
    informatives: await count("SELECT COUNT(*) AS n FROM informatives"),
    routes: await count("SELECT COUNT(*) AS n FROM routes WHERE entityType = ?", [ROUTE_ENTITY]),
  };
}

export const label = (name: string): string => tagged(name);
