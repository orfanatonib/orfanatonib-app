import api from '@/config/axiosConfig';
import { InformativeBannerData } from 'store/slices/informative/informativeBannerSlice';

export async function fetchBannersApi(search?: string): Promise<InformativeBannerData[]> {
  const { data } = await api.get<InformativeBannerData[]>('/informatives', {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });
  return data;
}

export async function deleteBannerApi(id: string): Promise<void> {
  await api.delete(`/informatives/${id}`);
}

export async function createBannerApi(payload: Pick<InformativeBannerData, 'title' | 'description'> & { public: boolean }) {
  const { data } = await api.post('/informatives', payload);
  return data as InformativeBannerData;
}

export async function updateBannerApi(id: string, payload: Pick<InformativeBannerData, 'title' | 'description'> & { public: boolean }) {
  const { data } = await api.patch(`/informatives/${id}`, payload);
  return data as InformativeBannerData;
}
