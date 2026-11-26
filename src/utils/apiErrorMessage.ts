import axios from 'axios';

/**
 * Mensagem de erro para a tela, a partir do que veio da API (`data.message`, texto ou lista),
 * do `Error` ou, por último, do texto padrão. Substitui o padrão repetido
 * `catch (err: any) { err?.response?.data?.message || ... }` (sem `any`).
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    const message = (data as { message?: unknown } | undefined)?.message;
    if (Array.isArray(message) && message.length > 0) return message.map(String).join(' ');
    if (typeof message === 'string' && message.trim()) return message;
  } else if (typeof error === 'object' && error !== null) {
    const anyShape = error as { response?: { data?: { message?: unknown } }; message?: unknown };
    const nested = anyShape.response?.data?.message;
    if (typeof nested === 'string' && nested.trim()) return nested;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** `true` para cancelamento de requisição (AbortController/axios), que não deve virar mensagem de erro. */
export function isRequestCanceled(error: unknown): boolean {
  if (axios.isCancel(error)) return true;
  return error instanceof Error && (error.name === 'CanceledError' || error.name === 'AbortError');
}
