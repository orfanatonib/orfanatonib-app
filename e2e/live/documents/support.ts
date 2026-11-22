import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import type { TestFile } from "../support/media-scenarios";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const MEDIA_TARGET = "Document";
/** Acima dos 255 caracteres de `media_items.title`: passa no DTO e falha de verdade no banco, DEPOIS do upload. */
export const OVERSIZED_MEDIA_TITLE = "m".repeat(300);

export const pdf = (name: string): TestFile => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 conteudo de teste"),
});

export interface DocumentInput {
  name: string;
  description?: string;
  /** `file` = upload do PDF; senão, link. */
  file?: TestFile;
  url?: string;
  mediaTitle?: string;
}

export interface DocumentBody {
  id: string;
  name: string;
  description?: string | null;
  media?: { id: string; url: string; isLocalFile: boolean; title: string } | null;
}

export function mediaPayload(input: Pick<DocumentInput, "file" | "url" | "mediaTitle">, id?: string): Record<string, unknown> {
  const base = { ...(id ? { id } : {}), title: input.mediaTitle ?? "Arquivo do documento", description: "Conteúdo", mediaType: "document" };
  return input.file
    ? { ...base, uploadType: "upload", isLocalFile: true, fileField: "file", originalName: input.file.name }
    : { ...base, uploadType: "link", isLocalFile: false, url: input.url ?? "https://example.com/doc.pdf" };
}

/** Multipart da API: `documentData` (JSON) + o PDF no campo `file`, quando há upload. */
export function buildMultipart(input: DocumentInput, id?: string): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  if (input.file) multipart.file = input.file;
  multipart.documentData = JSON.stringify({
    ...(id ? { id } : {}),
    name: input.name,
    description: input.description ?? "Descrição do documento de teste",
    media: mediaPayload(input),
  });
  return multipart;
}

export const createRaw = (request: APIRequestContext, token: string, input: DocumentInput): Promise<APIResponse> =>
  request.post(`${API_URL}/documents`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export async function create(request: APIRequestContext, token: string, input: DocumentInput): Promise<DocumentBody> {
  const response = await createRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as DocumentBody;
}

export const patchRaw = (
  request: APIRequestContext,
  token: string,
  id: string,
  data: Record<string, unknown>,
  file?: TestFile,
): Promise<APIResponse> => {
  const multipart: Record<string, string | TestFile> = { documentData: JSON.stringify(data) };
  if (file) multipart.file = file;
  return request.patch(`${API_URL}/documents/${id}`, { headers: authHeaders(token), multipart });
};

export async function removeApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/documents/${id}`, { headers: authHeaders(token) });
}

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const documentRow = (id: string) =>
  queryOne<{ id: string; name: string; description: string | null }>("SELECT id, name, description FROM documents WHERE id = ?", [id]);

export const documentsWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM documents WHERE name LIKE ?", [`%${tag}%`]);

export const mediaCount = (id: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ? AND targetId = ?", [MEDIA_TARGET, id]);

export const routesCount = (id: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM routes WHERE entityId = ? AND entityType = ?", [id, MEDIA_TARGET]);

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ documents: number; media: number; routes: number }> {
  return {
    documents: await count("SELECT COUNT(*) AS n FROM documents"),
    media: await count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ?", [MEDIA_TARGET]),
    routes: await count("SELECT COUNT(*) AS n FROM routes WHERE entityType = ?", [MEDIA_TARGET]),
  };
}

export const label = (name: string): string => tagged(name);
