import { MediaType } from '@/store/slices/types';

/**
 * Tipos de mídia que uma ideia aceita. A API recusa áudio, e a tela de envio
 * nunca o ofereceu — a lista existe para o filtro não virar string solta.
 */
export const IDEAS_SECTION_MEDIA_TYPES: readonly MediaType[] = [
  MediaType.VIDEO,
  MediaType.DOCUMENT,
  MediaType.IMAGE,
];

/** Rótulo e ícone de cada tipo, usados nos cards e no detalhe. */
export const MEDIA_TYPE_LABELS: Readonly<Record<string, string>> = {
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
  document: 'Documento',
};

export const MEDIA_TYPE_ICONS: Readonly<Record<string, string>> = {
  image: '🖼️',
  video: '🎥',
  audio: '🎵',
  document: '📄',
};

export const IDEAS_SECTION_MESSAGES = {
  LOAD_FAILED: 'Erro ao buscar Ideias compartilhadas',
  LOAD_PAGES_FAILED: 'Erro ao buscar páginas de ideias',
  DELETE_FAILED: 'Erro ao deletar seção de ideias',
  SAVE_FAILED: 'Erro ao salvar a seção.',
} as const;
