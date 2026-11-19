import { FEED_MEDIA_QUERY_PARAM, FEED_SECTION_ANCHOR_PREFIX } from './constants';
import { CollageLayoutKind } from './types';

/** Define o arranjo da colagem conforme a quantidade de fotos da publicação. */
export function resolveCollageLayout(mediaCount: number): CollageLayoutKind {
  if (mediaCount <= 0) return CollageLayoutKind.EMPTY;
  if (mediaCount === 1) return CollageLayoutKind.SINGLE;
  if (mediaCount === 2) return CollageLayoutKind.DUAL;
  if (mediaCount === 3) return CollageLayoutKind.TRIO;
  if (mediaCount === 4) return CollageLayoutKind.QUAD;
  return CollageLayoutKind.BENTO_FIVE_PLUS;
}

/**
 * Colunas (de 12) que cada cartão ocupa no modo Momentos em telas `md+`,
 * de modo que toda linha feche exatamente 12 colunas.
 */
export function resolveBentoTileColSpan(index: number, total: number): number {
  if (total <= 1) return 12;
  const fullBlockLimit = Math.floor(total / 5) * 5;
  if (index < fullBlockLimit) {
    const posInBlock = index % 5;
    if (posInBlock === 0) return 7;
    if (posInBlock === 1) return 5;
    return 4;
  }
  const tailCount = total - fullBlockLimit;
  const tailPos = index - fullBlockLimit;
  if (tailCount === 1) return 12;
  if (tailCount === 2) return tailPos === 0 ? 7 : 5;
  if (tailCount === 3) return 4;
  const fourPattern = [7, 5, 5, 7] as const;
  return fourPattern[tailPos] ?? 6;
}

export function formatCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Id HTML único e determinístico para rolar até uma publicação. */
export function buildSectionAnchorId(sectionId: string): string {
  const sanitized = sectionId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${FEED_SECTION_ANCHOR_PREFIX}${sanitized || 'item'}`;
}

/** Link direto compartilhável para uma publicação do feed (preserva `?galeria=`). */
export function buildSectionShareUrl(
  origin: string,
  pathname: string,
  search: string,
  sectionId: string,
  mediaIndex?: number,
): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const params = new URLSearchParams(search);
  params.delete(FEED_MEDIA_QUERY_PARAM);
  if (mediaIndex !== undefined && Number.isInteger(mediaIndex) && mediaIndex >= 0) {
    params.set(FEED_MEDIA_QUERY_PARAM, String(mediaIndex));
  }
  const query = params.toString();
  return `${cleanOrigin}${cleanPath}${query ? `?${query}` : ''}#${buildSectionAnchorId(sectionId)}`;
}

/** Índice (base 0) da mídia pedida em `?midia=N`, ou `null` se ausente/inválido. */
export function parseSharedMediaIndex(search: string): number | null {
  const raw = new URLSearchParams(search).get(FEED_MEDIA_QUERY_PARAM);
  if (raw === null || !/^\d{1,4}$/.test(raw)) return null;
  return Number(raw);
}

/** Remove `?midia=` da busca (ao fechar o lightbox), mantendo o restante. */
export function stripSharedMediaParam(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(FEED_MEDIA_QUERY_PARAM);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Âncora pedida na URL (`#publicacao-feed-<id>`), ou `null` se o hash for outro. */
export function parseSectionAnchorHash(hash: string): string | null {
  const raw = hash.replace(/^#/, '');
  return raw.startsWith(FEED_SECTION_ANCHOR_PREFIX) && raw.length > FEED_SECTION_ANCHOR_PREFIX.length
    ? raw
    : null;
}


/**
 * O cartão toca o vídeo direto (player) só quando o post é UM vídeo e mais nada; post com fotos (ou com várias
 * mídias) usa a colagem, em que o vídeo é um dos quadros e abre no lightbox.
 */
export function shouldRenderSinglePlayer(mediaItems: ReadonlyArray<{ mediaType: string }>): boolean {
  return mediaItems.length === 1 && mediaItems[0].mediaType === 'video';
}
