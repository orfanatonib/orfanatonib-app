import axios from 'axios';
import { extractErrorStatus } from './analyze';

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


