import { logger } from '../logger';
import { retryOperation } from './retry';
import { handleError } from './handle';

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
