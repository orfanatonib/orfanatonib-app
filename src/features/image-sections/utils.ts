import { MediaType, MediaUploadType } from '@/store/slices/types';
import { IMAGE_SECTION_PAYLOAD_FIELD } from './constants';
import type {
  ImageSectionMediaInput,
  ImageSectionPayload,
  ImageSectionUpload,
  SectionDraftInput,
  SectionUploadParts,
} from './types';

export const truncate = (text: string = '', max = 100) =>
  text.length > max ? text.slice(0, max) + '...' : text;

export const formatDatePtBr = (date?: string | Date) => {
  if (!date) return 'Não disponível';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/** Resumo da mídia de uma publicação, para o card (ex.: "2 fotos + 1 vídeo"). */
export function mediaSummary(items: { mediaType: string }[] = []): string {
  const videos = items.filter((item) => item.mediaType === MediaType.VIDEO).length;
  const photos = items.length - videos;
  const parts: string[] = [];
  if (photos) parts.push(photos === 1 ? '1 foto' : `${photos} fotos`);
  if (videos) parts.push(videos === 1 ? '1 vídeo' : `${videos} vídeos`);
  return parts.join(' + ') || 'Sem arquivos';
}

/** Monta o multipart: JSON em `sectionData` e cada arquivo em um campo próprio (`fieldKey`). */
export function buildSectionFormData(
  payload: ImageSectionPayload,
  uploads: ImageSectionUpload[] = []
): FormData {
  const formData = new FormData();
  formData.append(IMAGE_SECTION_PAYLOAD_FIELD, JSON.stringify(payload));
  uploads.forEach(({ fieldKey, file }) => formData.append(fieldKey, file));
  return formData;
}

/**
 * Corpo da publicação a partir do que a tela tem em mãos. Cada mídia mantém o
 * PRÓPRIO tipo (antes tudo era marcado como imagem e o vídeo voltava como foto).
 */
export function buildSectionUpload(section: SectionDraftInput): SectionUploadParts {
  const uploads: ImageSectionUpload[] = [];
  const mediaItems: ImageSectionMediaInput[] = section.mediaItems.map((media, index) => {
    const base: ImageSectionMediaInput = {
      id: media.id,
      title: media.title || '',
      description: media.description || '',
      uploadType: media.uploadType ?? MediaUploadType.UPLOAD,
      mediaType: media.mediaType ?? MediaType.IMAGE,
      isLocalFile: Boolean(media.isLocalFile),
      url: media.url || '',
      platformType: media.platformType,
      originalName: media.originalName,
      size: media.size,
    };
    if (media.isLocalFile && media.file) {
      const fieldKey = `file_${index}`;
      uploads.push({ fieldKey, file: media.file });
      return { ...base, fieldKey, originalName: media.file.name };
    }
    return base;
  });
  const payload: ImageSectionPayload = {
    caption: section.caption,
    description: section.description,
    mediaItems,
  };
  if (section.public !== undefined) payload.public = section.public;
  if (section.pageId) payload.pageId = section.pageId;
  return { payload, uploads };
}
