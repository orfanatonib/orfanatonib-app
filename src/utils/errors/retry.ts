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
import { analyzeError } from './analyze';

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
