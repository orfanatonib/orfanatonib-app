import api from '@/config/axiosConfig';
import { FEED_COMMENT_ITEMS_ENDPOINT, FEED_SECTIONS_ENDPOINT } from './constants';
import type {
  CreateFeedCommentPayload,
  FeedCommentPendingCount,
  ModerationFeedCommentsPage,
  ModerationFeedCommentsQuery,
  OwnFeedComment,
  OwnFeedCommentsPage,
  RejectFeedCommentPayload,
} from './types';

/** Cada tela mostra o próprio erro: o toast global não duplica a mensagem. */
const OWN_ERRORS = { skipGlobalError: true } as const;

export async function apiCreateOwnFeedComment(
  sectionId: string,
  payload: CreateFeedCommentPayload,
): Promise<OwnFeedComment> {
  const { data } = await api.post<OwnFeedComment>(
    `${FEED_SECTIONS_ENDPOINT}/${sectionId}/comments`,
    payload,
    OWN_ERRORS,
  );
  return data;
}

export async function apiListMyFeedComments(
  sectionId: string,
  params: { page: number; limit: number },
  signal?: AbortSignal,
): Promise<OwnFeedCommentsPage> {
  const { data } = await api.get<OwnFeedCommentsPage>(
    `${FEED_SECTIONS_ENDPOINT}/${sectionId}/comments/mine`,
    { params, signal, ...OWN_ERRORS },
  );
  return data;
}

export async function apiListModerationComments(
  params: ModerationFeedCommentsQuery,
  signal?: AbortSignal,
): Promise<ModerationFeedCommentsPage> {
  const { data } = await api.get<ModerationFeedCommentsPage>(
    `${FEED_COMMENT_ITEMS_ENDPOINT}/moderation`,
    { params, signal, ...OWN_ERRORS },
  );
  return data;
}

export async function apiGetPendingFeedCommentsCount(
  signal?: AbortSignal,
): Promise<FeedCommentPendingCount> {
  const { data } = await api.get<FeedCommentPendingCount>(
    `${FEED_COMMENT_ITEMS_ENDPOINT}/moderation/pending-count`,
    { signal, ...OWN_ERRORS },
  );
  return data;
}

export async function apiApproveFeedComment(id: string): Promise<OwnFeedComment> {
  const { data } = await api.patch<OwnFeedComment>(
    `${FEED_COMMENT_ITEMS_ENDPOINT}/${id}/approve`,
    {},
    OWN_ERRORS,
  );
  return data;
}

export async function apiRejectFeedComment(
  id: string,
  payload: RejectFeedCommentPayload,
): Promise<OwnFeedComment> {
  const { data } = await api.patch<OwnFeedComment>(
    `${FEED_COMMENT_ITEMS_ENDPOINT}/${id}/reject`,
    payload,
    OWN_ERRORS,
  );
  return data;
}

export async function apiDeleteModerationComment(id: string): Promise<void> {
  await api.delete(`${FEED_COMMENT_ITEMS_ENDPOINT}/${id}`, OWN_ERRORS);
}
