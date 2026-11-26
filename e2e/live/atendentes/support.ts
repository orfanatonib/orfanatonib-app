import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import type { TestFile } from "../support/media-scenarios";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const TARGET_ESTADUAL = "AtendenteEstadual";
export const TARGET_FEDERAL = "AtendenteFederal";
/** Acima dos 255 caracteres de `media_items.title`: passa no DTO e falha de verdade no banco, DEPOIS do upload. */
export const OVERSIZED_TITLE = "t".repeat(300);

export const pdf = (name: string): TestFile => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from(`%PDF-1.4 ${name} conteudo de teste`),
});
export const exe = (): TestFile => ({ name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });

export interface RecordInput {
  name?: string;
  attendableType?: "user" | "integration";
  attendableId?: string;
  estadual?: TestFile;
  federal?: TestFile;
  estadualTitle?: string;
  federalTitle?: string;
}

export interface RecordBody {
  id: string;
  name?: string;
  attendableType?: string | null;
  attendableId?: string | null;
  pdfEstadual?: { id: string; url: string; title?: string } | null;
  pdfFederal?: { id: string; url: string; title?: string } | null;
}

/** Multipart da API: `atendenteData` (JSON) + os PDFs nos campos `estadual` e `federal`. */
export function buildMultipart(input: RecordInput): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.attendableType) data.attendableType = input.attendableType;
  if (input.attendableId) data.attendableId = input.attendableId;
  if (input.estadual) multipart.estadual = input.estadual;
  if (input.federal) multipart.federal = input.federal;
  if (input.estadualTitle) data.pdfEstadual = { title: input.estadualTitle };
  if (input.federalTitle) data.pdfFederal = { title: input.federalTitle };
  multipart.atendenteData = JSON.stringify(data);
  return multipart;
}

export const createRaw = (request: APIRequestContext, token: string, input: RecordInput): Promise<APIResponse> =>
  request.post(`${API_URL}/antecedentes-criminais`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export async function create(request: APIRequestContext, token: string, input: RecordInput): Promise<RecordBody> {
  const response = await createRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as RecordBody;
}

export const putRaw = (
  request: APIRequestContext,
  token: string,
  id: string,
  data: Record<string, unknown>,
  files: { estadual?: TestFile; federal?: TestFile } = {},
): Promise<APIResponse> => {
  const multipart: Record<string, string | TestFile> = { atendenteData: JSON.stringify(data) };
  if (files.estadual) multipart.estadual = files.estadual;
  if (files.federal) multipart.federal = files.federal;
  return request.put(`${API_URL}/antecedentes-criminais/${id}`, { headers: authHeaders(token), multipart });
};

export async function removeApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/antecedentes-criminais/${id}`, { headers: authHeaders(token) });
}

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const recordRow = (id: string) =>
  queryOne<{ id: string; name: string | null; attendableType: string | null; attendableId: string | null }>(
    "SELECT id, name, attendableType, attendableId FROM atendentes WHERE id = ?",
    [id],
  );

export const recordsWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM atendentes WHERE name LIKE ?", [`%${tag}%`]);

export const allRecords = (): Promise<number> => count("SELECT COUNT(*) AS n FROM atendentes");

export const mediaCount = (id: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM media_items WHERE targetId = ? AND targetType IN (?, ?, 'Atendente')", [id, TARGET_ESTADUAL, TARGET_FEDERAL]);

export const pdfRow = (id: string, target: string) =>
  queryOne<{ id: string; url: string; title: string }>("SELECT id, url, title FROM media_items WHERE targetId = ? AND targetType = ?", [id, target]);

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ records: number; media: number }> {
  return {
    records: await allRecords(),
    media: await count("SELECT COUNT(*) AS n FROM media_items WHERE targetType IN (?, ?, 'Atendente')", [TARGET_ESTADUAL, TARGET_FEDERAL]),
  };
}

export const label = (name: string): string => tagged(name);
