import { describe, expect, it } from "vitest";

import { ReviewBlockReason } from "./review-workspace.types";
import {
  approvableStages,
  captureStageVersions,
  isTrackPublished,
  publishableTracks,
  hasStageVersionChanged,
  isReviewDecisionOpen,
  nextPendingStage,
  openCommentsCount,
  pendingStages,
  releasedListSummary,
  releasedSegmentAudiences,
  releasedSegments,
  releasedStages,
  releasedTracks,
  reviewBlockReason,
  reviewHeaderStatus,
  reviewProgressText,
  reviewSummary,
  unreleasedTracks,
} from "./review-workspace.utils";
import {
  ContentAudience,
  ContentPackageStatus,
  ContentReviewCommentStatus,
  ContentStageStatus,
  ContentStageType,
  type ContentStageResponse,
  type ContentTrackResponse,
} from "./types";

const STAGE_ORDER = [
  ContentStageType.LESSON,
  ContentStageType.LESSON_VISUALS,
  ContentStageType.VERSE_VISUALS,
  ContentStageType.VERSE_FIXATION,
  ContentStageType.STANDARD_GAME,
];

const stage = (
  audience: ContentAudience,
  index: number,
  status: ContentStageStatus,
  versionId: string | null = "v1",
): ContentStageResponse => ({
  id: `${audience}-${index}`,
  stageType: STAGE_ORDER[index],
  position: index + 1,
  required: true,
  dependencies: [],
  status,
  currentVersionId: versionId,
  lockVersion: 1,
  currentVersion: versionId
    ? {
        id: versionId,
        stageId: `${audience}-${index}`,
        versionNumber: 1,
        structuredContent: {},
        contentDocument: null,
        contentChecksum: "sum",
        templateVersion: "1",
        generationSnapshot: null,
        createdById: "u",
        createdAt: "",
        updatedAt: "",
      }
    : null,
  reviewComments: [],
  reviewDecisions: [],
  createdAt: "",
  updatedAt: "",
});

const track = (audience: ContentAudience, statuses: ContentStageStatus[]): ContentTrackResponse => ({
  id: audience,
  audience,
  audienceName: audience,
  minimumAge: 0,
  maximumAge: null,
  publishedAt: null,
  stages: statuses.map((status, index) => stage(audience, index, status)),
  createdAt: "",
  updatedAt: "",
});

const S = ContentStageStatus;
const baby = track(ContentAudience.BABY, [S.IN_REVIEW, S.IN_REVIEW, S.APPROVED, S.IN_REVIEW, S.IN_REVIEW]);
const child = track(ContentAudience.CHILD, [S.DRAFT, S.NOT_STARTED, S.NOT_STARTED, S.NOT_STARTED, S.NOT_STARTED]);
const teen = track(ContentAudience.TEEN, [
  S.PRODUCER_APPROVED,
  S.PRODUCER_APPROVED,
  S.PRODUCER_APPROVED,
  S.PRODUCER_APPROVED,
  S.PRODUCER_APPROVED,
]);

describe("o que foi liberado para revisão", () => {
  it("só as categorias com etapa nas mãos do revisor aparecem; produção e 'pronta para enviar' ficam de fora", () => {
    expect(releasedTracks([baby, child, teen]).map((item) => item.audience)).toEqual([ContentAudience.BABY]);
    expect(unreleasedTracks([baby, child, teen]).map((item) => item.audience)).toEqual([ContentAudience.CHILD, ContentAudience.TEEN]);
  });

  it("aprovada, em revisão e devolvida contam como liberadas", () => {
    const only = (status: ContentStageStatus) =>
      track(ContentAudience.ADULT, [status, S.NOT_STARTED, S.NOT_STARTED, S.NOT_STARTED, S.NOT_STARTED]);
    for (const status of [S.IN_REVIEW, S.APPROVED, S.CHANGES_REQUESTED]) expect(releasedTracks([only(status)])).toHaveLength(1);
    for (const status of [S.DRAFT, S.GENERATING, S.PRODUCER_APPROVED, S.NOT_STARTED, S.FAILED, S.STALE])
      expect(releasedTracks([only(status)])).toHaveLength(0);
  });

  it("etapas liberadas ficam na ordem de produção", () => {
    const mixed = track(ContentAudience.BABY, [S.APPROVED, S.DRAFT, S.IN_REVIEW, S.CHANGES_REQUESTED, S.NOT_STARTED]);
    expect(releasedStages(mixed).map((item) => item.position)).toEqual([1, 3, 4]);
    expect(releasedStages(undefined)).toEqual([]);
  });
});

