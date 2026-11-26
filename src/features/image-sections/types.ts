import type { ReactNode } from 'react';
import type { SectionData } from '@/store/slices/image-section/imageSectionSlice';
import type { MediaItem, MediaPlatform, MediaType, MediaUploadType } from '@/store/slices/types';

/** Mídia como vai no JSON `sectionData` (contrato da API). */
export interface ImageSectionMediaInput {
  id?: string;
  title: string;
  description: string;
  uploadType: MediaUploadType;
  mediaType: MediaType;
  isLocalFile: boolean;
  url: string;
  platformType?: MediaPlatform;
  originalName?: string;
  size?: number;
  fieldKey?: string;
}

/** JSON `sectionData` do POST/PATCH. */
export interface ImageSectionPayload {
  caption: string;
  description: string;
  public?: boolean;
  /** Galeria de destino na aprovação; omitido = galeria do feed da API. */
  pageId?: string;
  mediaItems: ImageSectionMediaInput[];
}

/** Arquivo a enviar, com o campo que o liga à sua mídia. */
export interface ImageSectionUpload {
  fieldKey: string;
  file: File;
}

/** Entrada de `buildSectionUpload`: o que a tela tem em mãos. */
export interface SectionDraftInput {
  caption: string;
  description: string;
  public?: boolean;
  pageId?: string;
  mediaItems: MediaItem[];
}

export interface SectionUploadParts {
  payload: ImageSectionPayload;
  uploads: ImageSectionUpload[];
}

export interface ShelterMediaEditorProps {
  isEditMode?: boolean;
  initialCaption: string;
  initialDescription: string;
  initialMediaItems: MediaItem[];
  onChange: (updatedData: Partial<SectionData>) => void;
  captionPlaceholder?: string;
  descriptionPlaceholder?: string;
  disabled?: boolean;
}

export interface ShelterMediaPreviewProps {
  media: Pick<MediaItem, 'url' | 'mediaType' | 'title' | 'file'>;
}

export interface ShelterVideoPlayerProps {
  src: string;
  title: string;
}

/** Arquivos escolhidos de um tipo, a validar contra o que já está no post. */
export interface ShelterFileSelection {
  files: File[];
  mediaType: MediaType;
  /** Mídias já no post, por tipo. */
  currentPhotos: number;
  currentVideos: number;
}

/** Estado de revisão de uma publicação (contrato da API). */
export enum ImageSectionReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/** Item de "Minhas publicações" (`GET /image-sections/mine`). */
export interface MyImageSection {
  id: string;
  caption: string;
  reviewStatus: ImageSectionReviewStatus;
  rejectionReason: string | null;
  photoCount: number;
  videoCount: number;
  createdAt: string;
  reviewedAt: string | null;
}

/** Corpo de `PATCH /image-sections/:id/reject`. */
export interface RejectImageSectionInput {
  reason: string;
}

/** `GET /image-sections/pending-count`: publicações aguardando revisão (selo do painel). */
export interface ImageSectionPendingCount {
  pending: number;
}

export interface ImageSectionsPendingBadgeProps {
  children: ReactNode;
}
