import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { circuitBreakerManager } from "@/utils/CircuitBreakerManager";

import api from "./axiosConfig";

/** Trava de segurança do próprio teste: sem ela, a recursão do defeito nunca termina. */
const RUNAWAY_LIMIT = 25;
/** Envio original + 2 novas tentativas. */
const SAFE_ATTEMPTS = 3;

let sent: string[] = [];
const originalAdapter = api.defaults.adapter;

const failure = (config: InternalAxiosRequestConfig, status?: number): AxiosError => {
  if (status === undefined) return new AxiosError("Network Error", "ERR_NETWORK", config);
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, {
    status,
    statusText: "erro",
    data: { message: "erro" },
    headers: {},
    config,
  });
};

/** Rede simulada: falha `failures` vezes com o status pedido e depois responde 200. */
function network(status: number | undefined, failures = Number.POSITIVE_INFINITY): void {
  const adapter: AxiosAdapter = async (config) => {
    sent.push(`${config.method?.toUpperCase()} ${config.url}`);
    if (sent.length > RUNAWAY_LIMIT) throw new AxiosError("runaway", "ERR_CANCELED", config);
    if (sent.length <= failures) throw failure(config, status);
    return { data: "ok", status: 200, statusText: "OK", headers: {}, config };
  };
  api.defaults.adapter = adapter;
}

async function settle<T>(promise: Promise<T>): Promise<{ value?: T; error?: unknown }> {
  const outcome = promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await vi.runAllTimersAsync();
  return outcome;
}

describe("axiosConfig: repetição automática", () => {
  beforeEach(() => {
    sent = [];
    circuitBreakerManager.clearAll();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    api.defaults.adapter = originalAdapter;
  });

  for (const method of ["post", "put", "patch", "delete"] as const) {
    it(`${method.toUpperCase()} nunca é reenviado sozinho (rede fora)`, async () => {
      network(undefined);
      const { error } = await settle(api.request({ method, url: "/contact" }));
      expect(error).toBeDefined();
      expect(sent).toHaveLength(1);
    });

    it(`${method.toUpperCase()} nunca é reenviado sozinho (500)`, async () => {
      network(500);
      const { error } = await settle(api.request({ method, url: "/contact" }));
      expect(error).toBeDefined();
      expect(sent).toHaveLength(1);
    });
  }

  it("GET com a rede fora: no máximo 2 novas tentativas e então falha", async () => {
    network(undefined);
    const { error } = await settle(api.get("/events"));
    expect((error as AxiosError).code).toBe("ERR_NETWORK");
    expect(sent).toHaveLength(SAFE_ATTEMPTS);
  });

  it("GET com 500 persistente: número finito de envios e o erro original chega a quem chamou", async () => {
    network(500);
    const { error } = await settle(api.get("/events"));
    expect((error as AxiosError).response?.status).toBe(500);
    expect(sent).toHaveLength(SAFE_ATTEMPTS);
  });

  it("GET que se recupera na segunda tentativa devolve a resposta", async () => {
    network(503, 1);
    const { value } = await settle(api.get("/events"));
    expect(value?.data).toBe("ok");
    expect(sent).toHaveLength(2);
  });

  it("circuito aberto depois de falhas seguidas: para de insistir, mas cada chamada ainda é enviada uma vez", async () => {
    network(500);
    for (let call = 0; call < 3; call += 1) await settle(api.get("/events"));
    sent = [];
    const { error } = await settle(api.get("/events"));
    expect((error as AxiosError).response?.status).toBe(500);
    expect(sent).toHaveLength(1);
  });

  it("4xx não é repetido", async () => {
    network(409);
    await settle(api.get("/events"));
    expect(sent).toHaveLength(1);
  });
});
