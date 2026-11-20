import type { APIRequestContext } from "@playwright/test";

import { API_URL } from "../../../playwright.live.config";
import { queryAll } from "../support/db";
import { authHeaders, expect } from "../support/live";

/** Apoio dos E2E de publicação (API e UI): material aprovado, flags e limpeza. */
export const CS = "/content-studio";

export const PUBLICATION_FLAGS = ["content_studio", "content_studio_review", "content_studio_publication", "page_management", "visit_materials"] as const;

export type Version = { id: string; contentChecksum: string };
export type Stage = { id: string; position: number; lockVersion: number; currentVersion: Version | null };
export type Pkg = { id: string; status: string; theme: string; tracks: Array<{ stages: Stage[] }> };

export const callApi = (request: APIRequestContext, token: string, method: "get" | "post" | "patch", path: string, data?: unknown) =>
  request.fetch(`${API_URL}${path}`, { method, headers: authHeaders(token), data });

export async function getPackage(request: APIRequestContext, token: string, id: string): Promise<Pkg> {
  return (await (await callApi(request, token, "get", `${CS}/packages/${id}`)).json()) as Pkg;
}

export async function createPackage(request: APIRequestContext, token: string, label: string, created: string[]): Promise<Pkg> {
  const res = await callApi(request, token, "post", `${CS}/packages`, {
    theme: `e2e-publicacao ${label} ${Date.now()}-${created.length}`,
    biblicalReferences: "Salmos 23",
    canonicalObjective: "Confiar no cuidado de Deus",
  });
  expect(res.status()).toBe(201);
  const pkg = (await res.json()) as Pkg;
  created.push(pkg.id);
  return pkg;
}

/** Cria o material e leva até READY_FOR_PUBLICATION: salva e conclui as 20 etapas (4 categorias × 5), envia para revisão e aprova todas. */
export async function createReadyPackage(request: APIRequestContext, token: string, label: string, created: string[]): Promise<Pkg> {
  const pkg = await createPackage(request, token, label, created);
  for (const track of pkg.tracks)
    for (const stage of [...track.stages].sort((x, y) => x.position - y.position)) {
      expect((await callApi(request, token, "patch", `${CS}/packages/${pkg.id}/stages/${stage.id}/content`, { structuredContent: { title: `Etapa ${stage.position}` } })).status()).toBe(200);
      expect([200, 201]).toContain((await callApi(request, token, "post", `${CS}/packages/${pkg.id}/stages/${stage.id}/complete-production`)).status());
    }
  // Sem lista, o envio leva as quatro categorias de uma vez.
  expect([200, 201]).toContain((await callApi(request, token, "post", `${CS}/packages/${pkg.id}/submit-review`, {})).status());
  for (const track of (await getPackage(request, token, pkg.id)).tracks)
    for (const stage of [...track.stages].sort((x, y) => x.position - y.position)) {
      const fresh = (await getPackage(request, token, pkg.id)).tracks.flatMap((t) => t.stages).find((item) => item.id === stage.id)!;
      const approved = await callApi(request, token, "post", `${CS}/packages/${pkg.id}/stages/${stage.id}/approve`, {
        versionId: fresh.currentVersion!.id,
        lockVersion: fresh.lockVersion,
        contentChecksum: fresh.currentVersion!.contentChecksum,
      });
      expect([200, 201]).toContain(approved.status());
    }
  const ready = await getPackage(request, token, pkg.id);
  expect(ready.status).toBe("READY_FOR_PUBLICATION");
  return ready;
}

export async function setFlag(request: APIRequestContext, token: string, key: string, enabled: boolean): Promise<void> {
  await request.patch(`${API_URL}/feature-flags/${key}`, { headers: authHeaders(token), data: { enabled } });
}

/** Remove as páginas publicadas (pela API, que também apaga os arquivos) e arquiva os materiais criados. */
export async function cleanupPackages(request: APIRequestContext, token: string, ids: readonly string[]): Promise<void> {
  for (const id of ids) {
    const pages = await queryAll<{ id: string }>("SELECT id FROM visit_material_pages WHERE sourceLessonId = ?", [id]);
    for (const page of pages) await request.delete(`${API_URL}/visit-material-pages/${page.id}`, { headers: authHeaders(token) });
    const pkg = await getPackage(request, token, id);
    if (pkg.status === "ARCHIVED") continue;
    // Arquivar exige conteúdo salvo em alguma etapa.
    const first = pkg.tracks[0]?.stages[0];
    if (first && pkg.status === "DRAFT") await callApi(request, token, "patch", `${CS}/packages/${id}/stages/${first.id}/content`, { structuredContent: { title: "a" } });
    await callApi(request, token, "post", `${CS}/packages/${id}/archive`);
  }
}
