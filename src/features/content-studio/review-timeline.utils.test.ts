import { describe, expect, it } from "vitest";

import { ReviewTimelineKind } from "./review-timeline.types";
import { buildReviewTimeline } from "./review-timeline.utils";
import { ContentReviewDecisionType, type ContentReviewDecisionResponse } from "./types";

const decision = (id: string, type: ContentReviewDecisionType, at: string, version: number): ContentReviewDecisionResponse => ({
  id,
  versionId: `v${version}`,
  versionNumber: version,
  contentChecksum: "x",
  decision: type,
  reviewerId: "u",
  relatedCommentId: null,
  decidedAt: at,
});

describe("linha do tempo de revisão", () => {
  it("conta o ciclo: enviado, ajuste solicitado, reenviado, aprovado", () => {
    const timeline = buildReviewTimeline([
      decision("d4", ContentReviewDecisionType.APPROVED, "2026-11-20T16:00:00Z", 2),
      decision("d1", ContentReviewDecisionType.SUBMITTED, "2026-11-20T10:00:00Z", 1),
      decision("d3", ContentReviewDecisionType.SUBMITTED, "2026-11-20T15:00:00Z", 2),
      decision("d2", ContentReviewDecisionType.CHANGES_REQUESTED, "2026-11-20T11:00:00Z", 1),
    ]);
    expect(timeline.map((item) => item.kind)).toEqual([
      ReviewTimelineKind.SUBMITTED,
      ReviewTimelineKind.CHANGES_REQUESTED,
      ReviewTimelineKind.RESUBMITTED,
      ReviewTimelineKind.APPROVED,
    ]);
    expect(timeline.map((item) => item.versionNumber)).toEqual([1, 1, 2, 2]);
  });
  it("sem eventos, sem linha do tempo; itens antigos (só decisões) continuam aparecendo", () => {
    expect(buildReviewTimeline([])).toEqual([]);
    expect(buildReviewTimeline([decision("a", ContentReviewDecisionType.APPROVED, "2026-01-01T00:00:00Z", 1)]).map((i) => i.kind)).toEqual([
      ReviewTimelineKind.APPROVED,
    ]);
  });
  it("mesmo instante mantém a ordem recebida", () => {
    const same = "2026-11-20T10:00:00Z";
    const timeline = buildReviewTimeline([
      decision("a", ContentReviewDecisionType.SUBMITTED, same, 1),
      decision("b", ContentReviewDecisionType.CHANGES_REQUESTED, same, 1),
    ]);
    expect(timeline.map((item) => item.id)).toEqual(["a", "b"]);
  });
});
