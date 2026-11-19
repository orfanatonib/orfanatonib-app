import { describe, expect, it } from 'vitest';
import {
  buildLoopItems,
  formatHighlightsMonthLabel,
  isInSameLocalMonth,
  rotateLoop,
  selectMonthHighlights,
  stepLoopOffset,
} from './feedHighlights.utils';
import type { FeedSectionViewModel } from './types';

const vm = (id: string, createdAtIso: string | null, coverUrl = 'https://x.test/a.png'): FeedSectionViewModel =>
  ({ id, createdAtIso, coverUrl, caption: id }) as FeedSectionViewModel;

describe('isInSameLocalMonth', () => {
  const ref = new Date(2026, 2, 15, 12); // 15/03/2026 local
  it('aceita só o mesmo mês e ano (virada de mês e de ano)', () => {
    expect(isInSameLocalMonth(new Date(2026, 2, 1, 0, 0, 0).toISOString(), ref)).toBe(true);
    expect(isInSameLocalMonth(new Date(2026, 2, 31, 23, 59, 59).toISOString(), ref)).toBe(true);
    expect(isInSameLocalMonth(new Date(2026, 1, 28, 23, 59, 59).toISOString(), ref)).toBe(false);
    expect(isInSameLocalMonth(new Date(2026, 3, 1, 0, 0, 0).toISOString(), ref)).toBe(false);
    expect(isInSameLocalMonth(new Date(2025, 2, 15).toISOString(), ref)).toBe(false);
    expect(isInSameLocalMonth(null, ref)).toBe(false);
    expect(isInSameLocalMonth('lixo', ref)).toBe(false);
  });
  it('usa o fuso do navegador: o instante local decide o mês', () => {
    const lastInstantOfMarch = new Date(2026, 2, 31, 23, 30);
    expect(isInSameLocalMonth(lastInstantOfMarch.toISOString(), new Date(2026, 2, 1))).toBe(true);
    expect(isInSameLocalMonth(lastInstantOfMarch.toISOString(), new Date(2026, 3, 1))).toBe(false);
  });
});

describe('selectMonthHighlights', () => {
  const ref = new Date(2026, 2, 15, 12);
  const mar = (day: number) => new Date(2026, 2, day, 10).toISOString();
  it('só do mês corrente, com capa, limitado ao máximo e na ordem recebida', () => {
    const list = [
      vm('a', mar(20)),
      vm('b', new Date(2026, 1, 10).toISOString()),
      vm('c', mar(10), ''),
      vm('d', mar(5)),
      vm('e', mar(2)),
    ];
    expect(selectMonthHighlights(list, ref, 2).map((s) => s.id)).toEqual(['a', 'd']);
    expect(selectMonthHighlights(list, ref, 10).map((s) => s.id)).toEqual(['a', 'd', 'e']);
    expect(selectMonthHighlights([vm('x', null)], ref, 5)).toEqual([]);
  });
  it('post só de vídeo (sem foto de capa) continua sendo destaque; sem capa e sem vídeo, não', () => {
    const onlyVideo = { ...vm('v', mar(8), ''), isVideo: true } as FeedSectionViewModel;
    const empty = vm('e', mar(9), '');
    expect(selectMonthHighlights([onlyVideo, empty], ref, 5).map((s) => s.id)).toEqual(['v']);
  });
  it('rótulo do mês', () => {
    expect(formatHighlightsMonthLabel(ref)).toBe('março de 2026');
  });
});

describe('loop infinito', () => {
  const items = [vm('a', null), vm('b', null)];
  it('com poucos itens repete até o mínimo, mantendo a ordem', () => {
    const loop = buildLoopItems(items, 6);
    expect(loop.map((i) => `${i.section.id}${i.copy}`)).toEqual(['a0', 'b0', 'a1', 'b1', 'a2', 'b2']);
    expect(buildLoopItems([items[0]], 3).map((i) => i.copy)).toEqual([0, 1, 2]);
  });
  it('com itens suficientes não repete; vazio continua vazio', () => {
    expect(buildLoopItems(items, 2)).toHaveLength(2);
    expect(buildLoopItems([], 6)).toEqual([]);
  });
  it('rotação circular sem pulo: o último passo volta ao início', () => {
    const letters = ['a', 'b', 'c'];
    expect(rotateLoop(letters, 1)).toEqual(['b', 'c', 'a']);
    expect(rotateLoop(letters, 3)).toEqual(letters);
    expect(rotateLoop(letters, -1)).toEqual(['c', 'a', 'b']);
    expect(rotateLoop([], 4)).toEqual([]);
    let offset = 0;
    const seen = Array.from({ length: 4 }, () => (offset = stepLoopOffset(offset, 3, 1)));
    expect(seen).toEqual([1, 2, 0, 1]);
    expect(stepLoopOffset(0, 3, -1)).toBe(2);
    expect(stepLoopOffset(0, 0, 1)).toBe(0);
  });
});
