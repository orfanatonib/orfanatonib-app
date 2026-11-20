import { ReviewTimelineKind } from "./review-timeline.types";

export const REVIEW_TIMELINE_TITLE = "Histórico de revisão";

export const REVIEW_TIMELINE_LABELS: Record<ReviewTimelineKind, string> = {
  [ReviewTimelineKind.SUBMITTED]: "Enviado para revisão",
  [ReviewTimelineKind.RESUBMITTED]: "Reenviado para revisão",
  [ReviewTimelineKind.CHANGES_REQUESTED]: "Ajuste solicitado",
  [ReviewTimelineKind.APPROVED]: "Aprovado",
};

export const REVIEW_TIMELINE_COLORS: Record<ReviewTimelineKind, "info" | "warning" | "success"> = {
  [ReviewTimelineKind.SUBMITTED]: "info",
  [ReviewTimelineKind.RESUBMITTED]: "info",
  [ReviewTimelineKind.CHANGES_REQUESTED]: "warning",
  [ReviewTimelineKind.APPROVED]: "success",
};
