import type { AdminFilterField } from '@/components/common/admin-shell/types';
import {
  ADMIN_CREATED_FROM_KEY,
  ADMIN_CREATED_TO_KEY,
  ADMIN_LABELS,
  ADMIN_SORT_FILTER_KEY,
  ADMIN_TOOLBAR_LABELS,
} from '@/components/common/admin-shell/constants';

export const VIDEO_PAGES_ENDPOINT = '/video-pages';
export const VIDEO_PAGES_TEST_ID_PREFIX = 'video-pages';
export const VIDEO_PAGES_DEFAULT_SORT = 'createdAt:DESC';
export const VIDEO_PAGES_PUBLIC_FILTER_KEY = 'public';

export const VIDEO_PAGES_MESSAGES = {
  TITLE: '🎥 Páginas de Vídeos',
  EMPTY: 'Ainda não há páginas de vídeos cadastradas.',
  SEARCH_LABEL: 'Buscar páginas',
  SEARCH_PLACEHOLDER: 'Buscar por título ou descrição...',
  LOAD_ERROR: 'Erro ao buscar páginas de vídeos',
  DELETE_ERROR: 'Erro ao excluir página.',
  DELETE_SUCCESS: 'Página excluída com sucesso.',
} as const;

export const VIDEO_PAGES_FILTER_FIELDS: AdminFilterField[] = [
  {
    kind: 'select',
    key: VIDEO_PAGES_PUBLIC_FILTER_KEY,
    label: 'Visibilidade',
    allLabel: 'Todas',
    options: [
      { value: 'true', label: ADMIN_LABELS.PUBLIC },
      { value: 'false', label: ADMIN_LABELS.PRIVATE },
    ],
  },
  { kind: 'date', key: ADMIN_CREATED_FROM_KEY, label: ADMIN_TOOLBAR_LABELS.DATE_FROM },
  { kind: 'date', key: ADMIN_CREATED_TO_KEY, label: ADMIN_TOOLBAR_LABELS.DATE_TO },
  {
    kind: 'select',
    key: ADMIN_SORT_FILTER_KEY,
    label: 'Ordenar por',
    allLabel: null,
    options: [
      { value: 'createdAt:DESC', label: 'Mais recentes' },
      { value: 'createdAt:ASC', label: 'Mais antigas' },
      { value: 'title:ASC', label: 'Título (A–Z)' },
      { value: 'title:DESC', label: 'Título (Z–A)' },
    ],
  },
];
