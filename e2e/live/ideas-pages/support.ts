import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { authHeaders, expect } from "../support/live";
import { PNG_1X1, type TestFile } from "../support/media-scenarios";

export { PNG_1X1 };

export const TARGET_TYPE = "IdeasSection";
export const PAGE_TARGET_TYPE = "IdeasPage";
export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
export const LONG_TITLE = "x".repeat(300);

export const png = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });

export interface MediaInput {
  id?: string;
  title: string;
  /** Upload de arquivo novo (imagem). */
  file?: TestFile;
  /** Mantém o arquivo já gravado (item existente sem arquivo novo). */
  keepFile?: boolean;
  url?: string;
}

export interface SectionInput {
  id?: string;
  title: string;
  medias?: MediaInput[];
}

export interface PageInput {
  id?: string;
  title: string;
  description?: string;
  sections: SectionInput[];
}

export interface IdeasPageBody {
  id: string;
  title: string;
  route: { path: string };
  sections: Array<{
    id: string;
    title: string;
    medias: Array<{ id: string; url: string; isLocalFile: boolean }>;
  }>;
}

export interface MediaRow {
  id: string;
  url: string;
  isLocalFile: number;
  storageKey: string | null;
  targetId: string;
}

/** Multipart que a API espera: `ideasMaterialsPageData` + um campo por arquivo novo. */
export function buildMultipart(input: PageInput): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  const sections = input.sections.map((section, sIdx) => ({
    id: section.id,
    title: section.title,
    description: `Descrição de ${section.title}`,
    public: true,
    medias: (section.medias ?? []).map((media, mIdx) => {
      const fieldKey = `image_${sIdx}_${mIdx}`;
      const isUpload = Boolean(media.file) || Boolean(media.keepFile);
      if (media.file) multipart[fieldKey] = media.file;
      return {
        id: media.id,
        title: media.title,
        description: `Descrição de ${media.title}`,
        mediaType: isUpload ? "image" : "video",
        uploadType: isUpload ? "upload" : "link",
        isLocalFile: isUpload,
        url: isUpload ? undefined : (media.url ?? YOUTUBE_URL),
        platformType: isUpload ? undefined : "youtube",
        fieldKey: media.file ? fieldKey : undefined,
      };
    }),
  }));
  multipart.ideasMaterialsPageData = JSON.stringify({
    ...(input.id ? { id: input.id } : {}),
    title: input.title,
    subtitle: "Subtítulo do cenário",
    description: input.description ?? `Descrição de ${input.title}`,
    sections,
  });
  return multipart;
}

export const createPageRaw = (request: APIRequestContext, token: string, input: PageInput) =>
  request.post(`${API_URL}/ideas-pages`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export const updatePageRaw = (request: APIRequestContext, token: string, id: string, input: PageInput) =>
  request.patch(`${API_URL}/ideas-pages/${id}`, {
    headers: authHeaders(token),
    multipart: buildMultipart({ ...input, id }),
  });

export async function createPage(request: APIRequestContext, token: string, input: PageInput): Promise<IdeasPageBody> {
  const response = await createPageRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as IdeasPageBody;
}

export async function updatePage(
  request: APIRequestContext,
  token: string,
  id: string,
  input: PageInput,
): Promise<IdeasPageBody> {
  const response = await updatePageRaw(request, token, id, input);
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as IdeasPageBody;
}

export async function deletePageApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/ideas-pages/${id}`, { headers: authHeaders(token) });
}

export const pageRow = (id: string) =>
  queryOne<{ id: string; title: string; description: string; public: number }>(
    "SELECT id, title, description, public FROM ideas_pages WHERE id = ?",
    [id],
  );

export const sectionRows = (pageId: string) =>
  queryAll<{ id: string; title: string }>("SELECT id, title FROM ideas_sections WHERE pageId = ? ORDER BY createdAt, id", [
    pageId,
  ]);

/** Mídia de TODAS as seções da página (a cascata é manual: não há FK em `media_items`). */
export const mediaRows = (pageId: string) =>
  queryAll<MediaRow & Record<string, unknown>>(
    `SELECT m.id, m.url, m.isLocalFile, m.storageKey, m.targetId
       FROM media_items m JOIN ideas_sections s ON s.id = m.targetId
      WHERE s.pageId = ? AND m.targetType = '${TARGET_TYPE}' ORDER BY m.createdAt, m.id`,
    [pageId],
  );

export const routeRows = (pageId: string) =>
  queryAll<{ id: string; path: string; public: number }>(
    `SELECT id, path, public FROM routes WHERE entityId = ? AND entityType = '${PAGE_TARGET_TYPE}'`,
    [pageId],
  );

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ pages: number; sections: number; media: number; routes: number }> {
  const one = async (sql: string): Promise<number> => Number((await queryOne<{ n: number }>(sql))?.n ?? 0);
  return {
    pages: await one("SELECT COUNT(*) AS n FROM ideas_pages"),
    sections: await one("SELECT COUNT(*) AS n FROM ideas_sections WHERE pageId IS NOT NULL"),
    media: await one(`SELECT COUNT(*) AS n FROM media_items WHERE targetType = '${TARGET_TYPE}'`),
    routes: await one(`SELECT COUNT(*) AS n FROM routes WHERE entityType = '${PAGE_TARGET_TYPE}'`),
  };
}

export async function pagesWithTag(tag: string): Promise<number> {
  return Number(
    (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM ideas_pages WHERE title LIKE ?", [`%${tag}%`]))?.n ?? 0,
  );
}
