import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import { PNG_1X1, type TestFile } from "../support/media-scenarios";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const MEDIA_TARGET = "ShelterEntity";
/** Acima dos 255 caracteres da coluna `addresses.city`: passa no DTO e falha de verdade no banco. */
export const OVERSIZED_CITY = "c".repeat(300);
export const FOTO_FIELD = "foto";

export const address = { street: "Rua Teste", number: "10", district: "Centro", city: "Manaus", state: "AM" };

export const png = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });
export const exe = (): TestFile => ({ name: "x.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });

export interface ShelterBody {
  id: string;
  name: string;
  teamsQuantity: number;
  address?: { city: string; state: string };
  teams: Array<{ id: string; numberTeam: number }>;
  mediaItem?: { id: string; url: string } | null;
}

export interface ShelterInput {
  name: string;
  teamsQuantity?: number;
  city?: string;
  file?: TestFile;
  linkUrl?: string;
}

/** Monta o multipart da API: `shelterData` + o arquivo no campo apontado por `fieldKey` (como a tela). */
export function buildShelterMultipart(input: ShelterInput): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  const data: Record<string, unknown> = {
    name: input.name,
    description: "Criado pela suíte de cenários",
    teamsQuantity: input.teamsQuantity ?? 1,
    address: { ...address, city: input.city ?? address.city },
  };
  if (input.file) {
    multipart[FOTO_FIELD] = input.file;
    data.mediaItem = {
      title: "Foto",
      uploadType: "upload",
      isLocalFile: true,
      originalName: input.file.name,
      fieldKey: FOTO_FIELD,
    };
  } else if (input.linkUrl) {
    data.mediaItem = { title: "Foto", uploadType: "link", isLocalFile: false, url: input.linkUrl };
  }
  multipart.shelterData = JSON.stringify(data);
  return multipart;
}

export const createShelterRaw = (request: APIRequestContext, token: string, input: ShelterInput): Promise<APIResponse> =>
  request.post(`${API_URL}/shelters`, { headers: authHeaders(token), multipart: buildShelterMultipart(input) });

export async function createShelter(
  request: APIRequestContext,
  token: string,
  input: ShelterInput,
): Promise<ShelterBody> {
  const response = await createShelterRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as ShelterBody;
}

export const putShelterRaw = (
  request: APIRequestContext,
  token: string,
  id: string,
  body: Record<string, unknown>,
  file?: TestFile,
): Promise<APIResponse> => {
  const multipart: Record<string, string | TestFile> = { shelterData: JSON.stringify(body) };
  if (file) multipart[FOTO_FIELD] = file;
  return request.put(`${API_URL}/shelters/${id}`, { headers: authHeaders(token), multipart });
};

export const patchMediaRaw = (
  request: APIRequestContext,
  token: string,
  id: string,
  media: { url?: string; file?: TestFile } | null,
): Promise<APIResponse> => {
  const multipart: Record<string, string | TestFile> = {};
  if (media?.file) {
    multipart[FOTO_FIELD] = media.file;
    multipart.mediaData = JSON.stringify({
      title: "Nova",
      uploadType: "upload",
      isLocalFile: true,
      fieldKey: FOTO_FIELD,
    });
  } else if (media?.url) {
    multipart.mediaData = JSON.stringify({ title: "Nova", uploadType: "link", isLocalFile: false, url: media.url });
  }
  return request.patch(`${API_URL}/shelters/${id}/media`, { headers: authHeaders(token), multipart });
};

export async function deleteShelterApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/shelters/${id}`, { headers: authHeaders(token) });
}

export const get = (request: APIRequestContext, token: string | undefined, path: string): Promise<APIResponse> =>
  request.get(`${API_URL}${path}`, { headers: token ? authHeaders(token) : {} });

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const shelterRow = (id: string) =>
  queryOne<{ id: string; name: string; teamsQuantity: number }>(
    "SELECT id, name, teamsQuantity FROM shelters WHERE id = ?",
    [id],
  );

export const sheltersWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM shelters WHERE name LIKE ?", [`%${tag}%`]);

export const mediaCount = (shelterId: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ? AND targetId = ?", [MEDIA_TARGET, shelterId]);

export const teamsCount = (shelterId: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM teams WHERE shelter_id = ?", [shelterId]);

export const routesCount = (shelterId: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM routes WHERE entityId = ? AND entityType = 'shelterPage'", [shelterId]);

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ shelters: number; addresses: number; teams: number; routes: number; media: number }> {
  return {
    shelters: await count("SELECT COUNT(*) AS n FROM shelters"),
    addresses: await count("SELECT COUNT(*) AS n FROM addresses"),
    teams: await count("SELECT COUNT(*) AS n FROM teams"),
    routes: await count("SELECT COUNT(*) AS n FROM routes WHERE entityType = 'shelterPage'"),
    media: await count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ?", [MEDIA_TARGET]),
  };
}

export const label = (name: string): string => tagged(name);
