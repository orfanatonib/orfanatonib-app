import api from '@/config/axiosConfig';
import { FEED_COMMENT_ITEMS_ENDPOINT, FEED_SECTIONS_ENDPOINT } from './constants';
import type {
  CelebrationState,
  CreateFeedCommentRequest,
  FeedComment,
  ListFeedCommentsParams,
  PaginatedFeedComments,
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
