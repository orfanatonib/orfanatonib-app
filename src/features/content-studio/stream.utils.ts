import {
  STREAM_RECONNECT_BASE_MS,
  STREAM_RECONNECT_JITTER_RATIO,
  STREAM_RECONNECT_MAX_MS,
} from "./generation.utils";

/**
 * Espera antes de reconectar o stream de andamento: backoff exponencial com jitter (modelo do Clubinho).
 * `failures` conta as falhas seguidas (1 = primeira); 0 reconecta na hora.
 */
export function nextReconnectDelay(
  failures: number,
  random: () => number = Math.random,
): number {
  if (failures <= 0) return 0;
  const exponent = Math.min(failures - 1, 10);
  const base = Math.min(
    STREAM_RECONNECT_MAX_MS,
    STREAM_RECONNECT_BASE_MS * 2 ** exponent,
  );
  const jitter = base * STREAM_RECONNECT_JITTER_RATIO * random();
  return Math.round(Math.min(STREAM_RECONNECT_MAX_MS, base + jitter));
}

/** Estado da conexão de acompanhamento mostrado na tela. */
export enum GenerationConnectionState {
  IDLE = "IDLE",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
}
