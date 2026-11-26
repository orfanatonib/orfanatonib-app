import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import { InformativeBannerData } from 'store/slices/informative/informativeBannerSlice';
import { INFORMATIVES_ENDPOINT } from './constants';

/** Página de informativos filtrada, ordenada e paginada no servidor. */
export const fetchBannersPage: AdminListFetcher<InformativeBannerData> = (params, signal) =>
  fetchAdminPage<InformativeBannerData>(INFORMATIVES_ENDPOINT, params, signal);

export async function deleteBannerApi(id: string): Promise<void> {
  await api.delete(`${INFORMATIVES_ENDPOINT}/${id}`);
}

export async function createBannerApi(payload: Pick<InformativeBannerData, 'title' | 'description'> & { public: boolean }) {
  const { data } = await api.post(INFORMATIVES_ENDPOINT, payload);
  return data as InformativeBannerData;
}

export async function updateBannerApi(id: string, payload: Pick<InformativeBannerData, 'title' | 'description'> & { public: boolean }) {
  const { data } = await api.patch(`${INFORMATIVES_ENDPOINT}/${id}`, payload);
  return data as InformativeBannerData;
}
