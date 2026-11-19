import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const del = vi.fn();

vi.mock("@/config/axiosConfig", () => ({ default: { get, post, put, delete: del } }));

const api = await import("./api");

const comment = { id: "c1", name: "Ana", comment: "ótimo", shelter: "A", neighborhood: "B" } as never;

describe("api de comentários", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lê a fila (admin) e os publicados (público) em rotas diferentes", async () => {
    get.mockResolvedValue({ data: [] });
    await api.apiGetComments();
    await api.apiGetPublishedComments();
    expect(get).toHaveBeenNthCalledWith(1, "/comments");
    expect(get).toHaveBeenNthCalledWith(2, "/comments/published");
  });

  it("envia um depoimento por POST /comments", async () => {
    post.mockResolvedValue({});
    const payload = { name: "Ana", comment: "ótimo", shelter: "A", neighborhood: "B" };
    await api.apiSubmitComment(payload);
    expect(post).toHaveBeenCalledWith("/comments", payload);
  });

  it("publicar marca published=true e mantém os demais campos", async () => {
    put.mockResolvedValue({});
    await api.apiPublishComment(comment);
    expect(put).toHaveBeenCalledWith("/comments/c1", { name: "Ana", comment: "ótimo", shelter: "A", neighborhood: "B", published: true });
  });

  it("atualizar sem published explícito publica; com false despublica", async () => {
    put.mockResolvedValue({});
    const base = { name: "n", comment: "c", shelter: "s", neighborhood: "b" };
    await api.apiUpdateComment(comment, base);
    await api.apiUpdateComment(comment, { ...base, published: false });
    expect(put.mock.calls[0][1].published).toBe(true);
    expect(put.mock.calls[1][1].published).toBe(false);
  });

  it("exclui por id", async () => {
    del.mockResolvedValue({});
    await api.apiDeleteComment("c1");
    expect(del).toHaveBeenCalledWith("/comments/c1");
  });
});
