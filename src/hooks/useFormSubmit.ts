import { useCallback, useState } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { handleError } from '@/utils/errorHandler';
import type { AppError, ErrorHandlingOptions } from '@/types/error';

export interface UseFormSubmitResult<T = any> {
  submit: (data: T, options?: ErrorHandlingOptions) => Promise<boolean>;
  isSubmitting: boolean;
  isRetrying: boolean;
  retryCount: number;
  error: AppError | null;
  clearError: () => void;
  lastSubmissionData: T | null;
  submissionCount: number;
}

export function useFormSubmit<T = any>(
  submitFunction: (data: T) => Promise<void>,
  context?: string,
  options: {
    clearErrorOnSubmit?: boolean;
    showSuccessNotification?: boolean;
    successMessage?: string;
  } = {}
): UseFormSubmitResult<T> {
  const {
    clearErrorOnSubmit = true,
    showSuccessNotification = true,
    successMessage = 'Dados salvos com sucesso!',
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionData, setLastSubmissionData] = useState<T | null>(null);
  const [submissionCount, setSubmissionCount] = useState(0);

  const {
    error,
    isRetrying,
    retryCount,
    handleError: handleErrorBase,
    clearError,
    executeWithErrorHandling,
  } = useErrorHandler(context);

  const submit = useCallback(async (data: T, submitOptions?: ErrorHandlingOptions): Promise<boolean> => {
    if (clearErrorOnSubmit) {
      clearError();
    }

    setIsSubmitting(true);
    setLastSubmissionData(data);
    setSubmissionCount(prev => prev + 1);

    try {
      await executeWithErrorHandling(
        () => submitFunction(data),
        {
          showNotification: false,
          ...submitOptions,
        }
      );

      setIsSubmitting(false);

      if (showSuccessNotification && submitOptions?.showNotification !== false) {
        import('@/store/slices').then(({ store }) => {
          import('@/store/slices/notification/notificationSlice').then(({ showNotification }) => {
            store.dispatch(showNotification({
              message: successMessage,
              type: 'success',
              duration: 4000,
            }));
          });
        });
      }

      return true;
    } catch (error) {
      setIsSubmitting(false);

      if (submitOptions?.showNotification !== false) {
        handleError(error, `${context} - Form submission failed`);
      }

      return false;
    }
  }, [
    submitFunction,
    context,
    clearErrorOnSubmit,
    showSuccessNotification,
    successMessage,
    executeWithErrorHandling,
    clearError,
  ]);

  return {
    submit,
    isSubmitting,
    isRetrying,
    retryCount,
    error,
    clearError,
    lastSubmissionData,
    submissionCount,
  };
}
