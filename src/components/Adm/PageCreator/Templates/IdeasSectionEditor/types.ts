import type { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import type { FeedbackSeverity } from '../shared/types';

/** Situação das mídias do rascunho de ideia do membro. */
export enum IdeaMediaStatus {
  READY = 'ready',
  INCOMPLETE = 'incomplete',
  EMPTY = 'empty',
}

/** Pendência que impede o admin de salvar e publicar a seção. */
export enum AdminSaveIssue {
  MISSING_PAGE = 'missing-page',
  MISSING_SECTION_ID = 'missing-section-id',
}

/** Página de ideias oferecida como destino da seção. */
export interface IdeasPageOption {
  id: string;
  title: string;
}

export interface IdeaFeedbackState {
  open: boolean;
  message: string;
  severity: FeedbackSeverity;
}

export interface AdminSaveValidationInput {
  pageId: string | null;
  sectionId: string | undefined;
}

export interface IdeasSectionAdminEditorProps {
  existingSection?: IdeasSection;
}
