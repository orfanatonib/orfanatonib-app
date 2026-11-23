import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getHttpStatus } from '@/utils/apiError';
import { fetchInboxNotifications } from '../api';
import { NOTIFICATIONS_PAGE_SIZE } from '../constants';
import { notificationKeys } from '../queryKeys';
import { InboxStatusFilter, type InboxSummaryDto } from '../types';
import { notificationsRetryDelay, shouldRetryNotifications } from '../utils';

/**
 * Lista paginada ("Ver mais avisos"). Só consulta com o painel aberto; quando a `revision` do resumo muda
 * (aviso novo, lido, apagado) o cache da lista é invalidado e recarrega.
 */
export function useInboxList(
  userId: string | null,
  enabled: boolean,
  open: boolean,
  summary: InboxSummaryDto | undefined,
) {
  const client = useQueryClient();
  const revision = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !summary) return;
    const previous = revision.current;
    revision.current = summary.revision;
    if (previous !== null && previous !== summary.revision) {
      void client.invalidateQueries({ queryKey: notificationKeys.lists(userId) });
    }
  }, [summary, userId, client]);

  // Trocar de conta reinicia o acompanhamento da revisão.
  useEffect(() => {
    revision.current = null;
  }, [userId]);

  return useInfiniteQuery({
    queryKey: notificationKeys.list(userId ?? '', InboxStatusFilter.ALL),
    enabled: enabled && open && Boolean(userId),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchInboxNotifications({ page: pageParam, limit: NOTIFICATIONS_PAGE_SIZE }, signal),
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    staleTime: 0,
    retry: (failureCount, error) => shouldRetryNotifications(failureCount, getHttpStatus(error)),
    retryDelay: notificationsRetryDelay,
  });
}
