import type { APIRequestContext, APIResponse } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll, queryOne } from "../support/db";
import { tagged } from "../support/factory";
import { authHeaders, expect } from "../support/live";
import { PNG_1X1, type TestFile } from "../support/media-scenarios";

export const BAD_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
export const PAGE_TARGET = "VisitMaterialsPage";
export const PAYLOAD_FIELD = "visitMaterialsPageData";
/** Acima dos 255 caracteres da coluna `title`: passa no DTO e falha de verdade no banco. */
export const OVERSIZED_TITLE = "t".repeat(300);

export const png = (name: string): TestFile => ({ name, mimeType: "image/png", buffer: PNG_1X1 });

export interface MediaInput {
  id?: string;
  file?: TestFile;
  url?: string;
  title?: string;
}

export interface SectionInput {
  id?: string;
  category: "BABY" | "CHILD" | "TEEN" | "ADULT";
  images?: MediaInput[];
}

export interface PageInput {
  title: string;
  sections?: SectionInput[];
  subtitle?: string;
  description?: string;
  currentWeek?: boolean;
  images?: MediaInput[];
}

export interface PageBody {
  id: string;
  title: string;
  currentWeek: boolean;
  route: { id: string; path: string; title: string };
  images: Array<{ id: string; url: string; isLocalFile?: boolean }>;
  videos: Array<{ id: string }>;
  documents: Array<{ id: string }>;
}

const mediaPayload = (
  media: MediaInput,
  fieldKey: string,
  multipart: Record<string, string | TestFile>,
): Record<string, unknown> => {
  const base = { title: media.title ?? "Imagem da visita", description: "Descrição", mediaType: "image" };
  if (media.file) {
    multipart[fieldKey] = media.file;
    return { ...(media.id ? { id: media.id } : {}), ...base, uploadType: "upload", isLocalFile: true, fieldKey };
  }
  if (media.id && !media.url) return { id: media.id, ...base, uploadType: "upload", isLocalFile: true };
  return {
    ...(media.id ? { id: media.id } : {}),
    ...base,
    uploadType: "link",
    isLocalFile: false,
    url: media.url ?? "https://example.com/img.png",
  };
};

/** Monta o multipart: o JSON no campo da página + um campo por arquivo novo (fieldKey = nome do campo). */
export function buildMultipart(input: PageInput, id?: string): Record<string, string | TestFile> {
  const multipart: Record<string, string | TestFile> = {};
  const images = (input.images ?? []).map((media, index) => mediaPayload(media, `img${index}`, multipart));
  const sections = input.sections?.map((section, s) => ({
    ...(section.id ? { id: section.id } : {}),
    category: section.category,
    title: `Seção ${section.category}`,
    images: (section.images ?? []).map((media, index) => mediaPayload(media, `sec${s}img${index}`, multipart)),
  }));
  multipart[PAYLOAD_FIELD] = JSON.stringify({
    ...(id ? { id, currentWeek: input.currentWeek ?? false } : {}),
    pageTitle: input.title,
    pageSubtitle: input.subtitle ?? "Subtítulo do E2E",
    pageDescription: input.description ?? "Descrição do E2E",
    images,
    ...(sections ? { sections } : {}),
  });
  return multipart;
}

export const createPageRaw = (request: APIRequestContext, token: string, input: PageInput): Promise<APIResponse> =>
  request.post(`${API_URL}/visit-material-pages`, { headers: authHeaders(token), multipart: buildMultipart(input) });

export const updatePageRaw = (request: APIRequestContext, token: string, id: string, input: PageInput): Promise<APIResponse> =>
  request.patch(`${API_URL}/visit-material-pages/${id}`, { headers: authHeaders(token), multipart: buildMultipart(input, id) });

export async function createPage(request: APIRequestContext, token: string, input: PageInput): Promise<PageBody> {
  const response = await createPageRaw(request, token, input);
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as PageBody;
}

