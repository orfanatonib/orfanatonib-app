import type { MemberGalleryItem } from '../types/gallery';

const normalize = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Busca por título ou descrição, sem diferenciar maiúsculas nem acentos. */
export function filterGalleryItems(
  items: readonly MemberGalleryItem[],
  term: string,
): MemberGalleryItem[] {
  const query = normalize(term);
  if (!query) return [...items];
  return items.filter(
    (item) => normalize(item.title).includes(query) || normalize(item.description).includes(query),
  );
}

export function sliceGalleryItems(
  items: readonly MemberGalleryItem[],
  visibleCount: number,
): { visible: MemberGalleryItem[]; hasMore: boolean } {
  return {
    visible: items.slice(0, Math.max(0, visibleCount)),
    hasMore: items.length > visibleCount,
  };
}
