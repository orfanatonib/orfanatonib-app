import { describe, expect, it } from "vitest";

import {
  STREAM_RECONNECT_BASE_MS,
  STREAM_RECONNECT_MAX_MS,
  STREAM_STALE_MS,
} from "./generation.utils";
import { nextReconnectDelay } from "./stream.utils";

describe("nextReconnectDelay (reconexão do stream de andamento)", () => {
  it("sem falhas reconecta na hora", () => {
    expect(nextReconnectDelay(0)).toBe(0);
  });

  it("dobra a cada falha seguida, a partir da base", () => {
    const noJitter = () => 0;
    expect(nextReconnectDelay(1, noJitter)).toBe(STREAM_RECONNECT_BASE_MS);
    expect(nextReconnectDelay(2, noJitter)).toBe(STREAM_RECONNECT_BASE_MS * 2);
    expect(nextReconnectDelay(3, noJitter)).toBe(STREAM_RECONNECT_BASE_MS * 4);
  });

  it("nunca passa do teto, mesmo com muitas falhas e jitter máximo", () => {
    expect(nextReconnectDelay(50, () => 1)).toBe(STREAM_RECONNECT_MAX_MS);
    expect(nextReconnectDelay(6, () => 1)).toBeLessThanOrEqual(
      STREAM_RECONNECT_MAX_MS,
    );
  });

  it("o jitter só soma: nunca reconecta antes do backoff", () => {
    for (let failures = 1; failures <= 5; failures += 1)
      expect(nextReconnectDelay(failures, () => 0.5)).toBeGreaterThanOrEqual(
        nextReconnectDelay(failures, () => 0),
      );
  });

  it("o vigia de conexão parada espera mais que o heartbeat de 15 s do servidor", () => {
    expect(STREAM_STALE_MS).toBeGreaterThan(15_000 * 2);
  });
});
