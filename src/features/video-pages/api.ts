import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import { VIDEO_PAGES_ENDPOINT } from './constants';
import { SavedVideoPage, VideoPageData, VideoPageResponse } from './types';

const MULTIPART_HEADERS = { 'Content-Type': 'multipart/form-data' };

/** Uma página da listagem administrativa; busca, visibilidade, datas e ordenação são aplicadas no servidor. */
export const fetchVideoPagesPage: AdminListFetcher<VideoPageData> = (params, signal) =>
  fetchAdminPage<VideoPageData>(VIDEO_PAGES_ENDPOINT, params, signal);

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
