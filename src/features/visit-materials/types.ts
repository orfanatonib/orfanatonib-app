import {
  MediaItem,
  MediaPlatform,
  MediaType,
  MediaUploadType,
} from '@/store/slices/types';

export enum TestamentType {
  OLD_TESTAMENT = 'OLD_TESTAMENT',
  NEW_TESTAMENT = 'NEW_TESTAMENT',
}

/**
 * Categoria do material. `GENERAL` ("Geral") são as mídias da própria página (as únicas das páginas antigas e o padrão do
 * que se cria à mão); as demais são seções por faixa etária e espelham o enum da API.
 */
export enum VisitMaterialCategory {
  GENERAL = 'GENERAL',
  BABY = 'BABY',
  CHILD = 'CHILD',
  TEEN = 'TEEN',
  ADULT = 'ADULT',
}

/** Categorias que existem como seção na API (tudo menos `GENERAL`). */
export type VisitMaterialSectionCategory = Exclude<
  VisitMaterialCategory,
  VisitMaterialCategory.GENERAL
>;

export enum VisitMaterialListTab {
  ALL = 'ALL',
  OLD_TESTAMENT = TestamentType.OLD_TESTAMENT,
  NEW_TESTAMENT = TestamentType.NEW_TESTAMENT,
}

export enum VisitMaterialMediaSection {
  VIDEOS = 'videos',
  DOCUMENTS = 'documents',
  IMAGES = 'images',
  AUDIOS = 'audios',
}

export enum VisitMaterialMutation {
  DELETE = 'delete',
  SET_CURRENT = 'set-current',
}

export interface VisitMaterialRouteResponseDto {
  id: string;
  path: string;
  title: string;
  subtitle: string;
  description: string;
  type: string;
  public: boolean;
}

export interface VisitMaterialMediaResponseDto {
  id: string;
  title: string;
  description: string;
  uploadType: MediaUploadType;
  mediaType: MediaType;
  platformType?: MediaPlatform;
  url: string;
  isLocalFile?: boolean;
  size?: number;
  originalName?: string;
}

export interface VisitMaterialSectionResponseDto {
  id: string;
  category: VisitMaterialSectionCategory;
  title: string | null;
  description: string | null;
  position: number;
  videos: VisitMaterialMediaResponseDto[];
  documents: VisitMaterialMediaResponseDto[];
  images: VisitMaterialMediaResponseDto[];
  audios: VisitMaterialMediaResponseDto[];
}

export interface VisitMaterialPageResponseDto {
  id: string;
  title: string;
  subtitle: string;
  testament: TestamentType;
  currentWeek: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  videos: VisitMaterialMediaResponseDto[];
  documents: VisitMaterialMediaResponseDto[];
  images: VisitMaterialMediaResponseDto[];
  audios: VisitMaterialMediaResponseDto[];
  /** Seções por categoria; vazio nas páginas antigas (as mídias delas são o "Geral"). */
  sections: VisitMaterialSectionResponseDto[];
  route: VisitMaterialRouteResponseDto;
}

export interface ListVisitMaterialsQueryDto {
  testament?: TestamentType;
  category?: VisitMaterialSectionCategory;
  searchString?: string;
}

export interface VisitMaterialIdParamsDto {
  id: string;
}

export interface VisitMaterialMediaRequestDto {
  id?: string;
  title: string;
  description: string;
  uploadType: MediaUploadType;
  mediaType: MediaType;
  isLocalFile: boolean;
  url?: string;
  platformType?: MediaPlatform;
  originalName?: string;
  fieldKey?: string;
  size?: number;
}

export interface VisitMaterialSectionRequestDto {
  category: VisitMaterialSectionCategory;
  title?: string;
  description?: string;
  videos: VisitMaterialMediaRequestDto[];
  documents: VisitMaterialMediaRequestDto[];
  images: VisitMaterialMediaRequestDto[];
  audios: VisitMaterialMediaRequestDto[];
}

export interface CreateVisitMaterialPageRequestDto {
  pageTitle: string;
  pageSubtitle: string;
  testament: TestamentType;
  pageDescription: string;
  videos: VisitMaterialMediaRequestDto[];
  documents: VisitMaterialMediaRequestDto[];
  images: VisitMaterialMediaRequestDto[];
  audios: VisitMaterialMediaRequestDto[];
  sections?: VisitMaterialSectionRequestDto[];
}

export interface UpdateVisitMaterialPageRequestDto
  extends CreateVisitMaterialPageRequestDto {
  id: string;
  currentWeek: boolean;
}

/** Mídias e textos de UMA categoria no editor. */
export interface VisitMaterialCategoryDraft {
  title: string;
  description: string;
  videos: MediaItem[];
  documents: MediaItem[];
  images: MediaItem[];
  audios: MediaItem[];
}

/** Rascunho por categoria; `GENERAL` guarda as mídias da página e as demais, as seções. */
export type VisitMaterialCategoryDrafts = Record<
  VisitMaterialCategory,
  VisitMaterialCategoryDraft
>;

export interface VisitMaterialFormValues {
  id?: string;
  pageTitle: string;
  pageSubtitle: string;
  testament: TestamentType;
  pageDescription: string;
  currentWeek: boolean;
  videos: MediaItem[];
  documents: MediaItem[];
  images: MediaItem[];
  audios: MediaItem[];
  /** Seções por categoria (as faixas etárias); as mídias do Geral continuam nas listas acima. */
  sections?: Partial<Record<VisitMaterialSectionCategory, VisitMaterialCategoryDraft>>;
}

export interface VisitMaterialPageCreatorProps {
  fromTemplatePage?: boolean;
}

export interface VisitMaterialFormErrors {
  title: boolean;
  subtitle: boolean;
  description: boolean;
}

export interface VisitMaterialSnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export interface VisitMaterialMediaSectionView {
  kind: VisitMaterialMediaSection;
  label: string;
  items: VisitMaterialMediaResponseDto[];
  icon: string;
  color: string;
}
