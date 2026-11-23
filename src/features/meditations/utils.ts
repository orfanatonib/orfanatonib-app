import type { MeditationData } from '@/store/slices/meditation/meditationSlice';
import { MeditationPeriod, type MeditationListItem } from './types';

/** `AAAA-MM-DD` de hoje no horário local. */
export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Só para exibir o selo do cartão; o filtro de período é sempre decidido pela API. */
export function periodOf(meditation: Pick<MeditationData, 'startDate' | 'endDate'>, today: string = todayIso()): MeditationPeriod {
  const start = String(meditation.startDate).slice(0, 10);
  const end = String(meditation.endDate).slice(0, 10);
  if (end < today) return MeditationPeriod.PAST;
  if (start > today) return MeditationPeriod.UPCOMING;
  return MeditationPeriod.CURRENT;
}

/** Achata o envelope `{ meditation }` da listagem em `MeditationData`. */
export function toMeditation(item: MeditationListItem): MeditationData {
  return {
    ...item.meditation,
    days: item.meditation?.days ?? [],
    media: {
      ...item.meditation?.media,
      mediaType: item.meditation?.media?.mediaType,
      uploadType: item.meditation?.media?.uploadType,
      platformType: item.meditation?.media?.platformType,
    },
  } as MeditationData;
}
