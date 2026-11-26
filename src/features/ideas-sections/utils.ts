import type { IdeasSection as DraftSection } from '@/store/slices/ideas/ideasSlice';
import { MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';
import { IDEAS_SECTION_ADMIN_EDIT_PATH, MEDIA_TYPE_ICONS, MEDIA_TYPE_LABELS } from './constants';
import { IdeaDraftIssue, type IdeasSection } from './types';

export const truncate = (text: string = '', max = 100) =>
  text.length > max ? text.slice(0, max) + '...' : text;

/**
 * `createdAt` é um instante, não um dia puro: aqui a conversão de fuso é o
 * comportamento correto.
 */
export const formatDatePtBr = (date?: string | Date) => {
  if (!date) return 'Não disponível';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const getMediaTypeIcon = (mediaType: string): string =>
  MEDIA_TYPE_ICONS[mediaType] ?? '📁';

export const getMediaTypeLabel = (mediaType: string): string =>
  MEDIA_TYPE_LABELS[mediaType] ?? 'Arquivo';

export const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Tamanho desconhecido';

  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

type IdeaDraft = Pick<DraftSection, 'title' | 'description' | 'medias'>;

/** Mídia pronta para envio: tem título e o arquivo (upload) ou o endereço (link). */
export const getSendableMedias = (medias: IdeaDraft['medias']) =>
  medias.filter((media) => {
    if (!media.title.trim()) return false;
    if (media.uploadType === MediaUploadType.UPLOAD) return Boolean(media.file);
    if (media.uploadType === MediaUploadType.LINK) return Boolean(media.url);
    return false;
  });

/** Primeira pendência da ideia, na ordem em que o formulário é preenchido; `null` se está pronta. */
export const validateIdeaDraft = (draft: IdeaDraft): IdeaDraftIssue | null => {
  if (!draft.title.trim()) return IdeaDraftIssue.MissingTitle;
  if (!draft.description.trim()) return IdeaDraftIssue.MissingDescription;
  if (getSendableMedias(draft.medias).length === 0) return IdeaDraftIssue.MissingMedia;
  return null;
};

/** Rota de edição de uma ideia; o id viaja na URL para a tela sobreviver a recarregar. */
export const buildEditSectionPath = (sectionId: string): string =>
  `${IDEAS_SECTION_ADMIN_EDIT_PATH}?id=${encodeURIComponent(sectionId)}`;

/** Id da ideia em edição, lido da query string; `null` se ausente ou vazio. */
export const readEditSectionId = (search: string): string | null => {
  const id = new URLSearchParams(search).get('id')?.trim();
  return id ? id : null;
};

/** Converte a ideia como a API devolve no rascunho que o editor manipula. */
export const toDraftSection = (section: IdeasSection): DraftSection => ({
  id: section.id,
  title: section.title,
  description: section.description,
  public: section.public,
  createdAt: section.createdAt,
  updatedAt: section.updatedAt,
  medias: (section.medias ?? []).map((media) => ({
    id: media.id,
    title: media.title,
    description: media.description,
    uploadType: media.uploadType as MediaUploadType,
    mediaType: media.mediaType as MediaType,
    isLocalFile: media.isLocalFile,
    url: media.url,
    platformType: (media.platformType as MediaPlatform | null) || undefined,
    originalName: media.originalName || undefined,
    size: media.size || undefined,
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
  })),
});

/** O rascunho mudou em relação ao ponto de partida (título, texto, visibilidade ou mídias)? */
export const isDraftDirty = (
  current: Pick<DraftSection, 'title' | 'description' | 'public' | 'medias'>,
  baseline: Pick<DraftSection, 'title' | 'description' | 'public' | 'medias'>,
): boolean => {
  const sameMedias =
    current.medias.length === baseline.medias.length &&
    current.medias.every((media, index) => {
      const base = baseline.medias[index];
      return (
        media.id === base.id &&
        media.title === base.title &&
        media.description === base.description &&
        media.url === base.url &&
        !media.file
      );
    });
  return (
    current.title !== baseline.title ||
    current.description !== baseline.description ||
    Boolean(current.public) !== Boolean(baseline.public) ||
    !sameMedias
  );
};
