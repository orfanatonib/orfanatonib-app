import { describe, expect, it } from 'vitest';

import { shouldRefetchFlags } from './refetchPolicy';

const base = { visible: true, lastFetched: 1_000, now: 20_000, minIntervalMs: 15_000 };

describe('shouldRefetchFlags', () => {
  it('relê quando a aba voltou e a leitura passou do intervalo', () => {
    expect(shouldRefetchFlags(base)).toBe(true);
  });

  it('não relê dentro do intervalo mínimo', () => {
    expect(shouldRefetchFlags({ ...base, now: 10_000 })).toBe(false);
  });

  it('relê exatamente no limite do intervalo', () => {
    expect(shouldRefetchFlags({ ...base, now: 16_000 })).toBe(true);
  });

  it('não relê com a aba oculta', () => {
    expect(shouldRefetchFlags({ ...base, visible: false })).toBe(false);
  });

  it('não relê antes da primeira leitura (o boot cuida disso)', () => {
    expect(shouldRefetchFlags({ ...base, lastFetched: null })).toBe(false);
  });
});
