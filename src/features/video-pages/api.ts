import api from '@/config/axiosConfig';
import { SavedVideoPage, VideoPageResponse } from './types';

const VIDEO_PAGES_ENDPOINT = '/video-pages';
const MULTIPART_HEADERS = { 'Content-Type': 'multipart/form-data' };

export async function apiListVideoPages(): Promise<VideoPageResponse[]> {
  const { data } = await api.get<VideoPageResponse[]>(VIDEO_PAGES_ENDPOINT);
  return data ?? [];
}

export async function apiGetVideoPage(id: string): Promise<VideoPageResponse> {
  const { data } = await api.get<VideoPageResponse>(`${VIDEO_PAGES_ENDPOINT}/${id}`);
  return data;
}

export async function apiDeleteVideoPage(id: string): Promise<void> {
  await api.delete(`${VIDEO_PAGES_ENDPOINT}/${id}`);
}

/** Cria (sem `id`) ou atualiza (com `id`) a página; o corpo é o multipart `videosPageData` + arquivos. */
export async function apiSaveVideoPage(formData: FormData, id?: string): Promise<SavedVideoPage> {
  const config = { headers: MULTIPART_HEADERS };
  const { data } = id
    ? await api.patch<SavedVideoPage>(`${VIDEO_PAGES_ENDPOINT}/${id}`, formData, config)
    : await api.post<SavedVideoPage>(VIDEO_PAGES_ENDPOINT, formData, config);
  return data;
}
