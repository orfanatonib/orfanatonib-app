import { MediaType, MediaUploadType, MediaPlatform, type MediaItem } from '@/store/slices/types';
import {
  SHELTER_IMAGE_FORMATS,
  SHELTER_MAX_IMAGE_BYTES,
  SHELTER_MAX_PHOTOS,
  SHELTER_MAX_VIDEOS,
  SHELTER_MAX_VIDEO_BYTES,
  SHELTER_UPLOAD_MESSAGES as MESSAGES,
  SHELTER_VIDEO_FORMATS,
} from './constants';
import type { ShelterFileSelection } from './types';

const extensionOf = (name: string): string => name.split('.').pop()?.toLowerCase() ?? '';

/** Quantas mídias de cada tipo o post já tem. */
export function countByType(items: Pick<MediaItem, 'mediaType'>[]): {
  photos: number;
  videos: number;
} {
  const videos = items.filter((item) => item.mediaType === MediaType.VIDEO).length;
  return { photos: items.length - videos, videos };
}

/**
 * Confere os arquivos escolhidos (tipo, extensão, tamanho, cota) antes de entrarem
 * no post. Devolve a mensagem de erro ou `null` quando tudo certo.
 */
export function validateShelterSelection({
  files,
  mediaType,
  currentPhotos,
  currentVideos,
}: ShelterFileSelection): string | null {
  if (!files.length) return null;
  const video = mediaType === MediaType.VIDEO;
  if (video && files.length + currentVideos > SHELTER_MAX_VIDEOS) return MESSAGES.ONE_VIDEO;
  if (!video && files.length + currentPhotos > SHELTER_MAX_PHOTOS) return MESSAGES.MAX_PHOTOS;
  const formats = video ? SHELTER_VIDEO_FORMATS : SHELTER_IMAGE_FORMATS;
  const maxBytes = video ? SHELTER_MAX_VIDEO_BYTES : SHELTER_MAX_IMAGE_BYTES;
  for (const file of files) {
    if (!formats[file.type]?.includes(extensionOf(file.name))) {
      return video ? MESSAGES.VIDEO_FORMAT : MESSAGES.PHOTO_FORMAT;
    }
    if (file.size <= 0 || file.size > maxBytes) {
      return video ? MESSAGES.VIDEO_SIZE : MESSAGES.PHOTO_SIZE;
    }
  }
  return null;
}

/**
 * Regra do post inteiro: de 1 a 10 fotos e no máximo 1 vídeo (fotos e vídeo
 * podem andar juntos). `preserveLegacyCount` (edição do admin) tolera álbuns
 * antigos com mais fotos que a cota atual.
 */
export function validateShelterPublication(
  items: Pick<MediaItem, 'mediaType'>[],
  preserveLegacyCount = false
): string | null {
  if (!items.length) return MESSAGES.MEDIA_REQUIRED;
  if (items.some((item) => item.mediaType !== MediaType.IMAGE && item.mediaType !== MediaType.VIDEO)) {
    return MESSAGES.COMPOSITION;
  }
  const { photos, videos } = countByType(items);
  if (videos > SHELTER_MAX_VIDEOS || (!preserveLegacyCount && photos > SHELTER_MAX_PHOTOS)) {
    return MESSAGES.COMPOSITION;
  }
  return null;
}

/** Validação completa antes de enviar: título, descrição e mídia. */
export function validateShelterDraft(draft: {
  caption: string;
  description: string;
  mediaItems: Pick<MediaItem, 'mediaType'>[];
}): string | null {
  if (!draft.caption.trim()) return MESSAGES.TITLE_REQUIRED;
  if (!draft.description.trim()) return MESSAGES.DESCRIPTION_REQUIRED;
  return validateShelterPublication(draft.mediaItems);
}

/** Arquivo recém-escolhido no formato de mídia do editor. */
export function toShelterUploadMedia(file: File, mediaType: MediaType): MediaItem {
  return {
    file,
    mediaType,
    uploadType: MediaUploadType.UPLOAD,
    platformType: MediaPlatform.ANY,
    isLocalFile: true,
    url: '',
    title: file.name,
    description: '',
    originalName: file.name,
    size: file.size,
  };
}
