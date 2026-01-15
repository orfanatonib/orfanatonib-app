import axios from 'axios';
import { store } from '@/store/slices';
import { showError, showSuccess, showWarning, showInfo } from '@/store/slices/notification/notificationSlice';
import { logger } from './logger';
import { recordErrorMetric } from './errorMetrics';
import type {
  ErrorCategory,
  ErrorSeverity,
  ErrorRecoverability,
  ApiErrorResponse,
  AppError,
  RetryConfig,
  ErrorHandlingOptions
} from '@/types/error';

export type { AppError, ErrorHandlingOptions };

const isDev = import.meta.env.DEV;

const ERROR_MESSAGES: Record<number, string> = {
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

const NETWORK_ERROR_MESSAGE = 'Erro de conexão. Verifique sua internet.';

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

const API_ERROR_CATEGORIES: Record<string, ErrorCategory> = {
  'RULE': 'VALIDATION',
  'BUSINESS': 'BUSINESS',
  'SERVER': 'SERVER',
  'PROCESS': 'PROCESS',
};

const HTTP_ERROR_CATEGORIES: Record<number, ErrorCategory> = {
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

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const NETWORK_ERRORS = new Set(['ERR_NETWORK', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT']);

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

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response && NETWORK_ERRORS.has(error.code || '')) {
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

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    context?: string;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxRetries = RETRY_CONFIG.maxRetries, context, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorAnalysis = analyzeError(error);


      if (!errorAnalysis.retryable || attempt > maxRetries) {
        break;
      }


      logger.warn(`Retry attempt ${attempt}/${maxRetries}`, {
        feature: 'error-handler',
        action: 'retry',
        context,
        metadata: {
          attempt,
          maxRetries,
          errorCategory: errorAnalysis.category,
          errorSeverity: errorAnalysis.severity,
        },
      });

      onRetry?.(attempt, error);


      const delay = calculateRetryDelay(attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

export function handleError(
  error: unknown,
  context = 'unknown',
  showNotificationFlag = true,
  logError = true
): AppError {
  const status = extractErrorStatus(error);
  const category = extractErrorCategory(error);
  const analysis = analyzeError(error);


  let apiData: ApiErrorResponse | undefined;
  if (axios.isAxiosError(error)) {
    apiData = error.response?.data as ApiErrorResponse | undefined;
  }


  const message = analysis.userMessage || extractErrorMessage(error);
  const correlationId = apiData?.correlationId || crypto.randomUUID();
  const requestId = apiData?.requestId;

  const appError: AppError = {
    message,
    status,
    category: category || analysis.category,
    severity: analysis.severity,
    recoverability: analysis.recoverability,
    retryable: analysis.retryable,
    context,
    originalError: error,
    correlationId,
    timestamp: apiData?.timestamp || new Date().toISOString(),
    maxRetries: RETRY_CONFIG.maxRetries,
    code: apiData?.error,
    metadata: {
      requestId,
      path: apiData?.path,
      details: apiData?.details,
      apiCategory: apiData?.category,
    },
  };


  if (logError) {
    const logContext = {
      feature: 'error-handler',
      action: 'error-handled',
      context,
      apiEndpoint: extractApiEndpoint(error),
      correlationId,
      userId: store.getState().auth.user?.id,

      metadata: {
        status,
        category: appError.category,
        severity: appError.severity,
        recoverability: appError.recoverability,
        retryable: appError.retryable,
      },
    };

    if (analysis.severity === 'CRITICAL') {
      logger.critical(message, logContext, error);
    } else if (analysis.severity === 'HIGH' || status && status >= 500) {
      logger.error(message, logContext, error);
    } else {
      logger.warn(message, logContext, error);
    }
  }

  if (showNotificationFlag && status !== 401) {
    let notificationType: 'error' | 'warning' | 'info' = 'error';
    let position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' = 'bottom-center';
    let persistent = false;
    let action = undefined;
    let title = undefined;
    let description = undefined;


    const apiCategory = apiData?.category;

    switch (apiCategory) {
      case 'RULE':
        notificationType = 'warning';
        position = 'top-right';
        title = 'Dados inválidos';

        if (apiData?.details?.fields) {
          description = 'Verifique os campos destacados';
        } else if (Array.isArray(apiData?.message)) {

          title = apiData.message[0];
          if (apiData.message.length > 1) {
            description = apiData.message.slice(1).join(' ');
          }
        }
        break;

      case 'BUSINESS':
        switch (status) {
          case 404:
            notificationType = 'warning';
            position = 'bottom-center';
            title = 'Não encontrado';
            break;
          case 409:
            notificationType = 'warning';
            position = 'bottom-center';
            title = 'Conflito';
            break;
          case 422:
            notificationType = 'warning';
            position = 'bottom-center';
            title = 'Dados inválidos';
            break;
          default:
            notificationType = 'error';
            position = 'bottom-center';
        }
        break;

      case 'SERVER':
        notificationType = 'error';
        position = 'top-center';
        persistent = analysis.severity === 'CRITICAL';
        title = 'Erro do servidor';
        if (apiData?.correlationId) {
          description = `ID: ${apiData.correlationId.substring(0, 8)}...`;
        }

        if (analysis.recoverability === 'RECOVERABLE') {
          action = {
            label: 'Tentar novamente',
            onClick: () => window.location.reload(),
          };
        }
        break;

      case 'PROCESS':
        notificationType = 'info';
        position = 'bottom-right';
        title = 'Processando';
        description = 'Operação em andamento';
        break;

      default:

        switch (status) {
          case 400:
          case 422:
            notificationType = 'warning';
            position = 'top-right';
            title = 'Dados inválidos';
            break;

          case 401:
            notificationType = 'error';
            position = 'top-center';
            persistent = true;
            title = 'Sessão expirada';
            action = {
              label: 'Fazer login',
              onClick: () => window.location.href = '/login',
            };
            break;

          case 403:
            notificationType = 'error';
            position = 'top-center';
            persistent = true;
            title = 'Acesso negado';
            action = {
              label: 'Voltar',
              onClick: () => window.history.back(),
            };
            break;

          case 404:
            notificationType = 'warning';
            position = 'bottom-center';
            title = 'Não encontrado';
            break;

          case 409:
            notificationType = 'warning';
            position = 'bottom-center';
            title = 'Conflito';
            break;

          case 429:
            notificationType = 'warning';
            position = 'top-center';
            title = 'Muitas tentativas';
            description = `Tente novamente em ${apiData?.details?.retryAfter || 60} segundos`;
            break;

          case 408:
            notificationType = 'warning';
            position = 'bottom-center';
            title = 'Timeout';
            action = {
              label: 'Tentar novamente',
              onClick: () => window.location.reload(),
            };
            break;

          case 500:
          case 502:
          case 503:
          case 504:
            notificationType = 'error';
            position = 'top-center';
            title = 'Erro do servidor';
            if (analysis.recoverability === 'RECOVERABLE') {
              action = {
                label: 'Tentar novamente',
                onClick: () => window.location.reload(),
              };
            }
            break;

          default:

            if (analysis.category === 'NETWORK') {
              notificationType = 'error';
              position = 'top-center';
              persistent = true;
              title = 'Sem conexão';
              action = {
                label: 'Tentar novamente',
                onClick: () => window.location.reload(),
              };
            } else {

              switch (analysis.severity) {
                case 'LOW':
                  notificationType = 'info';
                  position = 'bottom-left';
                  break;
                case 'MEDIUM':
                  notificationType = 'warning';
                  position = 'bottom-center';
                  break;
                case 'HIGH':
                case 'CRITICAL':
                  notificationType = 'error';
                  position = 'top-center';
                  persistent = analysis.severity === 'CRITICAL';
                  break;
              }
            }
        }
    }


    const notificationConfig = {
      position,
      persistent,
      action,
      title,
      description,
      duration: persistent ? undefined : (
        notificationType === 'error' ? 8000 :
          notificationType === 'warning' ? 6000 : 5000
      ),
    };

    if (notificationType === 'error') {
      store.dispatch(showError(message, notificationConfig));
    } else if (notificationType === 'warning') {
      store.dispatch(showWarning(message, notificationConfig));
    } else {
      store.dispatch(showInfo(message, notificationConfig));
    }
  }


  recordErrorMetric(appError);

  return appError;
}

export function handleSilentError(error: unknown, context?: string): AppError {
  const message = extractErrorMessage(error);
  const status = extractErrorStatus(error);
  const category = extractErrorCategory(error);
  const analysis = analyzeError(error);
  const correlationId = crypto.randomUUID();

  const appError: AppError = {
    message,
    status,
    category: category || analysis.category,
    severity: analysis.severity,
    recoverability: analysis.recoverability,
    retryable: analysis.retryable,
    context,
    originalError: error,
    correlationId,
    timestamp: new Date().toISOString(),
  };


  logger.info(`Silent error handled: ${message}`, {
    feature: 'error-handler',
    action: 'silent-error',
    context,
    apiEndpoint: extractApiEndpoint(error),
    correlationId,
    metadata: {
      status,
      category: appError.category,
      severity: appError.severity,
    },
  });

  return appError;
}


export function createErrorBoundary<T extends Error>(
  errorClass: new (...args: any[]) => T,
  message: string,
  context?: string
): T {
  const error = new errorClass(message);
  logger.error(`Error boundary triggered: ${message}`, {
    feature: 'error-boundary',
    context,
    component: context,
  }, error);
  return error;
}

export function withErrorHandling<T>(
  operation: () => T,
  context?: string,
  fallback?: T
): T | undefined {
  try {
    return operation();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}

export async function withAsyncErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string,
  options: {
    showNotification?: boolean;
    retry?: boolean;
    fallback?: T;
  } = {}
): Promise<T | undefined> {
  const { showNotification = true, retry = false, fallback } = options;

  try {
    if (retry) {
      return await retryOperation(operation, { context });
    }
    return await operation();
  } catch (error) {
    handleError(error, context, showNotification);
    return fallback;
  }
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

