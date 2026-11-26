import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { authHeaders, expect } from "../support/live";
import { PNG_1X1, type TestFile } from "../support/media-scenarios";
import { outboxRows } from "../support/outbox";

export const TARGET_TYPE = "ImagesPage";
export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const LINK_URL = "https://example.com/foto-e2e.png";
/** Acima dos 255 caracteres da coluna `caption`: passa no DTO e falha de verdade no banco. */
export const OVERSIZED_CAPTION = "x".repeat(300);
/** Flags que governam a unidade: ligá-las é pré-condição dos cenários, e cada spec as restaura. */
export const SECTION_FLAGS = ["shelter_photo_upload", "photo_moderation"] as const;
export const EMAIL_FLAGS = ["email_delivery", "email_image_shared_notification"] as const;

export const png = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });

export interface MediaInput {
  id?: string;
  file?: TestFile;
  url?: string;
  /** Quando `true` o item usa o MESMO campo de arquivo do anterior (envio repetido, deve ser recusado). */
  reuseFieldOfPrevious?: boolean;
}

export interface SectionInput {
  caption: string;
  description?: string;
  isPublic?: boolean;
  pageId?: string;
  media: MediaInput[];
  /** Campos extras no JSON (para provar que o DTO recusa o que não conhece). */
  extra?: Record<string, unknown>;
}

export interface SectionBody {
  id: string;
  caption: string;
  description: string;
  public: boolean;
  reviewStatus: string;
  rejectionReason: string | null;
  authorId: string | null;
  author: { displayName: string } | null;
  mediaItems: Array<{ id: string; url: string; isLocalFile: boolean; mediaType: string }>;
}

/** Monta o multipart da API: `sectionData` + um campo por arquivo novo (`file_<n>`). */
export function buildMultipart(input: SectionInput): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  let previousKey: string | undefined;
  const mediaItems = input.media.map((media, index) => {
    const fieldKey = media.reuseFieldOfPrevious && previousKey ? previousKey : `file_${index}`;
    const isUpload = Boolean(media.file) || Boolean(media.id && !media.url) || Boolean(media.reuseFieldOfPrevious);
    if (media.file) multipart[fieldKey] = media.file;
    if (media.file) previousKey = fieldKey;
    return {
      ...(media.id ? { id: media.id } : {}),
      title: "",
      description: "",
      uploadType: isUpload ? "upload" : "link",
      mediaType: "image",
      isLocalFile: isUpload,
      url: isUpload ? undefined : (media.url ?? LINK_URL),
      platformType: isUpload ? undefined : "ANY",
      originalName: media.file?.name,
      fieldKey: media.file || media.reuseFieldOfPrevious ? fieldKey : undefined,
    };
  });
  multipart.sectionData = JSON.stringify({
    caption: input.caption,
    description: input.description ?? `Descrição de ${input.caption}`,
    public: input.isPublic ?? false,
    ...(input.pageId ? { pageId: input.pageId } : {}),
    mediaItems,
    ...input.extra,
  });
  return multipart;
}

const headersOf = (token?: string): Record<string, string> => (token ? authHeaders(token) : {});

export const submitRaw = (request: APIRequestContext, token: string | undefined, input: SectionInput) =>
  request.post(`${API_URL}/image-sections`, { headers: headersOf(token), multipart: buildMultipart(input) });

export const patchRaw = (request: APIRequestContext, token: string | undefined, id: string, input: SectionInput) =>
  request.patch(`${API_URL}/image-sections/${id}`, { headers: headersOf(token), multipart: buildMultipart(input) });

export const deleteRaw = (request: APIRequestContext, token: string | undefined, id: string) =>
  request.delete(`${API_URL}/image-sections/${id}`, { headers: headersOf(token) });

export const getRaw = (request: APIRequestContext, token: string | undefined, path: string) =>
  request.get(`${API_URL}/image-sections${path}`, { headers: headersOf(token) });

export async function submit(request: APIRequestContext, token: string, input: SectionInput): Promise<SectionBody> {
  const response = await submitRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as SectionBody;
}

export async function fetchSection(request: APIRequestContext, adminToken: string, id: string): Promise<SectionBody> {
  const response = await getRaw(request, adminToken, `/${id}`);
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as SectionBody;
}

