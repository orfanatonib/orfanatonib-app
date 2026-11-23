import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import { IMAGE_PAGES_ENDPOINT, MULTIPART_HEADERS } from './constants';
import type { ImagePageData } from './types';

/** Uma página da listagem administrativa; busca, visibilidade, datas e ordenação são aplicadas no servidor. */
export const fetchImagePagesPage: AdminListFetcher<ImagePageData> = (params, signal) =>
  fetchAdminPage<ImagePageData>(IMAGE_PAGES_ENDPOINT, params, signal);

export async function apiCreateImagePage(
  formData: FormData,
): Promise<ImagePageData> {
  const { data } = await api.post<ImagePageData>(
    IMAGE_PAGES_ENDPOINT,
    formData,
    {
      headers: MULTIPART_HEADERS,
    },
  );
  return data;
}

export async function apiUpdateImagePage(
  id: string,
  formData: FormData,
): Promise<ImagePageData> {
  const { data } = await api.patch<ImagePageData>(
    `${IMAGE_PAGES_ENDPOINT}/${id}`,
    formData,
    {
      headers: MULTIPART_HEADERS,
    },
  );
  return data;
}

export async function apiDeleteImagePage(id: string): Promise<void> {
  await api.delete(`${IMAGE_PAGES_ENDPOINT}/${id}`);
}
