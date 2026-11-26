import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDeleteFeedComment,
  apiListFeedComments,
  apiToggleCelebration,
} from './api';
import { FEED_COMMENT_PAGE_SIZE, SHELTER_FEED_QUERY_ROOT } from './constants';
import type { CelebrationState, PaginatedFeedComments } from './types';
import { applyOptimisticToggle } from './utils';

/** Chaves de cache: sempre com o usuário (o estado "celebrado" é por pessoa) e a publicação. */
export const shelterFeedKeys = {
  celebration: (viewerId: string, sectionId: string) =>
    [SHELTER_FEED_QUERY_ROOT, 'celebration', viewerId, sectionId] as const,
  comments: (viewerId: string, sectionId: string) =>
    [SHELTER_FEED_QUERY_ROOT, 'comments', viewerId, sectionId] as const,
};

/**
 * Estado de "celebrar" de uma publicação. O cache nasce do payload do feed e só
 * muda por ação do usuário: otimista, com rollback se a API recusar e
 * reconciliação com a resposta (verdade do servidor). Sem refetch do feed.
 */
export function useCelebration(initial: CelebrationState, viewerId: string) {
  const queryClient = useQueryClient();
  const key = shelterFeedKeys.celebration(viewerId, initial.sectionId);

  const { data } = useQuery<CelebrationState>({
    queryKey: key,
    queryFn: () => Promise.resolve(initial),
    initialData: initial,
    enabled: false,
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: () => apiToggleCelebration(initial.sectionId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CelebrationState>(key) ?? initial;
      queryClient.setQueryData<CelebrationState>(key, applyOptimisticToggle(previous));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData<CelebrationState>(key, context.previous);
    },
    onSuccess: (serverState) => {
      queryClient.setQueryData<CelebrationState>(key, serverState);
    },
  });

  return {
    state: data ?? initial,
    toggle: () => mutation.mutate(),
    isPending: mutation.isPending,
    hasError: mutation.isError,
  };
}

export function useFeedComments(sectionId: string, viewerId: string, enabled: boolean) {
  return useInfiniteQuery<PaginatedFeedComments>({
    queryKey: shelterFeedKeys.comments(viewerId, sectionId),
    queryFn: ({ pageParam, signal }) =>
      apiListFeedComments(sectionId, { page: Number(pageParam), limit: FEED_COMMENT_PAGE_SIZE }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    enabled,
  });
}

export function useDeleteFeedComment(sectionId: string, viewerId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (commentId) => apiDeleteFeedComment(commentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: shelterFeedKeys.comments(viewerId, sectionId) }),
  });
}
