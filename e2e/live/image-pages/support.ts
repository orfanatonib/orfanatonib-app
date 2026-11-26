import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { authHeaders, expect } from "../support/live";
import { PNG_1X1, type TestFile } from "../support/media-scenarios";

export const TARGET_TYPE = "ImagesPage";
export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const LINK_URL = "https://example.com/foto.png";
/** Acima dos 255 caracteres da coluna `caption`: passa no DTO e falha de verdade no banco. */
export const OVERSIZED_CAPTION = "x".repeat(300);

export interface MediaInput {
  id?: string;
  file?: TestFile;
  url?: string;
  title?: string;
}

export interface SectionInput {
  id?: string;
  caption: string;
  description?: string;
  isPublic?: boolean;
  media: MediaInput[];
}

export interface PageInput {
  id?: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  sections: SectionInput[];
}

export interface ImagePageBody {
  id: string;
  title: string;
  description: string;
  public: boolean;
  route: { path: string; entityId: string };
  sections: Array<{
    id: string;
    caption: string;
    mediaItems: Array<{ id: string; url: string; isLocalFile: boolean }>;
  }>;
}

export const png = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });

/** Monta o multipart da API: `imageData` + um campo por arquivo novo (`file_sec<S>_mid<M>`, como a tela). */
export function buildMultipart(input: PageInput): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  const sections = input.sections.map((section, s) => ({
    ...(section.id ? { id: section.id } : {}),
    caption: section.caption,
    description: section.description ?? `Descrição de ${section.caption}`,
    public: section.isPublic ?? true,
    mediaItems: section.media.map((media, m) => {
      const fieldKey = `file_sec${s}_mid${m}`;
      const isUpload = Boolean(media.file) || Boolean(media.id && !media.url);
      if (media.file) multipart[fieldKey] = media.file;
      return {
        ...(media.id ? { id: media.id } : {}),
        title: media.title ?? "",
        description: "",
        uploadType: isUpload ? "upload" : "link",
        mediaType: "image",
        isLocalFile: isUpload,
        url: isUpload ? undefined : (media.url ?? LINK_URL),
        platformType: isUpload ? undefined : "ANY",
        originalName: media.file?.name,
        fieldKey: media.file ? fieldKey : undefined,
      };
    }),
  }));
  multipart.imageData = JSON.stringify({
    ...(input.id ? { id: input.id } : {}),
    title: input.title,
    description: input.description ?? `Descrição de ${input.title}`,
    public: input.isPublic ?? true,
    sections,
  });
  return multipart;
}

export const createPageRaw = (request: APIRequestContext, token: string, input: PageInput) =>
  request.post(`${API_URL}/image-pages`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export const updatePageRaw = (request: APIRequestContext, token: string, id: string, input: PageInput) =>
  request.patch(`${API_URL}/image-pages/${id}`, {
    headers: authHeaders(token),
    multipart: buildMultipart({ ...input, id }),
  });

export async function createPage(request: APIRequestContext, token: string, input: PageInput): Promise<ImagePageBody> {
  const response = await createPageRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as ImagePageBody;
}

export async function updatePage(
  request: APIRequestContext,
  token: string,
  id: string,
  input: PageInput,
): Promise<ImagePageBody> {
  const response = await updatePageRaw(request, token, id, input);
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as ImagePageBody;
}

export async function deletePageApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/image-pages/${id}`, { headers: authHeaders(token) });
}

export async function fetchPage(request: APIRequestContext, token: string, id: string): Promise<ImagePageBody> {
  const response = await request.get(`${API_URL}/image-pages/${id}`, { headers: authHeaders(token) });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as ImagePageBody;
}

/** Reenvia a galeria como está, preservando seções e mídias já gravadas (para editar só uma parte). */
export function inputFromBody(body: ImagePageBody, overrides: Partial<PageInput> = {}): PageInput {
  return {
    title: body.title,
    description: body.description,
    isPublic: body.public,
    sections: body.sections.map((section) => ({
      id: section.id,
      caption: section.caption,
      media: section.mediaItems.map((item) => ({ id: item.id })),
    })),
    ...overrides,
  };
}

export const pageRow = (id: string) =>
  queryOne<{ id: string; name: string; description: string; public: number }>(
    "SELECT id, name, description, public FROM image_pages WHERE id = ?",
    [id],
  );

export const sectionRows = (pageId: string) =>
  queryAll<{ id: string; caption: string; public: number; reviewStatus: string }>(
    "SELECT id, caption, public, reviewStatus FROM image_sections WHERE pageId = ? ORDER BY createdAt, id",
    [pageId],
  );

export const mediaRows = (pageId: string) =>
  queryAll<{ id: string; url: string; isLocalFile: number; targetId: string }>(
    `SELECT m.id, m.url, m.isLocalFile, m.targetId FROM media_items m
       JOIN image_sections s ON s.id = m.targetId
      WHERE s.pageId = ? AND m.targetType = '${TARGET_TYPE}' ORDER BY m.createdAt, m.id`,
    [pageId],
  );

export const routeRows = (pageId: string) =>
  queryAll<{ id: string; path: string }>(
    `SELECT id, path FROM routes WHERE entityId = ? AND entityType = '${TARGET_TYPE}'`,
    [pageId],
  );

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ pages: number; sections: number; media: number; routes: number }> {
  const one = async (sql: string): Promise<number> => Number((await queryOne<{ n: number }>(sql))?.n ?? 0);
  return {
    pages: await one("SELECT COUNT(*) AS n FROM image_pages"),
    sections: await one("SELECT COUNT(*) AS n FROM image_sections"),
    media: await one(`SELECT COUNT(*) AS n FROM media_items WHERE targetType = '${TARGET_TYPE}'`),
    routes: await one(`SELECT COUNT(*) AS n FROM routes WHERE entityType = '${TARGET_TYPE}'`),
  };
}

export async function pagesWithTag(tag: string): Promise<number> {
  return Number(
    (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM image_pages WHERE name LIKE ?", [`%${tag}%`]))?.n ?? 0,
  );
}

export async function sectionsWithTag(tag: string): Promise<number> {
  return Number(
    (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM image_sections WHERE caption LIKE ?", [`%${tag}%`]))?.n ?? 0,
  );
}
