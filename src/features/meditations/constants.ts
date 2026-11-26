import { MeditationPeriod } from './types';

export const MEDITATIONS_ENDPOINT = '/meditations';
export const MEDITATIONS_TEST_ID_PREFIX = 'meditations';
export const MEDITATION_CREATE_PATH = '/adm/criar-pagina/meditacao';
export const MEDITATION_EDIT_PATH = '/adm/editar-meditacao';
export const MEDITATIONS_DEFAULT_SORT = 'startDate:DESC';

export const MEDITATION_FILTER_KEYS = {
  PERIOD: 'period',
  START_FROM: 'startFrom',
  START_TO: 'startTo',
  CREATED_FROM: 'createdFrom',
  CREATED_TO: 'createdTo',
  SORT: 'sort',
} as const;

export const MEDITATION_PERIOD_LABELS: Record<MeditationPeriod, string> = {
  [MeditationPeriod.CURRENT]: 'Semana atual',
  [MeditationPeriod.UPCOMING]: 'Próxima',
  [MeditationPeriod.PAST]: 'Encerrada',
};

export const MEDITATION_PERIOD_FILTER_LABELS: Record<MeditationPeriod, string> = {
  [MeditationPeriod.CURRENT]: 'Semana atual',
  [MeditationPeriod.UPCOMING]: 'Próximas',
  [MeditationPeriod.PAST]: 'Encerradas',
};

export const MEDITATION_SORT_OPTIONS = [
  { value: 'startDate:DESC', label: 'Início: mais recentes' },
  { value: 'startDate:ASC', label: 'Início: mais antigas' },
  { value: 'topic:ASC', label: 'Tema: A a Z' },
  { value: 'topic:DESC', label: 'Tema: Z a A' },
  { value: 'createdAt:DESC', label: 'Criação: mais recentes' },
  { value: 'createdAt:ASC', label: 'Criação: mais antigas' },
] as const;

export const MEDITATIONS_LABELS = {
  TITLE: '📖 Lista de Meditações',
  SEARCH: 'Buscar meditações',
  SEARCH_PLACEHOLDER: 'Buscar por tema...',
  EMPTY: 'Ainda não há meditações cadastradas.',
  LOAD_ERROR: 'Erro ao buscar meditações.',
  DELETE_ERROR: 'Erro ao deletar meditação.',
  DELETE_TITLE_FALLBACK: 'Meditação',
  CREATE: 'Nova meditação',
  FILTER_PERIOD: 'Período',
  FILTER_START_FROM: 'Início a partir de',
  FILTER_START_TO: 'Início até',
  FILTER_CREATED_FROM: 'Criada a partir de',
  FILTER_CREATED_TO: 'Criada até',
  FILTER_SORT: 'Ordenar por',
  DAYS_BUTTON: 'Dias',
  MATERIAL_BUTTON: 'Material',
  EDIT_BUTTON: 'Editar',
  DELETE: 'Excluir meditação',
  CREATED_AT: 'Criada em',
  DAYS_DIALOG_TITLE: 'Dias da meditação',
  DAY_DETAIL: 'Ver detalhes do dia',
  CLOSE: 'Fechar',
  PERIOD_RANGE_SEPARATOR: '—',
} as const;
