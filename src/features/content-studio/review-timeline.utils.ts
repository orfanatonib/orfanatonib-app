import { ReviewTimelineKind, type ReviewTimelineEntry } from "./review-timeline.types";
import { ContentReviewDecisionType, type ContentReviewDecisionResponse } from "./types";

/**
 * Linha do tempo do item em ordem cronológica. O primeiro envio é "Enviado"; os seguintes (depois de um ajuste) são
 * "Reenviado". Eventos no mesmo instante mantêm a ordem em que chegaram do servidor.
 */
export function buildReviewTimeline(decisions: readonly ContentReviewDecisionResponse[]): ReviewTimelineEntry[] {
  const ordered = decisions
    .map((decision, index) => ({ decision, index }))
    .sort((a, b) => new Date(a.decision.decidedAt).getTime() - new Date(b.decision.decidedAt).getTime() || a.index - b.index);
  let submissions = 0;
  return ordered.map(({ decision }) => {
    let kind: ReviewTimelineKind;
    if (decision.decision === ContentReviewDecisionType.SUBMITTED) {
      kind = submissions === 0 ? ReviewTimelineKind.SUBMITTED : ReviewTimelineKind.RESUBMITTED;
      submissions += 1;
    } else if (decision.decision === ContentReviewDecisionType.APPROVED) kind = ReviewTimelineKind.APPROVED;
    else kind = ReviewTimelineKind.CHANGES_REQUESTED;
    return { id: decision.id, kind, versionNumber: decision.versionNumber, at: decision.decidedAt };
  });
}

/** Da mais recente para a mais antiga (o que a tela lista); `buildReviewTimeline` segue cronológica para rotular os envios. */
export function buildReviewTimelineNewestFirst(decisions: readonly ContentReviewDecisionResponse[]): ReviewTimelineEntry[] {
  return buildReviewTimeline(decisions).reverse();
}

/** Observações da mais recente para a mais antiga. */
export function commentsNewestFirst<T extends { createdAt: string }>(comments: readonly T[]): T[] {
  return [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
