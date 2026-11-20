import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { closeDb, countRows, queryAll, queryOne } from "../support/db";
import { expect, loginAs, test } from "../support/live";
import {
  CS,
  PUBLICATION_FLAGS,
  callApi,
  cleanupPackages,
  createPackage,
  createReadyPackage,
  getPackage,
  setFlag as setFlagFor,
  type Pkg,
} from "./publication.fixtures";

/**
 * Publicação do material (plano 44): material aprovado vira uma página de materiais para visita (`visit_material_pages`,
 * `sourceLessonId` = id do material) com os documentos DOCX/PDF das versões aprovadas. API ao vivo + MySQL + LibreOffice.
 * Tudo o que o teste cria é removido no fim (páginas pela API; materiais arquivados).
 */
const U = "00000000-0000-4000-8000-000000000000";
const before: Record<string, number> = {};
const createdPackages: string[] = [];
let admin = "";
let leader = "";

type Publication = {
  id: string;
  packageId: string;
  status: string;
  visitMaterialPageId: string | null;
  visitMaterialPagePath: string | null;
  publishedAt: string | null;
};

const call = (request: APIRequestContext, method: "get" | "post" | "patch", path: string, data?: unknown, token = admin) =>
  callApi(request, token, method, path, data);
const getPkg = (request: APIRequestContext, id: string) => getPackage(request, admin, id);
const newPackage = (request: APIRequestContext) => createPackage(request, admin, "api", createdPackages);
const readyPackage = (request: APIRequestContext) => createReadyPackage(request, admin, "api", createdPackages);
const setFlag = (request: APIRequestContext, key: string, enabled: boolean) => setFlagFor(request, admin, key, enabled);

const publish = (request: APIRequestContext, packageId: string, body: unknown, token = admin) =>
  call(request, "post", `${CS}/packages/${packageId}/publish`, body, token);

