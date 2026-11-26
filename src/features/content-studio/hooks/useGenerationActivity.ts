import { useCallback, useEffect, useRef, useState } from "react";

import { getGenerationActivity } from "../api";
import type { GenerationActivityResponse } from "../types";

/** Intervalo de atualização enquanto algo está sendo gerado; sem geração, atualiza bem menos. */
export const ACTIVITY_POLL_ACTIVE_MS = 3_000;
export const ACTIVITY_POLL_IDLE_MS = 15_000;

/** Acompanha, em tempo quase real, o que o Estúdio está gerando. Pausa com a aba escondida. */
export function useGenerationActivity(enabled = true) {
  const [activity, setActivity] = useState<GenerationActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const hasActive = useRef(false);

  const load = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    try {
      const data = await getGenerationActivity(current.signal);
      if (current.signal.aborted) return;
      hasActive.current = data.usage.activeJobs > 0;
      setActivity(data);
      setError(false);
    } catch {
      if (!current.signal.aborted) setError(true);
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(() => void tick(), hasActive.current ? ACTIVITY_POLL_ACTIVE_MS : ACTIVITY_POLL_IDLE_MS);
    };
    const tick = async () => {
      if (stopped) return;
      if (!document.hidden) await load();
      schedule();
    };
    // Ao voltar para a aba, atualiza na hora em vez de esperar o próximo ciclo.
    const onVisible = () => {
      if (document.hidden || stopped) return;
      if (timer) clearTimeout(timer);
      void tick();
    };

    document.addEventListener("visibilitychange", onVisible);
    void tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      controller.current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, load]);

  return { activity, loading, error, reload: load };
}
