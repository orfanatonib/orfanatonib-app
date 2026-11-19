import axios from 'axios';
import { logger } from '../logger';
import { store } from '@/store/slices';
import { showError, showSuccess, showWarning, showInfo } from '@/store/slices/notification/notificationSlice';
import { recordErrorMetric } from '../errorMetrics';
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
import {
  analyzeError,
  extractErrorMessage,
  extractErrorStatus,
  extractErrorCategory,
  extractApiEndpoint,
  extractCorrelationId,
} from './analyze';
import { calculateRetryDelay, retryOperation, sleep } from './retry';

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
  errorClass: new (message: string) => T,
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

