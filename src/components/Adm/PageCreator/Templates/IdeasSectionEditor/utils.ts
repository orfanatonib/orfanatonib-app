import type { IdeasSection } from '@/store/slices/ideas/ideasSlice';
import { buildIdeasSectionFormData } from '@/features/ideas-sections/payload';
import { IDEA_MEDIA_STATUS_MESSAGES } from './constants';
import {
  AdminSaveIssue,
  IdeaMediaStatus,
  type AdminSaveValidationInput,
  type IdeasPageOption,
} from './types';

/** Estado das mídias do rascunho: quantas estão prontas e quantas existem. */
export function getIdeaMediaStatus(sendableCount: number, totalCount: number): IdeaMediaStatus {
  if (sendableCount > 0) return IdeaMediaStatus.READY;
  return totalCount > 0 ? IdeaMediaStatus.INCOMPLETE : IdeaMediaStatus.EMPTY;
}

/** Texto do aviso de mídias do membro. */
export function getIdeaMediaStatusMessage(status: IdeaMediaStatus, sendableCount: number): string {
  switch (status) {
    case IdeaMediaStatus.READY:
      return `${sendableCount} mídia(s) pronta(s) para envio`;
    case IdeaMediaStatus.INCOMPLETE:
      return IDEA_MEDIA_STATUS_MESSAGES.INCOMPLETE;
    default:
      return IDEA_MEDIA_STATUS_MESSAGES.EMPTY;
  }
}

/** Primeira pendência que impede salvar (página de destino antes do id). */
export function validateAdminSave({ pageId, sectionId }: AdminSaveValidationInput): AdminSaveIssue | null {
  if (!pageId) return AdminSaveIssue.MISSING_PAGE;
  if (!sectionId) return AdminSaveIssue.MISSING_SECTION_ID;
  return null;
}

export function findPageOption(
  pages: readonly IdeasPageOption[],
  pageId: string,
): IdeasPageOption | null {
  return pages.find((page) => page.id === pageId) ?? null;
}

/** Multipart da edição do admin: os `id` das mídias viajam (evita recriar arquivos no bucket). */
export function buildAdminSectionFormData(section: IdeasSection): FormData {
  return buildIdeasSectionFormData({
    title: section.title,
    description: section.description,
    public: section.public ?? false,
    medias: section.medias,
    keepMediaIds: true,
  });
}

/** Multipart da ideia de um membro: sempre pública e com mídia nova. */
export function buildMemberIdeaFormData(section: IdeasSection): FormData {
  return buildIdeasSectionFormData({
    title: section.title,
    description: section.description,
    public: true,
    medias: section.medias,
  });
}

export const isPublicValue = (value: string): boolean => value === 'true';
export const publicToValue = (isPublic: boolean | undefined): string => (isPublic ? 'true' : 'false');
