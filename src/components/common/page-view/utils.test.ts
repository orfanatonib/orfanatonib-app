import { describe, expect, it } from 'vitest';
import { PageViewType } from './types';
import { buildHeroGradient, formatCountLabel, getPageViewAccent, resolveSkeletonCount } from './utils';

describe('page-view utils', () => {
  it('has distinct accents per type', () => {
    const colors = Object.values(PageViewType).map((t) => getPageViewAccent(t).color);
    expect(new Set(colors).size).toBe(3);
  });

  it('builds gradient', () => {
    expect(buildHeroGradient(getPageViewAccent(PageViewType.IDEAS))).toContain('#9c27b0');
  });

  it('formats counts with singular/plural', () => {
    expect(formatCountLabel(1, 'Seção', 'Seções')).toBe('1 Seção');
    expect(formatCountLabel(0, 'Seção', 'Seções')).toBe('0 Seções');
    expect(formatCountLabel(-3, 'Seção', 'Seções')).toBe('0 Seções');
    expect(formatCountLabel(5, 'Vídeo', 'Vídeos')).toBe('5 Vídeos');
  });

  it('clamps skeleton count', () => {
    expect(resolveSkeletonCount()).toBe(3);
    expect(resolveSkeletonCount(99)).toBe(12);
    expect(resolveSkeletonCount(-1)).toBe(0);
    expect(resolveSkeletonCount(NaN)).toBe(3);
  });
});
