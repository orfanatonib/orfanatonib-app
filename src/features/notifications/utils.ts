import {
  NOTIFICATIONS_BADGE_MAX,
  NOTIFICATIONS_MAX_RETRIES,
  NOTIFICATIONS_RETRY_BASE_MS,
  NOTIFICATIONS_RETRY_MAX_MS,
  NOTIFICATIONS_ROUTES,
  NOTIFICATIONS_SUMMARY_HIDDEN_POLL_MS,
  NOTIFICATIONS_SUMMARY_POLL_MS,
  NOTIFICATIONS_TERMINAL_STATUSES,
} from './constants';
import {
  InboxNotificationTargetKind,
  InboxNotificationType,
  type InboxNotificationTargetDto,
} from './types';

/** Falha que não adianta repetir (sessão, permissão, recurso desligado ou ausente). */
export function isTerminalStatus(status: number | null): boolean {
  return status !== null && NOTIFICATIONS_TERMINAL_STATUSES.includes(status);
}

export function shouldRetryNotifications(failureCount: number, status: number | null): boolean {
  if (isTerminalStatus(status)) return false;
  return failureCount < NOTIFICATIONS_MAX_RETRIES;
}

/** 2 s, 4 s, 8 s… até 30 s. */
export function notificationsRetryDelay(attempt: number): number {
  return Math.min(NOTIFICATIONS_RETRY_BASE_MS * 2 ** Math.max(0, attempt), NOTIFICATIONS_RETRY_MAX_MS);
}

/** Intervalo do polling do resumo; `false` para de consultar (falha terminal). */
export function summaryPollInterval(input: { visible: boolean; stopped: boolean }): number | false {
  if (input.stopped) return false;
  return input.visible ? NOTIFICATIONS_SUMMARY_POLL_MS : NOTIFICATIONS_SUMMARY_HIDDEN_POLL_MS;
}

/** Contador do sino: avisos não lidos + pendências de presença/relatórios/perfil. */
export function bellCount(unread: number, pending: number): number {
  return Math.max(0, unread) + Math.max(0, pending);
}

export function badgeText(count: number): string {
  return count > NOTIFICATIONS_BADGE_MAX ? `${NOTIFICATIONS_BADGE_MAX}+` : String(count);
}

const REVIEW_TYPES: readonly InboxNotificationType[] = [
  InboxNotificationType.SUBMITTED_FOR_REVIEW,
  InboxNotificationType.RESUBMITTED_FOR_REVIEW,
];

/**
 * Para onde o aviso leva. A API nunca manda URL: a rota sai do tipo do destino. `null` = sem tela
 * para abrir (o aviso continua na lista; só não navega).
 *  - Estúdio Orfanato, envio/reenvio para revisão → tela de revisão da categoria; os demais → produção.
 *  - Estúdio Clubinho: as telas de lição ainda não têm rota neste app, então não navega.
 */
export function notificationRoute(type: InboxNotificationType, target: InboxNotificationTargetDto): string | null {
  if (target.kind !== InboxNotificationTargetKind.STUDIO_PACKAGE) return null;
  const base = REVIEW_TYPES.includes(type)
    ? `${NOTIFICATIONS_ROUTES.studioReview}/${target.id}`
    : `${NOTIFICATIONS_ROUTES.studioPackage}/${target.id}`;
  const params = new URLSearchParams();
  if (target.audience) params.set('audience', target.audience);
  if (target.stage) params.set('stage', target.stage);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** "agora", "há 5 min", "há 3 h", "há 2 d" ou a data, para avisos mais antigos. */
export function relativeTime(iso: string, now: number): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const diff = Math.max(0, now - time);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;
  return new Date(time).toLocaleDateString('pt-BR');
}
