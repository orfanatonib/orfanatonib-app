import { describe, expect, it } from "vitest";

import { ReviewQueueView } from "./review-list.constants";
import {
  readReviewListState,
  reviewCardAction,
  reviewPackageSummary,
  reviewProgressText,
  reviewQueueCounts,
  reviewViewFromStatus,
  reviewViewStatuses,
  writeReviewListState,
} from "./review-list.utils";
import { ContentAudience, ContentPackageStatus, ContentStageStatus, ContentStageType } from "./types";

const seg = (status: ContentStageStatus) => ({ audience: ContentAudience.CHILD, stageType: ContentStageType.LESSON, status });

describe("fila de revisão", () => {
  it("recortes têm as situações certas", () => {
    expect(reviewViewStatuses(ReviewQueueView.TO_REVIEW)).toEqual([ContentPackageStatus.PACKAGE_READY, ContentPackageStatus.IN_REVIEW]);
    expect(reviewViewStatuses(ReviewQueueView.PUBLISHED)).toEqual([ContentPackageStatus.PUBLISHED]);
    expect(reviewViewStatuses(ReviewQueueView.ALL)).toHaveLength(6);
  });
  it("situação da URL cai no recorte que a contém; fora da fila vira Todos; vazio é o padrão", () => {
    expect(reviewViewFromStatus("IN_REVIEW")).toBe(ReviewQueueView.TO_REVIEW);
    expect(reviewViewFromStatus("READY_FOR_PUBLICATION")).toBe(ReviewQueueView.READY);
    expect(reviewViewFromStatus("CHANGES_REQUESTED")).toBe(ReviewQueueView.RETURNED);
    expect(reviewViewFromStatus("ARCHIVED")).toBe(ReviewQueueView.ALL);
    expect(reviewViewFromStatus(null)).toBe(ReviewQueueView.TO_REVIEW);
  });
  it("lê e grava o estado na URL (só o que difere do padrão)", () => {
    const state = readReviewListState(new URLSearchParams("recorte=PUBLISHED&faixa=TEEN&busca=Davi&pagina=2"));
    expect(state).toEqual({ view: ReviewQueueView.PUBLISHED, audience: ContentAudience.TEEN, search: "Davi", page: 2 });
    expect(readReviewListState(new URLSearchParams("recorte=lixo&faixa=X&pagina=-1"))).toEqual({ view: ReviewQueueView.TO_REVIEW, audience: "", search: "", page: 1 });
    expect(writeReviewListState(new URLSearchParams("situacao=IN_REVIEW"), { view: ReviewQueueView.TO_REVIEW, audience: "", search: "", page: 1 }).toString()).toBe("");
    expect(writeReviewListState(new URLSearchParams(), state).get("recorte")).toBe("PUBLISHED");
  });
  it("contagens por recorte somam as situações", () => {
    const counts = reviewQueueCounts({
      [ContentPackageStatus.IN_REVIEW]: 2,
      [ContentPackageStatus.PACKAGE_READY]: 1,
      [ContentPackageStatus.PUBLISHED]: 5,
      [ContentPackageStatus.IN_PROGRESS]: 9,
    });
    expect(counts).toMatchObject({ TO_REVIEW: 3, PUBLISHED: 5, READY: 0, RETURNED: 0, ALL: 8 });
    expect(reviewQueueCounts(undefined).ALL).toBe(0);
  });
  it("resumo e texto de andamento", () => {
    const summary = reviewPackageSummary({
      requiredStagesCount: 5,
      approvedStagesCount: 2,
      stageSegments: [seg(ContentStageStatus.APPROVED), seg(ContentStageStatus.IN_REVIEW), seg(ContentStageStatus.IN_REVIEW), seg(ContentStageStatus.CHANGES_REQUESTED)],
    });
    expect(summary).toMatchObject({ approved: 2, awaiting: 2, returned: 1, total: 5, percent: 40 });
    expect(reviewProgressText(summary)).toBe("2 de 5 etapas aprovadas · 2 aguardam sua decisão · 1 devolvida");
    expect(reviewProgressText({ approved: 5, awaiting: 0, returned: 0, total: 5, percent: 100 })).toBe("5 de 5 etapas aprovadas");
    expect(reviewPackageSummary({ requiredStagesCount: 0, approvedStagesCount: 3, stageSegments: [] }).percent).toBe(0);
  });
  it("botão do cartão conforme a situação", () => {
    expect(reviewCardAction(ContentPackageStatus.PACKAGE_READY).label).toBe("Iniciar revisão");
    expect(reviewCardAction(ContentPackageStatus.IN_REVIEW).label).toBe("Continuar revisão");
    expect(reviewCardAction(ContentPackageStatus.CHANGES_REQUESTED).color).toBe("warning");
    expect(reviewCardAction(ContentPackageStatus.PUBLISHED).variant).toBe("outlined");
  });
});
