/** Tipos de evento da linha do tempo de revisão de um item. */
export enum ReviewTimelineKind {
  SUBMITTED = "SUBMITTED",
  RESUBMITTED = "RESUBMITTED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  APPROVED = "APPROVED",
}

export interface ReviewTimelineEntry {
  id: string;
  kind: ReviewTimelineKind;
  versionNumber: number | null;
  /** ISO da data do evento. */
  at: string;
}
