import type { MediaItem, MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';

/** Modos de visualização do feed: Publicações, Momentos e Fotos e vídeos. */
export enum FeedViewMode {
  TIMELINE = 'timeline',
  BENTO = 'bento',
  GALLERY = 'gallery',
}

/** Arranjos da colagem de fotos conforme a quantidade de itens. */
export enum CollageLayoutKind {
  EMPTY = 'empty',
  SINGLE = 'single',
  DUAL = 'dual',
  TRIO = 'trio',
  QUAD = 'quad',
  BENTO_FIVE_PLUS = 'bento_five_plus',
}

/** Resultado da tentativa de compartilhar uma publicação. */
export enum ShareResultKind {
  SHARED_NATIVE = 'shared_native',
  COPIED_LINK = 'copied_link',
  ABORTED = 'aborted',
  FAILED = 'failed',
}

/** Query params de `GET /image-pages/:id/sections`. */
export interface QueryFeedSectionsParams {
  page: number;
  limit: number;
}

/** Mídia de uma publicação como a API devolve. */
export type FeedMediaItemDto = Omit<MediaItem, 'file' | 'fieldKey' | 'fileField'>;

/** Autor exibível (só nome público). `null` = "Autor não informado" ou visitante. */
export interface FeedAuthor {
  displayName: string;
}

/** Publicação do feed como a API devolve (`GET /image-pages/:id/sections`). */
export interface FeedSectionData {
  id: string;
  public: boolean;
  caption: string;
  description: string;
  mediaItems: FeedMediaItemDto[];
  createdAt?: string;
  updatedAt?: string;
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

/** Resposta paginada de `GET /image-pages/:id/sections`. */
export interface FeedPageDto {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
  sections: FeedSectionData[];
  page: number;
  limit: number;
  total: number;
}

export type FeedPageMeta = Omit<FeedPageDto, 'sections'>;

/** Resultado da mescla das páginas carregadas (seções deduplicadas por id). */
export interface MergedFeedPages {
  pageMeta: FeedPageMeta | null;
  sections: FeedSectionData[];
  total: number;
}

/** Mídia normalizada para exibição. */
export interface FeedMediaViewModel {
  key: string;
  id?: string;
  title: string;
  description: string;
  previewUrl: string;
  mediaType: MediaType;
  originalUrl: string;
  platformType: MediaPlatform;
  uploadType: MediaUploadType;
  isLocalFile: boolean;
}

/** Publicação preparada para os três modos de visualização. */
export interface FeedSectionViewModel {
  id: string;
  anchorId: string;
  caption: string;
  description: string;
  isPublic: boolean;
  monogram: string;
  isVideo: boolean;
  formattedDate: string;
  formattedTime: string;
  relativeDate: string;
  createdAtIso: string | null;
  mediaItems: FeedMediaViewModel[];
  coverUrl: string;
  mediaCount: number;
  author: FeedAuthor | null;
  celebrationCount: number;
  celebratedByMe: boolean;
  commentCount: number;
}

/** Foto/vídeo achatado do modo "Fotos e vídeos". */
export interface FeedPhotoWallItem {
  key: string;
  sectionId: string;
  sectionCaption: string;
  formattedDate: string;
  mediaIndex: number;
  totalInSection: number;
  previewUrl: string;
  mediaType: MediaType;
  altText: string;
}

/** Publicações de um mesmo mês (índice lateral e momentos). */
export interface FeedMonthGroup {
  key: string;
  label: string;
  sections: FeedSectionViewModel[];
}

export interface ActiveLightboxState {
  section: FeedSectionViewModel;
  initialIndex: number;
}
