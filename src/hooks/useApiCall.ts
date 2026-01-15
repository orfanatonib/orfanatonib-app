import { useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';
import type { ErrorHandlingOptions } from '@/utils/errorHandler';

export interface UseApiCallResult<T> {
  execute: (options?: ErrorHandlingOptions) => Promise<T | undefined>;
  executeWithRetry: (options?: ErrorHandlingOptions & { maxRetries?: number }) => Promise<T | undefined>;
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
  error: any;
  clearError: () => void;
}

export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  context?: string
): UseApiCallResult<T> {
  const {
    executeWithErrorHandling,
    executeWithRetry,
    isLoading,
    isRetrying,
    retryCount,
    error,
    clearError,
  } = useErrorHandler(context);

  const execute = useCallback((options?: ErrorHandlingOptions) => {
    return executeWithErrorHandling(apiFunction, {
      showNotification: false,
      ...options,
    });
  }, [executeWithErrorHandling, apiFunction]);

  const executeWithRetryHandler = useCallback((options?: ErrorHandlingOptions & { maxRetries?: number }) => {
    return executeWithRetry(apiFunction, {
      showNotification: false,
      ...options,
    });
  }, [executeWithRetry, apiFunction]);

  return {
    execute,
    executeWithRetry: executeWithRetryHandler,
    isLoading,
    isRetrying,
    retryCount,
    error,
    clearError,
  };
}
