import { MediaItem, MediaType, MediaUploadType } from '@/store/slices/types';
import {
  VISIT_MATERIAL_FIELD_SCOPE,
  VISIT_MATERIAL_PAYLOAD_FIELD,
  VISIT_MATERIAL_SECTION_CATEGORIES,
} from './constants';
import { isCategoryDraftFilled } from './utils';
import {
  CreateVisitMaterialPageRequestDto,
  UpdateVisitMaterialPageRequestDto,
  VisitMaterialCategoryDraft,
  VisitMaterialFormValues,
  VisitMaterialMediaRequestDto,
  VisitMaterialSectionCategory,
  VisitMaterialSectionRequestDto,
} from './types';

const extensionOf = (file: File): string =>
  file.name.includes('.') ? file.name.split('.').pop() ?? 'bin' : 'bin';

/** Nome do campo do arquivo no multipart; o prefixo da categoria evita colisão (o Geral mantém o formato antigo). */
const fileFieldFor = (
  scope: string,
  mediaType: MediaType,
  index: number,
  file: File,
): string => `${scope}${mediaType}_${index}.${extensionOf(file)}`;

const toMediaRequest = (
  item: MediaItem,
  mediaType: MediaType,
  index: number,
  formData: FormData,
  scope: string,
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
    const fieldKey = fileFieldFor(scope, mediaType, index, item.file);
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
  scope = '',
): VisitMaterialMediaRequestDto[] =>
  items.map((item, index) =>
    toMediaRequest(item, mediaType, index, formData, scope),
  );

/** Seção de uma categoria; só entra no payload se tiver mídia ou texto (o resto é "categoria vazia"). */
const toSectionRequest = (
  category: VisitMaterialSectionCategory,
  draft: VisitMaterialCategoryDraft,
  formData: FormData,
): VisitMaterialSectionRequestDto => {
  const scope = VISIT_MATERIAL_FIELD_SCOPE[category];
  const title = draft.title.trim();
  const description = draft.description.trim();
  return {
    category,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    videos: mapBucket(draft.videos, MediaType.VIDEO, formData, scope),
    documents: mapBucket(draft.documents, MediaType.DOCUMENT, formData, scope),
    images: mapBucket(draft.images, MediaType.IMAGE, formData, scope),
    audios: mapBucket(draft.audios, MediaType.AUDIO, formData, scope),
  };
};

const buildSections = (
  values: VisitMaterialFormValues,
  formData: FormData,
): VisitMaterialSectionRequestDto[] =>
  VISIT_MATERIAL_SECTION_CATEGORIES.flatMap((category) => {
    const draft = values.sections?.[category];
    return draft && isCategoryDraftFilled(draft)
      ? [toSectionRequest(category, draft, formData)]
      : [];
  });

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
    // Sem `sections` (cliente antigo) a API não mexe nas seções; com ele, a lista é a verdade (as que faltam são removidas).
    ...(values.sections ? { sections: buildSections(values, formData) } : {}),
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
