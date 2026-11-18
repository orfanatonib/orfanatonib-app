/**
 * Mensagem de erro de uma chamada à API.
 *
 * Cada componente do módulo repetia `catch (err: unknown)` seguido de
 * `err?.response?.data?.message` — onze vezes, com fallbacks diferentes.
 */
export function attendanceErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const apiMessage = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;

  if (Array.isArray(apiMessage)) return apiMessage.join(', ');
  if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;

  return fallback;
}
