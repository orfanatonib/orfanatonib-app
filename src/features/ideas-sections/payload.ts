import { MediaItem, MediaType, MediaUploadType } from '@/store/slices/types';
import { IDEAS_SECTION_MEDIA_TYPES } from './constants';

export interface IdeasSectionPayloadInput {
  title: string;
  description: string;
  public: boolean;
  medias: MediaItem[];
  /** Mantém o `id` das mídias, para a API saber o que é edição. */
  keepMediaIds?: boolean;
}

interface MediaPayload {
  id?: string;
  title: string;
  description: string;
  mediaType: MediaType;
  uploadType: MediaUploadType;
  isLocalFile: boolean;
  url?: string;
  platformType?: string;
  fieldKey?: string;
  originalName?: string;
}

const isUpload = (media: MediaItem): boolean =>
  media.uploadType === MediaUploadType.UPLOAD;

/**
 * Nome único do campo multipart, estável para o mesmo conjunto de mídias:
 * `image_upload`, `image2_upload`, `video_upload`…
 */
const fieldKeyFor = (
  mediaType: MediaType,
  counters: Map<MediaType, number>,
): string => {
  const count = (counters.get(mediaType) ?? 0) + 1;
  counters.set(mediaType, count);
  return count === 1 ? `${mediaType}_upload` : `${mediaType}${count}_upload`;
};

/**
 * Monta o multipart que `/ideas-sections` espera.
 *
 * Os três editores de ideia repetiam esta montagem, cada um com uma diferença
 * calada: um nomeava o campo do arquivo por índice e extensão, outro por
 * contador; um mandava `public` fixo em `true`; só um preservava o `id` das
 * mídias, de modo que editar pelos outros apagava e recriava tudo no bucket.
 */
export const buildIdeasSectionFormData = (
  input: IdeasSectionPayloadInput,
): FormData => {
  const formData = new FormData();
  const counters = new Map<MediaType, number>();

  const medias = input.medias
    .filter((media) => IDEAS_SECTION_MEDIA_TYPES.includes(media.mediaType))
    .map((media): MediaPayload => {
      const base: MediaPayload = {
        ...(input.keepMediaIds && media.id ? { id: media.id } : {}),
        title: media.title,
        description: media.description,
        mediaType: media.mediaType,
        uploadType: media.uploadType,
        isLocalFile: isUpload(media),
      };

      if (isUpload(media) && media.file) {
        const fieldKey = fieldKeyFor(media.mediaType, counters);
        formData.append(fieldKey, media.file, media.file.name);
        return { ...base, fieldKey, originalName: media.file.name };
      }

      // Upload já gravado, sem arquivo novo: a API mantém o que está no
      // bucket desde que o `id` viaje junto.
      if (isUpload(media)) return base;

      return { ...base, url: media.url, platformType: media.platformType };
    });

  formData.append(
    'sectionData',
    JSON.stringify({
      title: input.title,
      description: input.description,
      public: input.public,
      medias,
    }),
  );

  return formData;
};