describe("andamento da revisão", () => {
  it("conta só as etapas das categorias liberadas (as demais categorias não pesam)", () => {
    const summary = reviewSummary([baby, child, teen]);
    expect(summary).toEqual({ approved: 1, awaiting: 4, returned: 0, total: 5, percent: 20 });
  });

  it("sem nada liberado, o total é zero e o percentual também", () => {
    expect(reviewSummary([child, teen])).toEqual({ approved: 0, awaiting: 0, returned: 0, total: 0, percent: 0 });
  });

  it("etapas não obrigatórias não entram na conta", () => {
    const optional = track(ContentAudience.BABY, [S.APPROVED, S.NOT_REQUIRED, S.IN_REVIEW, S.IN_REVIEW, S.IN_REVIEW]);
    expect(reviewSummary([optional]).total).toBe(4);
  });

  it("texto diz o que falta, no singular e no plural", () => {
    expect(reviewProgressText({ approved: 1, awaiting: 1, returned: 0, total: 5, percent: 20 })).toBe(
      "1 de 5 itens aprovados · 1 aguarda sua decisão",
    );
    expect(reviewProgressText({ approved: 0, awaiting: 3, returned: 2, total: 5, percent: 0 })).toBe(
      "0 de 5 itens aprovados · 3 aguardam sua decisão · 2 devolvidas",
    );
    expect(reviewProgressText({ approved: 2, awaiting: 0, returned: 1, total: 5, percent: 40 })).toContain("1 devolvida");
  });

  it("cabeçalho: publicado, pronto, tudo aprovado e em andamento", () => {
    const partial = reviewSummary([baby]);
    expect(reviewHeaderStatus(ContentPackageStatus.IN_REVIEW, partial)).toEqual({ label: "1 de 5 itens aprovados", color: "warning" });
    expect(reviewHeaderStatus(ContentPackageStatus.PUBLISHED, partial).color).toBe("success");
    expect(reviewHeaderStatus(ContentPackageStatus.READY_FOR_PUBLICATION, partial).label).toBe("Pronto para publicar");
    expect(reviewHeaderStatus(ContentPackageStatus.PUBLISHING, partial).color).toBe("info");
    expect(reviewHeaderStatus(ContentPackageStatus.ARCHIVED, partial).color).toBe("default");
    const all = reviewSummary([track(ContentAudience.BABY, [S.APPROVED, S.APPROVED, S.APPROVED, S.APPROVED, S.APPROVED])]);
    expect(reviewHeaderStatus(ContentPackageStatus.IN_REVIEW, all).label).toBe("Liberado aprovado");
  });
});

describe("próxima etapa pendente", () => {
  it("lista só o que espera decisão", () => {
    expect(pendingStages(baby).map((item) => item.position)).toEqual([1, 2, 4, 5]);
  });

  it("vai para a seguinte e dá a volta no fim; não devolve a atual", () => {
    expect(nextPendingStage(baby, "BABY-0")?.position).toBe(2);
    expect(nextPendingStage(baby, "BABY-1")?.position).toBe(4); // a 3 já foi aprovada
    expect(nextPendingStage(baby, "BABY-4")?.position).toBe(1);
  });

  it("sem outra pendente (ou sem categoria) não há próxima", () => {
    const one = track(ContentAudience.BABY, [S.IN_REVIEW, S.APPROVED, S.APPROVED, S.APPROVED, S.APPROVED]);
    expect(nextPendingStage(one, "BABY-0")).toBeNull();
    expect(nextPendingStage(undefined, undefined)).toBeNull();
  });
});

