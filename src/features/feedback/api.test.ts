import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock("@/config/axiosConfig", () => ({ default: { get, post, patch, delete: del } }));

const api = await import("./api");

describe("api de avaliações do site", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lista paginada: filtros e ordenação viram query string e o envelope vira itens e total", async () => {
    get.mockResolvedValue({
      data: { data: [{ id: "f1" }], meta: { page: 2, limit: 12, totalItems: 13, totalPages: 2 } },
    });
    const signal = new AbortController().signal;
    const page = await api.fetchFeedbacksPage(
      { page: 2, limit: 12, search: " ótimo ", filters: { read: "false", rating: "4", category: "", sort: "rating:DESC" } },
      signal,
    );
    expect(page).toEqual({ items: [{ id: "f1" }], total: 13, totalPages: 2 });
    expect(get).toHaveBeenCalledWith("/site-feedbacks", {
      params: { page: 2, limit: 12, search: "ótimo", read: "false", rating: "4", sortBy: "rating", order: "DESC" },
      signal,
    });
  });

  it("envia a avaliação por POST e devolve a criada", async () => {
    post.mockResolvedValue({ data: { id: "f9" } });
    await expect(api.apiSubmitFeedback({ rating: 5 } as never)).resolves.toEqual({ id: "f9" });
    expect(post).toHaveBeenCalledWith("/site-feedbacks", { rating: 5 });
  });

  it("marca como lida e exclui nas rotas certas", async () => {
    patch.mockResolvedValue({ data: { id: "f1", read: true } });
    del.mockResolvedValue({});
    await expect(api.apiMarkAsRead("f1")).resolves.toEqual({ id: "f1", read: true });
    await api.apiDeleteFeedback("f1");
    expect(patch).toHaveBeenCalledWith("/site-feedbacks/f1/read");
    expect(del).toHaveBeenCalledWith("/site-feedbacks/f1");
  });
});
