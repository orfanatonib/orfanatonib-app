import { MEDIA_TYPE_ICONS, MEDIA_TYPE_LABELS } from './constants';

export const truncate = (text: string = '', max = 100) =>
  text.length > max ? text.slice(0, max) + '...' : text;

/**
 * `createdAt` é um instante, não um dia puro: aqui a conversão de fuso é o
 * comportamento correto.
 */
export const formatDatePtBr = (date?: string | Date) => {
  if (!date) return 'Não disponível';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getMediaTypeIcon = (mediaType: string): string =>
  MEDIA_TYPE_ICONS[mediaType] ?? '📁';

export const getMediaTypeLabel = (mediaType: string): string =>
  MEDIA_TYPE_LABELS[mediaType] ?? 'Arquivo';

export const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Tamanho desconhecido';

  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
