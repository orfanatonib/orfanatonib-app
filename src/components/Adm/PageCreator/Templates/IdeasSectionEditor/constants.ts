import type { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import type { FeedbackSeverity } from '../shared/types';
import { AdminSaveIssue, IdeaMediaStatus } from './types';

export const ADMIN_IDEAS_SECTIONS_PATH = '/adm/ideias-compartilhadas';
/** Tempo para o admin ver a confirmação antes de voltar à lista. */
export const ADMIN_REDIRECT_DELAY_MS = 2000;
export const MIN_TOUCH_TARGET_PX = 44;

export const IDEAS_SECTION_ADMIN_TEST_ID = 'ideas-section-admin';
export const IDEAS_SECTION_ADMIN_TEST_IDS = {
  PAGE_SELECT: 'ideas-section-admin-page-select',
  VISIBILITY: 'ideas-section-admin-visibility',
  SELECTED_PAGE: 'ideas-section-admin-selected-page',
  SETTINGS: 'ideas-section-admin-settings',
  MEDIA_CARD: 'ideas-section-admin-media-card',
  FEEDBACK: 'ideas-section-admin-feedback',
} as const;

export const IDEA_SHARE_TEST_IDS = {
  PAGE: 'idea-share-page',
  FORM_CARD: 'idea-share-form-card',
  ACTIONS: 'idea-share-actions',
  MEDIA_STATUS: 'idea-share-media-status',
  CANCEL: 'idea-share-cancel',
  SUBMIT: 'idea-share-submit',
  SNACKBAR: 'idea-share-snackbar',
} as const;

export const IDEAS_SECTION_ADMIN_COPY = {
  HEADING: '🔧 Editar Seção de Ideias',
  SETTINGS: '⚙️ Configurações',
  PAGE_LABEL: 'Página de Destino',
  PAGE_PLACEHOLDER: 'Selecione uma página...',
  PAGE_REQUIRED: 'Campo obrigatório',
  VISIBILITY_LABEL: 'Visibilidade',
  PUBLIC: 'Público',
  PRIVATE: 'Privado',
  SELECTED_PAGE_CHIP: 'Página selecionada',
  SAVE: 'Salvar e Publicar',
  SAVING: 'Salvando...',
  SUCCESS: 'Seção editada e vinculada com sucesso! 🎉',
  SAVE_FAILED: 'Ops! Algo deu errado ao salvar a seção. Tente novamente.',
  LOAD_PAGES_FAILED: 'Erro ao carregar páginas disponíveis',
} as const;

export const ADMIN_SAVE_ISSUE_MESSAGES: Readonly<Record<AdminSaveIssue, string>> = {
  [AdminSaveIssue.MISSING_PAGE]: 'Por favor, selecione uma página de destino',
  [AdminSaveIssue.MISSING_SECTION_ID]: 'ID da seção não encontrado',
};

export const IDEA_MEDIA_STATUS_SEVERITY: Readonly<Record<IdeaMediaStatus, FeedbackSeverity>> = {
  [IdeaMediaStatus.READY]: 'success',
  [IdeaMediaStatus.INCOMPLETE]: 'warning',
  [IdeaMediaStatus.EMPTY]: 'info',
};

export const IDEA_MEDIA_STATUS_MESSAGES = {
  INCOMPLETE: 'Complete os dados das mídias adicionadas',
  EMPTY: 'Adicione pelo menos uma mídia (vídeo, imagem ou documento)',
} as const;

/** Ideia de um membro nasce pública. */
export const EMPTY_IDEA_SECTION: IdeasSection = { title: '', description: '', medias: [], public: true };

export const CLOSED_FEEDBACK = { open: false, message: '', severity: 'success' } as const;
