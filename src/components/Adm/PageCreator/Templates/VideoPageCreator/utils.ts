import { MediaItem, MediaPlatform, MediaType, MediaUploadType } from 'store/slices/types';
import { validateMediaURL } from '@/utils/validateMediaURL';
import { VIDEO_FIELD_PREFIX, VIDEO_PAGE_MESSAGES } from './constants';
import { VideoFieldErrors, VideoPageDraft } from './types';

export const createEmptyVideo = (): MediaItem => ({
  title: '',
  description: '',
  uploadType: MediaUploadType.LINK,
  platformType: MediaPlatform.YOUTUBE,
  url: '',
  isLocalFile: false,
  mediaType: MediaType.VIDEO,
});

export const NO_VIDEO_ERRORS: VideoFieldErrors = {
  newVideoTitle: false,
  newVideoDescription: false,
  newVideoSrc: false,
  newVideoURL: false,
};

export const videoToEditable = (video: MediaItem): MediaItem => ({ ...video, file: undefined });

/** Primeira regra violada da página, ou `null` quando pode salvar. */
export function validateVideoPage(draft: VideoPageDraft): string | null {
  if (!draft.title.trim()) return VIDEO_PAGE_MESSAGES.TITLE_REQUIRED;
  if (!draft.description.trim()) return VIDEO_PAGE_MESSAGES.DESCRIPTION_REQUIRED;
  if (draft.videoCount === 0) return VIDEO_PAGE_MESSAGES.NO_VIDEO;
  if (!draft.fromTemplatePage && !draft.hasId) return VIDEO_PAGE_MESSAGES.MISSING_ID;
  if (!draft.uploadsComplete) return VIDEO_PAGE_MESSAGES.UPLOAD_PENDING;
  return null;
}

export interface NewVideoValidation {
  errors: VideoFieldErrors;
  hasError: boolean;
  isValidUrl: boolean;
}

export function validateNewVideo(video: MediaItem, isEditing: boolean): NewVideoValidation {
  const isLink = video.uploadType === MediaUploadType.LINK;
  const isUpload = video.uploadType === MediaUploadType.UPLOAD;
  const hasError =
    !video.title ||
    !video.description ||
    (isLink && !video.url) ||
    (isUpload && !video.file && !isEditing);
  const isValidUrl = isLink && video.platformType ? validateMediaURL(video.url, video.platformType) : true;

  return {
    hasError,
    isValidUrl,
    errors: {
      newVideoTitle: !video.title,
      newVideoDescription: !video.description,
      newVideoSrc: isLink ? !video.url : !video.file && !isEditing,
      newVideoURL: isLink && !isValidUrl,
    },
  };
}

export interface BuildVideoPayloadInput {
  videos: MediaItem[];
  title: string;
  description: string;
  isPublic: boolean;
  fromTemplatePage: boolean;
  existingId?: string;
}

/** Monta o `videosPageData` e anexa os arquivos novos ao `FormData` (mesmas chaves de antes). */
export function buildVideoFormData(input: BuildVideoPayloadInput): FormData {
  const { videos, title, description, isPublic, fromTemplatePage, existingId } = input;
  const formData = new FormData();

  const videosPayload = videos.map((video, index) => {
    const fieldKey = `${VIDEO_FIELD_PREFIX}${index}`;
    const isUpload = video.uploadType === MediaUploadType.UPLOAD;
    const isNewUpload = isUpload && !video.id;
    if (isUpload && video.file && !video.id) formData.append(fieldKey, video.file);

    return {
      id: !fromTemplatePage && video.id ? video.id : undefined,
      title: video.title,
      description: video.description,
      uploadType: video.uploadType,
      isLocalFile: isUpload,
      url: video.uploadType === MediaUploadType.LINK || (isUpload && video.id) ? video.url : undefined,
      platformType: video.uploadType === MediaUploadType.LINK ? video.platformType : undefined,
      originalName: video.file?.name,
      mediaType: MediaType.VIDEO,
      fieldKey: isNewUpload ? fieldKey : undefined,
    };
  });

  formData.append(
    'videosPageData',
    JSON.stringify({
      ...(fromTemplatePage ? {} : { id: existingId }),
      public: isPublic,
      title,
      description,
      videos: videosPayload,
    }),
  );
  return formData;
}
