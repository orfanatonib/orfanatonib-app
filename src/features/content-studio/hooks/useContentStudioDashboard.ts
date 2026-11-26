import { useCallback, useEffect, useRef, useState } from "react";

import { getContentStudioDashboard } from "../api";
import type {
  ContentStudioDashboardQuery,
  ContentStudioDashboardState,
} from "../types";

const INITIAL_STATE: ContentStudioDashboardState = {
  dashboard: null,
  loading: true,
  error: false,
};

export function useContentStudioDashboard(
  filters: ContentStudioDashboardQuery = {},
) {
  const [state, setState] =
    useState<ContentStudioDashboardState>(INITIAL_STATE);
  const requestController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setState((current) => ({ ...current, loading: true, error: false }));

    try {
      const dashboard = await getContentStudioDashboard(
        filters,
        controller.signal,
      );
      setState({ dashboard, loading: false, error: false });
    } catch {
      if (!controller.signal.aborted) {
        setState({ dashboard: null, loading: false, error: true });
      }
    }
  }, [filters.startDate, filters.endDate, filters.audience]);

  useEffect(() => {
    void load();
    return () => requestController.current?.abort();
  }, [load]);

  return { ...state, reload: load };
}
