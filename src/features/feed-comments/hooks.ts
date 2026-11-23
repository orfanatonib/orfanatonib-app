import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SHELTER_FEED_QUERY_ROOT } from '@/features/shelter-feed/constants';
import {
  apiApproveFeedComment,
  apiCreateOwnFeedComment,
  apiDeleteModerationComment,
  apiGetPendingFeedCommentsCount,
  apiListMyFeedComments,
  apiRejectFeedComment,
} from './api';
import {
  FEED_COMMENTS_INITIAL_PAGE,
  FEED_COMMENTS_MINE_PAGE_SIZE,
  FEED_COMMENTS_PENDING_POLL_MS,
  FEED_COMMENTS_STALE_TIME_MS,
  feedCommentKeys,
} from './constants';
import { FeedCommentStatus } from './types';
import type {
  DecideFeedCommentVariables,
  OwnFeedComment,
  OwnFeedCommentsPage,
} from './types';

/** Chave dos comentários de uma publicação: a lista pública e a pessoal compartilham o prefixo. */
const sectionCommentsKey = (viewerId: string, sectionId: string) =>
  [SHELTER_FEED_QUERY_ROOT, 'comments', viewerId, sectionId] as const;

/** Comentários do próprio usuário na publicação (pendentes e reprovados, com o motivo). */
export function useMyFeedComments(sectionId: string, viewerId: string, enabled: boolean) {
  return useInfiniteQuery<OwnFeedCommentsPage>({
    queryKey: [...sectionCommentsKey(viewerId, sectionId), 'mine'],
    queryFn: ({ pageParam, signal }) =>
      apiListMyFeedComments(
        sectionId,
        { page: Number(pageParam), limit: FEED_COMMENTS_MINE_PAGE_SIZE },
        signal,
      ),
    initialPageParam: FEED_COMMENTS_INITIAL_PAGE,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    enabled,
  });
}

/** Envia o comentário (nasce pendente) e atualiza a lista pessoal. */
export function useSubmitFeedComment(sectionId: string, viewerId: string) {
  const queryClient = useQueryClient();
  return useMutation<OwnFeedComment, Error, { content: string; requestId: string }>({
    mutationFn: (payload) => apiCreateOwnFeedComment(sectionId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: sectionCommentsKey(viewerId, sectionId) }),
  });
}

/** Pendentes para o selo do menu. Só liga quando `enabled` (admin com a flag). */
export function usePendingFeedCommentsCount(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: feedCommentKeys.pendingCount(userId),
    queryFn: ({ signal }) => apiGetPendingFeedCommentsCount(signal),
    enabled,
    refetchInterval: FEED_COMMENTS_PENDING_POLL_MS,
    staleTime: FEED_COMMENTS_STALE_TIME_MS,
    retry: false,
  });
}

/** Aprova ou reprova e refaz a fila, as abas e o selo. */
export function useDecideFeedComment() {
  const queryClient = useQueryClient();
  return useMutation<OwnFeedComment, Error, DecideFeedCommentVariables>({
    mutationFn: ({ id, decision }) =>
      decision.status === FeedCommentStatus.APPROVED
        ? apiApproveFeedComment(id)
        : apiRejectFeedComment(id, { reason: decision.reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedCommentKeys.all }),
  });
}

export function useDeleteModerationComment() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: apiDeleteModerationComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: feedCommentKeys.all });
      await queryClient.invalidateQueries({ queryKey: [SHELTER_FEED_QUERY_ROOT] });
    },
  });
}
