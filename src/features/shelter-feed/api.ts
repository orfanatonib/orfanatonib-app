import api from '@/config/axiosConfig';
import type { AxiosRequestConfig } from 'axios';
import { FEED_COMMENT_ITEMS_ENDPOINT, FEED_IMAGE_PAGES_ENDPOINT, FEED_SECTIONS_ENDPOINT } from './constants';
import { buildFeedSectionsQuery } from './feedData.utils';
import type {
  CelebrationState,
  CreateFeedCommentRequest,
  FeedComment,
  FeedPageDto,
  ListFeedCommentsParams,
  PaginatedFeedComments,
  QueryFeedSectionsParams,
} from './types';

export async function apiToggleCelebration(sectionId: string): Promise<CelebrationState> {
  const { data } = await api.post<CelebrationState>(
    `${FEED_SECTIONS_ENDPOINT}/${sectionId}/celebration/toggle`,
  );
  return data;
}

export async function apiListFeedComments(
  sectionId: string,
  params: ListFeedCommentsParams,
  signal?: AbortSignal,
): Promise<PaginatedFeedComments> {
  const { data } = await api.get<PaginatedFeedComments>(
    `${FEED_SECTIONS_ENDPOINT}/${sectionId}/comments`,
    { params, signal },
  );
  return data;
}

export async function apiCreateFeedComment(
  sectionId: string,
  payload: CreateFeedCommentRequest,
): Promise<FeedComment> {
  const { data } = await api.post<FeedComment>(
    `${FEED_SECTIONS_ENDPOINT}/${sectionId}/comments`,
    payload,
  );
  return data;
}

export async function apiDeleteFeedComment(commentId: string): Promise<void> {
  await api.delete(`${FEED_COMMENT_ITEMS_ENDPOINT}/${commentId}`);
}

/**
 * Uma página de publicações da galeria (`GET /image-pages/:id/sections`).
 * `skipGlobalError`: a tela mostra estados próprios de falha inicial e de próxima página,
 * então o toast global não duplica a mensagem.
 */
export async function apiGetShelterFeedSections(
  pageId: string,
  params: QueryFeedSectionsParams,
  config?: AxiosRequestConfig,
): Promise<FeedPageDto> {
  const { data } = await api.get<FeedPageDto>(`${FEED_IMAGE_PAGES_ENDPOINT}/${pageId}/sections`, {
    skipGlobalError: true,
    ...config,
    params: buildFeedSectionsQuery(params.page, params.limit),
  });
  return data;
}
