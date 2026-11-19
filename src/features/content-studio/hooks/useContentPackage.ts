import { useCallback, useEffect, useRef, useState } from "react";
import { getContentPackage } from "../api";
import { ContentStageStatus, type ContentPackageState } from "../types";
import {
  GENERATION_POLL_MS,
  INITIAL_PACKAGE_STATE,
} from "../workspace.constants";

export function useContentPackage(id: string | undefined) {
  const [state, setState] = useState<ContentPackageState>(
    INITIAL_PACKAGE_STATE,
  );
  const requestController = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    if (!id) {
      setState({ contentPackage: null, loading: false, error: true });
      return;
    }
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setState((current) => ({
      ...current,
      loading: !current.contentPackage,
      error: false,
    }));
    try {
      const contentPackage = await getContentPackage(id, controller.signal);
      if (!controller.signal.aborted)
        setState({ contentPackage, loading: false, error: false });
    } catch {
      if (!controller.signal.aborted)
        setState((current) => ({ ...current, loading: false, error: true }));
    }
  }, [id]);
  useEffect(() => {
    setState(INITIAL_PACKAGE_STATE);
    void load();
    return () => requestController.current?.abort();
  }, [load]);
  const generating = state.contentPackage?.tracks.some((track) =>
    track.stages.some(
      (stage) => stage.status === ContentStageStatus.GENERATING,
    ),
  );
  useEffect(() => {
    if (!generating) return;
    const timer = window.setTimeout(() => void load(), GENERATION_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [generating, state.contentPackage, state.error, load]);
  return { ...state, reload: load };
}
