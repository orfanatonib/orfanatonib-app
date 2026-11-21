import type { RouteData } from '@/store/slices/route/routeSlice';
import type { MediaItem, MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';

export interface VideoPageData {
  id?: string;
  public: boolean;
  title: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  videos: MediaItem[];
  route?: RouteData;
}

/** Vídeo como a API devolve (`VideoMediaResponseDto`): sem chave de bucket nem vínculo interno. */
export interface VideoMediaResponse {
  id: string;
  title: string;
  description: string;
  mediaType: MediaType;
  uploadType: MediaUploadType;
  platformType?: MediaPlatform;
  url: string;
  isLocalFile: boolean;
  originalName?: string;
  size?: number;
  createdAt: string;
  updatedAt: string;
}

/** Página de vídeos como a API devolve (`VideosPageResponseDto`). */
export interface VideoPageResponse extends Omit<VideoPageData, 'videos'> {
  videos: VideoMediaResponse[];
}

export interface SavedVideoPage {
  id: string;
  route: { path: string };
}
