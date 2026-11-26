import axios from 'axios';
import { logger } from '../logger';
import { store } from '@/store/slices';
import { recordErrorMetric } from '../errorMetrics';
import type { ApiErrorResponse, AppError } from '@/types/error';
import { RETRY_CONFIG } from './constants';
import {
  analyzeError,
  extractErrorMessage,
  extractErrorStatus,
  extractErrorCategory,
  extractApiEndpoint,
} from './analyze';
import { planNotification } from './notification.plan';
import { dispatchNotification } from './notification.dispatch';

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
    dispatchNotification(message, planNotification({ apiData, status, analysis }));
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
