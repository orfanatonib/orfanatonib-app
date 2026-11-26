import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock("@/config/axiosConfig", () => ({ default: { get, post, patch, delete: del } }));

const { apiCreatePagela, apiDeletePagela, apiListPagelasPaginated, apiUpdatePagela } = await import("./api");

describe("api da pagela", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lista paginada envia os filtros e o signal", async () => {
    get.mockResolvedValue({ data: { items: [], total: 0 } });
    const signal = new AbortController().signal;
    await apiListPagelasPaginated({ shelteredId: "s1", page: 2 }, { signal });
    expect(get).toHaveBeenCalledWith("/pagelas/paginated", { params: { shelteredId: "s1", page: 2 }, signal });
  });

  it("cria, atualiza e remove nas rotas certas", async () => {
    post.mockResolvedValue({ data: { id: "p1" } });
    patch.mockResolvedValue({ data: { id: "p1" } });
    del.mockResolvedValue({});
    await expect(apiCreatePagela({ shelteredId: "s1" } as never)).resolves.toEqual({ id: "p1" });
    await expect(apiUpdatePagela("p1", { present: false } as never)).resolves.toEqual({ id: "p1" });
    await expect(apiDeletePagela("p1")).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/pagelas", { shelteredId: "s1" });
    expect(patch).toHaveBeenCalledWith("/pagelas/p1", { present: false });
    expect(del).toHaveBeenCalledWith("/pagelas/p1");
  });
});
