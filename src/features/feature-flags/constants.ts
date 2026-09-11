import type { FeatureFlagAudience, FeatureFlagsMap } from './types';

export const FEATURE_FLAGS_ENDPOINT = '/feature-flags';
export const FEATURE_FLAGS_ROUTE = '/adm/feature-flags';
export const FEATURE_FLAGS_DEFAULT_LIMIT = 12;
export const FEATURE_FLAGS_PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
export const FEATURE_FLAGS_SEARCH_DEBOUNCE_MS = 300;

export const DEFAULT_FEATURE_FLAGS_MAP: FeatureFlagsMap = {
  'shelter-address': true,
  'shelter-management': true,
  'shelter-pagelas': true,
};

export const FEATURE_FLAG_AUDIENCE_OPTIONS: ReadonlyArray<{
  value: FeatureFlagAudience;
  label: string;
  description: string;
  color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning';
}> = [
  {
    value: 'EVERYONE',
    label: 'Para todos',
    description: 'Vale para qualquer visitante, mesmo sem login.',
    color: 'default',
  },
  {
    value: 'ALL_ROLES',
    label: 'Todos os perfis',
    description: 'Admin, líder e membro — exige estar logado.',
    color: 'info',
  },
  {
    value: 'ADMIN',
    label: 'Só admin',
    description: 'Apenas administradores.',
    color: 'primary',
  },
  {
    value: 'LEADER',
    label: 'Só líder',
    description: 'Apenas líderes.',
    color: 'warning',
  },
  {
    value: 'MEMBER',
    label: 'Só membro',
    description: 'Apenas membros.',
    color: 'success',
  },
  {
    value: 'ADMIN_LEADER',
    label: 'Admin e líder',
    description: 'Administradores e líderes.',
    color: 'secondary',
  },
  {
    value: 'ADMIN_MEMBER',
    label: 'Admin e membro',
    description: 'Administradores e membros.',
    color: 'secondary',
  },
  {
    value: 'LEADER_MEMBER',
    label: 'Líder e membro',
    description: 'Líderes e membros.',
    color: 'secondary',
  },
];

export const FEATURE_FLAG_AUDIENCE_FILTER_OPTIONS = [
  { value: '', label: 'Todos os públicos' },
  ...FEATURE_FLAG_AUDIENCE_OPTIONS.map(({ value, label }) => ({ value, label })),
];

export const FEATURE_FLAG_STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'true', label: 'Ligadas' },
  { value: 'false', label: 'Desligadas' },
] as const;

export const FEATURE_FLAG_SORT_OPTIONS = [
  { value: 'name:ASC', label: 'Nome (A–Z)' },
  { value: 'name:DESC', label: 'Nome (Z–A)' },
  { value: 'key:ASC', label: 'Chave (A–Z)' },
  { value: 'key:DESC', label: 'Chave (Z–A)' },
  { value: 'updatedAt:DESC', label: 'Alteradas recentemente' },
  { value: 'createdAt:DESC', label: 'Mais recentes' },
  { value: 'createdAt:ASC', label: 'Mais antigas' },
] as const;
