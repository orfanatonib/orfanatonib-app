import { describe, expect, it } from "vitest";

import { ContentAudience, ContentPackageStatus, ContentStageStatus, ContentStageType, type ContentTrackResponse } from "./types";
import {
  TrackReviewState,
  canSendAllToReview,
  canSubmitForReview,
  nextProductionStage,
  submittableTracks,
  trackReviewState,
} from "./workspace.utils";

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

describe("próximo item ao concluir na produção", () => {
  const four = track(ContentAudience.CHILD, all(ContentStageStatus.DRAFT));

  it("vai para o item seguinte da categoria, na ordem de produção", () => {
    expect(nextProductionStage(four, "CHILD-LESSON")?.stageType).toBe(ContentStageType.LESSON_VISUALS);
    expect(nextProductionStage(four, "CHILD-VERSE_FIXATION")?.stageType).toBe(ContentStageType.STANDARD_GAME);
  });

  it("no último item não há próximo (a categoria só vai para a revisão quando o usuário mandar)", () => {
    expect(nextProductionStage(four, "CHILD-STANDARD_GAME")).toBeNull();
  });

  it("sem categoria ou com item desconhecido, não há próximo", () => {
    expect(nextProductionStage(undefined, "x")).toBeNull();
    expect(nextProductionStage(four, "desconhecido")).toBeNull();
    expect(nextProductionStage(four, undefined)).toBeNull();
  });

  it("concluir todos os itens deixa a categoria 'pronta para ENVIAR', nunca 'em revisão'", () => {
    expect(trackReviewState(track(ContentAudience.CHILD, all(ContentStageStatus.PRODUCER_APPROVED)))).toBe(
      TrackReviewState.READY_TO_SUBMIT,
    );
    expect(trackReviewState(track(ContentAudience.CHILD, all(ContentStageStatus.IN_REVIEW)))).toBe(TrackReviewState.IN_REVIEW);
  });
});

describe("envio para a revisão: por categoria, e o geral só quando tudo está pronto", () => {
  const S = ContentStageStatus;
  const ready = (audience: ContentAudience) => track(audience, all(S.PRODUCER_APPROVED));
  const sent = (audience: ContentAudience) => track(audience, all(S.IN_REVIEW));
  const inProduction = (audience: ContentAudience) => track(audience, all(S.DRAFT));

  it("o 'Enviar tudo' geral só aparece quando nenhuma categoria está mais em produção e há uma para enviar", () => {
    const children = ready(ContentAudience.CHILD);
    expect(canSendAllToReview([children])).toBe(true);
    // BABY já enviado e as crianças prontas, TEEN e ADULT ainda em produção: só o botão da categoria vale
    expect(
      canSendAllToReview([sent(ContentAudience.BABY), children, inProduction(ContentAudience.TEEN), inProduction(ContentAudience.ADULT)]),
    ).toBe(false);
    expect(canSendAllToReview([sent(ContentAudience.BABY), children, ready(ContentAudience.TEEN), ready(ContentAudience.ADULT)])).toBe(
      true,
    );
  });

  it("sem categoria pronta para enviar (tudo já enviado ou nada pronto) não há 'Enviar tudo'", () => {
    expect(canSendAllToReview([sent(ContentAudience.BABY), sent(ContentAudience.CHILD)])).toBe(false);
    expect(canSendAllToReview([inProduction(ContentAudience.BABY)])).toBe(false);
    expect(canSendAllToReview([])).toBe(false);
  });

  it("pode enviar uma categoria em QUALQUER estado do pacote que não seja encerramento (o status do pacote não esconde o botão)", () => {
    const tracks = [ready(ContentAudience.CHILD)];
    for (const status of Object.values(ContentPackageStatus)) {
      const closed = [ContentPackageStatus.PUBLISHING, ContentPackageStatus.PUBLISHED, ContentPackageStatus.ARCHIVED].includes(status);
      expect(canSubmitForReview(status, tracks, true), status).toBe(!closed);
    }
    expect(canSubmitForReview(ContentPackageStatus.IN_REVIEW, tracks, false)).toBe(false);
    expect(canSubmitForReview(ContentPackageStatus.IN_REVIEW, [inProduction(ContentAudience.CHILD)], true)).toBe(false);
  });
});
