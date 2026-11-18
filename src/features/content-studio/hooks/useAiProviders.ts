import { useCallback, useEffect, useRef, useState } from 'react';

import { getAiProviders } from '../api';
import type { AiProvidersState } from '../types';

const INITIAL_STATE: AiProvidersState = {
  providers: [],
  loading: true,
  error: false,
};

export function useAiProviders() {
  const [state, setState] = useState<AiProvidersState>(INITIAL_STATE);
  const requestController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setState((current) => ({ ...current, loading: true, error: false }));

    try {
      const providers = await getAiProviders(controller.signal);
      setState({ providers, loading: false, error: false });
    } catch {
      if (!controller.signal.aborted) {
        setState({ providers: [], loading: false, error: true });
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => requestController.current?.abort();
  }, [load]);

  return { ...state, reload: load };
}

