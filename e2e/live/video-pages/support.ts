import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { authHeaders, expect } from "../support/live";
import { FAKE_MP4 } from "../page-creator/support";

export { FAKE_MP4 };

export const TARGET_TYPE = "VideosPage";
export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

export interface VideoFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export interface VideoInput {
  id?: string;
  title: string;
  /** Link (padrão) ou upload de arquivo. */
  file?: VideoFile;
  url?: string;
}

export interface PageInput {
  id?: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  videos: VideoInput[];
}

export interface VideoPageBody {
  id: string;
  title: string;
  description: string;
  public: boolean;
  route: { path: string; entityId: string };
  /** `VideoMediaResponseDto`: sem `storageKey`, `targetId` nem `targetType`. */
  videos: Array<{ id: string; url: string; isLocalFile: boolean }>;
}

export interface MediaRow {
  id: string;
  url: string;
  isLocalFile: number;
  storageKey: string | null;
}

/** Monta o multipart que a API espera: `videosPageData` + um campo por arquivo novo (`video-<n>`). */
export function buildMultipart(input: PageInput): Record<string, string | VideoFile> {
  const multipart: Record<string, string | VideoFile> = {};
  const videos = input.videos.map((video, index) => {
    const fieldKey = `video-${index}`;
    const isUpload = Boolean(video.file) || Boolean(video.id && !video.url);
    if (video.file) multipart[fieldKey] = video.file;
    return {
      id: video.id,
      title: video.title,
      description: `Descrição de ${video.title}`,
      uploadType: isUpload ? "upload" : "link",
      mediaType: "video",
      isLocalFile: isUpload,
      url: isUpload ? undefined : (video.url ?? YOUTUBE_URL),
      platformType: isUpload ? undefined : "youtube",
      fieldKey: video.file ? fieldKey : undefined,
    };
  });
  multipart.videosPageData = JSON.stringify({
    ...(input.id ? { id: input.id } : {}),
    title: input.title,
    description: input.description ?? `Descrição de ${input.title}`,
    public: input.isPublic ?? true,
    videos,
  });
  return multipart;
}

export const createPageRaw = (request: APIRequestContext, token: string, input: PageInput) =>
  request.post(`${API_URL}/video-pages`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export const updatePageRaw = (request: APIRequestContext, token: string, id: string, input: PageInput) =>
  request.patch(`${API_URL}/video-pages/${id}`, {
    headers: authHeaders(token),
    multipart: buildMultipart({ ...input, id }),
  });

export async function createPage(request: APIRequestContext, token: string, input: PageInput): Promise<VideoPageBody> {
  const response = await createPageRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as VideoPageBody;
}

export async function updatePage(
  request: APIRequestContext,
  token: string,
  id: string,
  input: PageInput,
): Promise<VideoPageBody> {
  const response = await updatePageRaw(request, token, id, input);
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as VideoPageBody;
}

export async function deletePageApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/video-pages/${id}`, { headers: authHeaders(token) });
}

export const mp4 = (name: string): VideoFile => ({ name, mimeType: "video/mp4", buffer: FAKE_MP4 });

export const pageRow = (id: string) =>
  queryOne<{ id: string; name: string; description: string; public: number }>(
    "SELECT id, name, description, public FROM videos_pages WHERE id = ?",
    [id],
  );

export const mediaRows = (pageId: string) =>
  queryAll<MediaRow & Record<string, unknown>>(
    `SELECT id, url, isLocalFile, storageKey FROM media_items WHERE targetId = ? AND targetType = '${TARGET_TYPE}' ORDER BY createdAt, id`,
    [pageId],
  );

export const routeRows = (pageId: string) =>
  queryAll<{ id: string; path: string }>(
    `SELECT id, path FROM routes WHERE entityId = ? AND entityType = '${TARGET_TYPE}'`,
    [pageId],
  );

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ pages: number; media: number; routes: number }> {
  const one = async (sql: string): Promise<number> =>
    Number((await queryOne<{ n: number }>(sql))?.n ?? 0);
  return {
    pages: await one("SELECT COUNT(*) AS n FROM videos_pages"),
    media: await one(`SELECT COUNT(*) AS n FROM media_items WHERE targetType = '${TARGET_TYPE}'`),
    routes: await one(`SELECT COUNT(*) AS n FROM routes WHERE entityType = '${TARGET_TYPE}'`),
  };
}

export async function pagesWithTag(tag: string): Promise<number> {
  return Number(
    (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM videos_pages WHERE name LIKE ?", [`%${tag}%`]))?.n ?? 0,
  );
}

/** Campos que o DTO de saída do vídeo não pode expor (chave do bucket e vínculo interno). */
export const INTERNAL_MEDIA_FIELDS = ["storageKey", "targetId", "targetType"] as const;
