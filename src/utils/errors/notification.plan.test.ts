import { describe, expect, it } from 'vitest';
import { planNotification } from './notification.plan';
import type { NotificationPlanInput } from './notification.types';
import type { ApiErrorResponse } from '@/types/error';

const baseAnalysis: NotificationPlanInput['analysis'] = {
  category: 'UNKNOWN',
  severity: 'MEDIUM',
  recoverability: 'NON_RECOVERABLE',
};

function api(partial: Partial<ApiErrorResponse>): ApiErrorResponse {
  return {
    statusCode: 400,
    message: 'x',
    error: 'Bad Request',
    category: 'RULE',
    timestamp: '2026-01-01T00:00:00.000Z',
    path: '/x',
    requestId: 'req-1',
    correlationId: 'abcdefghijkl',
    ...partial,
  };
}

describe('planNotification', () => {
  it('anexa o requestId do servidor ao texto de apoio (com ou sem descrição prévia)', () => {
    const comDescricao = planNotification({ apiData: api({ category: 'PROCESS', requestId: 'rid-9' }), status: 202, analysis: baseAnalysis });
    expect(comDescricao.description).toBe('Operação em andamento\nCódigo do erro: rid-9');
    const semDescricao = planNotification({ apiData: api({ category: 'BUSINESS', requestId: 'rid-10' }), status: 404, analysis: baseAnalysis });
    expect(semDescricao.description).toBe('Código do erro: rid-10');
    expect(planNotification({ status: 404, analysis: baseAnalysis }).description).toBeUndefined();
  });

  it('RULE com campos: aviso no topo direito pedindo para revisar os campos', () => {
    const plan = planNotification({
      apiData: api({ category: 'RULE', details: { fields: { name: ['obrigatório'] } } }),
      status: 400,
      analysis: baseAnalysis,
    });
    expect(plan).toMatchObject({ level: 'warning', position: 'top-right', title: 'Dados inválidos', description: 'Verifique os campos destacados\nCódigo do erro: req-1', duration: 6000 });
  });

  it('RULE com lista de mensagens: primeira vira título, o resto descrição', () => {
    const plan = planNotification({ apiData: api({ message: ['a', 'b', 'c'] }), status: 400, analysis: baseAnalysis });
    expect(plan.title).toBe('a');
    expect(plan.description).toBe('b c\nCódigo do erro: req-1');
  });

  it.each([
    [404, 'Não encontrado', 'warning'],
    [409, 'Conflito', 'warning'],
    [422, 'Dados inválidos', 'warning'],
    [418, undefined, 'error'],
  ])('BUSINESS %i', (status, title, level) => {
    const plan = planNotification({ apiData: api({ category: 'BUSINESS' }), status, analysis: baseAnalysis });
    expect(plan.title).toBe(title);
    expect(plan.level).toBe(level);
    expect(plan.position).toBe('bottom-center');
  });

  it('SERVER crítico é persistente (sem duração), mostra o prefixo do correlationId e recarrega se recuperável', () => {
    const plan = planNotification({
      apiData: api({ category: 'SERVER' }),
      status: 500,
      analysis: { category: 'SERVER', severity: 'CRITICAL', recoverability: 'RECOVERABLE' },
    });
    expect(plan.persistent).toBe(true);
    expect(plan.duration).toBeUndefined();
    expect(plan.description).toBe('ID: abcdefgh...\nCódigo do erro: req-1');
    expect(plan.action).toEqual({ label: 'Tentar novamente', kind: 'reload' });
  });

  it('PROCESS é informativo', () => {
    const plan = planNotification({ apiData: api({ category: 'PROCESS' }), status: 202, analysis: baseAnalysis });
    expect(plan).toMatchObject({ level: 'info', title: 'Processando', duration: 5000 });
  });

  it('401 e 403 sem categoria: persistentes com ação de login/voltar', () => {
    expect(planNotification({ status: 401, analysis: baseAnalysis })).toMatchObject({ persistent: true, action: { kind: 'login' } });
    expect(planNotification({ status: 403, analysis: baseAnalysis })).toMatchObject({ persistent: true, title: 'Acesso negado', action: { kind: 'back' } });
  });

  it('429 usa retryAfter da API ou 60 segundos', () => {
    const withValue = planNotification({ apiData: api({ category: 'UNKNOWN', details: { retryAfter: 12 } }), status: 429, analysis: baseAnalysis });
    expect(withValue.description).toBe('Tente novamente em 12 segundos\nCódigo do erro: req-1');
    expect(planNotification({ status: 429, analysis: baseAnalysis }).description).toBe('Tente novamente em 60 segundos');
  });

  it('408 e 5xx oferecem recarregar (5xx só se recuperável)', () => {
    expect(planNotification({ status: 408, analysis: baseAnalysis }).action?.kind).toBe('reload');
    expect(planNotification({ status: 503, analysis: { ...baseAnalysis, recoverability: 'RECOVERABLE' } }).action?.kind).toBe('reload');
    expect(planNotification({ status: 503, analysis: baseAnalysis }).action).toBeUndefined();
  });

  it('rede sem status: "Sem conexão" persistente', () => {
    const plan = planNotification({ analysis: { ...baseAnalysis, category: 'NETWORK' } });
    expect(plan).toMatchObject({ level: 'error', title: 'Sem conexão', persistent: true });
  });

  it.each([
    ['LOW', 'info', 'bottom-left', false],
    ['MEDIUM', 'warning', 'bottom-center', false],
    ['HIGH', 'error', 'top-center', false],
    ['CRITICAL', 'error', 'top-center', true],
  ] as const)('sem status nem categoria, severidade %s', (severity, level, position, persistent) => {
    const plan = planNotification({ analysis: { ...baseAnalysis, severity } });
    expect(plan).toMatchObject({ level, position, persistent });
  });
});
