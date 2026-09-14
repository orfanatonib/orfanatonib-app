import { MediaItem, MediaType, MediaUploadType } from '@/store/slices/types';
import { VISIT_MATERIAL_PAYLOAD_FIELD } from './constants';
import {
  CreateVisitMaterialPageRequestDto,
  UpdateVisitMaterialPageRequestDto,
  VisitMaterialFormValues,
  VisitMaterialMediaRequestDto,
} from './types';

const extensionOf = (file: File): string =>
  file.name.includes('.') ? file.name.split('.').pop() ?? 'bin' : 'bin';

const fileFieldFor = (
  mediaType: MediaType,
  index: number,
  file: File,
): string => `${mediaType}_${index}.${extensionOf(file)}`;

const toMediaRequest = (
  item: MediaItem,
  mediaType: MediaType,
  index: number,
  formData: FormData,
): VisitMaterialMediaRequestDto => {
  const base: VisitMaterialMediaRequestDto = {
    ...(item.id ? { id: item.id } : {}),
    title: item.title.trim(),
    description: item.description.trim(),
    mediaType,
    uploadType: item.uploadType,
    isLocalFile: item.uploadType === MediaUploadType.UPLOAD,
  };

  if (item.uploadType === MediaUploadType.LINK) {
    return {
      ...base,
      url: item.url.trim(),
      ...(item.platformType ? { platformType: item.platformType } : {}),
    };
  }

  if (item.file instanceof File) {
    const fieldKey = fileFieldFor(mediaType, index, item.file);
    formData.append(fieldKey, item.file, item.file.name);
    return {
      ...base,
      fieldKey,
      originalName: item.file.name,
      size: item.file.size,
    };
  }

  // Upload já persistido: o id permite ao backend conservar a URL e os
  // metadados armazenados sem confiar em um caminho enviado pelo navegador.
  return {
    ...base,
    ...(item.originalName ? { originalName: item.originalName } : {}),
    ...(item.size !== undefined ? { size: item.size } : {}),
  };
};

const mapBucket = (
  items: MediaItem[],
  mediaType: MediaType,
  formData: FormData,
): VisitMaterialMediaRequestDto[] =>
  items.map((item, index) =>
    toMediaRequest(item, mediaType, index, formData),
  );

export const buildVisitMaterialFormData = (
  values: VisitMaterialFormValues,
  mode: 'create' | 'update',
): FormData => {
  const formData = new FormData();
  const shared = {
    pageTitle: values.pageTitle.trim(),
    pageSubtitle: values.pageSubtitle.trim(),
    testament: values.testament,
    pageDescription: values.pageDescription.trim(),
    videos: mapBucket(values.videos, MediaType.VIDEO, formData),
    documents: mapBucket(values.documents, MediaType.DOCUMENT, formData),
    images: mapBucket(values.images, MediaType.IMAGE, formData),
    audios: mapBucket(values.audios, MediaType.AUDIO, formData),
  };

  const payload: CreateVisitMaterialPageRequestDto | UpdateVisitMaterialPageRequestDto =
    mode === 'create'
      ? shared
      : {
          ...shared,
          id: values.id ?? '',
          currentWeek: values.currentWeek,
        };

  formData.append(VISIT_MATERIAL_PAYLOAD_FIELD, JSON.stringify(payload));
  return formData;
};
