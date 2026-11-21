import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const dispatch = vi.fn().mockResolvedValue(undefined);
vi.mock("react-redux", () => ({ useDispatch: () => dispatch }));
vi.mock("@/store/slices/route/routeSlice", () => ({ fetchRoutes: () => ({ type: "routes/fetch" }) }));
vi.mock("@/store/slices", () => ({}));

const apiGet = vi.fn();
const apiDelete = vi.fn();
vi.mock("@/features/video-pages/api", () => ({
  apiGetVideoPage: (...a: unknown[]) => apiGet(...a),
  apiDeleteVideoPage: (...a: unknown[]) => apiDelete(...a),
  apiListVideoPages: vi.fn(),
}));

const { useVideoPage, DELETE_ERROR_MESSAGE } = await import("./hooks");

const dto = { id: "p1", title: "T", description: undefined, public: undefined, videos: [] };

beforeEach(() => vi.clearAllMocks());

describe("VideoViewPage/hooks", () => {
  it("carrega a página e normaliza os campos opcionais", async () => {
    apiGet.mockResolvedValueOnce(dto);
    const { result } = renderHook(() => useVideoPage("p1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.videoData).toEqual({ id: "p1", title: "T", description: "", public: false, videos: [] });
    expect(result.current.error).toBeNull();
  });

  it("falha ao carregar: sem dados e com mensagem de erro", async () => {
    apiGet.mockRejectedValueOnce(new Error("404"));
    const { result } = renderHook(() => useVideoPage("x"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.videoData).toBeNull();
    expect(result.current.error).toMatch(/Erro ao carregar/);
  });

  it("deletePage chama a API, recarrega as rotas e avisa o sucesso", async () => {
    apiGet.mockResolvedValueOnce(dto);
    apiDelete.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useVideoPage("p1"));
    await waitFor(() => expect(result.current.videoData).not.toBeNull());
    const onSuccess = vi.fn();
    await act(async () => {
      await result.current.deletePage(onSuccess);
    });
    expect(apiDelete).toHaveBeenCalledWith("p1");
    expect(dispatch).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("deletePage com erro: expõe a mensagem e chama onError", async () => {
    apiGet.mockResolvedValueOnce(dto);
    apiDelete.mockRejectedValueOnce(new Error("500"));
    const { result } = renderHook(() => useVideoPage("p1"));
    await waitFor(() => expect(result.current.videoData).not.toBeNull());
    const onError = vi.fn();
    await act(async () => {
      await result.current.deletePage(undefined, onError);
    });
    expect(onError).toHaveBeenCalledWith(DELETE_ERROR_MESSAGE);
    expect(result.current.error).toBe(DELETE_ERROR_MESSAGE);
    expect(result.current.isDeleting).toBe(false);
  });
});
