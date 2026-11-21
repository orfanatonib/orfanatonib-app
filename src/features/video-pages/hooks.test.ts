import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const apiList = vi.fn();
const apiGet = vi.fn();
const apiDelete = vi.fn();
vi.mock("./api", () => ({
  apiListVideoPages: (...a: unknown[]) => apiList(...a),
  apiGetVideoPage: (...a: unknown[]) => apiGet(...a),
  apiDeleteVideoPage: (...a: unknown[]) => apiDelete(...a),
}));

const { useVideoPages, useVideoPageById, VIDEO_PAGE_LOAD_ERROR, VIDEO_PAGE_MISSING_ID } = await import("./hooks");

const pages = [
  { id: "1", title: "Culto", description: "", public: true, videos: [] },
  { id: "2", title: "Treino", description: "", public: false, videos: [] },
];

beforeEach(() => vi.clearAllMocks());

describe("useVideoPages", () => {
  it("carrega a lista e expõe erro quando a API falha", async () => {
    apiList.mockResolvedValueOnce(pages);
    const { result } = renderHook(() => useVideoPages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toEqual(pages);
    expect(result.current.error).toBe("");

    apiList.mockRejectedValueOnce(new Error("500"));
    await act(async () => {
      await result.current.fetchPages();
    });
    expect(result.current.error).toBe("Erro ao buscar páginas de vídeos");
  });

  it("removePage chama a API e recarrega a lista", async () => {
    apiList.mockResolvedValue(pages);
    apiDelete.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useVideoPages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.removePage("1");
    });
    expect(apiDelete).toHaveBeenCalledWith("1");
    expect(apiList).toHaveBeenCalledTimes(2);
  });

  it("filtra por título depois do debounce", async () => {
    apiList.mockResolvedValue(pages);
    const { result } = renderHook(() => useVideoPages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSearch("treino"));
    await waitFor(() => expect(result.current.filtered.map((p) => p.id)).toEqual(["2"]));
  });
});

describe("useVideoPageById", () => {
  it("sem id: erro de ID ausente e nenhuma chamada", async () => {
    const { result } = renderHook(() => useVideoPageById(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(VIDEO_PAGE_MISSING_ID);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("com id: carrega a página; falha vira mensagem de erro e página nula", async () => {
    apiGet.mockResolvedValueOnce(pages[0]);
    const { result } = renderHook(() => useVideoPageById("1"));
    await waitFor(() => expect(result.current.page).toEqual(pages[0]));
    expect(result.current.error).toBeNull();

    apiGet.mockRejectedValueOnce(new Error("404"));
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.page).toBeNull();
    expect(result.current.error).toBe(VIDEO_PAGE_LOAD_ERROR);
  });
});
