import type { NotificationActionKind, NotificationPlan, NotificationPlanInput } from './notification.types';
import {
  DEFAULT_RETRY_AFTER_SECONDS,
  NOTIFICATION_ACTION_LABELS,
  NOTIFICATION_DURATION_MS,
  REQUEST_ID_LABEL,
  SERVER_STATUSES,
} from './notification.constants';

function action(kind: NotificationActionKind): NotificationPlan['action'] {
  return { label: NOTIFICATION_ACTION_LABELS[kind], kind };
}

type PlanBody = Omit<NotificationPlan, 'duration'>;

function planByApiCategory({ apiData, status, analysis }: NotificationPlanInput): PlanBody | undefined {
  switch (apiData?.category) {
    case 'RULE': {
      const body: PlanBody = { level: 'warning', position: 'top-right', persistent: false, title: 'Dados inválidos' };
      if (apiData.details?.fields) {
        body.description = 'Verifique os campos destacados';
      } else if (Array.isArray(apiData.message)) {
        body.title = apiData.message[0];
        if (apiData.message.length > 1) body.description = apiData.message.slice(1).join(' ');
      }
      return body;
    }
    case 'BUSINESS': {
      const titles: Record<number, string> = { 404: 'Não encontrado', 409: 'Conflito', 422: 'Dados inválidos' };
      const title = status === undefined ? undefined : titles[status];
      return {
        level: title ? 'warning' : 'error',
        position: 'bottom-center',
        persistent: false,
        title,
      };
    }
    case 'SERVER':
      return {
        level: 'error',
        position: 'top-center',
        persistent: analysis.severity === 'CRITICAL',
        title: 'Erro do servidor',
        description: apiData.correlationId ? `ID: ${apiData.correlationId.substring(0, 8)}...` : undefined,
        action: analysis.recoverability === 'RECOVERABLE' ? action('reload') : undefined,
      };
    case 'PROCESS':
      return {
        level: 'info',
        position: 'bottom-right',
        persistent: false,
        title: 'Processando',
        description: 'Operação em andamento',
      };
    default:
      return undefined;
  }
}

function planByStatus({ apiData, status, analysis }: NotificationPlanInput): PlanBody | undefined {
  switch (status) {
    case 400:
    case 422:
      return { level: 'warning', position: 'top-right', persistent: false, title: 'Dados inválidos' };
    case 401:
      return { level: 'error', position: 'top-center', persistent: true, title: 'Sessão expirada', action: action('login') };
    case 403:
      return { level: 'error', position: 'top-center', persistent: true, title: 'Acesso negado', action: action('back') };
    case 404:
      return { level: 'warning', position: 'bottom-center', persistent: false, title: 'Não encontrado' };
    case 409:
      return { level: 'warning', position: 'bottom-center', persistent: false, title: 'Conflito' };
    case 429:
      return {
        level: 'warning',
        position: 'top-center',
        persistent: false,
        title: 'Muitas tentativas',
        description: `Tente novamente em ${apiData?.details?.retryAfter || DEFAULT_RETRY_AFTER_SECONDS} segundos`,
      };
    case 408:
      return { level: 'warning', position: 'bottom-center', persistent: false, title: 'Timeout', action: action('reload') };
    default:
      if (status !== undefined && SERVER_STATUSES.has(status)) {
        return {
          level: 'error',
          position: 'top-center',
          persistent: false,
          title: 'Erro do servidor',
          action: analysis.recoverability === 'RECOVERABLE' ? action('reload') : undefined,
        };
      }
      return undefined;
  }
}

function planBySeverity({ analysis }: NotificationPlanInput): PlanBody {
  if (analysis.category === 'NETWORK') {
    return { level: 'error', position: 'top-center', persistent: true, title: 'Sem conexão', action: action('reload') };
  }
  switch (analysis.severity) {
    case 'LOW':
      return { level: 'info', position: 'bottom-left', persistent: false };
    case 'HIGH':
    case 'CRITICAL':
      return { level: 'error', position: 'top-center', persistent: analysis.severity === 'CRITICAL' };
    case 'MEDIUM':
    default:
      return { level: 'warning', position: 'bottom-center', persistent: false };
  }
}

/** Junta ao texto de apoio o `requestId` do servidor, que é o código que o suporte usa para achar o log. */
export function withRequestId(description: string | undefined, requestId: string | undefined): string | undefined {
  if (!requestId) return description;
  const line = `${REQUEST_ID_LABEL}: ${requestId}`;
  return description ? `${description}\n${line}` : line;
}

/** Decide, sem efeitos colaterais, como o erro aparece ao usuário (nível, posição, título, ação). */
export function planNotification(input: NotificationPlanInput): NotificationPlan {
  const body = planByApiCategory(input) ?? planByStatus(input) ?? planBySeverity(input);
  return {
    ...body,
    description: withRequestId(body.description, input.apiData?.requestId),
    duration: body.persistent ? undefined : NOTIFICATION_DURATION_MS[body.level],
  };
}
