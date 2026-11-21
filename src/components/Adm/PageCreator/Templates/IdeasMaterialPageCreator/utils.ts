import { IdeasSection } from 'store/slices/ideas/ideasSlice';
import { MediaItem, MediaUploadType } from 'store/slices/types';
import { validateMediaURL } from 'utils/validateMediaURL';
import { DEFAULT_UPLOAD_EXTENSION, IDEAS_FORM_FIELD } from './constants';
import {
  IdeasMediaPayload,
  IdeasPagePayload,
  IdeasSectionPayload,
  IdeasValidationInput,
} from './types';

/** `true` quando algum campo obrigatório falta (título, descrição ou ao menos uma seção). */
export function hasIdeasErrors({ title, description, sectionCount }: IdeasValidationInput): boolean {
  return !title.trim() || !description.trim() || sectionCount === 0;
}

/** Nome do campo multipart de um arquivo: `<tipo>_<seção>_<mídia>.<extensão>`. */
export function buildMediaFieldKey(media: MediaItem, sectionIndex: number, mediaIndex: number): string {
  const extension = media.file?.name.split('.').pop() || DEFAULT_UPLOAD_EXTENSION;
  return `${media.mediaType}_${sectionIndex}_${mediaIndex}.${extension}`;
}

export interface BuildIdeasFormDataInput {
  title: string;
  description: string;
  sections: IdeasSection[];
  fromTemplatePage: boolean;
  existingId?: string;
}

const idOf = (id: string | undefined, fromTemplatePage: boolean): { id?: string } =>
  !fromTemplatePage && id ? { id } : {};

/** Monta o `ideasMaterialsPageData` e anexa os arquivos novos ao `FormData`. */
export function buildIdeasFormData(input: BuildIdeasFormDataInput): FormData {
  const { title, description, sections, fromTemplatePage, existingId } = input;
  const formData = new FormData();

  const sectionPayloads: IdeasSectionPayload[] = sections.map((section, sectionIndex) => ({
    ...idOf(section.id, fromTemplatePage),
    title: section.title,
    description: section.description,
    medias: section.medias.map((media, mediaIndex): IdeasMediaPayload => {
      const base: IdeasMediaPayload = {
        ...idOf(media.id, fromTemplatePage),
        title: media.title,
        description: media.description,
        mediaType: media.mediaType,
        uploadType: media.uploadType,
        platformType: media.platformType,
        isLocalFile: media.uploadType === MediaUploadType.UPLOAD,
      };
      if (media.uploadType === MediaUploadType.UPLOAD && media.file) {
        const fieldKey = buildMediaFieldKey(media, sectionIndex, mediaIndex);
        formData.append(fieldKey, media.file, fieldKey);
        return { ...base, fieldKey };
      }
      return { ...base, url: media.url };
    }),
  }));

  const payload: IdeasPagePayload = {
    ...idOf(existingId, fromTemplatePage),
    title,
    description,
    sections: sectionPayloads,
  };
  formData.append(IDEAS_FORM_FIELD, JSON.stringify(payload));
  return formData;
}

/** Título e descrição gerados para o vídeo `number` da ideia. */
export function buildGeneratedVideoInfo(ideaTitle: string, number: number): { title: string; description: string } {
  const named = ideaTitle.trim();
  return {
    title: named ? `Vídeo ${number} da ideia "${ideaTitle}"` : `Vídeo ${number}`,
    description: named ? `Vídeo ${number} para auxiliar na Ideia "${ideaTitle}"` : `Vídeo ${number}`,
  };
}

/** `true` quando o rascunho de vídeo não pode ser adicionado (sem URL/arquivo, ou link inválido). */
export function hasVideoDraftError(draft: Pick<MediaItem, 'url' | 'uploadType' | 'platformType'>): boolean {
  if (!draft.url) return true;
  return draft.uploadType === MediaUploadType.LINK && !validateMediaURL(draft.url, draft.platformType);
}

/** URL de incorporação do YouTube (sem autoplay) a partir de um link `watch?v=` ou já `embed`. */
export function toYoutubeEmbedUrl(url: string): string {
  const embed = url.includes('embed') ? url : url.replace(/watch\?v=/, 'embed/');
  return `${embed}?autoplay=0&mute=0`;
}
