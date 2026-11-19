import { MediaFileKind } from './types';

/** Atributo `accept` de cada tipo de arquivo, igual ao usado hoje nos criadores. */
export const MEDIA_ACCEPT_BY_KIND: Record<MediaFileKind, string> = {
  [MediaFileKind.IMAGE]: 'image/*',
  [MediaFileKind.VIDEO]: 'video/*',
  [MediaFileKind.AUDIO]: 'audio/mp3',
  [MediaFileKind.DOCUMENT]: '.pdf,.doc,.docx',
};

export const DOCUMENT_EXTENSIONS: readonly string[] = ['.pdf', '.doc', '.docx'];
export const AUDIO_MIME_PREFIX = 'audio/';
export const IMAGE_MIME_PREFIX = 'image/';
export const VIDEO_MIME_PREFIX = 'video/';

export const BYTES_PER_MB = 1024 * 1024;

export const MEDIA_ERROR_MESSAGES = {
  INVALID_TYPE: 'Tipo de arquivo não permitido.',
  TOO_LARGE: 'O arquivo excede o tamanho máximo permitido.',
} as const;

export const SNACKBAR_AUTO_HIDE_MS = 5000;
export const REQUIRED_FIELD_MESSAGE = 'Campo obrigatório';
export const DEFAULT_PUBLIC_LABEL = 'Página pública';
export const BASIC_INFO_HEADING = 'Informações Básicas';
export const SAVING_LABEL = 'Salvando...';
export const CANCEL_LABEL = 'Cancelar';
export const DESCRIPTION_ROWS = 4;

export const PAGE_FORM_TEST_IDS = {
  BACK: 'back-button',
  HEADING: 'heading',
  BASIC_INFO: 'basic-info',
  TITLE: 'title-input',
  DESCRIPTION: 'description-input',
  PUBLIC: 'public-switch',
  ACTIONS: 'actions',
  CANCEL: 'cancel-button',
  SAVE: 'save-button',
  FEEDBACK: 'feedback',
} as const;
