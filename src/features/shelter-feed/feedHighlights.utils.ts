import { PT_BR_MONTH_NAMES } from './constants';
import type { FeedSectionViewModel } from './types';

/** Item do carrossel de destaques; `copy` > 0 indica repetição para completar o loop. */
export interface HighlightLoopItem {
  section: FeedSectionViewModel;
  copy: number;
}

/** A data (ISO) cai no mesmo mês/ano de `reference`, no fuso do navegador. */
export function isInSameLocalMonth(iso: string | null | undefined, reference: Date): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

/** Destaques = publicações do mês corrente com capa, na ordem recebida, até `max`. */
export function selectMonthHighlights(
  sections: ReadonlyArray<FeedSectionViewModel>,
  reference: Date,
  max: number,
): FeedSectionViewModel[] {
  return sections
    .filter((section) => Boolean(section.coverUrl) && isInSameLocalMonth(section.createdAtIso, reference))
    .slice(0, Math.max(0, max));
}

/** "março de 2026". */
export function formatHighlightsMonthLabel(reference: Date): string {
  return `${PT_BR_MONTH_NAMES[reference.getMonth()]} de ${reference.getFullYear()}`;
}

/** Repete os itens (em ordem) até haver ao menos `minLength`, para o loop não ter vazio nem "pulo". */
export function buildLoopItems(
  sections: ReadonlyArray<FeedSectionViewModel>,
  minLength: number,
): HighlightLoopItem[] {
  if (sections.length === 0) return [];
  const copies = sections.length >= minLength ? 1 : Math.ceil(minLength / sections.length);
  return Array.from({ length: copies }, (_, copy) => sections.map((section) => ({ section, copy }))).flat();
}

/** Lista circular começando em `offset` (aceita negativos e valores maiores que o tamanho). */
export function rotateLoop<T>(items: ReadonlyArray<T>, offset: number): T[] {
  if (items.length === 0) return [];
  const start = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

/** Próximo deslocamento circular (`direction` = +1 avança, -1 volta). */
export function stepLoopOffset(offset: number, length: number, direction: 1 | -1): number {
  if (length <= 0) return 0;
  return (((offset + direction) % length) + length) % length;
}
