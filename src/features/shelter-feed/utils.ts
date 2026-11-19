import { FEED_AUTHOR_UNKNOWN_LABEL, FEED_COMMENT_MAX_LENGTH } from './constants';
import type { CelebrationState, CommentDraftError, FeedAuthor } from './types';

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const LINK_PATTERN = /(https?:\/\/|www\.)\S+/i;
const LONG_DIGIT_RUN_PATTERN = /(?:\d[\s().-]?){8,}/;

/** Estado otimista do "celebrar": inverte e ajusta a contagem (nunca abaixo de zero). */
export function applyOptimisticToggle(state: CelebrationState): CelebrationState {
  const celebratedByMe = !state.celebratedByMe;
  return {
    ...state,
    celebratedByMe,
    count: Math.max(0, state.count + (celebratedByMe ? 1 : -1)),
  };
}

/** "Autor: Maria L." ou o rótulo neutro para itens antigos. */
export function formatAuthorLabel(author: FeedAuthor | null | undefined): string {
  return author?.displayName ? `Por ${author.displayName}` : FEED_AUTHOR_UNKNOWN_LABEL;
}

/** Texto acessível da contagem: "1 celebração" / "3 celebrações". */
export function formatCelebrationCount(count: number): string {
  return `${count} ${count === 1 ? 'celebração' : 'celebrações'}`;
}

export function formatCommentCount(count: number): string {
  return `${count} ${count === 1 ? 'comentário' : 'comentários'}`;
}

/** Validação local (espelha a API, que continua soberana). `null` = ok. */
export function validateCommentDraft(raw: string): CommentDraftError | null {
  const text = raw.trim();
  if (text.length === 0) return 'empty';
  if (text.length > FEED_COMMENT_MAX_LENGTH) return 'too-long';
  if (EMAIL_PATTERN.test(text) || LINK_PATTERN.test(text) || LONG_DIGIT_RUN_PATTERN.test(text)) {
    return 'sensitive';
  }
  return null;
}

export function formatCommentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Galeria do feed: `?galeria=<uuid>` (deep link, usado também pelos E2E) vence a
 * configurada em `VITE_FEED_MINISTERIO_ID`. Valor que não é UUID é ignorado; a
 * visibilidade continua sendo decidida pela API.
 */
export function resolveFeedPageId(
  galleryParam: string | null,
  configuredId: string | undefined,
): string | undefined {
  return galleryParam && UUID_PATTERN.test(galleryParam) ? galleryParam : configuredId;
}