describe("quando o revisor pode decidir", () => {
  const base = { reviewEnabled: true, packageStatus: ContentPackageStatus.IN_REVIEW, versionChanged: false };
  const inReview = baby.stages[0];

  it("etapa em revisão, material em revisão e versão conhecida: pode", () => {
    expect(reviewBlockReason({ ...base, stage: inReview })).toBeNull();
  });

  it("cada impedimento tem o seu motivo", () => {
    expect(reviewBlockReason({ ...base, reviewEnabled: false, stage: inReview })).toBe(ReviewBlockReason.DISABLED);
    expect(reviewBlockReason({ ...base, packageStatus: ContentPackageStatus.PUBLISHED, stage: inReview })).toBe(
      ReviewBlockReason.PACKAGE_CLOSED,
    );
    // Uma categoria pronta para publicar não fecha a revisão das que ainda estão em revisão (igual ao servidor).
    expect(reviewBlockReason({ ...base, packageStatus: ContentPackageStatus.READY_FOR_PUBLICATION, stage: inReview })).toBeNull();
    expect(reviewBlockReason({ ...base, packageStatus: ContentPackageStatus.IN_PROGRESS, stage: inReview })).toBeNull();
    expect(reviewBlockReason({ ...base, stage: undefined })).toBe(ReviewBlockReason.NOT_RELEASED);
    expect(reviewBlockReason({ ...base, stage: baby.stages[2] })).toBe(ReviewBlockReason.APPROVED);
    expect(reviewBlockReason({ ...base, stage: stage(ContentAudience.BABY, 0, S.CHANGES_REQUESTED) })).toBe(ReviewBlockReason.RETURNED);
    expect(reviewBlockReason({ ...base, stage: stage(ContentAudience.BABY, 0, S.PRODUCER_APPROVED) })).toBe(ReviewBlockReason.NOT_RELEASED);
    expect(reviewBlockReason({ ...base, stage: stage(ContentAudience.BABY, 0, S.IN_REVIEW, null) })).toBe(ReviewBlockReason.NO_VERSION);
    expect(reviewBlockReason({ ...base, versionChanged: true, stage: inReview })).toBe(ReviewBlockReason.VERSION_CHANGED);
    // categoria já publicada: nada a decidir, mesmo com a etapa aprovada
    expect(reviewBlockReason({ ...base, trackPublished: true, stage: baby.stages[2] })).toBe(ReviewBlockReason.TRACK_PUBLISHED);
  });

  it("material devolvido à produção ainda deixa decidir as etapas que seguem em revisão", () => {
    expect(isReviewDecisionOpen(ContentPackageStatus.CHANGES_REQUESTED)).toBe(true);
    // Uma categoria devolvida à produção rebaixa o material a IN_PROGRESS: as outras seguem decidíveis.
    expect(isReviewDecisionOpen(ContentPackageStatus.IN_PROGRESS)).toBe(true);
    expect(isReviewDecisionOpen(ContentPackageStatus.PUBLISHED)).toBe(false);
    expect(reviewBlockReason({ ...base, packageStatus: ContentPackageStatus.CHANGES_REQUESTED, stage: inReview })).toBeNull();
  });
});

describe("versão que o revisor já viu", () => {
  it("guarda a versão da primeira vez e só acrescenta etapas novas", () => {
    const first = captureStageVersions({}, [baby]);
    expect(first["BABY-0"]).toBe("v1");
    const changed = { ...baby, stages: baby.stages.map((item, index) => (index === 0 ? { ...item, currentVersionId: "v2" } : item)) };
    const again = captureStageVersions(first, [changed, child]);
    expect(again["BABY-0"]).toBe("v1"); // não sobrescreve o que o revisor já viu
    expect(again["CHILD-0"]).toBe("v1");
    expect(captureStageVersions(again, [changed, child])).toBe(again); // nada novo: mesma referência
  });

  it("avisa quando a versão atual é outra, e não avisa de etapa desconhecida", () => {
    const seen = captureStageVersions({}, [baby]);
    expect(hasStageVersionChanged(seen, baby.stages[0])).toBe(false);
    expect(hasStageVersionChanged(seen, { id: "BABY-0", currentVersionId: "v2" })).toBe(true);
    expect(hasStageVersionChanged(seen, { id: "nova", currentVersionId: "v9" })).toBe(false);
    expect(hasStageVersionChanged(seen, undefined)).toBe(false);
  });
});

