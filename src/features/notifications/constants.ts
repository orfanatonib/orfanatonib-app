import { InboxNotificationSource, InboxNotificationType } from './types';

export const NOTIFICATIONS_ENDPOINT = '/notifications/me';

/** Resumo: aba visível consulta a cada 30 s; aba escondida, a cada 2 min. */
export const NOTIFICATIONS_SUMMARY_POLL_MS = 30_000;
export const NOTIFICATIONS_SUMMARY_HIDDEN_POLL_MS = 120_000;
export const NOTIFICATIONS_SUMMARY_STALE_MS = 15_000;
export const NOTIFICATIONS_PAGE_SIZE = 10;

/** Backoff exponencial limitado das consultas que falham. */
export const NOTIFICATIONS_MAX_RETRIES = 3;
export const NOTIFICATIONS_RETRY_BASE_MS = 2_000;
export const NOTIFICATIONS_RETRY_MAX_MS = 30_000;
/** Falhas que não adiantam repetir (sessão, permissão, flag desligada): o polling para. */
export const NOTIFICATIONS_TERMINAL_STATUSES: readonly number[] = [401, 403, 404];

export const NOTIFICATIONS_BADGE_MAX = 99;

/** Rotas do Estúdio Orfanato (as telas já existem no app). */
export const NOTIFICATIONS_ROUTES = {
  studioPackage: '/adm/estudio/pacotes',
  studioReview: '/adm/estudio/revisao',
} as const;

export const NOTIFICATIONS_TEXTS = {
  section: 'Avisos',
  empty: 'Nenhum aviso por aqui.',
  loading: 'Carregando avisos…',
  error: 'Não foi possível carregar os avisos.',
  retry: 'Tentar novamente',
  markAllRead: 'Marcar todos como lidos',
  loadMore: 'Ver mais avisos',
  unreadLabel: 'Não lido',
  openLabel: (title: string) => `Abrir aviso: ${title}`,
} as const;

export const NOTIFICATION_SOURCE_LABELS: Record<InboxNotificationSource, string> = {
  [InboxNotificationSource.ORFANATO_STUDIO]: 'Estúdio Orfanato',
  [InboxNotificationSource.CLUBINHO_LESSONS]: 'Estúdio Clubinho',
};

/** Cor da etiqueta de cada tipo (MUI Chip). */
export const NOTIFICATION_TYPE_COLORS: Record<
  InboxNotificationType,
  'default' | 'info' | 'success' | 'warning' | 'error'
> = {
  [InboxNotificationType.PRODUCTION_COMPLETED]: 'info',
  [InboxNotificationType.SUBMITTED_FOR_REVIEW]: 'info',
  [InboxNotificationType.RESUBMITTED_FOR_REVIEW]: 'info',
  [InboxNotificationType.CHANGES_REQUESTED]: 'warning',
  [InboxNotificationType.STAGE_APPROVED]: 'success',
  [InboxNotificationType.PUBLISHED]: 'success',
  [InboxNotificationType.GENERATION_COMPLETED]: 'default',
  [InboxNotificationType.GENERATION_FAILED]: 'error',
};
