import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/config/axiosConfig", () => ({ default: http }));

import { apiDeleteVideoPage, apiGetVideoPage, apiListVideoPages, apiSaveVideoPage } from "./api";

beforeEach(() => vi.clearAllMocks());

describe("features/video-pages/api", () => {
  it("lista: GET /video-pages e devolve [] quando a resposta vem vazia", async () => {
    http.get.mockResolvedValueOnce({ data: [{ id: "1" }] });
    expect(await apiListVideoPages()).toEqual([{ id: "1" }]);
    expect(http.get).toHaveBeenCalledWith("/video-pages");
    http.get.mockResolvedValueOnce({ data: null });
    expect(await apiListVideoPages()).toEqual([]);
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
