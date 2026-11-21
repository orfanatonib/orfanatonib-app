import { PendingCountKind } from './types';

export const PENDING_COUNT_ENDPOINTS: Readonly<Record<PendingCountKind, string>> = {
  [PendingCountKind.SHARED_IDEAS]: '/ideas-sections/pending-count',
  [PendingCountKind.COMMENTS]: '/comments/pending-count',
};

/** O selo atualiza sozinho a cada minuto e some quando não há pendência. */
export const PENDING_COUNT_POLL_MS = 60_000;
export const PENDING_COUNT_STALE_TIME_MS = 15_000;
export const PENDING_COUNT_BADGE_MAX = 99;

export const PENDING_COUNT_ARIA: Readonly<Record<PendingCountKind, string>> = {
  [PendingCountKind.SHARED_IDEAS]: 'ideias compartilhadas aguardando publicação',
  [PendingCountKind.COMMENTS]: 'comentários aguardando moderação',
};

export const PENDING_COUNT_TEST_IDS: Readonly<Record<PendingCountKind, string>> = {
  [PendingCountKind.SHARED_IDEAS]: 'shared-ideas-pending-badge',
  [PendingCountKind.COMMENTS]: 'comments-pending-badge',
};

/** Chaves do cache de servidor da feature (todas dentro de `admin-pending-counts`). */
export const pendingCountKeys = {
  root: ['admin-pending-counts'] as const,
  byKind: (kind: PendingCountKind, userId: string | null) =>
    ['admin-pending-counts', kind, userId] as const,
};
