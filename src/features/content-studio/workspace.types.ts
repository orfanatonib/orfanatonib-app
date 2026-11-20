import type { ReactNode } from "react";
import type {
  ContentStageResponse,
  ContentTrackResponse,
  TiptapDocument,
} from "./types";
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
  /** Categoria do material, mostrada na etiqueta do cabeçalho do documento. */
  audienceName?: string;
  /** Muda quando as imagens da etapa mudam (fixação e brincadeira): o PDF é refeito junto. */
  pdfVersionSuffix?: string;
  /** Conteúdo logo abaixo do documento, só no modo Documento (some na aba PDF, que já traz a imagem na última página). */
  documentFooter?: ReactNode;
  /** Item bloqueado (em revisão, categoria publicada…): só a "Prévia", sem a aba de edição. */
  previewOnly?: boolean;
  onSaveDocument?: (
    stage: ContentStageResponse,
    document: TiptapDocument,
  ) => Promise<boolean>;
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
