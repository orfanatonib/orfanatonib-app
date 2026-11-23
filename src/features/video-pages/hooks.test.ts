import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const apiGet = vi.fn();
const apiDelete = vi.fn();
vi.mock("./api", () => ({
  apiGetVideoPage: (...a: unknown[]) => apiGet(...a),
  apiDeleteVideoPage: (...a: unknown[]) => apiDelete(...a),
}));

const { useVideoPageById, VIDEO_PAGE_LOAD_ERROR, VIDEO_PAGE_MISSING_ID } = await import("./hooks");

const pages = [
  { id: "1", title: "Culto", description: "", public: true, videos: [] },
  { id: "2", title: "Treino", description: "", public: false, videos: [] },
];

beforeEach(() => vi.clearAllMocks());

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
