import type { MeditationData } from '@/store/slices/meditation/meditationSlice';

/** Situação da semana da meditação em relação a hoje (espelha o filtro `period` da API). */
export enum MeditationPeriod {
  CURRENT = 'current',
  UPCOMING = 'upcoming',
  PAST = 'past',
}

/** Item da listagem: a API devolve a meditação aninhada em `meditation`. */
export interface MeditationListItem {
  meditation?: Partial<MeditationData> & { media?: Partial<MeditationData['media']> };
}

