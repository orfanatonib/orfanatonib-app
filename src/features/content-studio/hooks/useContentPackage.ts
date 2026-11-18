import { useCallback, useEffect, useRef, useState } from 'react';

import { getContentPackage } from '../api';
import type { ContentPackageState } from '../types';

const INITIAL_STATE: ContentPackageState = {
  contentPackage: null,
  loading: true,
  error: false,
};

export function useContentPackage(id: string | undefined) {
  const [state, setState] = useState<ContentPackageState>(INITIAL_STATE);
  const requestController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setState({ contentPackage: null, loading: false, error: true });
      return;
    }

    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setState((current) => ({ ...current, loading: true, error: false }));

    try {
      const contentPackage = await getContentPackage(id, controller.signal);
      setState({ contentPackage, loading: false, error: false });
    } catch {
      if (!controller.signal.aborted) {
        setState({ contentPackage: null, loading: false, error: true });
      }
    }
  }, [id]);

  useEffect(() => {
    void load();
    return () => requestController.current?.abort();
  }, [load]);

  return { ...state, reload: load };
}
