import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isRequestCanceled } from '@/utils/apiErrorMessage';
import {
  ADMIN_LIST_PAGE_SIZE,
  ADMIN_SEARCH_DEBOUNCE_MS,
  ADMIN_SORT_FILTER_KEY,
} from './constants';
import type {
  AdminFilterValues,
  AdminListPage,
  UseAdminListOptions,
  UseAdminListResult,
} from './types';

const EMPTY_PAGE = { items: [] as never[], total: 0, totalPages: 1 };

/** Conta os filtros que de fato restringem o resultado (a ordenação não conta). */
export function countActiveFilters(
  search: string,
  filters: AdminFilterValues,
  neutralFilters: AdminFilterValues = {},
): number {
  const fromFilters = Object.entries(filters).filter(
    ([key, value]) =>
      key !== ADMIN_SORT_FILTER_KEY && Boolean(value) && value !== neutralFilters[key],
  ).length;
  return fromFilters + (search.trim() ? 1 : 0);
}

/**
 * Estado único das listagens administrativas, com busca, filtros e página no servidor.
 *
 * - Mexer na busca ou num filtro volta para a página 1.
 * - A lista anterior permanece na tela enquanto a próxima carrega (`fetching`); só a primeira
 *   carga é `initialLoading`. Assim a tela não troca de altura nem pisca a cada digitação.
 * - Resposta de uma busca antiga nunca sobrescreve a da busca atual (cancelamento + versão).
 * - Se a página ficou vazia (ex.: excluiu o último item dela), volta uma página.
 */
export function useAdminList<TItem>({
  fetcher,
  pageSize = ADMIN_LIST_PAGE_SIZE,
  defaultFilters,
  errorMessage,
  neutralFilters,
}: UseAdminListOptions<TItem>): UseAdminListResult<TItem> {
  const baseFilters = useRef<AdminFilterValues>(defaultFilters ?? {}).current;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<AdminFilterValues>(baseFilters);
  const [page, setPageState] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [result, setResult] = useState<AdminListPage<TItem>>(EMPTY_PAGE);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), ADMIN_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setFetching(true);
    setError(null);

    fetcherRef
      .current({ page, limit: pageSize, search: debouncedSearch, filters }, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        if (next.items.length === 0 && page > 1) {
          setPageState(Math.max(1, Math.min(page - 1, next.totalPages)));
          return;
        }
        setResult(next);
        setLoadedOnce(true);
        setFetching(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isRequestCanceled(err)) return;
        setError(errorMessage);
        setLoadedOnce(true);
        setFetching(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, filters, page, pageSize, reloadKey, errorMessage]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageState(1);
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPageState(1);
  }, []);

  const setPage = useCallback((next: number) => setPageState(Math.max(1, next)), []);

  const clearAll = useCallback(() => {
    setSearchState('');
    setDebouncedSearch('');
    // A ordenação escolhida não é filtro: continua depois de limpar (como a documentação do hook diz).
    setFilters((current) => {
      const sort = current[ADMIN_SORT_FILTER_KEY];
      return sort ? { ...baseFilters, [ADMIN_SORT_FILTER_KEY]: sort } : baseFilters;
    });
    setPageState(1);
  }, [baseFilters]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const activeFilterCount = countActiveFilters(search, filters, neutralFilters);

  return useMemo(
    () => ({
      items: result.items,
      total: result.total,
      totalPages: result.totalPages,
      page,
      pageSize,
      search,
      filters,
      initialLoading: !loadedOnce && fetching,
      fetching,
      error,
      setSearch,
      setFilter,
      setPage,
      clearAll,
      reload,
      hasActiveFilters: activeFilterCount > 0,
      activeFilterCount,
    }),
    [
      result, page, pageSize, search, filters, loadedOnce, fetching, error,
      setSearch, setFilter, setPage, clearAll, reload, activeFilterCount,
    ],
  );
}
