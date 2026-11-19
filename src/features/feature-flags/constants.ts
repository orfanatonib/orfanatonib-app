import type { FeatureFlagAudience, FeatureFlagsMap } from './types';

export const FEATURE_FLAGS_ENDPOINT = '/feature-flags';
export const FEATURE_FLAGS_ROUTE = '/adm/feature-flags';
export const FEATURE_FLAGS_DEFAULT_LIMIT = 12;
export const FEATURE_FLAGS_PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
export const FEATURE_FLAGS_SEARCH_DEBOUNCE_MS = 300;

/**
 * Padrão do catálogo da API (`DEFAULT_FEATURE_FLAGS`), só as flags de interface.
 * Vale enquanto o mapa não chegou ou se a chamada falhar; o mapa real (já
 * resolvido para o perfil de quem pergunta) o substitui por inteiro.
 */
export const DEFAULT_FEATURE_FLAGS_MAP: FeatureFlagsMap = {
  public_registration: true,
  google_login: true,
  password_recovery: true,
  contact_form: true,
  events_section: true,
  shelter_feed: true,
  home_comments: true,
  public_galleries: true,
  public_videos: true,
  shelter_pages: true,
  about_page: true,
  shelter_address: true,
  member_area: true,
  visit_materials: true,
  documents_library: true,
  training_videos: true,
  ideas_sharing: true,
  idea_submission: true,
  shelter_photo_upload: true,
  site_feedback: true,
  member_manual: true,
  weekly_meditation: true,
  informative_banners: true,
  comment_submission: true,
  sheltered_area: true,
  accepted_christs: true,
  attendance: true,
  integration: true,
  comment_moderation: true,
  document_management: true,
  informative_management: true,
  feedback_management: true,
  contact_management: true,
  page_management: true,
  meditation_management: true,
  event_management: true,
  photo_moderation: true,
  idea_moderation: true,
  user_management: true,
  leader_management: true,
  member_management: true,
  shelter_management: true,
  sheltered_management: true,
  pagelas: true,
  shelter_schedule: true,
  criminal_records: true,
  visit_reports: true,
  content_studio: false,
  content_studio_generation: false,
  content_studio_review: false,
  content_studio_publication: false,
  content_studio_provider_admin: false,
  observability_audit: false,
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
