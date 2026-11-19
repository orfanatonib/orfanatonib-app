import axios from 'axios';
import { logger } from '../logger';
import type {
  ErrorCategory,
  ErrorSeverity,
  ErrorRecoverability,
  ApiErrorResponse,
  AppError,
  RetryConfig,
  ErrorHandlingOptions
} from '@/types/error';
import {
  isDev,
  ERROR_MESSAGES,
  NETWORK_ERROR_MESSAGE,
  RETRY_CONFIG,
  API_ERROR_CATEGORIES,
  HTTP_ERROR_CATEGORIES,
  RETRYABLE_STATUSES,
  NETWORK_ERRORS,
} from './constants';

export function analyzeError(error: unknown): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverability: ErrorRecoverability;
  retryable: boolean;
  userMessage?: string;
} {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    const status = error.response?.status;
    const code = error.code;


    if (!error.response && NETWORK_ERRORS.has(code || '')) {
      return {
        category: 'NETWORK',
        severity: 'HIGH',
        recoverability: 'RECOVERABLE',
        retryable: true,
        userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
      };
    }


    if (data?.category) {
      const apiCategory = API_ERROR_CATEGORIES[data.category];

      switch (data.category) {
        case 'RULE':
          return {
            category: apiCategory,
            severity: 'MEDIUM',
            recoverability: 'REQUIRES_USER_ACTION',
            retryable: false,
            userMessage: Array.isArray(data.message)
              ? data.message.join(' ')
              : data.message,
          };

        case 'BUSINESS':
          return {
            category: apiCategory,
            severity: 'MEDIUM',
            recoverability: status === 404 ? 'NON_RECOVERABLE' : 'REQUIRES_USER_ACTION',
            retryable: false,
            userMessage: Array.isArray(data.message)
              ? data.message.join(' ')
              : data.message,
          };

        case 'SERVER':
          return {
            category: apiCategory,
            severity: 'HIGH',
            recoverability: 'RECOVERABLE',
            retryable: true,
            userMessage: 'Erro interno do servidor. Nossa equipe foi notificada. Tente novamente em alguns minutos.',
          };

        case 'PROCESS':
          return {
            category: apiCategory,
            severity: 'MEDIUM',
            recoverability: 'RECOVERABLE',
            retryable: false,
            userMessage: 'Operação em andamento. Verifique o status mais tarde.',
          };
      }
    }


    if (status) {
      const category = HTTP_ERROR_CATEGORIES[status] || 'UNKNOWN';
      let retryable = RETRYABLE_STATUSES.has(status);

      let severity: ErrorSeverity = 'MEDIUM';
      let recoverability: ErrorRecoverability = 'NON_RECOVERABLE';
      let userMessage = extractErrorMessage(error);

      switch (status) {
        case 400:
          severity = 'MEDIUM';
          recoverability = 'REQUIRES_USER_ACTION';
          userMessage = data?.message ? (Array.isArray(data.message) ? data.message.join(' ') : data.message) : userMessage;
          break;

        case 401:
          severity = 'HIGH';
          recoverability = 'REQUIRES_USER_ACTION';
          userMessage = 'Sua sessão expirou. Faça login novamente para continuar.';
          break;

        case 403:
          severity = 'HIGH';
          recoverability = 'NON_RECOVERABLE';
          userMessage = 'Você não tem permissão para acessar este recurso.';
          break;

        case 404:
          severity = 'LOW';
          recoverability = 'NON_RECOVERABLE';
          userMessage = 'O recurso solicitado não foi encontrado.';
          break;

        case 409:
          severity = 'MEDIUM';
          recoverability = 'REQUIRES_USER_ACTION';
          userMessage = data?.message
            ? (Array.isArray(data.message) ? data.message.join(' ') : data.message)
            : 'Já existe um registro com estes dados.';
          break;

        case 422:
          severity = 'MEDIUM';
          recoverability = 'REQUIRES_USER_ACTION';
          userMessage = data?.message
            ? (Array.isArray(data.message) ? data.message.join(' ') : data.message)
            : 'Os dados fornecidos não podem ser processados.';
          break;

        case 429:
          severity = 'MEDIUM';
          recoverability = 'RECOVERABLE';
          userMessage = `Muitas tentativas. Tente novamente em ${data?.details?.retryAfter || 60} segundos.`;
          break;

        case 408:
          severity = 'MEDIUM';
          recoverability = 'RECOVERABLE';
          retryable = true;
          userMessage = 'A requisição demorou muito para responder. Tente novamente.';
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          severity = 'HIGH';
          recoverability = 'RECOVERABLE';
          retryable = true;
          userMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          break;
      }

      return { category, severity, recoverability, retryable, userMessage };
    }
  }


  return {
    category: 'UNKNOWN',
    severity: 'MEDIUM',
    recoverability: 'NON_RECOVERABLE',
    retryable: false,
    userMessage: 'Ocorreu um erro inesperado. Tente novamente.',
  };
}

/** Código que a API devolve em `details.code` quando a funcionalidade está desligada para o ator. */
export const FEATURE_DISABLED_CODE = 'FEATURE_DISABLED';
export const FEATURE_DISABLED_MESSAGE = 'Este recurso não está disponível no momento.';

export function isFeatureDisabledResponse(data: unknown): boolean {
  const details = (data as { details?: { code?: unknown } } | undefined)?.details;
  return details?.code === FEATURE_DISABLED_CODE;
}

/** `true` quando o erro é o 403 `FEATURE_DISABLED` (recurso desligado), e não falta de permissão. */
export function isFeatureDisabledError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403 && isFeatureDisabledResponse(error.response.data);
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response && NETWORK_ERRORS.has(error.code || '')) {
      return NETWORK_ERROR_MESSAGE;
    }

    const data = error.response?.data as ApiErrorResponse | undefined;
    const status = error.response?.status;

    // Flag desligada para o perfil (403 `FEATURE_DISABLED`): mensagem própria, sem o texto técnico da API.
    if (isFeatureDisabledResponse(data)) {
      return FEATURE_DISABLED_MESSAGE;
    }

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


    if (data?.category && API_ERROR_CATEGORIES[data.category]) {
      return API_ERROR_CATEGORIES[data.category];
    }


    const status = error.response?.status;
    if (status && HTTP_ERROR_CATEGORIES[status]) {
      return HTTP_ERROR_CATEGORIES[status];
    }
  }
  return undefined;
}

export function extractApiEndpoint(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return error.config?.url;
  }
  return undefined;
}

export function extractCorrelationId(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.correlationId;
  }
  return undefined;
}
