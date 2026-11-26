import { describe, expect, it } from 'vitest';

import { formatCount, formatDuration, healthSeverity } from './diagnostics.utils';
import { AiProviderHealthStatus } from './types';
import type { AiProviderHealthResult } from './types';

const result = (status: AiProviderHealthStatus): AiProviderHealthResult => ({
  provider: 'openai',
  status,
  ok: status === AiProviderHealthStatus.OK,
  message: '',
  missingModels: [],
  checkedAt: '2026-01-01T00:00:00.000Z',
  durationMs: 10,
});

describe('diagnostics.utils', () => {
  it('gravidade por status', () => {
    expect(healthSeverity(result(AiProviderHealthStatus.OK))).toBe('success');
    expect(healthSeverity(result(AiProviderHealthStatus.NO_KEY))).toBe('warning');
    expect(healthSeverity(result(AiProviderHealthStatus.MODEL_MISSING))).toBe('warning');
    expect(healthSeverity(result(AiProviderHealthStatus.FAILED))).toBe('error');
  });
  it('formata números e duração em pt-BR', () => {
    expect(formatCount(12345)).toBe('12.345');
    expect(formatCount(-1)).toBe('0');
    expect(formatCount(undefined)).toBe('0');
    expect(formatDuration(850)).toBe('850 ms');
    expect(formatDuration(1500)).toBe('1,5 s');
    expect(formatDuration(Number.NaN)).toBe('0 ms');
  });
});
