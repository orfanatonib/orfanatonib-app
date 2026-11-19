import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/slices';
import { extractErrorMessage } from '@/utils/apiError';
import { apiGetShelterFeedSections } from './api';
import {
  FEED_INITIAL_PAGE,
  FEED_PAGE_MESSAGES,
  FEED_SECTIONS_PAGE_SIZE,
  FEED_STALE_TIME_MS,
  shelterFeedListKeys,
} from './constants';
import { hasNextFeedPage, mergeFeedPages, toFeedSectionViewModel } from './feedData.utils';
import type { FeedPageMeta, FeedSectionData, FeedSectionViewModel } from './types';

export interface UseShelterFeedSectionsResult {
  pageMeta: FeedPageMeta | null;
  rawSections: FeedSectionData[];
  sections: FeedSectionViewModel[];
  totalSections: number;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  initialErrorMessage: string | null;
  nextPageErrorMessage: string | null;
  loadNextPage: () => void;
  refreshFeed: () => Promise<void>;
}

/**
 * Único dono do estado de servidor do feed (TanStack Query): paginação infinita
 * com dedupe por id. A chave inclui galeria, lote e usuário (autoria e
 * "celebrado" variam por pessoa). Serve o feed e a página de galeria.
 */
export function useShelterFeedSections(pageId: string | undefined): UseShelterFeedSectionsResult {
  const viewerId = useSelector((state: RootState) => state.auth.user?.id ?? 'anon');
  const query = useInfiniteQuery({
    queryKey: shelterFeedListKeys.sections(pageId ?? 'unconfigured', FEED_SECTIONS_PAGE_SIZE, viewerId),
    enabled: Boolean(pageId),
    initialPageParam: FEED_INITIAL_PAGE,
    staleTime: FEED_STALE_TIME_MS,
    retry: 1,
    queryFn: ({ pageParam, signal }) =>
      apiGetShelterFeedSections(pageId as string, { page: pageParam, limit: FEED_SECTIONS_PAGE_SIZE }, { signal }),
    getNextPageParam: (lastPage) => (hasNextFeedPage(lastPage) ? lastPage.page + 1 : undefined),
  });

  const merged = useMemo(() => mergeFeedPages(query.data?.pages), [query.data?.pages]);
  const sections = useMemo(() => merged.sections.map((section) => toFeedSectionViewModel(section)), [merged.sections]);

  const { fetchNextPage, refetch, hasNextPage, isFetchingNextPage } = query;
  const loadNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const refreshFeed = useCallback(async () => {
    if (pageId) await refetch();
  }, [pageId, refetch]);

  const hasLoadedPages = Boolean(query.data?.pages.length);
  return {
    pageMeta: merged.pageMeta,
    rawSections: merged.sections,
    sections,
    totalSections: merged.total,
    isInitialLoading: Boolean(pageId) && query.isPending,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage,
    hasNextPage: Boolean(hasNextPage),
    initialErrorMessage:
      query.isError && !hasLoadedPages ? extractErrorMessage(query.error, FEED_PAGE_MESSAGES.LOAD_ERROR) : null,
    nextPageErrorMessage: query.isFetchNextPageError
      ? extractErrorMessage(query.error, FEED_PAGE_MESSAGES.NEXT_PAGE_ERROR)
      : null,
    loadNextPage,
    refreshFeed,
  };
}
