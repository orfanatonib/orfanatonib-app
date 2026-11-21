import type { UploadKind, UploadPolicy } from './mediaUpload.types';

const MB = 1024 * 1024;

/**
 * Espelho de `orfanatonib-api/src/shared/media/storage/media-storage.constants.ts`.
 * A API continua sendo a autoridade (ela recusa com 400/413); aqui só se evita enviar o que já se sabe recusado.
 */
export const UPLOAD_POLICIES: Readonly<Record<UploadKind, UploadPolicy>> = {
  image: {
    label: 'imagem',
    maxBytes: 10 * MB,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  video: {
    label: 'vídeo',
    maxBytes: 200 * MB,
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  document: {
    label: 'documento',
    maxBytes: 25 * MB,
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  audio: {
    label: 'áudio',
    maxBytes: 50 * MB,
    mimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/wav'],
  },
};

export const UPLOAD_MESSAGES = {
  empty: 'O arquivo está vazio.',
  type: (label: string, accepted: string): string =>
    `Formato não aceito para ${label}. Use: ${accepted}.`,
  size: (label: string, max: string, actual: string): string =>
    `O arquivo tem ${actual}; o máximo para ${label} é ${max}.`,
} as const;
