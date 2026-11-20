import { STAGE_CONTENT_TEMPLATES } from "./editor.constants";
import {
  AiGenerationCapability,
  ContentStageStatus,
  type ContentStageResponse,
  type ContentTrackResponse,
} from "./types";

/** Situação de uma categoria (aba) na produção e na revisão. */
export enum TrackReviewState {
  IN_PRODUCTION = "IN_PRODUCTION",
  READY_TO_SUBMIT = "READY_TO_SUBMIT",
  IN_REVIEW = "IN_REVIEW",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  APPROVED = "APPROVED",
}

const SUBMITTABLE_STAGE_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.PRODUCER_APPROVED,
];
const SENT_STAGE_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.IN_REVIEW,
  ContentStageStatus.APPROVED,
];

/** Resume a categoria a partir do estado das suas etapas obrigatórias. */
export function trackReviewState(track: ContentTrackResponse): TrackReviewState {
  const required = track.stages.filter((stage) => stage.required);
  if (required.length === 0) return TrackReviewState.IN_PRODUCTION;
  if (required.every((stage) => stage.status === ContentStageStatus.APPROVED))
    return TrackReviewState.APPROVED;
  if (required.some((stage) => stage.status === ContentStageStatus.CHANGES_REQUESTED))
    return TrackReviewState.CHANGES_REQUESTED;
  if (
    required.every((stage) => SENT_STAGE_STATUSES.includes(stage.status)) &&
    required.some((stage) => stage.status === ContentStageStatus.IN_REVIEW)
  )
    return TrackReviewState.IN_REVIEW;
  if (
    required.every(
      (stage) =>
        SUBMITTABLE_STAGE_STATUSES.includes(stage.status) ||
        SENT_STAGE_STATUSES.includes(stage.status),
    ) &&
    required.some((stage) => SUBMITTABLE_STAGE_STATUSES.includes(stage.status))
  )
    return TrackReviewState.READY_TO_SUBMIT;
  return TrackReviewState.IN_PRODUCTION;
}

/** Categorias que podem ser enviadas agora para revisão. */
export function submittableTracks(
  tracks: readonly ContentTrackResponse[],
): ContentTrackResponse[] {
  return tracks.filter(
    (track) => trackReviewState(track) === TrackReviewState.READY_TO_SUBMIT,
  );
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function capabilityForStage(): AiGenerationCapability {
  return AiGenerationCapability.TEXT_STRUCTURED;
}

export function stageDraftValue(stage: ContentStageResponse): string {
  const content =
    stage.currentVersion?.structuredContent ??
    STAGE_CONTENT_TEMPLATES[stage.stageType];

  return JSON.stringify(content, null, 2);
}

export function parseStageDraft(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
