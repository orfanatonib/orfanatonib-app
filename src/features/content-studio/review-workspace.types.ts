import type { ContentPackageStatus, ContentStageResponse, ContentTrackResponse } from "./types";

/** Quantas etapas liberadas já foram decididas, quantas esperam o revisor e quantas voltaram à produção. */
export interface ReviewSummary {
  approved: number;
  awaiting: number;
  returned: number;
  total: number;
  percent: number;
}

/** Por que o revisor não pode decidir agora (ou `null` quando pode). */
export enum ReviewBlockReason {
  DISABLED = "DISABLED",
  PACKAGE_CLOSED = "PACKAGE_CLOSED",
  TRACK_PUBLISHED = "TRACK_PUBLISHED",
  APPROVED = "APPROVED",
  RETURNED = "RETURNED",
  NOT_RELEASED = "NOT_RELEASED",
  NO_VERSION = "NO_VERSION",
  VERSION_CHANGED = "VERSION_CHANGED",
}

export interface ReviewDecisionInput {
  reviewEnabled: boolean;
  packageStatus: ContentPackageStatus;
  stage: ContentStageResponse | undefined;
  versionChanged: boolean;
  /** A categoria da etapa já está em Materiais de Visita: não há mais decisão a tomar. */
  trackPublished?: boolean;
}

export interface ReviewHeaderStatus {
  label: string;
  color: "success" | "info" | "warning" | "default";
}

/** O que o hook de revisão entrega para a tela: o material, a seleção e as ações. */
export interface ReviewTrackSelection {
  tracks: ContentTrackResponse[];
  track: ContentTrackResponse | undefined;
  stage: ContentStageResponse | undefined;
}
