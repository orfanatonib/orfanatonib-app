import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getImageSectionsPendingCount, listMyImageSections } from './api';
import {
  IMAGE_SECTIONS_PENDING_POLL_MS,
  IMAGE_SECTIONS_STALE_TIME_MS,
  imageSectionKeys,
} from './constants';
import type { MyImageSection } from './types';

/** "Minhas publicações" do autor logado; `reload` recarrega depois de um envio. */
export function useMyImageSections() {
  const [items, setItems] = useState<MyImageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setItems(await listMyImageSections());
    } catch (error: unknown) {
      console.error('Falha ao listar as próprias publicações', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, failed, reload };
}

/** Pendentes para o selo do painel. Só liga quando `enabled` (admin logado). */
export function usePendingImageSectionsCount(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: imageSectionKeys.pendingCount(userId),
    queryFn: ({ signal }) => getImageSectionsPendingCount(signal),
    enabled,
    refetchInterval: IMAGE_SECTIONS_PENDING_POLL_MS,
    staleTime: IMAGE_SECTIONS_STALE_TIME_MS,
    retry: false,
  });
}

/** Refaz o selo depois de aprovar, reprovar ou apagar uma publicação. */
export function useRefreshImageSectionsPending(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: imageSectionKeys.root }),
    [queryClient],
  );
}
