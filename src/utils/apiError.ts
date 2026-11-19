import axios from "axios";

import { getApiErrorMessage } from "./apiErrorMessage";

const GENERIC_MESSAGE = "Algo deu errado. Tente novamente.";

/** Mensagem de erro para a tela (painel de provedores de IA e telas de aulas, portados do Clubinho). */
export function getErrorMessage(error: unknown, fallback: string = GENERIC_MESSAGE): string {
  return getApiErrorMessage(error, fallback);
}

export const extractErrorMessage = getErrorMessage;

/** Status HTTP da resposta, quando o erro veio da API. */
export function getHttpStatus(error: unknown): number | null {
  return axios.isAxiosError(error) ? (error.response?.status ?? null) : null;
}

/** Código do erro no contrato da API do orfanato (`details.code` ou `details[0].code`). */
export function getApiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const details = (error.response?.data as { details?: unknown } | undefined)?.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const code = (details as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  if (Array.isArray(details)) {
    const code = (details[0] as { code?: unknown } | undefined)?.code;
    return typeof code === "string" ? code : null;
  }
  return null;
}
