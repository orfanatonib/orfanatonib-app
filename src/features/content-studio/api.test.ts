import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContentAudience } from "./types";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock("@/config/axiosConfig", () => ({ default: { get, post, patch, delete: del } }));

const api = await import("./api");

const P = "p1";
const S = "s1";

describe("api do Estúdio — rotas e corpos", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    get.mockResolvedValue({ data: { ok: true } });
    post.mockResolvedValue({ data: { ok: true } });
    patch.mockResolvedValue({ data: { ok: true } });
    del.mockResolvedValue({ data: { ok: true } });
  });

  it("geração: pede por POST, acompanha por GET .../latest, cancela por DELETE", async () => {
    await api.requestStageGeneration(P, S, { capability: "TEXT_STRUCTURED", idempotencyKey: "k" } as never);
    await api.getLatestStageGeneration(P, S);
    await api.cancelStageGeneration(P, S);
    expect(post).toHaveBeenCalledWith(`/content-studio/packages/${P}/stages/${S}/generations`, { capability: "TEXT_STRUCTURED", idempotencyKey: "k" });
    expect(get).toHaveBeenCalledWith(`/content-studio/packages/${P}/stages/${S}/generations/latest`);
    expect(del).toHaveBeenCalledWith(`/content-studio/packages/${P}/stages/${S}/generations`);
  });

  it("job mais recente: corpo vazio (nunca houve geração) vira null", async () => {
    get.mockResolvedValueOnce({ data: "" });
    await expect(api.getLatestStageGeneration(P, S)).resolves.toBeNull();
    get.mockResolvedValueOnce({ data: { id: "j1" } });
    await expect(api.getLatestStageGeneration(P, S)).resolves.toEqual({ id: "j1" });
  });

  it("conteúdo e produção da etapa", async () => {
    await api.saveStageContent(P, S, { structuredContent: { a: 1 } } as never);
    await api.completeProductionStage(P, S);
    expect(patch).toHaveBeenCalledWith(`/content-studio/packages/${P}/stages/${S}/content`, { structuredContent: { a: 1 } });
    expect(post).toHaveBeenCalledWith(`/content-studio/packages/${P}/stages/${S}/complete-production`);
  });

  it("revisão: submeter, aprovar, pedir ajustes e resolver comentário", async () => {
    await api.submitPackageReview(P);
    await api.approveReviewStage(P, S, { note: "ok" } as never);
    await api.requestStageChanges(P, S, { message: "ajustar" } as never);
    await api.resolveReviewComment(P, "c1");
    expect(post).toHaveBeenCalledWith(`/content-studio/packages/${P}/submit-review`, {});
    await api.submitPackageReview(P, [ContentAudience.TEEN]);
    expect(post).toHaveBeenLastCalledWith(`/content-studio/packages/${P}/submit-review`, { audiences: ["TEEN"] });
    expect(post).toHaveBeenCalledWith(`/content-studio/packages/${P}/stages/${S}/approve`, { note: "ok" });
    expect(post).toHaveBeenCalledWith(`/content-studio/packages/${P}/stages/${S}/request-changes`, { message: "ajustar" });
    expect(post).toHaveBeenCalledWith(`/content-studio/packages/${P}/review-comments/c1/resolve`);
  });

  it("arquivar e painel (com o signal repassado)", async () => {
    const signal = new AbortController().signal;
    await api.archiveContentPackage(P);
    await api.getContentStudioDashboard({}, signal);
    expect(post).toHaveBeenCalledWith(`/content-studio/packages/${P}/archive`);
    expect(get).toHaveBeenCalledWith("/content-studio/dashboard", { params: {}, signal });
  });
});
