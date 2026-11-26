import { describe, expect, it } from "vitest";

import { ReviewQueueView } from "./review-list.constants";
import {
  readReviewListState,
  reviewQueueCounts,
  reviewViewFromStatus,
  reviewViewStatuses,
  writeReviewListState,
} from "./review-list.utils";
import { ContentAudience, ContentPackageStatus, ContentStageStatus, ContentStageType } from "./types";

const seg = (status: ContentStageStatus) => ({ audience: ContentAudience.CHILD, stageType: ContentStageType.LESSON, status });

describe("fila de revisão", () => {
  it("recortes têm as situações certas", () => {
    expect(reviewViewStatuses(ReviewQueueView.TO_REVIEW)).toEqual([ContentPackageStatus.IN_REVIEW]);
    expect(reviewViewStatuses(ReviewQueueView.PUBLISHED)).toEqual([ContentPackageStatus.PUBLISHED]);
    expect(reviewViewStatuses(ReviewQueueView.ALL)).toHaveLength(5);
    // Material só "pronto" na produção ainda não foi enviado: não é da revisão.
    expect(reviewViewStatuses(ReviewQueueView.ALL)).not.toContain(ContentPackageStatus.PACKAGE_READY);
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
    expect(readReviewListState(new URLSearchParams("recorte=lixo&faixa=X&pagina=-1"))).toEqual({
      view: ReviewQueueView.TO_REVIEW,
      audience: "",
      search: "",
      page: 1,
    });
    expect(
      writeReviewListState(new URLSearchParams("situacao=IN_REVIEW"), {
        view: ReviewQueueView.TO_REVIEW,
        audience: "",
        search: "",
        page: 1,
      }).toString(),
    ).toBe("");
    expect(writeReviewListState(new URLSearchParams(), state).get("recorte")).toBe("PUBLISHED");
  });
  it("contagens por recorte somam as situações", () => {
    const counts = reviewQueueCounts({
      [ContentPackageStatus.IN_REVIEW]: 2,
      [ContentPackageStatus.PACKAGE_READY]: 1,
      [ContentPackageStatus.PUBLISHED]: 5,
      [ContentPackageStatus.IN_PROGRESS]: 9,
    });
    expect(counts).toMatchObject({ TO_REVIEW: 2, PUBLISHED: 5, READY: 0, RETURNED: 0, ALL: 7 });
    expect(reviewQueueCounts(undefined).ALL).toBe(0);
  });
});
