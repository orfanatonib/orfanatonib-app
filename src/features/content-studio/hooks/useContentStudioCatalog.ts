import { useCallback, useEffect, useRef, useState } from 'react';

import { getContentStudioCatalog } from '../api';
import type { ContentStudioCatalogState } from '../types';

const INITIAL_STATE: ContentStudioCatalogState = {
  catalog: null,
  loading: true,
  error: false,
};

export function useContentStudioCatalog() {
  const [state, setState] = useState<ContentStudioCatalogState>(INITIAL_STATE);
  const requestController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setState((current) => ({ ...current, loading: true, error: false }));

    try {
      const catalog = await getContentStudioCatalog(controller.signal);
      setState({ catalog, loading: false, error: false });
    } catch {
      if (!controller.signal.aborted) {
        setState({ catalog: null, loading: false, error: true });
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => requestController.current?.abort();
  }, [load]);

  return { ...state, reload: load };
}

