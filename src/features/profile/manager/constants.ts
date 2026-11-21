import type { QueryProfilesDto } from '../types';

export const SEARCH_DEBOUNCE_MS = 500;
export const BIRTHDAYS_FETCH_LIMIT = 1000;
export const DEFAULT_PAGE_SIZE = 12;
export const NO_BIRTHDAY_SORT_DAYS = 999;

export const DEFAULT_PROFILE_FILTERS: QueryProfilesDto = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  sortBy: 'name',
  order: 'ASC',
};

export const ROLE_FILTER_OPTIONS = ['all', 'member', 'leader', 'admin'] as const;
export type RoleFilterOption = (typeof ROLE_FILTER_OPTIONS)[number];

export const PROFILE_SORT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'name-ASC', label: 'Nome (A-Z)' },
  { value: 'name-DESC', label: 'Nome (Z-A)' },
  { value: 'email-ASC', label: 'Email (A-Z)' },
  { value: 'email-DESC', label: 'Email (Z-A)' },
  { value: 'createdAt-DESC', label: 'Mais recentes' },
  { value: 'createdAt-ASC', label: 'Mais antigos' },
];

export const PAGE_SIZE_OPTIONS = [8, 12, 24, 48];

export const ADVANCED_FILTER_FIELDS: ReadonlyArray<{
  field: 'temperaments' | 'loveLanguages' | 'favoriteColor';
  label: string;
  placeholder: string;
}> = [
  { field: 'temperaments', label: 'Temperamento', placeholder: 'Ex: Sanguíneo' },
  { field: 'loveLanguages', label: 'Linguagem do Amor', placeholder: 'Ex: Palavras' },
  { field: 'favoriteColor', label: 'Cor Favorita', placeholder: 'Ex: Azul' },
];

export const MANAGER_TEXTS = {
  title: 'Nossa Família ❤️',
  loadError: 'Erro ao carregar perfis',
  birthdaysWarn: 'Não foi possível carregar os perfis para os aniversários',
  searchPlaceholder: 'Buscar por nome ou email...',
  all: 'Todos',
  advancedFilters: 'Filtros avançados',
  refresh: 'Atualizar',
  clearFilters: 'Limpar filtros',
  empty: 'Nenhum perfil encontrado',
  emptyHint: 'Tente ajustar os filtros de busca',
  loading: 'Carregando...',
  sortBy: 'Ordenar por',
  filtered: ' (filtrado)',
} as const;

export const MANAGER_PAPER_SX = {
  borderRadius: 3,
  border: '1px solid rgba(0,0,0,0.06)',
} as const;
