import { useCallback, useEffect, useState } from "react";

import { getStageDocument } from "../api";
import type { StageDocumentResponse } from "../types";

interface State {
  data: StageDocumentResponse | null;
  loading: boolean;
  error: boolean;
}

/** Carrega o documento da etapa (editado à mão ou montado dos campos); recarrega quando a versão muda. */
export function useStageDocument(packageId: string, stageId: string, versionKey: string | null) {
  const [state, setState] = useState<State>({ data: null, loading: true, error: false });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: false }));
    getStageDocument(packageId, stageId, controller.signal)
      .then((data) => setState({ data, loading: false, error: false }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ data: null, loading: false, error: true });
      });
    return () => controller.abort();
  }, [packageId, stageId, versionKey, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { ...state, reload };
}
