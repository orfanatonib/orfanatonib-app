import type { ReactNode } from 'react';
import type { FeedAuthor, FeedComment } from '@/features/shelter-feed/types';
import type { MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';

export enum FeedCommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/** Valor do filtro de status: um status ou todos (string vazia). */
export type FeedCommentStatusFilter = FeedCommentStatus | '';

/** Comentário do próprio usuário: qualquer status, com o motivo quando reprovado. */
export interface OwnFeedComment extends FeedComment {
  status: FeedCommentStatus;
  moderationReason: string | null;
}

export interface OwnFeedCommentsPage {
  items: OwnFeedComment[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateFeedCommentPayload {
  content: string;
  /** UUID v4 do envio: reenviar o mesmo valor não duplica o comentário. */
  requestId: string;
}

export interface FeedCommentCover {
  id?: string;
  title?: string;
  description?: string;
  uploadType: MediaUploadType;
  mediaType: MediaType;
  isLocalFile: boolean;
  url?: string;
  platformType?: MediaPlatform;
}

/** Publicação do feed onde o comentário foi feito (contexto da moderação). */
export interface FeedCommentPost {
  id: string;
  caption: string;
  cover: FeedCommentCover | null;
  mediaCount: number;
}

export interface ModerationFeedComment extends OwnFeedComment {
  author: FeedAuthor | null;
  post: FeedCommentPost | null;
  reviewedAt: string | null;
  moderatedByName: string | null;
}

export type FeedCommentCounts = Record<FeedCommentStatus, number>;

export interface ModerationFeedCommentsPage {
  items: ModerationFeedComment[];
  counts: FeedCommentCounts;
  page: number;
  limit: number;
  total: number;
}

export interface ModerationFeedCommentsQuery {
  page: number;
  limit: number;
  status?: FeedCommentStatus;
  search?: string;
}

export interface RejectFeedCommentPayload {
  reason: string;
}

export interface FeedCommentPendingCount {
  pending: number;
}

export type FeedCommentDecision =
  | { status: FeedCommentStatus.APPROVED }
  | { status: FeedCommentStatus.REJECTED; reason: string };

export interface DecideFeedCommentVariables {
  id: string;
  decision: FeedCommentDecision;
}

export interface FeedCommentReviewDialogProps {
  comment: ModerationFeedComment | null;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onDecide: (comment: ModerationFeedComment, decision: FeedCommentDecision) => Promise<boolean>;
  onDelete: (comment: ModerationFeedComment) => void;
}

export interface FeedCommentStatusChipProps {
  status: FeedCommentStatus;
  'data-testid'?: string;
}

export interface FeedCommentsPendingBadgeProps {
  children: ReactNode;
}
