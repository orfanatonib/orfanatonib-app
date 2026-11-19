import type { ErrorCategory, RetryConfig } from '@/types/error';

export const isDev = import.meta.env.DEV;

export const ERROR_MESSAGES: Record<number, string> = {
  400: 'Solicitação inválida. Verifique os dados enviados.',
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

export const NETWORK_ERROR_MESSAGE = 'Erro de conexão. Verifique sua internet.';

export const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export const API_ERROR_CATEGORIES: Record<string, ErrorCategory> = {
  'RULE': 'VALIDATION',
  'BUSINESS': 'BUSINESS',
  'SERVER': 'SERVER',
  'PROCESS': 'PROCESS',
};

export const HTTP_ERROR_CATEGORIES: Record<number, ErrorCategory> = {
  400: 'VALIDATION',
  401: 'AUTHENTICATION',
  403: 'AUTHORIZATION',
  404: 'BUSINESS',
  409: 'BUSINESS',
  422: 'BUSINESS',
  429: 'VALIDATION',
  408: 'NETWORK',
  500: 'SERVER',
  502: 'SERVER',
  503: 'SERVER',
  504: 'SERVER',
};

export const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
export const NETWORK_ERRORS = new Set(['ERR_NETWORK', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT']);
