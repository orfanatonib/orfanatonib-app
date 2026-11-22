import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import { PNG_1X1, type TestFile } from "../support/media-scenarios";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const MEDIA_TARGET = "Integration";
/** Acima dos 255 caracteres de `media_items.title`: passa no DTO e falha de verdade no banco, DEPOIS do upload. */
export const OVERSIZED_TITLE = "t".repeat(300);

export const png = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });

export interface IntegrationInput {
  name: string;
  phone?: string;
  gaLeader?: string;
  baptized?: boolean;
  churchYears?: number;
  integrationYear?: number;
  /** Fotos enviadas como `files[i]` (cada uma vira uma mídia). */
  files?: TestFile[];
  /** Se informado, descreve as imagens (título/fieldKey) em vez de deixar a API criar uma mídia por arquivo. */
  images?: Array<Record<string, unknown>>;
}

export interface IntegrationBody {
  id: string;
  name?: string;
  images?: Array<{ id: string; url: string; isLocalFile?: boolean }>;
}

export function buildMultipart(input: IntegrationInput): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  (input.files ?? []).forEach((file, index) => {
    multipart[`files[${index}]`] = file;
  });
  multipart.integrationData = JSON.stringify({
    name: input.name,
    phone: input.phone ?? "11999990000",
    gaLeader: input.gaLeader ?? "Líder do E2E",
    baptized: input.baptized ?? true,
    churchYears: input.churchYears ?? 3,
    integrationYear: input.integrationYear ?? 2026,
    ...(input.images ? { images: input.images } : {}),
  });
  return multipart;
}

export const createRaw = (request: APIRequestContext, token: string, input: IntegrationInput): Promise<APIResponse> =>
  request.post(`${API_URL}/integrations`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export async function create(request: APIRequestContext, token: string, input: IntegrationInput): Promise<IntegrationBody> {
  const response = await createRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as IntegrationBody;
}

export const putRaw = (
  request: APIRequestContext,
  token: string,
  id: string,
  data: Record<string, unknown>,
  files: TestFile[] = [],
): Promise<APIResponse> => {
  const multipart: Record<string, string | TestFile> = { integrationData: JSON.stringify(data) };
  files.forEach((file, index) => {
    multipart[`files[${index}]`] = file;
  });
  return request.put(`${API_URL}/integrations/${id}`, { headers: authHeaders(token), multipart });
};

export async function removeApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/integrations/${id}`, { headers: authHeaders(token) });
}

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

export async function fetchOne(request: APIRequestContext, token: string, id: string): Promise<IntegrationBody> {
  const response = await get(request, token, `/integrations/${id}`);
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as IntegrationBody;
}

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const integrationRow = (id: string) =>
  queryOne<{ id: string; name: string | null; phone: string | null; churchYears: number | null }>(
    "SELECT id, name, phone, churchYears FROM integrations WHERE id = ?",
    [id],
  );

export const integrationsWithTag = (tag: string): Promise<number> => count("SELECT COUNT(*) AS n FROM integrations WHERE name LIKE ?", [`%${tag}%`]);

export const mediaCount = (id: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ? AND targetId = ?", [MEDIA_TARGET, id]);

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ integrations: number; media: number }> {
  return {
    integrations: await count("SELECT COUNT(*) AS n FROM integrations"),
    media: await count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ?", [MEDIA_TARGET]),
  };
}

export const label = (name: string): string => tagged(name);
