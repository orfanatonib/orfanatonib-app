import { useCallback, useState } from 'react';
import {
  handleError,
  handleSilentError,
  withAsyncErrorHandling,
  retryOperation,
  type AppError,
  type ErrorHandlingOptions
} from '@/utils/errorHandler';
import type { ErrorState } from '@/types/error';

export interface UseErrorHandlerResult {
  error: AppError | null;
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
  handleError: (error: unknown, options?: ErrorHandlingOptions) => AppError;
  handleSilentError: (error: unknown, options?: Omit<ErrorHandlingOptions, 'showNotification'>) => AppError;
  clearError: () => void;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    options?: ErrorHandlingOptions
  ) => Promise<T | undefined>;
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    options?: ErrorHandlingOptions & { maxRetries?: number }
  ) => Promise<T | undefined>;
}

export function useErrorHandler(context?: string): UseErrorHandlerResult {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    isRetrying: false,
    retryCount: 0,
  });

  const handleErrorWithContext = useCallback((error: unknown, options?: ErrorHandlingOptions) => {
    const fullContext = [context, options?.context].filter(Boolean).join(' - ');
    const appError = handleError(
      error,
      fullContext,
      options?.showNotification ?? true,
      options?.logError ?? true
    );

    setErrorState(prev => ({
      ...prev,
      error: appError,
      isLoading: false,
      isRetrying: false,
    }));

    return appError;
  }, [context]);

  const handleSilentErrorWithContext = useCallback((error: unknown, options?: Omit<ErrorHandlingOptions, 'showNotification'>) => {
    const fullContext = [context, options?.context].filter(Boolean).join(' - ');
    const appError = handleSilentError(error, fullContext);

    setErrorState(prev => ({
      ...prev,
      error: appError,
      isLoading: false,
      isRetrying: false,
    }));

    return appError;
  }, [context]);

  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      error: null,
      isLoading: false,
      isRetrying: false,
      retryCount: 0,
    }));
  }, []);

  const executeWithErrorHandling = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: ErrorHandlingOptions
  ): Promise<T | undefined> => {
    setErrorState(prev => ({ ...prev, isLoading: true, error: null }));

    const fullContext = [context, options?.context].filter(Boolean).join(' - ');

    const result = await withAsyncErrorHandling(
      operation,
      fullContext,
      {
        showNotification: options?.showNotification ?? true,
        retry: false,
        fallback: options?.fallback,
      }
    );

    setErrorState(prev => ({
      ...prev,
      isLoading: false,
    }));

    return result;
  }, [context]);

  const executeWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: ErrorHandlingOptions & { maxRetries?: number }
  ): Promise<T | undefined> => {
    setErrorState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isRetrying: false,
      retryCount: 0
    }));

    const fullContext = [context, options?.context].filter(Boolean).join(' - ');
    const { maxRetries, ...errorOptions } = options || {};

    try {
      const result = await retryOperation(
        operation,
        {
          maxRetries,
          context: fullContext,
          onRetry: (attempt, error) => {
            setErrorState(prev => ({
              ...prev,
              isRetrying: true,
              retryCount: attempt,
            }));

            handleSilentError(error, `${fullContext} - Retry ${attempt}`);
          },
        }
      );

      setErrorState(prev => ({
        ...prev,
        isLoading: false,
        isRetrying: false,
        retryCount: 0,
        error: null,
      }));

      return result;
    } catch (error) {
      const appError = handleError(
        error,
        fullContext,
        options?.showNotification ?? true,
        options?.logError ?? true
      );

      setErrorState(prev => ({
        ...prev,
        isLoading: false,
        isRetrying: false,
        error: appError,
      }));

      return options?.fallback;
    }
  }, [context]);

  return {
    error: errorState.error,
    isLoading: errorState.isLoading,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    handleError: handleErrorWithContext,
    handleSilentError: handleSilentErrorWithContext,
    clearError,
    executeWithErrorHandling,
    executeWithRetry,
  };
}
