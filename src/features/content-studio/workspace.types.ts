import type { ContentStageResponse, ContentTrackResponse } from "./types";
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
}
export interface ContentFieldProps {
  fieldKey: string;
  value: unknown;
  disabled: boolean;
  onChange: (value: unknown) => void;
}
export enum StudioEditorMode {
  EDIT = "edit",
  PREVIEW = "preview",
}
export interface StudioDraft {
  value: string;
  baseVersionId: string | null;
}
export type StudioDrafts = Record<string, StudioDraft>;
