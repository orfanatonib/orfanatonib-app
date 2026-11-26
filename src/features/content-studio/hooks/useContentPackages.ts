import { useCallback, useEffect, useRef, useState } from 'react';

import { getContentPackages } from '../api';
import type { ContentPackagesState, QueryContentPackagesParams } from '../types';

const INITIAL_STATE: ContentPackagesState = {
  packages: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  loading: true,
  error: false,
};

export function useContentPackages(query: QueryContentPackagesParams) {
  const [state, setState] = useState<ContentPackagesState>(INITIAL_STATE);
  const requestController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setState((current) => ({ ...current, loading: true, error: false }));

    try {
      const result = await getContentPackages(query, controller.signal);
      setState({
        packages: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        loading: false,
        error: false,
      });
    } catch {
      if (!controller.signal.aborted) {
        setState((current) => ({ ...current, loading: false, error: true }));
      }
    }
  }, [query]);

  useEffect(() => {
    void load();
    return () => requestController.current?.abort();
  }, [load]);

  return { ...state, reload: load };
}
