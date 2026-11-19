import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { authHeaders } from "../support/live";

/**
 * Dados do feed criados **pela API** (nada por SQL): uma galeria própria do
 * cenário, seções propostas por um usuário e anexadas pelo admin. Tudo é
 * apagado por `removeGallery`/`removeSection` no `afterAll`.
 */
const IMAGE_LINK = {
  title: "foto",
  description: "foto de teste",
  uploadType: "link",
  mediaType: "image",
  isLocalFile: false,
  url: "https://example.com/e2e-feed.png",
  platformType: "googledrive",
};

export interface FeedSectionIds {
  id: string;
}

/** Galeria pública do cenário, com uma seção "legada" criada pelo admin (sem autor). */
export async function createGallery(
  request: APIRequestContext,
  adminToken: string,
  title: string,
  legacyCaption: string,
): Promise<{ pageId: string; legacySectionId: string }> {
  const response = await request.post(`${API_URL}/image-pages`, {
    headers: authHeaders(adminToken),
    multipart: {
      imageData: JSON.stringify({
        title,
        description: "galeria do cenário e2e",
        public: true,
        sections: [{ caption: legacyCaption, description: "seção legada", public: true, mediaItems: [IMAGE_LINK] }],
      }),
    },
  });
  if (!response.ok()) throw new Error(`createGallery falhou: ${response.status()} ${await response.text()}`);
  const page = (await response.json()) as { id: string; sections: Array<{ id: string }> };
  return { pageId: page.id, legacySectionId: page.sections[0].id };
}

/** Membro/líder/admin propõe a foto; o admin a anexa à galeria (publicada ou privada). */
export async function createFeedSection(
  request: APIRequestContext,
  authorToken: string,
  adminToken: string,
  pageId: string,
  caption: string,
  isPublic: boolean,
): Promise<string> {
  const body = { caption, description: "seção de teste", public: false, mediaItems: [IMAGE_LINK] };
  const created = await request.post(`${API_URL}/image-sections`, {
    headers: authHeaders(authorToken),
    multipart: { sectionData: JSON.stringify(body) },
  });
  if (!created.ok()) throw new Error(`POST /image-sections falhou: ${created.status()} ${await created.text()}`);
  const { id } = (await created.json()) as { id: string };

  const attached = await request.patch(`${API_URL}/image-sections/${id}`, {
    headers: authHeaders(adminToken),
    multipart: { sectionData: JSON.stringify({ ...body, public: isPublic, pageId }) },
  });
  if (!attached.ok()) throw new Error(`PATCH /image-sections falhou: ${attached.status()} ${await attached.text()}`);
  return id;
}

export async function removeSection(request: APIRequestContext, adminToken: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/image-sections/${id}`, { headers: authHeaders(adminToken) });
}

export async function removeGallery(request: APIRequestContext, adminToken: string, pageId: string): Promise<void> {
  await request.delete(`${API_URL}/image-pages/${pageId}`, { headers: authHeaders(adminToken) });
}

export interface FeedSectionView {
  id: string;
  caption: string;
  author: { displayName: string } | null;
  celebrationCount: number;
  celebratedByMe: boolean;
  commentCount: number;
}

export async function readFeed(
  request: APIRequestContext,
  pageId: string,
  token?: string,
  limit = 50,
): Promise<FeedSectionView[]> {
  const response = await request.get(`${API_URL}/image-pages/${pageId}/sections?page=1&limit=${limit}`, {
    headers: token ? authHeaders(token) : {},
  });
  if (!response.ok()) throw new Error(`feed falhou: ${response.status()}`);
  return ((await response.json()) as { sections: FeedSectionView[] }).sections;
}

export async function setFlag(
  request: APIRequestContext,
  adminToken: string,
  key: string,
  enabled: boolean,
): Promise<void> {
  const response = await request.patch(`${API_URL}/feature-flags/${key}`, {
    headers: authHeaders(adminToken),
    data: { enabled },
  });
  if (!response.ok()) throw new Error(`flag ${key} falhou: ${response.status()}`);
}
