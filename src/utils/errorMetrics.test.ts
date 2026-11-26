import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./logger', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import {
  errorMetrics,
  exportErrorMetrics,
  getErrorHealthStatus,
  getErrorStats,
  recordErrorMetric,
} from './errorMetrics';
import type { AppError } from '@/types/error';

const err = (over: Partial<AppError> = {}): AppError =>
  ({ category: 'SERVER', severity: 'HIGH', context: 'ctx', message: 'x', ...over }) as AppError;

describe('errorMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T12:00:00Z'));
    errorMetrics.clearMetrics();
  });
  afterEach(() => {
    errorMetrics.clearMetrics();
    vi.useRealTimers();
  });

  it('registra categoria/severidade com padrão e guarda só o caminho da URL (sem query)', () => {
    window.history.pushState({}, '', '/redefinir-senha?token=SEGREDO&email=a@b.com');
    recordErrorMetric({ message: 'x' } as AppError);
    const [metric] = exportErrorMetrics();
    expect(metric.category).toBe('UNKNOWN');
    expect(metric.severity).toBe('MEDIUM');
    expect(metric.url).toBe('/redefinir-senha');
    expect(JSON.stringify(metric)).not.toContain('SEGREDO');
  });

  it('estatísticas agregam por categoria, severidade e contexto', () => {
    recordErrorMetric(err({ category: 'SERVER', severity: 'HIGH', context: 'a' }));
    recordErrorMetric(err({ category: 'NETWORK', severity: 'LOW', context: 'a' }));
    recordErrorMetric(err({ category: 'NETWORK', severity: 'LOW', context: 'b' }));
    const stats = getErrorStats();
    expect(stats.totalErrors).toBe(3);
    expect(stats.errorsByCategory.NETWORK).toBe(2);
    expect(stats.errorsBySeverity.LOW).toBe(2);
    expect(stats.topErrorContexts[0]).toEqual({ context: 'a', count: 2 });
  });

  it('a janela de tempo descarta erros antigos', () => {
    recordErrorMetric(err());
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    recordErrorMetric(err());
    expect(getErrorStats().totalErrors).toBe(1);
    expect(getErrorStats(3 * 60 * 60 * 1000).totalErrors).toBe(2);
  });

  it('guarda no máximo 1000 métricas (as mais recentes)', () => {
    for (let i = 0; i < 1005; i++) recordErrorMetric(err({ context: `c${i}` }));
    const all = exportErrorMetrics();
    expect(all).toHaveLength(1000);
    expect(all[all.length - 1].context).toBe('c1004');
  });

  it('saúde: healthy, warning (>5/min) e critical (>10/min)', () => {
    expect(getErrorHealthStatus().status).toBe('healthy');
    for (let i = 0; i < 6; i++) recordErrorMetric(err());
    expect(getErrorHealthStatus().status).toBe('warning');
    for (let i = 0; i < 5; i++) recordErrorMetric(err());
    expect(getErrorHealthStatus().status).toBe('critical');
  });
});
