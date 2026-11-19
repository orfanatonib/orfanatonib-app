import { MediaType } from '@/store/slices/types';
import type { MediaItem } from '@/store/slices/types';
import { getMediaPreviewUrl } from '@/utils/getMediaPreviewUrl';
import { FEED_COMMENTS_MAX_LENGTH, FEED_COMMENT_STATUS_LABELS } from './constants';
import { FeedCommentStatus } from './types';
import type {
  FeedCommentCover,
  FeedCommentStatusFilter,
  ModerationFeedCommentsQuery,
} from './types';

export function isFeedCommentStatus(value: string): value is FeedCommentStatus {
  return Object.values(FeedCommentStatus).some((status) => status === value);
}

export function toStatusFilter(value: string): FeedCommentStatusFilter {
  return isFeedCommentStatus(value) ? value : '';
}

export function buildModerationQuery(
  page: number,
  limit: number,
  search: string,
  status: FeedCommentStatusFilter,
): ModerationFeedCommentsQuery {
  const term = search.trim();
  return {
    page,
    limit,
    ...(term ? { search: term } : {}),
    ...(status ? { status } : {}),
  };
}

/** Texto do rótulo de status exibido ao usuário. */
export function getStatusLabel(status: FeedCommentStatus): string {
  return FEED_COMMENT_STATUS_LABELS[status];
}

/** Os não aprovados (pendente/reprovado) que o autor precisa ver na lista pessoal. */
export function isAwaitingOrRejected(status: FeedCommentStatus): boolean {
  return status !== FeedCommentStatus.APPROVED;
}

/** URL da miniatura da publicação; `null` para vídeo ou sem capa. */
export function getCoverPreviewUrl(cover: FeedCommentCover | null): string | null {
  if (!cover?.url || cover.mediaType === MediaType.VIDEO) return null;
  const media: MediaItem = {
    title: cover.title ?? '',
    description: cover.description ?? '',
    mediaType: cover.mediaType,
    uploadType: cover.uploadType,
    platformType: cover.platformType,
    isLocalFile: cover.isLocalFile,
    url: cover.url,
  };
  return getMediaPreviewUrl(media);
}

export function isVideoCover(cover: FeedCommentCover | null): boolean {
  return cover?.mediaType === MediaType.VIDEO;
}

export function formatFeedCommentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Valida o motivo da reprovação: `null` quando serve. */
export function validateRejectionReason(reason: string): 'required' | null {
  return reason.trim().length === 0 ? 'required' : null;
}

export function clampBadgeCount(count: number, max: number): string {
  return count > max ? `${max}+` : String(count);
}

export function isDraftTooLong(content: string): boolean {
  return content.length > FEED_COMMENTS_MAX_LENGTH;
}

/** Id do envio (idempotência): um UUID novo por tentativa de comentário. */
export function newRequestId(): string {
  return crypto.randomUUID();
}
