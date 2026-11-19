import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock("@/config/axiosConfig", () => ({ default: { get, post, patch, delete: del } }));

const api = await import("./api");

describe("api de avaliações do site", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lista: resposta que não é array vira lista vazia", async () => {
    get.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: [{ id: "f1" }] });
    await expect(api.apiListFeedbacks()).resolves.toEqual([]);
    await expect(api.apiListFeedbacks()).resolves.toEqual([{ id: "f1" }]);
    expect(get).toHaveBeenCalledWith("/site-feedbacks");
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
