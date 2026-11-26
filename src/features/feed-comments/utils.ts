import { MediaType } from '@/store/slices/types';
import type { MediaItem } from '@/store/slices/types';
import { getMediaPreviewUrl } from '@/utils/getMediaPreviewUrl';
import { ADMIN_SORT_FILTER_KEY } from '@/components/common/admin-shell/constants';
import { splitSort } from '@/components/common/admin-shell/listQuery';
import type { AdminListParams } from '@/components/common/admin-shell/types';
import { FEED_COMMENTS_MAX_LENGTH, FEED_COMMENT_FILTER_KEYS, FEED_COMMENT_STATUS_LABELS } from './constants';
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

/** Parâmetros da lista administrativa → query da fila de moderação (só o que foi preenchido). */
export function toModerationQuery(params: AdminListParams): ModerationFeedCommentsQuery {
  const term = params.search.trim();
  const status = toStatusFilter(params.filters[FEED_COMMENT_FILTER_KEYS.STATUS] ?? '');
  const createdFrom = params.filters[FEED_COMMENT_FILTER_KEYS.CREATED_FROM];
  const createdTo = params.filters[FEED_COMMENT_FILTER_KEYS.CREATED_TO];
  const { sortBy, order } = splitSort(params.filters[ADMIN_SORT_FILTER_KEY]);
  return {
    page: params.page,
    limit: params.limit,
    ...(term ? { search: term } : {}),
    ...(status ? { status } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
    ...(sortBy && order ? { sortBy, order } : {}),
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
