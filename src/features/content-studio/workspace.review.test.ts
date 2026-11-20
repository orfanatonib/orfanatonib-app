import { describe, expect, it } from "vitest";

import { ContentAudience, ContentStageStatus, ContentStageType, type ContentTrackResponse } from "./types";
import { TrackReviewState, submittableTracks, trackReviewState } from "./workspace.utils";

const STAGES = [
  ContentStageType.LESSON,
  ContentStageType.LESSON_VISUALS,
  ContentStageType.VERSE_VISUALS,
  ContentStageType.VERSE_FIXATION,
  ContentStageType.STANDARD_GAME,
];

const track = (audience: ContentAudience, statuses: ContentStageStatus[]): ContentTrackResponse =>
  ({
    id: audience,
    audience,
    audienceName: audience,
    stages: STAGES.map((stageType, index) => ({
      id: `${audience}-${stageType}`,
      stageType,
      position: index + 1,
      required: true,
      status: statuses[index] ?? statuses[0],
    })),
  }) as unknown as ContentTrackResponse;

const all = (status: ContentStageStatus) => STAGES.map(() => status);

describe("situação de revisão por categoria", () => {
  it("em produção enquanto faltar alguma etapa concluída", () => {
    const partial = all(ContentStageStatus.PRODUCER_APPROVED);
    partial[3] = ContentStageStatus.DRAFT;
    expect(trackReviewState(track(ContentAudience.CHILD, partial))).toBe(TrackReviewState.IN_PRODUCTION);
    expect(trackReviewState(track(ContentAudience.CHILD, all(ContentStageStatus.NOT_STARTED)))).toBe(TrackReviewState.IN_PRODUCTION);
  });

  it("pronta para revisão quando as cinco etapas estão concluídas", () => {
    expect(trackReviewState(track(ContentAudience.TEEN, all(ContentStageStatus.PRODUCER_APPROVED)))).toBe(TrackReviewState.READY_TO_SUBMIT);
  });

  it("em revisão, com ajustes pedidos e aprovada", () => {
    expect(trackReviewState(track(ContentAudience.TEEN, all(ContentStageStatus.IN_REVIEW)))).toBe(TrackReviewState.IN_REVIEW);
    const changes = all(ContentStageStatus.IN_REVIEW);
    changes[1] = ContentStageStatus.CHANGES_REQUESTED;
    expect(trackReviewState(track(ContentAudience.TEEN, changes))).toBe(TrackReviewState.CHANGES_REQUESTED);
    expect(trackReviewState(track(ContentAudience.TEEN, all(ContentStageStatus.APPROVED)))).toBe(TrackReviewState.APPROVED);
  });

  it("só as categorias prontas podem ser enviadas", () => {
    const tracks = [
      track(ContentAudience.BABY, all(ContentStageStatus.DRAFT)),
      track(ContentAudience.CHILD, all(ContentStageStatus.PRODUCER_APPROVED)),
      track(ContentAudience.TEEN, all(ContentStageStatus.IN_REVIEW)),
      track(ContentAudience.ADULT, all(ContentStageStatus.PRODUCER_APPROVED)),
    ];
    expect(submittableTracks(tracks).map((item) => item.audience)).toEqual([ContentAudience.CHILD, ContentAudience.ADULT]);
  });
});
