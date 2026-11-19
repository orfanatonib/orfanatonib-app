import { describe, expect, it } from 'vitest';
import { CollageLayoutKind } from './types';
import { shouldRenderSinglePlayer } from './feedLayout.utils';
import {
  buildSectionAnchorId,
  buildSectionShareUrl,
  parseSectionAnchorHash,
  parseSharedMediaIndex,
  resolveBentoTileColSpan,
  resolveCollageLayout,
  stripSharedMediaParam,
} from './feedLayout.utils';

describe('resolveCollageLayout', () => {
  it('escolhe o arranjo pela quantidade', () => {
    expect([0, 1, 2, 3, 4, 9].map(resolveCollageLayout)).toEqual([
      CollageLayoutKind.EMPTY, CollageLayoutKind.SINGLE, CollageLayoutKind.DUAL,
      CollageLayoutKind.TRIO, CollageLayoutKind.QUAD, CollageLayoutKind.BENTO_FIVE_PLUS,
    ]);
  });
});

describe('resolveBentoTileColSpan', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14])('as linhas de %i cartões fecham 12 colunas', (total) => {
    const spans = Array.from({ length: total }, (_, i) => resolveBentoTileColSpan(i, total));
    let row = 0;
    for (const span of spans) {
      row += span;
      if (row > 12) throw new Error(`linha passou de 12: ${spans.join(',')}`);
      if (row === 12) row = 0;
    }
    expect(row).toBe(0);
  });
});

describe('deep link e compartilhamento', () => {
  it('âncora saneada e reconhecida', () => {
    expect(buildSectionAnchorId('ab-12_x')).toBe('publicacao-feed-ab-12_x');
    expect(buildSectionAnchorId('a/b?c')).toBe('publicacao-feed-abc');
    expect(parseSectionAnchorHash('#publicacao-feed-abc')).toBe('publicacao-feed-abc');
    expect(parseSectionAnchorHash('#publicacao-feed-')).toBeNull();
    expect(parseSectionAnchorHash('#outra')).toBeNull();
  });
  it('link compartilhado leva a galeria, a mídia e a âncora', () => {
    expect(buildSectionShareUrl('https://x.test/', '/feed', '?galeria=g1&midia=9', 's1', 2)).toBe(
      'https://x.test/feed?galeria=g1&midia=2#publicacao-feed-s1',
    );
    expect(buildSectionShareUrl('https://x.test', 'feed', '', 's1')).toBe('https://x.test/feed#publicacao-feed-s1');
  });
  it('lê e remove o parâmetro da mídia', () => {
    expect(parseSharedMediaIndex('?galeria=g&midia=3')).toBe(3);
    expect(parseSharedMediaIndex('?midia=abc')).toBeNull();
    expect(parseSharedMediaIndex('')).toBeNull();
    expect(stripSharedMediaParam('?galeria=g&midia=3')).toBe('?galeria=g');
    expect(stripSharedMediaParam('?midia=3')).toBe('');
  });
});


describe('shouldRenderSinglePlayer', () => {
  it('só um vídeo e mais nada: toca no cartão', () => {
    expect(shouldRenderSinglePlayer([{ mediaType: 'video' }])).toBe(true);
  });
  it('foto + vídeo, várias mídias ou só foto: colagem (o vídeo abre no lightbox)', () => {
    expect(shouldRenderSinglePlayer([{ mediaType: 'image' }, { mediaType: 'video' }])).toBe(false);
    expect(shouldRenderSinglePlayer([{ mediaType: 'video' }, { mediaType: 'video' }])).toBe(false);
    expect(shouldRenderSinglePlayer([{ mediaType: 'image' }])).toBe(false);
  });
});
