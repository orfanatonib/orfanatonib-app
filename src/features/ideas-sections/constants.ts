import { MediaType } from '@/store/slices/types';
import { IdeaDraftIssue } from './types';

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

export const IDEA_DRAFT_ISSUE_MESSAGES: Readonly<Record<IdeaDraftIssue, string>> = {
  [IdeaDraftIssue.MissingTitle]: 'Por favor, adicione um título para sua ideia',
  [IdeaDraftIssue.MissingDescription]: 'Por favor, adicione uma descrição para sua ideia',
  [IdeaDraftIssue.MissingMedia]:
    'Por favor, adicione pelo menos uma mídia (vídeo, imagem ou documento) para sua ideia',
};

export const IDEA_SHARE_COPY = {
  FORM_TITLE_LABEL: 'Título da ideia',
  FORM_DESCRIPTION_LABEL: 'Descrição (brincadeira, versículo, história...)',
  MEDIA_SECTION_TITLE: 'Mídias da ideia',
  MEDIA_SECTION_HINT: 'Adicione pelo menos uma mídia. O arquivo só é incluído depois de clicar em "Adicionar".',
  SUCCESS: 'Sua ideia foi compartilhada com sucesso! 🎉',
  FAILURE: 'Ops! Algo deu errado ao compartilhar sua ideia. Tente novamente.',
  SUBMIT: 'Compartilhar ideia',
  SUBMITTING: 'Compartilhando...',
  CANCEL: 'Cancelar',
} as const;

/** Tempo para o membro ver a confirmação antes de voltar à Home. */
export const IDEA_SHARE_REDIRECT_DELAY_MS = 2000;
export const IDEA_SHARE_SNACKBAR_DURATION_MS = 5000;
