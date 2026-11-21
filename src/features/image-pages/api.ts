import api from '@/config/axiosConfig';
import { IMAGE_PAGES_ENDPOINT, MULTIPART_HEADERS } from './constants';
import type { ImagePageData } from './types';

export async function apiListImagePages(): Promise<ImagePageData[]> {
  const { data } = await api.get<ImagePageData[]>(IMAGE_PAGES_ENDPOINT);
  return data;
}

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
