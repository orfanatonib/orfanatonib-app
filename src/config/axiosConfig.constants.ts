/** Métodos sem efeito no servidor: os únicos que o cliente pode reenviar sozinho. */
export const AUTO_RETRY_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

/** Novas tentativas depois do envio original. */
export const AUTO_RETRY_MAX = 2;

/** 5xx que não adianta repetir (recurso não implementado / versão HTTP). */
export const NON_RETRYABLE_SERVER_STATUSES: ReadonlySet<number> = new Set([501, 505]);
