import { describe, expect, it } from "vitest";

import { ReviewTimelineKind } from "./review-timeline.types";
import { buildReviewTimeline, buildReviewTimelineNewestFirst, commentsNewestFirst } from "./review-timeline.utils";
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

  it("lista do mais recente para o mais antigo, mantendo os rótulos de envio/reenvio", () => {
    const timeline = buildReviewTimelineNewestFirst([
      decision("a", ContentReviewDecisionType.SUBMITTED, "2026-11-20T10:00:00Z", 1),
      decision("b", ContentReviewDecisionType.CHANGES_REQUESTED, "2026-11-20T11:00:00Z", 1),
      decision("c", ContentReviewDecisionType.SUBMITTED, "2026-11-20T12:00:00Z", 1),
    ]);
    expect(timeline.map((item) => item.id)).toEqual(["c", "b", "a"]);
    expect(timeline[0].kind).toBe(ReviewTimelineKind.RESUBMITTED);
  });

  it("ordena as observações da mais recente para a mais antiga sem alterar a lista original", () => {
    const comments = [{ createdAt: "2026-11-20T10:00:00Z" }, { createdAt: "2026-11-22T10:00:00Z" }, { createdAt: "2026-11-21T10:00:00Z" }];
    expect(commentsNewestFirst(comments).map((item) => item.createdAt.slice(8, 10))).toEqual(["22", "21", "20"]);
    expect(comments[0].createdAt.slice(8, 10)).toBe("20");
  });
});
