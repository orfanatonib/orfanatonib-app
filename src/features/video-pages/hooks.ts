import { useCallback, useEffect, useState } from 'react';
import { useAdminList } from '@/components/common/admin-shell/useAdminList';
import { VideoPageData } from './types';
import { apiDeleteVideoPage, apiGetVideoPage, fetchVideoPagesPage } from './api';
import { VIDEO_PAGES_DEFAULT_SORT, VIDEO_PAGES_MESSAGES } from './constants';

const DEFAULT_FILTERS = { sort: VIDEO_PAGES_DEFAULT_SORT };

/** Listagem paginada no servidor (busca, visibilidade, datas, ordenação) + exclusão com recarga. */
export function useVideoPagesList() {
  const list = useAdminList<VideoPageData>({
    fetcher: fetchVideoPagesPage,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: VIDEO_PAGES_MESSAGES.LOAD_ERROR,
  });
  const { reload } = list;

  /** Exclui e recarrega a lista; em falha recarrega também (a página pode já ter sumido) e propaga o erro. */
  const removePage = useCallback(async (id: string) => {
    try {
      await apiDeleteVideoPage(id);
    } finally {
      reload();
    }
  }, [reload]);

  return { list, removePage };
}

export const VIDEO_PAGE_LOAD_ERROR = 'Erro ao carregar a página de vídeos. Tente novamente mais tarde.';
export const VIDEO_PAGE_MISSING_ID = 'ID da página de vídeos não fornecido.';

/** Dono único da página de vídeos carregada por id (visualização e edição). */
export function useVideoPageById(id: string | null | undefined) {
  const [page, setPage] = useState<VideoPageData | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setPage(null);
      setError(VIDEO_PAGE_MISSING_ID);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPage(await apiGetVideoPage(id));
    } catch {
      setPage(null);
      setError(VIDEO_PAGE_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { page, loading, error, reload: load } as const;
}
