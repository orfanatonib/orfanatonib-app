import type { NotificationActionKind } from './notification.types';

export const NOTIFICATION_DURATION_MS = {
  error: 8000,
  warning: 6000,
  info: 5000,
} as const;

export const DEFAULT_RETRY_AFTER_SECONDS = 60;

export const NOTIFICATION_ACTION_LABELS: Record<NotificationActionKind, string> = {
  reload: 'Tentar novamente',
  login: 'Fazer login',
  back: 'Voltar',
};

export const LOGIN_PATH = '/login';

export const SERVER_STATUSES = new Set([500, 502, 503, 504]);

export const REQUEST_ID_LABEL = 'Código do erro';
