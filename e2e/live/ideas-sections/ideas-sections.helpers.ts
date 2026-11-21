import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { authHeaders, expect } from "../support/live";
import { PNG_1X1, type TestFile } from "../support/media-scenarios";

export type SectionDto = {
  id: string;
  title: string;
  description: string;
  public: boolean;
  medias: Array<{ id: string; title: string; url: string; mediaType: string; uploadType: string }>;
  user?: { name: string; email: string; phone?: string };
};

export const png = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });
export const pdf = (name: string): TestFile => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n%%EOF"),
});

export const LINK_MEDIA = {
  uploadType: "link",
  mediaType: "video",
  isLocalFile: false,
  url: "https://youtu.be/abc",
  platformType: "youtube",
  title: "Vídeo",
  description: "Vídeo da ideia",
} as const;

export const uploadMedia = (fieldKey: string, title = "Foto") => ({
  uploadType: "upload",
  mediaType: "image",
  isLocalFile: true,
  fieldKey,
  title,
  description: "Foto da ideia",
});

export const sectionBody = (title: string, medias: unknown[] = [LINK_MEDIA], extra: object = {}) =>
  JSON.stringify({ title, description: `Descrição de ${title}`, public: true, medias, ...extra });

export async function createIdea(
  request: APIRequestContext,
  token: string,
  title: string,
  options: { medias?: unknown[]; files?: Record<string, TestFile> } = {},
): Promise<SectionDto> {
  const response = await request.post(`${API_URL}/ideas-sections`, {
    headers: authHeaders(token),
    multipart: { sectionData: sectionBody(title, options.medias), ...(options.files ?? {}) },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as SectionDto;
}

export async function createIdeasPage(request: APIRequestContext, adminToken: string, title: string): Promise<string> {
  const response = await request.post(`${API_URL}/ideas-pages`, {
    headers: authHeaders(adminToken),
    multipart: {
      ideasMaterialsPageData: JSON.stringify({ title, subtitle: "Sub", description: "Desc", sections: [] }),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

export async function deleteIdeasPage(request: APIRequestContext, adminToken: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/ideas-pages/${id}`, { headers: authHeaders(adminToken) });
}

export async function deleteIdea(request: APIRequestContext, adminToken: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/ideas-sections/${id}`, { headers: authHeaders(adminToken) });
}

export type SectionRow = { id: string; title: string; description: string; public: number; pageId: string | null; user_id: string | null };

export const sectionRow = (id: string) =>
  queryOne<SectionRow>("SELECT id, title, description, public, pageId, user_id FROM ideas_sections WHERE id = ?", [id]);

export const sectionRowsByTitle = (title: string) =>
  queryAll<SectionRow>("SELECT id, title, description, public, pageId, user_id FROM ideas_sections WHERE title LIKE ?", [`${title}%`]);

export const countSections = async (): Promise<number> =>
  Number((await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM ideas_sections"))?.n ?? 0);

export const mediaRows = (sectionId: string) =>
  queryAll<{ id: string; url: string; storageKey: string | null; targetType: string }>(
    "SELECT id, url, storageKey, targetType FROM media_items WHERE targetId = ? ORDER BY title, url",
    [sectionId],
  );
