import type { AdminFilterField } from '@/components/common/admin-shell/types';
import {
  ADMIN_CREATED_FROM_KEY,
  ADMIN_CREATED_TO_KEY,
  ADMIN_SORT_FILTER_KEY,
  ADMIN_TOOLBAR_LABELS,
} from '@/components/common/admin-shell/constants';

export const IDEAS_PAGES_PATH = '/ideas-pages';
export const IDEAS_PAGES_TEST_ID_PREFIX = 'ideas-pages';
export const IDEAS_PAGES_DEFAULT_SORT = 'createdAt:DESC';

export const IDEAS_PAGES_MESSAGES = {
  TITLE: '💡 Páginas de Ideias',
  EMPTY: 'Ainda não há páginas de ideias cadastradas.',
  PRIVATE_LABEL: 'Privada',
  SEARCH_LABEL: 'Buscar páginas',
  SEARCH_PLACEHOLDER: 'Buscar por título, subtítulo ou descrição...',
  LOAD_ERROR: 'Erro ao buscar páginas de ideias. Tente novamente mais tarde.',
  DELETE_ERROR: 'Erro ao excluir a página. Tente novamente.',
} as const;

export const IDEAS_PAGES_FILTER_FIELDS: AdminFilterField[] = [
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