test.describe.serial("Estúdio — publicação como página de materiais para visita", () => {
  let ready: Pkg;
  let first: Publication;
  const key = `e2e-pub-${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    admin = (await loginAs(request, "admin")).accessToken;
    leader = (await loginAs(request, "leader")).accessToken;
    for (const flag of PUBLICATION_FLAGS) {
      before[flag] = (await queryOne<{ enabled: number }>("SELECT enabled FROM feature_flags WHERE `key` = ?", [flag]))?.enabled ?? 0;
      await setFlag(request, flag, true);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupPackages(request, admin, createdPackages);
    for (const flag of PUBLICATION_FLAGS) await setFlag(request, flag, before[flag] === 1);
    await closeDb();
  });

  test("[content-studio.post.content-studio-packages-packageid-publish#feliz] publica o material aprovado como página de materiais", async ({ request }) => {
    test.setTimeout(100_000);
    ready = await readyPackage(request);
    const res = await publish(request, ready.id, { idempotencyKey: key, testament: "NEW_TESTAMENT" });
    expect(res.status()).toBe(201);
    first = (await res.json()) as Publication;
    expect(first).toMatchObject({ status: "PUBLISHED", packageId: ready.id });
    expect(first.visitMaterialPageId).toBeTruthy();
    expect(first.visitMaterialPagePath).toBeTruthy();
    expect(first.publishedAt).toBeTruthy();
    // nunca a entidade crua
    expect(Object.keys(first)).not.toEqual(expect.arrayContaining(["idempotencyKey"]));
    expect(JSON.stringify(first)).not.toContain("requestedById");

    expect((await getPkg(request, ready.id)).status).toBe("PUBLISHED");
    const pages = await queryAll<{ id: string; title: string; subtitle: string; description: string; testament: string }>(
      "SELECT id, title, subtitle, description, testament FROM visit_material_pages WHERE sourceLessonId = ?",
      [ready.id],
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({
      id: first.visitMaterialPageId,
      title: ready.theme,
      subtitle: "Salmos 23",
      description: "Confiar no cuidado de Deus",
      testament: "NEW_TESTAMENT",
    });
    const media = await queryAll<{ mediaType: string; originalName: string; isLocalFile: number; size: number }>(
      "SELECT mediaType, originalName, isLocalFile, size FROM media_items WHERE targetId = ? AND targetType = 'VisitMaterialsPage'",
      [pages[0].id],
    );
    // quatro categorias (PDF + DOCX cada) + o pacote completo (PDF + DOCX)
    expect(media).toHaveLength(10);
    expect(media.every((item) => item.mediaType === "document" && item.isLocalFile === 1 && Number(item.size) > 0)).toBe(true);
    expect(media.map((item) => item.originalName.split(".").pop()).sort()).toEqual(Array(5).fill("docx").concat(Array(5).fill("pdf")));
    const row = await queryOne<{ status: string; visit_material_page_id: string }>(
      "SELECT status, visit_material_page_id FROM content_publications WHERE idempotencyKey = ?",
      [key],
    );
    expect(row).toMatchObject({ status: "PUBLISHED", visit_material_page_id: pages[0].id });
  });

  test("[content-studio.post.content-studio-packages-packageid-publish#idempotencia] mesma chave devolve a mesma publicação, sem segunda página", async ({ request }) => {
    const res = await publish(request, ready.id, { idempotencyKey: key, testament: "NEW_TESTAMENT" });
    expect(res.status()).toBe(201);
    const again = (await res.json()) as Publication;
    expect(again.id).toBe(first.id);
    expect(again.visitMaterialPageId).toBe(first.visitMaterialPageId);
    expect(await countRows("visit_material_pages", { sourceLessonId: ready.id })).toBe(1);
    expect(await countRows("content_publications", { package_id: ready.id })).toBe(1);
    expect(await countRows("media_items", { targetId: first.visitMaterialPageId!, targetType: "VisitMaterialsPage" })).toBe(10);
  });

  test("[content-studio.post.content-studio-packages-packageid-publish#conflito-ou-duplicidade] chave de outro material ou material já publicado => 409", async ({ request }) => {
    expect((await publish(request, ready.id, { idempotencyKey: `${key}-novo` })).status()).toBe(409);
    const other = await newPackage(request);
    expect((await publish(request, other.id, { idempotencyKey: key })).status()).toBe(409);
    expect(await countRows("visit_material_pages", { sourceLessonId: ready.id })).toBe(1);
  });

  test("[content-studio.post.content-studio-packages-packageid-publish#estado-invalido] material fora de READY_FOR_PUBLICATION => 409 sem efeito", async ({ request }) => {
    const draft = await newPackage(request);
    const res = await publish(request, draft.id, { idempotencyKey: `e2e-draft-${Date.now()}` });
    expect(res.status()).toBe(409);
    expect((await getPkg(request, draft.id)).status).toBe("DRAFT");
    expect(await countRows("visit_material_pages", { sourceLessonId: draft.id })).toBe(0);
    expect(await countRows("content_publications", { package_id: draft.id })).toBe(0);
  });

  test("[content-studio.post.content-studio-packages-packageid-publish#validacao] corpo sem chave ou testamento inválido => 400", async ({ request }) => {
    const draft = createdPackages[createdPackages.length - 1];
    expect((await publish(request, draft, {})).status()).toBe(400);
    expect((await publish(request, draft, { idempotencyKey: "k", testament: "OUTRO" })).status()).toBe(400);
    expect((await publish(request, draft, { idempotencyKey: "x".repeat(192) })).status()).toBe(400);
  });

  test("[content-studio.post.content-studio-packages-packageid-publish#nao-encontrado] material inexistente => 404", async ({ request }) => {
    expect((await publish(request, U, { idempotencyKey: `e2e-404-${Date.now()}` })).status()).toBe(404);
  });

  test("[content-studio.post.content-studio-packages-packageid-publish#sem-token] sem token => 401; líder => 403", async ({ request }) => {
    const bare = await request.post(`${API_URL}${CS}/packages/${U}/publish`, { data: { idempotencyKey: "k" } });
    expect(bare.status()).toBe(401);
    expect((await publish(request, U, { idempotencyKey: "k" }, leader)).status()).toBe(403);
  });

  test("[content-studio.post.content-studio-packages-packageid-publish#flag-desligada] flag de publicação desligada => 403 e nada muda", async ({ request }) => {
    const second = await readyPackage(request);
    await setFlag(request, "content_studio_publication", false);
    try {
      expect((await publish(request, second.id, { idempotencyKey: `e2e-flag-${Date.now()}` })).status()).toBe(403);
      expect((await call(request, "get", `${CS}/packages/${second.id}/publication`)).status()).toBe(403);
    } finally {
      await setFlag(request, "content_studio_publication", true);
    }
    expect((await getPkg(request, second.id)).status).toBe("READY_FOR_PUBLICATION");
    expect(await countRows("visit_material_pages", { sourceLessonId: second.id })).toBe(0);
  });

  test("[content-studio.get.content-studio-packages-packageid-publication#feliz] devolve a última publicação (200) ou 204 sem publicação", async ({ request }) => {
    const res = await call(request, "get", `${CS}/packages/${ready.id}/publication`);
    expect(res.status()).toBe(200);
    const latest = (await res.json()) as Publication;
    expect(latest).toMatchObject({ id: first.id, status: "PUBLISHED", visitMaterialPagePath: first.visitMaterialPagePath });
    const draft = await newPackage(request);
    expect((await call(request, "get", `${CS}/packages/${draft.id}/publication`)).status()).toBe(204);
  });
});
