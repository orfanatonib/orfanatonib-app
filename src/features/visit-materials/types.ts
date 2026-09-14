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
  route: VisitMaterialRouteResponseDto;
}

export interface ListVisitMaterialsQueryDto {
  testament?: TestamentType;
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

export interface CreateVisitMaterialPageRequestDto {
  pageTitle: string;
  pageSubtitle: string;
  testament: TestamentType;
  pageDescription: string;
  videos: VisitMaterialMediaRequestDto[];
  documents: VisitMaterialMediaRequestDto[];
  images: VisitMaterialMediaRequestDto[];
  audios: VisitMaterialMediaRequestDto[];
}

export interface UpdateVisitMaterialPageRequestDto
  extends CreateVisitMaterialPageRequestDto {
  id: string;
  currentWeek: boolean;
}

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
