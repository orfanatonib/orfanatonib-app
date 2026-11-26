import type { InboxStatusFilter } from './types';

/** Todo cache da central é por usuário: trocar de conta nunca mostra o aviso de outra pessoa. */
export const notificationKeys = {
  user: (userId: string) => ['notifications', userId] as const,
  summary: (userId: string) => ['notifications', userId, 'summary'] as const,
  lists: (userId: string) => ['notifications', userId, 'list'] as const,
  list: (userId: string, status: InboxStatusFilter) => ['notifications', userId, 'list', status] as const,
};
