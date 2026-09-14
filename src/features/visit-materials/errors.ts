import { extractErrorMessage } from '@/utils/errorHandler';

const GENERIC_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';

export const visitMaterialErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const message = extractErrorMessage(error);
  return message === GENERIC_ERROR_MESSAGE ? fallback : message;
};
