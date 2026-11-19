import type { SectionData } from '@/store/slices/image-section/imageSectionSlice';

/** Autor exibível (só nome público). `null` = "Autor não informado" ou visitante. */
export interface FeedAuthor {
  displayName: string;
}

/** Publicação do feed como a API devolve (`GET /image-pages/:id/sections`). */
export interface FeedSectionData extends SectionData {
  author?: FeedAuthor | null;
  celebrationCount?: number;
  celebratedByMe?: boolean;
  commentCount?: number;
}

export interface CelebrationState {
  sectionId: string;
  count: number;
  celebratedByMe: boolean;
}

export interface FeedComment {
  id: string;
  sectionId: string;
  content: string;
  createdAt: string;
  author: FeedAuthor | null;
  /** Só o admin recebe (moderação por autor). */
  authorId: string | null;
  isMine: boolean;
  canDelete: boolean;
}

export interface PaginatedFeedComments {
  items: FeedComment[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateFeedCommentRequest {
  content: string;
}

export interface ListFeedCommentsParams {
  page: number;
  limit: number;
}

export type CommentDraftError = 'empty' | 'too-long' | 'sensitive';
