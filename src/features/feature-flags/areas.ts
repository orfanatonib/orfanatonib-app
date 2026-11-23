import type { FeatureFlagArea, FeatureFlagAreaId } from './types';
import { FeatureFlagKeys } from './types';

const K = FeatureFlagKeys;

/** Ordem em que as áreas aparecem no painel. */
export const FEATURE_FLAG_AREAS: readonly FeatureFlagArea[] = [
  {
    id: 'public',
    label: 'Site público',
    description: 'Recursos que o visitante enxerga, mesmo sem login.',
  },
  {
    id: 'member',
    label: 'Área do membro',
    description: 'Recursos de quem está logado como admin, líder ou membro.',
  },
  {
    id: 'content-admin',
    label: 'Conteúdo e moderação',
    description: 'Painéis de conteúdo, moderação e contatos.',
  },
  {
    id: 'people-admin',
    label: 'Pessoas e abrigos',
    description: 'Gestão de usuários, abrigos, acolhidos e relatórios.',
  },
  {
    id: 'studio',
    label: 'Estúdio de conteúdo',
    description: 'Geração, revisão e publicação assistidas por IA.',
  },
  {
    id: 'email',
    label: 'E-mails (servidor)',
    description: 'Interruptores de envio; não aparecem para a interface.',
  },
  {
    id: 'custom',
    label: 'Outras',
    description: 'Flags criadas no painel, fora do catálogo de fábrica.',
  },
];

const AREA_KEYS: Readonly<Record<Exclude<FeatureFlagAreaId, 'email' | 'custom'>, readonly string[]>> = {
  public: [
    K.PUBLIC_REGISTRATION,
    K.GOOGLE_LOGIN,
    K.PASSWORD_RECOVERY,
    K.CONTACT_FORM,
    K.EVENTS_SECTION,
    K.SHELTER_FEED,
    K.SHELTER_FEED_CELEBRATIONS,
    K.SHELTER_FEED_COMMENTS,
    K.HOME_COMMENTS,
    K.PUBLIC_GALLERIES,
    K.PUBLIC_VIDEOS,
    K.SHELTER_PAGES,
    K.ABOUT_PAGE,
    K.SHELTER_ADDRESS,
    K.HOME_SHELTERS_PUBLIC,
    K.HOME_SHELTERS_PRIVATE,
  ],
  member: [
    K.MEMBER_AREA,
    K.VISIT_MATERIALS,
    K.DOCUMENTS_LIBRARY,
    K.TRAINING_VIDEOS,
    K.IDEAS_SHARING,
    K.IDEA_SUBMISSION,
    K.SHELTER_PHOTO_UPLOAD,
    K.SITE_FEEDBACK,
    K.MEMBER_MANUAL,
    K.WEEKLY_MEDITATION,
    K.INFORMATIVE_BANNERS,
    K.COMMENT_SUBMISSION,
    K.SHELTERED_AREA,
    K.ACCEPTED_CHRISTS,
    K.ATTENDANCE_CONTROL,
    K.MINISTRY_FAIR_INTEGRATION,
    K.NOTIFICATION_CENTER,
  ],
  'content-admin': [
    K.COMMENT_MODERATION,
    K.DOCUMENT_MANAGEMENT,
    K.INFORMATIVE_MANAGEMENT,
    K.FEEDBACK_MANAGEMENT,
    K.CONTACT_MANAGEMENT,
    K.PAGE_MANAGEMENT,
    K.MEDITATION_MANAGEMENT,
    K.EVENT_MANAGEMENT,
    K.PHOTO_MODERATION,
    K.IDEA_MODERATION,
  ],
  'people-admin': [
    K.USER_MANAGEMENT,
    K.PROFILE_MANAGEMENT,
    K.LEADER_MANAGEMENT,
    K.MEMBER_MANAGEMENT,
    K.SHELTER_MANAGEMENT,
    K.SHELTERED_MANAGEMENT,
    K.PAGELAS_MANAGEMENT,
    K.SHELTER_SCHEDULE,
    K.CRIMINAL_RECORDS,
    K.VISIT_REPORTS,
    K.OBSERVABILITY_AUDIT,
  ],
  studio: [
    K.CONTENT_STUDIO,
    K.CONTENT_STUDIO_GENERATION,
    K.CONTENT_STUDIO_REVIEW,
    K.CONTENT_STUDIO_PUBLICATION,
    K.CONTENT_STUDIO_PROVIDER_ADMIN,
  ],
};

/** Prefixos das flags operacionais de e-mail (`email_*`; `email-*` é a geração anterior). */
const EMAIL_PREFIXES = ['email_', 'email-'] as const;

/** Chaves cujo recurso não tem endpoint próprio: só a interface as impõe. */
export const FRONT_ONLY_FEATURE_FLAGS: readonly string[] = [
  K.SHELTER_PAGES,
  K.ABOUT_PAGE,
  K.MEMBER_MANUAL,
  K.HOME_SHELTERS_PUBLIC,
  K.HOME_SHELTERS_PRIVATE,
];

export function featureFlagAreaOf(key: string): FeatureFlagAreaId {
  if (EMAIL_PREFIXES.some((prefix) => key.startsWith(prefix))) return 'email';
  for (const [area, keys] of Object.entries(AREA_KEYS)) {
    if (keys.includes(key)) return area as FeatureFlagAreaId;
  }
  return 'custom';
}

export function featureFlagAreaLabel(id: FeatureFlagAreaId): string {
  return FEATURE_FLAG_AREAS.find((area) => area.id === id)?.label ?? id;
}

/**
 * `true` quando a API também impõe a flag (403 `FEATURE_DISABLED`).
 * Flag personalizada ou de e-mail não ganha o selo: a interface não a consulta.
 */
export function isEnforcedByApi(key: string): boolean {
  const area = featureFlagAreaOf(key);
  if (area === 'custom' || area === 'email') return false;
  return !FRONT_ONLY_FEATURE_FLAGS.includes(key);
}

/** Todas as chaves de uma área do catálogo (vazio para `email`/`custom`). */
export function featureFlagKeysOfArea(id: FeatureFlagAreaId): readonly string[] {
  return id === 'email' || id === 'custom' ? [] : AREA_KEYS[id];
}

export interface FeatureFlagGroup<T> {
  area: FeatureFlagArea;
  items: T[];
}

/** Agrupa por área na ordem do painel, omitindo áreas vazias; dentro da área mantém a ordem recebida. */
export function groupFlagsByArea<T extends { key: string }>(
  flags: readonly T[],
): FeatureFlagGroup<T>[] {
  return FEATURE_FLAG_AREAS.map((area) => ({
    area,
    items: flags.filter((flag) => featureFlagAreaOf(flag.key) === area.id),
  })).filter((group) => group.items.length > 0);
}

export function countFlagsByArea<T extends { key: string }>(
  flags: readonly T[],
): Record<FeatureFlagAreaId, number> {
  const counts: Record<FeatureFlagAreaId, number> = {
    public: 0,
    member: 0,
    'content-admin': 0,
    'people-admin': 0,
    studio: 0,
    email: 0,
    custom: 0,
  };
  for (const flag of flags) counts[featureFlagAreaOf(flag.key)] += 1;
  return counts;
}
