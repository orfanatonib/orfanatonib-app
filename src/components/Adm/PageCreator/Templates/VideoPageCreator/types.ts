export interface VideoFieldErrors {
  newVideoTitle: boolean;
  newVideoDescription: boolean;
  newVideoSrc: boolean;
  newVideoURL: boolean;
}

export interface VideoPageDraft {
  title: string;
  description: string;
  hasId: boolean;
  fromTemplatePage: boolean;
  videoCount: number;
  uploadsComplete: boolean;
}

export enum SnackbarKind {
  SUCCESS = 'success',
  ERROR = 'error',
}
