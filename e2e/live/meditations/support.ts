import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import type { TestFile } from "../support/media-scenarios";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const MEDIA_TARGET = "Meditation";
/** Acima dos 255 caracteres de `media_items.title`: passa no DTO e falha de verdade no banco, DEPOIS do upload. */
export const OVERSIZED_MEDIA_TITLE = "m".repeat(300);

export const pdf = (name: string): TestFile => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 conteudo de teste"),
});

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const DAY_MS = 86_400_000;
/** Segunda-feira aleatória num futuro distante: a API recusa duas meditações na mesma semana, então cada cenário usa a sua. */
const BASE_MONDAY = Date.UTC(2070, 0, 6) + Math.floor(Math.random() * 3000) * 7 * DAY_MS;
let weekCounter = 0;

export interface Week {
  start: string;
  end: string;
}

const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** Uma semana (segunda a sexta) que nenhum outro cenário desta execução usa. */
export function nextWeek(): Week {
  const monday = BASE_MONDAY + (weekCounter += 1) * 7 * DAY_MS;
  return { start: iso(monday), end: iso(monday + 4 * DAY_MS) };
}

export interface MeditationInput {
  topic: string;
  week?: Week;
  startDate?: string;
  endDate?: string;
  days?: Array<Record<string, unknown>>;
  /** `file` = upload do PDF; `url` = link. */
  file?: TestFile;
  url?: string;
  mediaTitle?: string;
}

export interface MeditationBody {
  id: string;
  topic: string;
  startDate: string;
  endDate: string;
  days: Array<{ day: string }>;
}

export const defaultDays = (): Array<Record<string, unknown>> =>
  WEEKDAYS.map((day) => ({ day, verse: `Salmos 23:${day.length}`, topic: `Tema de ${day}` }));

/** Multipart da API: `meditationData` (JSON) + o PDF no campo `file`, quando há upload. */
export function buildMultipart(input: MeditationInput): Record<string, string | TestFile> {
  const week = input.week ?? nextWeek();
  const multipart: Record<string, string | TestFile> = {};
  const media = input.file
    ? {
        title: input.mediaTitle ?? "Guia da meditação",
        description: "PDF da semana",
        mediaType: "document",
        uploadType: "upload",
        isLocalFile: true,
        fieldKey: "file",
        originalName: input.file.name,
      }
    : {
        title: input.mediaTitle ?? "Guia da meditação",
        description: "Link da semana",
        mediaType: "document",
        uploadType: "link",
        isLocalFile: false,
        url: input.url ?? "https://example.com/meditacao.pdf",
      };
  if (input.file) multipart.file = input.file;
  multipart.meditationData = JSON.stringify({
    topic: input.topic,
    startDate: input.startDate ?? week.start,
    endDate: input.endDate ?? week.end,
    days: input.days ?? defaultDays(),
    media,
  });
  return multipart;
}

export const createRaw = (request: APIRequestContext, token: string, input: MeditationInput): Promise<APIResponse> =>
  request.post(`${API_URL}/meditations`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export async function create(request: APIRequestContext, token: string, input: MeditationInput): Promise<MeditationBody> {
  const response = await createRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as MeditationBody;
}

export const patchRaw = (
  request: APIRequestContext,
  token: string,
  id: string,
  data: Record<string, unknown>,
  file?: TestFile,
): Promise<APIResponse> => {
  const multipart: Record<string, string | TestFile> = { meditationData: JSON.stringify(data) };
  if (file) multipart.file = file;
  return request.patch(`${API_URL}/meditations/${id}`, { headers: authHeaders(token), multipart });
};

export async function removeApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/meditations/${id}`, { headers: authHeaders(token) });
}

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const meditationRow = (id: string) =>
  queryOne<{ id: string; topic: string; startDate: string; endDate: string }>(
    "SELECT id, topic, startDate, endDate FROM meditations WHERE id = ?",
    [id],
  );

export const meditationsWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM meditations WHERE topic LIKE ?", [`%${tag}%`]);

export const mediaCount = (id: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ? AND targetId = ?", [MEDIA_TARGET, id]);

export const daysCount = (id: string): Promise<number> => count("SELECT COUNT(*) AS n FROM meditation_days WHERE meditationId = ?", [id]);

export const routesCount = (id: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM routes WHERE entityId = ? AND entityType = ?", [id, MEDIA_TARGET]);

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ meditations: number; days: number; media: number; routes: number }> {
  return {
    meditations: await count("SELECT COUNT(*) AS n FROM meditations"),
    days: await count("SELECT COUNT(*) AS n FROM meditation_days"),
    media: await count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ?", [MEDIA_TARGET]),
    routes: await count("SELECT COUNT(*) AS n FROM routes WHERE entityType = ?", [MEDIA_TARGET]),
  };
}

export const label = (name: string): string => tagged(name);
