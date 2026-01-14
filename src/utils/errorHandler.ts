import axios from 'axios';
import { store } from '@/store/slices';
import { showNotification } from '@/store/slices/notification/notificationSlice';

export type ErrorCategory = 'BUSINESS' | 'RULE' | 'PROCESS' | 'SERVER';

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  category: ErrorCategory;
  timestamp: string;
  path: string;
}

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  category?: ErrorCategory;
  context?: string;
  originalError?: unknown;
}

const isDev = import.meta.env.DEV;

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Solicitação inválida. Verifique os dados enviada.',
  401: 'Sessão expirada. Por favor, faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito detectado. O recurso pode já existir.',
  422: 'Dados inválidos. Verifique os campos e tente novamente.',
  429: 'Muitas solicitações. Aguarde um momento.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
  502: 'Serviço temporariamente indisponível.',
  503: 'Serviço indisponível no momento.',
  504: 'O servidor demorou muito para responder.',
};

const NETWORK_ERROR_MESSAGE = 'Erro de conexão. Verifique sua internet.';

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
      return NETWORK_ERROR_MESSAGE;
    }

    const data = error.response?.data as ApiErrorResponse | undefined;
    const status = error.response?.status;

    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(' ')
        : String(data.message);
    }

    if (status && ERROR_MESSAGES[status]) {
      return ERROR_MESSAGES[status];
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export function extractErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

export function extractErrorCategory(error: unknown): ErrorCategory | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.category) {
      return data.category;
    }
  }
  return undefined;
}

export function handleError(error: unknown, context?: string, showNotificationFlag = true): AppError {
  const message = extractErrorMessage(error);
  const status = extractErrorStatus(error);
  const category = extractErrorCategory(error);

  const appError: AppError = {
    message,
    status,
    category,
    context,
    originalError: error,
  };

  if (isDev) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }

  if (showNotificationFlag && status !== 401) {
    let type: 'error' | 'warning' | 'info' = 'error';

    if (!category) {
      if (status) {
        if (status >= 500) type = 'error';
        else if (status === 404 || status === 409 || status === 400 || status === 422) type = 'warning';
        else if (status === 403) type = 'error';
      } else if (message === NETWORK_ERROR_MESSAGE) {
        type = 'error';
      }
    } else {
      switch (category) {
        case 'BUSINESS':
        case 'RULE':
          type = 'warning';
          break;
        case 'PROCESS':
          type = 'error';
          break;
        case 'SERVER':
        default:
          type = 'error';
          break;
      }
    }

    let displayMessage = message;
    if (category === 'SERVER' && status === 500) {
      if (!displayMessage) displayMessage = ERROR_MESSAGES[500];
    }

    store.dispatch(showNotification({
      message: displayMessage,
      type,
      duration: type === 'error' ? 8000 : 5000
    }));
  }

  return appError;
}

export function handleSilentError(error: unknown, context?: string): AppError {
  const message = extractErrorMessage(error);
  const status = extractErrorStatus(error);
  const category = extractErrorCategory(error);

  const appError: AppError = {
    message,
    status,
    category,
    context,
    originalError: error,
  };

  if (isDev) {
    console.warn(`[Silent Error${context ? ` - ${context}` : ''}]:`, error);
  }

  return appError;
}

export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
  }
  return false;
}

export function isUnauthorizedError(error: unknown): boolean {
  return extractErrorStatus(error) === 401;
}

export function isForbiddenError(error: unknown): boolean {
  return extractErrorStatus(error) === 403;
}

export function isNotFoundError(error: unknown): boolean {
  return extractErrorStatus(error) === 404;
}

export function isValidationError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  return status === 400 || status === 422;
}

export function isServerError(error: unknown): boolean {
  const status = extractErrorStatus(error);
  return !!status && status >= 500;
}

export function isConflictError(error: unknown): boolean {
  return extractErrorStatus(error) === 409;
}

export function isTooManyRequestsError(error: unknown): boolean {
  return extractErrorStatus(error) === 429;
}

