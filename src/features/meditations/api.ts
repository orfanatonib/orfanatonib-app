import api from '@/config/axiosConfig';
import { fetchAdminPage } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher } from '@/components/common/admin-shell/types';
import type { MeditationData } from '@/store/slices/meditation/meditationSlice';
import { MEDITATIONS_ENDPOINT } from './constants';
import type { MeditationListItem } from './types';
import { toMeditation } from './utils';

/** Página de meditações filtrada, ordenada e paginada no servidor. */
export const fetchMeditationsPage: AdminListFetcher<MeditationData> = async (params, signal) => {
  const page = await fetchAdminPage<MeditationListItem>(MEDITATIONS_ENDPOINT, params, signal);
  return { ...page, items: page.items.map(toMeditation) };
};

export async function deleteMeditation(id: string): Promise<void> {
  await api.delete(`${MEDITATIONS_ENDPOINT}/${id}`);
}

/** Meditação de um dia da semana (a API a devolve aninhada em `meditation`). */
export async function getMeditationOfDay(id: string): Promise<MeditationData | null> {
  const { data } = await api.get<{ meditation?: MeditationData }>(`${MEDITATIONS_ENDPOINT}/${id}`);
  return data?.meditation ?? null;
}
