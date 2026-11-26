import axios from 'axios';

/**
 * Mensagem de erro da API, com recuo para um texto próprio.
 *
 * Os três editores de ideia terminavam em `catch { 'Erro ao salvar a seção.' }`,
 * descartando o que a API explicava — "Arquivo ausente para a mídia X" virava
 * "algo deu errado".
 */
export const ideasSectionErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (Array.isArray(message) && message.length > 0) return message.join('; ');
    if (typeof message === 'string' && message.trim()) return message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
};
