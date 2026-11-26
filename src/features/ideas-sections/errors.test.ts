import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { ideasSectionErrorMessage } from './errors';

const axiosError = (data: unknown) =>
  new AxiosError('falhou', 'ERR', undefined, undefined, { data, status: 400, statusText: '', headers: {}, config: {} as never });

describe('ideasSectionErrorMessage', () => {
  it('usa a mensagem da API', () => {
    expect(ideasSectionErrorMessage(axiosError({ message: 'Arquivo ausente' }), 'x')).toBe('Arquivo ausente');
  });

  it('junta a lista de mensagens da validação', () => {
    expect(ideasSectionErrorMessage(axiosError({ message: ['a', 'b'] }), 'x')).toBe('a; b');
  });

  it('cai na mensagem do Error e depois no texto de recuo', () => {
    expect(ideasSectionErrorMessage(new Error('rede'), 'x')).toBe('rede');
    expect(ideasSectionErrorMessage('estranho', 'recuo')).toBe('recuo');
    expect(ideasSectionErrorMessage(axiosError({ message: '  ' }), 'recuo')).toBe('falhou');
  });
});
