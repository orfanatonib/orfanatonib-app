import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';
import { IDEAS_PAGES_PATH } from './constants';

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/** Uma página da listagem administrativa; busca, datas e ordenação são aplicadas no servidor. */
export const fetchIdeasPagesPage: AdminListFetcher<IdeasPageData> = (params, signal) =>
  fetchAdminPage<IdeasPageData>(IDEAS_PAGES_PATH, params, signal);

export async function apiGetIdeasPage(id: string) {
  const { data } = await api.get<IdeasPageData>(`${IDEAS_PAGES_PATH}/${id}`);
  return data;
}

export async function apiDeleteIdeasPage(id: string) {
  await api.delete(`${IDEAS_PAGES_PATH}/${id}`);
}

/** Cria (sem `id`) ou atualiza (com `id`) a página; o corpo é o multipart montado por `buildIdeasFormData`. */
export async function apiSaveIdeasPage(formData: FormData, id?: string) {
  const { data } = id
    ? await api.patch<IdeasPageData>(`${IDEAS_PAGES_PATH}/${id}`, formData, MULTIPART)
    : await api.post<IdeasPageData>(IDEAS_PAGES_PATH, formData, MULTIPART);
  return data;
}
