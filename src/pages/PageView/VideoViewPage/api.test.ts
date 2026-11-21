import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiDelete = vi.fn();
vi.mock("@/features/video-pages/api", () => ({
  apiGetVideoPage: (...a: unknown[]) => apiGet(...a),
  apiDeleteVideoPage: (...a: unknown[]) => apiDelete(...a),
}));

import { toVideoPageData, videoPageApi } from "./api";

beforeEach(() => vi.clearAllMocks());

describe("VideoViewPage/api", () => {
  it("toVideoPageData aplica padrões para campos ausentes", () => {
    expect(toVideoPageData({ id: "1", title: "T", videos: undefined as never })).toEqual({
      id: "1",
      title: "T",
      description: "",
      public: false,
      videos: [],
    });
  });

  it("toVideoPageData preserva os vídeos e a visibilidade", () => {
    // Contrato `VideoMediaResponseDto`: só os campos de exibição/edição (sem storageKey/targetId/targetType).
    const videos = [
      {
        id: "v",
        title: "Vídeo",
        description: "D",
        mediaType: "video",
        uploadType: "link",
        platformType: "youtube",
        url: "https://youtu.be/abc",
        isLocalFile: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ] as never;
    expect(toVideoPageData({ id: "1", title: "T", description: "D", public: true, videos })).toMatchObject({
      description: "D",
      public: true,
      videos,
    });
  });

  it("getById e deleteById delegam à API da feature", async () => {
    apiGet.mockResolvedValueOnce({ id: "1" });
    expect(await videoPageApi.getById("1")).toEqual({ id: "1" });
    await videoPageApi.deleteById("1");
    expect(apiDelete).toHaveBeenCalledWith("1");
  });
});
