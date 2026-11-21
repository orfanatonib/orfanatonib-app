/** data-testid do esqueleto exibido enquanto o código de uma rota é baixado. */
export const ROUTE_FALLBACK_TEST_ID = "route-fallback";

export const ROUTE_FALLBACK_LABEL = "Carregando página...";

/** Linhas de esqueleto do fallback (suficiente para ocupar a tela sem rolagem horizontal). */
export const ROUTE_FALLBACK_BLOCKS = 3;

/** Prazo para a verificação da sessão antes de mostrar a falha com nova tentativa. */
export const BOOT_TIMEOUT_MS = 15_000;

export const ADMIN_FALLBACK_PATH = "/adm/config-provedores-ia";

export const LEGACY_AI_PROVIDERS_PATHS = [
  "provedores-ia",
  "estudio/provedores-ia",
  "estudio/config",
] as const;
