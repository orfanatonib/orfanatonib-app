import type { ContentStageResponse, ContentTrackResponse, TiptapDocument } from "./types";
export interface FeedbackState {
  readonly severity: "success" | "error";
  readonly message: string;
}
export interface StageNavigationProps {
  track: ContentTrackResponse;
  selectedId: string;
  dirtyIds: string[];
  onSelect: (id: string) => void;
}
export interface ContentEditorProps {
  stage: ContentStageResponse;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  /** Habilitam o editor de documento e a aba de PDF. */
  packageId?: string;
  fileBaseName?: string;
  onSaveDocument?: (stage: ContentStageResponse, document: TiptapDocument) => Promise<boolean>;
  onResetDocument?: (stage: ContentStageResponse) => Promise<boolean>;
  onDocumentDirtyChange?: (dirty: boolean) => void;
  /** Há edição de campos ainda não salva. */
  fieldsDirty?: boolean;
}
export interface ContentFieldProps {
  fieldKey: string;
  value: unknown;
  disabled: boolean;
  onChange: (value: unknown) => void;
}
export enum StudioEditorMode {
  DOCUMENT = "document",
  EDIT = "edit",
  PREVIEW = "preview",
  PDF = "pdf",
}
export interface StudioDraft {
  value: string;
  baseVersionId: string | null;
}
export type StudioDrafts = Record<string, StudioDraft>;
