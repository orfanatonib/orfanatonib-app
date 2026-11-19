import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock("@/config/axiosConfig", () => ({ default: { get, post, patch, delete: del } }));

const api = await import("./api");

describe("api de materiais de visita", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lista com os filtros e trata resposta vazia como lista vazia", async () => {
    get.mockResolvedValue({ data: undefined });
    await expect(api.listVisitMaterials({ testament: "OLD_TESTAMENT" } as never)).resolves.toEqual([]);
    expect(get).toHaveBeenCalledWith("/visit-material-pages", { params: { testament: "OLD_TESTAMENT" } });
  });

  it("cria e atualiza com o FormData e as rotas certas", async () => {
    const form = new FormData();
    post.mockResolvedValue({ data: { id: "v1" } });
    patch.mockResolvedValue({ data: { id: "v1" } });
    await expect(api.createVisitMaterial(form)).resolves.toEqual({ id: "v1" });
    await expect(api.updateVisitMaterial({ id: "v1" }, form)).resolves.toEqual({ id: "v1" });
    expect(post).toHaveBeenCalledWith("/visit-material-pages", form);
    expect(patch).toHaveBeenCalledWith("/visit-material-pages/v1", form);
  });

  it("remove e define o material da semana", async () => {
    del.mockResolvedValue({});
    post.mockResolvedValue({ data: { id: "v1" } });
    await expect(api.deleteVisitMaterial({ id: "v1" })).resolves.toBeUndefined();
    await expect(api.setCurrentMaterial({ id: "v1" })).resolves.toEqual({ id: "v1" });
    expect(del).toHaveBeenCalledWith("/visit-material-pages/v1");
    expect(post).toHaveBeenCalledWith("/visit-material-pages/current-material/v1");
  });

  it("material da semana e detalhe por id", async () => {
    get.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: { id: "v2" } });
    await expect(api.getCurrentMaterial()).resolves.toBeNull();
    await expect(api.getVisitMaterialById({ id: "v2" })).resolves.toEqual({ id: "v2" });
    expect(get).toHaveBeenLastCalledWith("/visit-material-pages/v2");
  });
});