/** Reenvia a publicação como está (mídias já gravadas por id), para editar só uma parte dela. */
export function inputFromBody(body: SectionBody, overrides: Partial<SectionInput> = {}): SectionInput {
  return {
    caption: body.caption,
    description: body.description,
    isPublic: body.public,
    media: body.mediaItems.map((item) => ({ id: item.id })),
    ...overrides,
  };
}

/** Aprova como o admin faz na tela: PATCH com `public: true` e a galeria de destino. */
export async function approve(
  request: APIRequestContext,
  adminToken: string,
  body: SectionBody,
  pageId: string,
  overrides: Partial<SectionInput> = {},
): Promise<APIResponse> {
  return patchRaw(request, adminToken, body.id, inputFromBody(body, { isPublic: true, pageId, ...overrides }));
}

/** Galeria pública do cenário (destino da aprovação), criada e apagada pela API. */
export async function createGallery(request: APIRequestContext, adminToken: string, title: string): Promise<string> {
  const response = await request.post(`${API_URL}/image-pages`, {
    headers: authHeaders(adminToken),
    multipart: {
      imageData: JSON.stringify({
        title,
        description: "galeria do cenário e2e",
        public: true,
        sections: [
          {
            caption: `${title} legada`,
            description: "seção legada",
            public: true,
            mediaItems: [
              {
                title: "foto",
                description: "",
                uploadType: "link",
                mediaType: "image",
                isLocalFile: false,
                url: LINK_URL,
                platformType: "ANY",
              },
            ],
          },
        ],
      }),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

export const removeGallery = (request: APIRequestContext, adminToken: string, pageId: string) =>
  request.delete(`${API_URL}/image-pages/${pageId}`, { headers: authHeaders(adminToken) });

export type SectionRow = {
  id: string;
  caption: string;
  description: string;
  public: number;
  pageId: string | null;
  authorId: string | null;
  reviewStatus: string;
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
};

export const sectionRow = (id: string) =>
  queryOne<SectionRow>(
    "SELECT id, caption, description, public, pageId, authorId, reviewStatus, rejectionReason, reviewedById, reviewedAt FROM image_sections WHERE id = ?",
    [id],
  );

export const mediaRows = (sectionId: string) =>
  queryAll<{ id: string; url: string; isLocalFile: number; mediaType: string; targetId: string }>(
    `SELECT id, url, isLocalFile, mediaType, targetId FROM media_items WHERE targetType = '${TARGET_TYPE}' AND targetId = ? ORDER BY createdAt, id`,
    [sectionId],
  );

export async function sectionsWithTag(tag: string): Promise<number> {
  return Number(
    (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM image_sections WHERE caption LIKE ?", [`%${tag}%`]))?.n ?? 0,
  );
}

export async function mediaWithTag(tag: string): Promise<number> {
  return Number(
    (
      await queryOne<{ n: number }>(
        `SELECT COUNT(*) AS n FROM media_items m JOIN image_sections s ON s.id = m.targetId
          WHERE m.targetType = '${TARGET_TYPE}' AND s.caption LIKE ?`,
        [`%${tag}%`],
      )
    )?.n ?? 0,
  );
}

export async function pendingCount(): Promise<number> {
  return Number(
    (await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM image_sections WHERE reviewStatus = 'pending'"))?.n ?? 0,
  );
}

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ sections: number; media: number; pending: number }> {
  const one = async (sql: string): Promise<number> => Number((await queryOne<{ n: number }>(sql))?.n ?? 0);
  return {
    sections: await one("SELECT COUNT(*) AS n FROM image_sections"),
    media: await one(`SELECT COUNT(*) AS n FROM media_items WHERE targetType = '${TARGET_TYPE}'`),
    pending: await pendingCount(),
  };
}

/** Linhas do outbox de um modelo de e-mail cujo texto cita a legenda do cenário. */
export const outboxFor = (templateKey: string, caption: string) =>
  outboxRows<{ status: string; recipient: string; subject: string }>(
    "status, recipient, subject",
    "templateKey = ? AND text LIKE ?",
    [templateKey, `%${caption}%`],
  );
