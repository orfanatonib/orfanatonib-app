import { MediaPlatform, MediaType, MediaUploadType } from 'store/slices/types';

export interface IdeasMediaPayload {
  id?: string;
  title: string;
  description: string;
  mediaType: MediaType;
  uploadType: MediaUploadType;
  platformType?: MediaPlatform;
  isLocalFile: boolean;
  fieldKey?: string;
  url?: string;
}

export interface IdeasSectionPayload {
  id?: string;
  title: string;
  description: string;
  medias: IdeasMediaPayload[];
}

export interface IdeasPagePayload {
  id?: string;
  title: string;
  description: string;
  sections: IdeasSectionPayload[];
}

export interface IdeasValidationInput {
  title: string;
  description: string;
  sectionCount: number;
}
