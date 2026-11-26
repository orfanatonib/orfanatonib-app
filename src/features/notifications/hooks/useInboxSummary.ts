import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getHttpStatus } from '@/utils/apiError';
import { fetchInboxSummary } from '../api';
import { NOTIFICATIONS_SUMMARY_STALE_MS } from '../constants';
import { notificationKeys } from '../queryKeys';
import { isTerminalStatus, notificationsRetryDelay, shouldRetryNotifications, summaryPollInterval } from '../utils';

/**
 * Resumo da caixa de entrada: contador e `revision`. Polling com política própria (não depende dos defaults
 * globais): mais lento em aba escondida, atualiza ao voltar para a aba e ao reconectar, tenta de novo com
 * backoff e PARA em falha terminal (sessão/permissão/flag).
 */
export function useInboxSummary(userId: string | null, enabled: boolean) {
  const client = useQueryClient();
  const previousUser = useRef<string | null>(null);

  // Troca de conta/logout: cancela e remove o cache privado da conta anterior.
  useEffect(() => {
    const previous = previousUser.current;
    previousUser.current = userId;
    if (previous && previous !== userId) {
      void client.cancelQueries({ queryKey: notificationKeys.user(previous) });
      client.removeQueries({ queryKey: notificationKeys.user(previous) });
    }
  }, [userId, client]);

  return useQuery({
    queryKey: notificationKeys.summary(userId ?? ''),
    enabled: enabled && Boolean(userId),
    queryFn: ({ signal }) => fetchInboxSummary(signal),
    staleTime: NOTIFICATIONS_SUMMARY_STALE_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
    refetchInterval: (query) =>
      summaryPollInterval({
        visible: typeof document === 'undefined' || document.visibilityState === 'visible',
        stopped: isTerminalStatus(getHttpStatus(query.state.error)),
      }),
    retry: (failureCount, error) => shouldRetryNotifications(failureCount, getHttpStatus(error)),
    retryDelay: notificationsRetryDelay,
  });
}
