import { MediaItem, MediaPlatform, MediaType, MediaUploadType } from 'store/slices/types';
import { SectionData } from '@/store/slices/image-section/imageSectionSlice';
import { ImagePageData } from '@/store/slices/image/imageSlice';
import { IMAGE_FORM_FIELD_PREFIX, IMAGE_PAGE_MESSAGES } from './constants';

export function sectionToEditable(section: SectionData): SectionData {
  return {
    ...section,
    public: section.public ?? true,
    mediaItems: section.mediaItems.map((media) => ({ ...media, file: undefined })),
  };
}

export interface ImagePageDraft {
  title: string;
  description: string;
  sections: SectionData[];
}

/** Primeira regra violada do rascunho, ou `null` quando está válido. */
export function validateImageDraft(draft: ImagePageDraft): string | null {
  if (!draft.title.trim()) return IMAGE_PAGE_MESSAGES.TITLE_REQUIRED;
  if (!draft.description.trim()) return IMAGE_PAGE_MESSAGES.DESCRIPTION_REQUIRED;
  if (draft.sections.length === 0) return IMAGE_PAGE_MESSAGES.NO_SECTION;

  for (let i = 0; i < draft.sections.length; i++) {
    const { caption, description, mediaItems } = draft.sections[i];
    if (!caption.trim()) return `A seção ${i + 1} precisa de um título.`;
    if (!description.trim()) return `A seção ${i + 1} precisa de uma descrição.`;
    if (mediaItems.length === 0) return `A seção ${i + 1} precisa conter pelo menos uma mídia.`;
  }
  return null;
}

export interface BuildImagePayloadInput {
  draft: ImagePageDraft;
  isPublic: boolean;
  fromTemplatePage: boolean;
  existingId?: string;
}

/** Monta o `imageData` e anexa os arquivos locais ao `FormData` (mesmas chaves de antes). */
export function buildImageFormData(input: BuildImagePayloadInput): FormData {
  const { draft, isPublic, fromTemplatePage, existingId } = input;
  const formData = new FormData();

  const sections: SectionData[] = draft.sections.map((section, sectionIndex) => {
    const mediaItems: MediaItem[] = section.mediaItems.map((media, mediaIndex) => {
      const fieldKey = `${IMAGE_FORM_FIELD_PREFIX}${sectionIndex}_mid${mediaIndex}`;
      if (media.isLocalFile && media.file) formData.append(fieldKey, media.file);

      const baseMedia: MediaItem = {
        isLocalFile: media.isLocalFile,
        url: media.url || '',
        uploadType: media.uploadType || MediaUploadType.UPLOAD,
        mediaType: MediaType.IMAGE,
        title: media.title || '',
        description: media.description || '',
        platformType: media.platformType || MediaPlatform.ANY,
        originalName: media.originalName,
        size: media.size,
        fieldKey,
      };
      return fromTemplatePage && !media.id ? baseMedia : { ...baseMedia, id: media.id };
    });

    const baseSection = {
      public: section.public,
      caption: section.caption,
      description: section.description,
      mediaItems,
    };
    return fromTemplatePage && !section.id ? baseSection : { ...baseSection, id: section.id };
  });

  const payload: ImagePageData = {
    ...(!fromTemplatePage && existingId && { id: existingId }),
    public: isPublic,
    title: draft.title,
    description: draft.description,
    sections,
  };
  formData.append('imageData', JSON.stringify(payload));
  return formData;
}
