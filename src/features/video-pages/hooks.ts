import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VideoPageData } from './types';
import { apiDeleteVideoPage, apiGetVideoPage, apiListVideoPages } from './api';
import { filterVideoPagesByTitle } from './utils';

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(value), delay) as unknown as number;
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, delay]);

  return debounced;
}

export function useVideoPages() {
  const [pages, setPages] = useState<VideoPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await apiListVideoPages();
      setPages(list);
    } catch {
      setError('Erro ao buscar páginas de vídeos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const filtered = useMemo(
    () => filterVideoPagesByTitle(pages, debouncedSearch),
    [pages, debouncedSearch],
  );

  const removePage = useCallback(async (id: string) => {
    await apiDeleteVideoPage(id);
    await fetchPages();
  }, [fetchPages]);

  return {
    pages,
    filtered,
    loading,
    error,
    search,
    setSearch,
    fetchPages,
    removePage,
    setError,
  };
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
