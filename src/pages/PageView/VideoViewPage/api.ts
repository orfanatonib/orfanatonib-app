import { apiDeleteVideoPage, apiGetVideoPage } from "@/features/video-pages/api";
import type { VideoMediaResponse, VideoPageData } from "@/features/video-pages/types";

export interface GetVideoPageResponse {
  id: string;
  title: string;
  description?: string;
  public?: boolean;
  videos: VideoMediaResponse[];
}

export const toVideoPageData = (dto: GetVideoPageResponse): VideoPageData => ({
  id: dto.id,
  title: dto.title,
  description: dto.description ?? "",
  public: dto.public ?? false,
  videos: Array.isArray(dto.videos) ? dto.videos : [],
});

export const videoPageApi = {
  async getById(id: string): Promise<GetVideoPageResponse> {
    return (await apiGetVideoPage(id)) as GetVideoPageResponse;
  },

  async deleteById(id: string) {
    await apiDeleteVideoPage(id);
  },
};
