import api from '@/config/axiosConfig';
import { IdeasPageData } from 'store/slices/ideas/ideasSlice';

const IDEAS_PAGES_PATH = '/ideas-pages';
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

export async function apiListIdeasPages() {
  const { data } = await api.get<IdeasPageData[]>(IDEAS_PAGES_PATH);
  return data;
}

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
