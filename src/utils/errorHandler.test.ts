import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import {
  analyzeError,
  calculateRetryDelay,
  extractCorrelationId,
  extractErrorCategory,
  extractErrorMessage,
  extractErrorStatus,
  isConflictError,
  isForbiddenError,
  isNetworkError,
  isNotFoundError,
  isServerError,
  isTooManyRequestsError,
  isUnauthorizedError,
  isValidationError,
} from './errorHandler';

function axiosError(status: number | null, data?: unknown, code?: string): AxiosError {
  const config = { url: '/x' } as InternalAxiosRequestConfig;
  const response =
    status === null
      ? undefined
      : ({ status, data, statusText: '', headers: {}, config } as AxiosResponse);
  return new AxiosError('falhou', code, config, undefined, response);
}

describe('extract*', () => {
  it('mensagem: array de mensagens é unida; fallback por status; rede; string; desconhecido', () => {
    expect(extractErrorMessage(axiosError(400, { message: ['a', 'b'] }))).toBe('a b');
    expect(extractErrorMessage(axiosError(404, {}))).toBe('Recurso não encontrado.');
    expect(extractErrorMessage(axiosError(null, undefined, 'ERR_NETWORK'))).toBe(
      'Erro de conexão. Verifique sua internet.',
    );
    expect(extractErrorMessage('texto')).toBe('texto');
    expect(extractErrorMessage(new Error('e'))).toBe('e');
    expect(extractErrorMessage(42)).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });

  it('status, categoria e correlationId', () => {
    expect(extractErrorStatus(axiosError(409))).toBe(409);
    expect(extractErrorStatus(new Error('x'))).toBeUndefined();
    expect(extractErrorCategory(axiosError(400, { category: 'RULE' }))).toBe('VALIDATION');
    expect(extractErrorCategory(axiosError(401))).toBe('AUTHENTICATION');
    expect(extractErrorCategory(axiosError(418))).toBeUndefined();
    expect(extractCorrelationId(axiosError(500, { correlationId: 'corr-1' }))).toBe('corr-1');
  });
});

describe('analyzeError', () => {
  it('rede é recuperável e repetível', () => {
    expect(analyzeError(axiosError(null, undefined, 'ERR_NETWORK'))).toMatchObject({
      category: 'NETWORK',
      retryable: true,
    });
  });

  it('category da API manda sobre o status', () => {
    expect(analyzeError(axiosError(400, { category: 'RULE', message: ['x', 'y'] }))).toMatchObject({
      category: 'VALIDATION',
      recoverability: 'REQUIRES_USER_ACTION',
      userMessage: 'x y',
    });
    expect(analyzeError(axiosError(404, { category: 'BUSINESS', message: 'n' })).recoverability).toBe(
      'NON_RECOVERABLE',
    );
    expect(analyzeError(axiosError(500, { category: 'SERVER' })).retryable).toBe(true);
  });

  it('status sem category', () => {
    expect(analyzeError(axiosError(401)).userMessage).toContain('sessão expirou');
    expect(analyzeError(axiosError(403)).recoverability).toBe('NON_RECOVERABLE');
    expect(analyzeError(axiosError(429, { details: { retryAfter: 30 } })).userMessage).toContain('30');
    expect(analyzeError(axiosError(503)).retryable).toBe(true);
    expect(analyzeError(axiosError(409)).userMessage).toBe('Já existe um registro com estes dados.');
  });

  it('erro não-axios é UNKNOWN', () => {
    expect(analyzeError(new Error('x')).category).toBe('UNKNOWN');
  });
});

describe('predicados e retry', () => {
  it('predicados por status', () => {
    expect(isUnauthorizedError(axiosError(401))).toBe(true);
    expect(isForbiddenError(axiosError(403))).toBe(true);
    expect(isNotFoundError(axiosError(404))).toBe(true);
    expect(isValidationError(axiosError(422))).toBe(true);
    expect(isServerError(axiosError(502))).toBe(true);
    expect(isServerError(axiosError(400))).toBe(false);
    expect(isConflictError(axiosError(409))).toBe(true);
    expect(isTooManyRequestsError(axiosError(429))).toBe(true);
    expect(isNetworkError(axiosError(null, undefined, 'ERR_NETWORK'))).toBe(true);
    expect(isNetworkError(axiosError(500))).toBe(false);
  });

  it('backoff exponencial limitado a 10s', () => {
    expect(calculateRetryDelay(1)).toBe(1000);
    expect(calculateRetryDelay(2)).toBe(2000);
    expect(calculateRetryDelay(3)).toBe(4000);
    expect(calculateRetryDelay(10)).toBe(10000);
  });
});

describe('FEATURE_DISABLED (flag desligada para o perfil)', () => {
  const featureDisabled = (): AxiosError => {
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: {
        statusCode: 403,
        message: 'A funcionalidade "shelter_pages" está temporariamente indisponível',
        details: { code: 'FEATURE_DISABLED' },
      },
    });
    return error;
  };

  it('mostra a mensagem própria, não o texto técnico da API', async () => {
    const { extractErrorMessage, FEATURE_DISABLED_MESSAGE } = await import('./errors/analyze');
    expect(extractErrorMessage(featureDisabled())).toBe(FEATURE_DISABLED_MESSAGE);
  });

  it('distingue recurso desligado de falta de permissão (403 comum)', async () => {
    const { isFeatureDisabledError } = await import('./errors/analyze');
    expect(isFeatureDisabledError(featureDisabled())).toBe(true);
    const plain403 = new AxiosError('x', 'ERR', undefined, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: 'Acesso negado' },
    });
    expect(isFeatureDisabledError(plain403)).toBe(false);
    expect(isFeatureDisabledError(new Error('x'))).toBe(false);
  });
});
