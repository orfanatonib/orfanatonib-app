import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/config/axiosConfig", () => ({ default: http }));

import { apiDeleteVideoPage, apiGetVideoPage, fetchVideoPagesPage, apiSaveVideoPage } from "./api";

beforeEach(() => vi.clearAllMocks());

describe("features/video-pages/api", () => {
  it("lista no servidor: filtros vão na query e o envelope vira {items,total,totalPages}", async () => {
    const signal = new AbortController().signal;
    http.get.mockResolvedValueOnce({
      data: { data: [{ id: "1" }], meta: { page: 3, limit: 12, totalItems: 25, totalPages: 3 } },
    });
    expect(
      await fetchVideoPagesPage(
        { page: 3, limit: 12, search: "culto", filters: { public: "true", sort: "title:DESC", createdFrom: "2026-01-01" } },
        signal,
      ),
    ).toEqual({ items: [{ id: "1" }], total: 25, totalPages: 3 });
    expect(http.get).toHaveBeenCalledWith("/video-pages", {
      params: { page: 3, limit: 12, search: "culto", public: "true", sortBy: "title", order: "DESC", createdFrom: "2026-01-01" },
      signal,
    });
  });

  it("busca por id: GET /video-pages/:id", async () => {
    http.get.mockResolvedValueOnce({ data: { id: "9" } });
    expect(await apiGetVideoPage("9")).toEqual({ id: "9" });
    expect(http.get).toHaveBeenCalledWith("/video-pages/9");
  });

  it("exclui: DELETE /video-pages/:id", async () => {
    http.delete.mockResolvedValueOnce({});
    await apiDeleteVideoPage("9");
    expect(http.delete).toHaveBeenCalledWith("/video-pages/9");
  });

  it("salvar sem id cria (POST multipart); com id atualiza (PATCH multipart)", async () => {
    const form = new FormData();
    http.post.mockResolvedValueOnce({ data: { id: "n", route: { path: "p" } } });
    expect(await apiSaveVideoPage(form)).toEqual({ id: "n", route: { path: "p" } });
    expect(http.post).toHaveBeenCalledWith("/video-pages", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    http.patch.mockResolvedValueOnce({ data: { id: "7", route: { path: "q" } } });
    await apiSaveVideoPage(form, "7");
    expect(http.patch).toHaveBeenCalledWith("/video-pages/7", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  });

  it("erro da API propaga para quem chamou", async () => {
    http.post.mockRejectedValueOnce(new Error("400"));
    await expect(apiSaveVideoPage(new FormData())).rejects.toThrow("400");
  });
});