describe("observações", () => {
  it("conta só as abertas", () => {
    const comment = (status: ContentReviewCommentStatus) => ({
      id: status,
      versionId: "v1",
      blockKey: null,
      message: "x",
      status,
      authorId: "u",
      createdAt: "",
    });
    const withComments = {
      ...baby.stages[0],
      reviewComments: [comment(ContentReviewCommentStatus.OPEN), comment(ContentReviewCommentStatus.RESOLVED)],
    };
    expect(openCommentsCount(withComments)).toBe(1);
  });
});

describe("cartão da fila: só o que foi liberado", () => {
  const seg = (audience: ContentAudience, index: number, status: ContentStageStatus) => ({
    audience,
    stageType: STAGE_ORDER[index],
    status,
  });
  const segments = [
    ...baby.stages.map((item, index) => seg(ContentAudience.BABY, index, item.status)),
    ...child.stages.map((item, index) => seg(ContentAudience.CHILD, index, item.status)),
    ...teen.stages.map((item, index) => seg(ContentAudience.TEEN, index, item.status)),
  ];

  it("mostra só a categoria liberada (BABY) e esconde as demais", () => {
    expect(releasedSegmentAudiences(segments)).toEqual([ContentAudience.BABY]);
    expect(releasedSegments(segments)).toHaveLength(5);
    expect(releasedSegments(segments).every((segment) => segment.audience === ContentAudience.BABY)).toBe(true);
  });

  it("o resumo do cartão conta só as etapas liberadas (não '1 de 15')", () => {
    expect(releasedListSummary({ stageSegments: segments })).toEqual({ approved: 1, awaiting: 4, returned: 0, total: 5, percent: 20 });
  });

  it("sem nada liberado, o cartão fica vazio", () => {
    expect(releasedSegments([seg(ContentAudience.CHILD, 0, S.DRAFT)])).toEqual([]);
    expect(releasedListSummary({ stageSegments: [] }).total).toBe(0);
  });
});

describe("publicação por categoria na tela de revisão", () => {
  const published = (item: ContentTrackResponse): ContentTrackResponse => ({ ...item, publishedAt: "2026-11-20T12:00:00Z" });
  const done = (audience: ContentAudience) => track(audience, [S.APPROVED, S.APPROVED, S.APPROVED, S.APPROVED, S.APPROVED]);

  it("só as categorias aprovadas e ainda não publicadas entram na publicação", () => {
    const tracks = [done(ContentAudience.BABY), published(done(ContentAudience.CHILD)), baby, child];
    const status = ContentPackageStatus.IN_REVIEW;
    expect(publishableTracks(tracks, status).map((item) => item.id)).toEqual([ContentAudience.BABY]);
  });

  it("pacote antigo PUBLISHED conta tudo como publicado", () => {
    expect(isTrackPublished(done(ContentAudience.BABY), ContentPackageStatus.PUBLISHED)).toBe(true);
    expect(isTrackPublished(done(ContentAudience.BABY), ContentPackageStatus.IN_REVIEW)).toBe(false);
    expect(publishableTracks([done(ContentAudience.BABY)], ContentPackageStatus.PUBLISHED)).toEqual([]);
  });

  it("'aprovar tudo' junta as etapas pendentes das categorias liberadas e ainda não publicadas", () => {
    const status = ContentPackageStatus.IN_REVIEW;
    expect(approvableStages([baby, child, teen], status).map((item) => item.id)).toEqual(["BABY-0", "BABY-1", "BABY-3", "BABY-4"]);
    expect(approvableStages([published(baby)], status)).toEqual([]);
    expect(approvableStages([done(ContentAudience.BABY)], status)).toEqual([]);
  });
});
