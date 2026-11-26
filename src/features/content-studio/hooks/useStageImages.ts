import { useCallback, useEffect, useRef, useState } from "react";

import { getStageImages } from "../api";
import type { StageImagesResponse } from "../types";

const POLL_MS = 4_000;

/**
 * Imagens da versão atual da etapa. Recarrega quando a versão muda e, enquanto o job de imagens está ativo, a cada
 * poucos segundos (a URL assinada de cada imagem pronta aparece assim que ela é salva).
 */
export function useStageImages(packageId: string, stageId: string, versionKey: string | null, active: boolean) {
  const [data, setData] = useState<StageImagesResponse | null>(null);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    try {
      setData(await getStageImages(packageId, stageId, next.signal));
      setError(false);
    } catch {
      if (!next.signal.aborted) setError(true);
    }
  }, [packageId, stageId]);

  useEffect(() => {
    if (!versionKey) {
      setData(null);
      return;
    }
    void load();
    return () => controller.current?.abort();
  }, [load, versionKey]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [active, load]);

  return { data, error, reload: load };
}
