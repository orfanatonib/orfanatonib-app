import { describe, expect, it } from 'vitest';
import { coverImageUrl, countMedias, formatPtBrDate, truncate } from './utils';

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

  it('countMedias e coverImageUrl somam as seções e escolhem a primeira imagem', () => {
    const page = {
      title: 't',
      description: '',
      sections: [
        { title: 'a', description: '', medias: [{ mediaType: 'video', url: 'v' }] },
        { title: 'b', description: '', medias: [{ mediaType: 'image', url: 'i1' }, { mediaType: 'image', url: 'i2' }] },
      ],
    } as unknown as Parameters<typeof countMedias>[0];
    expect(countMedias(page)).toBe(3);
    expect(coverImageUrl(page)).toBe('i1');
    expect(coverImageUrl({ ...page, sections: [] })).toBeUndefined();
  });
});
