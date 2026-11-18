import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { getApiErrorMessage, isRequestCanceled } from './apiErrorMessage';

const axiosErr = (data: unknown) =>
  new AxiosError('falhou', undefined, undefined, undefined, { status: 400, data, statusText: '', headers: {}, config: {} as InternalAxiosRequestConfig } as AxiosResponse);

describe('getApiErrorMessage', () => {
  it('usa data.message (texto ou lista) da API', () => {
    expect(getApiErrorMessage(axiosErr({ message: 'Nome inválido' }), 'padrão')).toBe('Nome inválido');
    expect(getApiErrorMessage(axiosErr({ message: ['a', 'b'] }), 'padrão')).toBe('a b');
  });
  it('sem mensagem da API usa a do Error e, por último, o texto padrão', () => {
    expect(getApiErrorMessage(axiosErr({}), 'padrão')).toBe('falhou');
    expect(getApiErrorMessage(new Error('boom'), 'padrão')).toBe('boom');
    expect(getApiErrorMessage('texto', 'padrão')).toBe('padrão');
    expect(getApiErrorMessage(undefined, 'padrão')).toBe('padrão');
  });
  it('objeto com formato de resposta (sem ser AxiosError)', () => {
    expect(getApiErrorMessage({ response: { data: { message: 'x' } } }, 'padrão')).toBe('x');
  });
  it('cancelamento é reconhecido', () => {
    const e = new Error('c'); e.name = 'CanceledError';
    expect(isRequestCanceled(e)).toBe(true);
    expect(isRequestCanceled(new Error('x'))).toBe(false);
  });
});
