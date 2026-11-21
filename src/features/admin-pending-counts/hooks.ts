import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getPendingCount } from './api';
import {
  PENDING_COUNT_POLL_MS,
  PENDING_COUNT_STALE_TIME_MS,
  pendingCountKeys,
} from './constants';
import type { PendingCountKind } from './types';

/** Pendentes de uma fila para o selo. Só liga quando `enabled` (admin logado). */
export function usePendingCount(kind: PendingCountKind, userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: pendingCountKeys.byKind(kind, userId),
    queryFn: ({ signal }) => getPendingCount(kind, signal),
    enabled,
    refetchInterval: PENDING_COUNT_POLL_MS,
    staleTime: PENDING_COUNT_STALE_TIME_MS,
    retry: false,
  });
}

/** Refaz os selos depois de publicar, apagar ou aprovar um item da fila. */
export function useRefreshPendingCounts(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: pendingCountKeys.root }),
    [queryClient],
  );
}