export async function deletePageApi(request: APIRequestContext, token: string, id: string): Promise<void> {
  await request.delete(`${API_URL}/visit-material-pages/${id}`, { headers: authHeaders(token) });
}

export async function fetchPage(request: APIRequestContext, token: string, id: string): Promise<PageBody> {
  const response = await request.get(`${API_URL}/visit-material-pages/${id}`, { headers: authHeaders(token) });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as PageBody;
}

/** Reenvia a página como está (mantendo as imagens já gravadas) para editar só uma parte. */
export function inputFromBody(body: PageBody, overrides: Partial<PageInput> = {}): PageInput {
  return {
    title: body.title,
    currentWeek: body.currentWeek,
    images: body.images.map((image) => ({ id: image.id })),
    ...overrides,
  };
}

const count = async (sql: string, params: ReadonlyArray<string | number> = []): Promise<number> =>
  Number((await queryOne<{ n: number }>(sql, params))?.n ?? 0);

export const pageRow = (id: string) =>
  queryOne<{ id: string; title: string; currentWeek: number }>("SELECT id, title, currentWeek FROM visit_material_pages WHERE id = ?", [id]);

export const pagesWithTag = (tag: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM visit_material_pages WHERE title LIKE ?", [`%${tag}%`]);

export const mediaCount = (pageId: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ? AND targetId = ?", [PAGE_TARGET, pageId]);

/** Mídia das seções da página (alvo `VisitMaterialsSection`). */
export const sectionMediaCount = (pageId: string): Promise<number> =>
  count(
    `SELECT COUNT(*) AS n FROM media_items m JOIN visit_material_sections s ON s.id = m.targetId
      WHERE m.targetType = 'VisitMaterialsSection' AND s.page_id = ?`,
    [pageId],
  );

export const routesCount = (pageId: string): Promise<number> =>
  count("SELECT COUNT(*) AS n FROM routes WHERE entityId = ? AND entityType = 'VisitMaterialsPage'", [pageId]);

export const currentPageIds = async (): Promise<string[]> =>
  (await queryAll<{ id: string }>("SELECT id FROM visit_material_pages WHERE currentWeek = 1")).map((row) => row.id);

/** Foto do banco desta unidade: o que um cenário negativo não pode mudar. */
export async function snapshotDb(): Promise<{ pages: number; media: number; routes: number; sections: number }> {
  return {
    pages: await count("SELECT COUNT(*) AS n FROM visit_material_pages"),
    media: await count("SELECT COUNT(*) AS n FROM media_items WHERE targetType = ?", [PAGE_TARGET]),
    routes: await count("SELECT COUNT(*) AS n FROM routes WHERE entityType = 'VisitMaterialsPage'"),
    sections: await count("SELECT COUNT(*) AS n FROM visit_material_sections"),
  };
}

export const label = (name: string): string => tagged(name);

/** Página com testamento e seções por categoria (todos por link, sem upload). */
export interface MaterialInput {
  title: string;
  subtitle?: string;
  description?: string;
  testament?: "OLD_TESTAMENT" | "NEW_TESTAMENT";
  categories?: Array<"BABY" | "CHILD" | "TEEN" | "ADULT">;
}

export async function createMaterial(request: APIRequestContext, token: string, input: MaterialInput): Promise<PageBody> {
  const response = await request.post(`${API_URL}/visit-material-pages`, {
    headers: authHeaders(token),
    multipart: {
      [PAYLOAD_FIELD]: JSON.stringify({
        pageTitle: input.title,
        pageSubtitle: input.subtitle ?? "Subtítulo do E2E",
        pageDescription: input.description ?? "Descrição do E2E",
        testament: input.testament ?? "OLD_TESTAMENT",
        ...(input.categories
          ? {
              sections: input.categories.map((category) => ({
                category,
                title: `Seção ${category}`,
                documents: [
                  { title: `Doc ${category}`, description: "d", uploadType: "link", mediaType: "document", isLocalFile: false, url: "https://example.test/d.pdf", platformType: "googledrive" },
                ],
              })),
            }
          : {}),
      }),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as PageBody;
}
