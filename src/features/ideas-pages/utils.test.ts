import { describe, expect, it } from 'vitest';
import { formatPtBrDate, truncate } from './utils';

describe('utils de páginas de ideias', () => {
  it('formatPtBrDate: sem data devolve o texto padrão', () => {
    expect(formatPtBrDate()).toBe('Não disponível');
    expect(formatPtBrDate('')).toBe('Não disponível');
  });

  it('formatPtBrDate: formata em pt-BR', () => {
    expect(formatPtBrDate('2026-11-20T15:30:00Z')).toMatch(/20\/11\/2026/);
  });

  it('truncate: só corta acima do limite', () => {
    expect(truncate('abc', 3)).toBe('abc');
    expect(truncate('abcd', 3)).toBe('abc...');
    expect(truncate('x'.repeat(101))).toBe(`${'x'.repeat(100)}...`);
  });
});
