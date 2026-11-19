import api from '@/config/axiosConfig';
import type { MeditationData } from '@/store/slices/meditation/meditationSlice';

/** Item da listagem: a API devolve a meditação aninhada em `meditation`. */
interface MeditationListItem {
  meditation?: Partial<MeditationData> & { media?: Partial<MeditationData['media']> };
}

export async function listMeditations(search?: string): Promise<MeditationData[]> {
  const res = await api.get<MeditationListItem[]>('/meditations', {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });
  return (res.data || []).map((item) => ({
    ...item.meditation,
    media: {
      ...item.meditation?.media,
      mediaType: item.meditation?.media?.mediaType,
      uploadType: item.meditation?.media?.uploadType,
      platformType: item.meditation?.media?.platformType,
    },
  })) as MeditationData[];
}

export async function deleteMeditation(id: string): Promise<void> {
  await api.delete(`/meditations/${id}`);
}
