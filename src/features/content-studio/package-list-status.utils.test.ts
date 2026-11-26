import { describe, expect, it } from "vitest";

import { PRODUCTION_LIST_STATUS_VIEWS, REVIEW_LIST_STATUS_VIEWS } from "./package-list-status.constants";
import { ProductionListStatus, ReviewListStatus } from "./package-list-status.types";
import {
  productionCardAction,
  productionListStatus,
  productionListStatusView,
  reviewListStatus,
  reviewListStatusView,
} from "./package-list-status.utils";
import { ContentAudience, ContentPackageStatus, ContentStageStatus, ContentStageType, type ContentPackageListItemResponse } from "./types";

const S = ContentStageStatus;
const STAGES = [
  ContentStageType.LESSON,
  ContentStageType.LESSON_VISUALS,
  ContentStageType.VERSE_VISUALS,
  ContentStageType.VERSE_FIXATION,
  ContentStageType.STANDARD_GAME,
];
const ALL = [ContentAudience.BABY, ContentAudience.CHILD, ContentAudience.TEEN, ContentAudience.ADULT];

type Item = Pick<
  ContentPackageListItemResponse,
  "status" | "audiences" | "publishedAudiences" | "stageSegments" | "stagesWithContentCount"
>;

/** Material com as quatro categorias; `tracks` diz o estado das etapas de cada uma (as omitidas ficam sem começar). */
function item(
  status: ContentPackageStatus,
  tracks: Partial<Record<ContentAudience, ContentStageStatus[]>>,
  publishedAudiences: ContentAudience[] = [],
  stagesWithContentCount = 1,
): Item {
  return {
    status,
    audiences: ALL,
    publishedAudiences,
    stagesWithContentCount,
    stageSegments: ALL.flatMap((audience) =>
      STAGES.map((stageType, index) => ({
        audience,
        stageType,
        status: tracks[audience]?.[index] ?? tracks[audience]?.[0] ?? S.NOT_STARTED,
      })),
    ),
  };
}

const five = (status: ContentStageStatus): ContentStageStatus[] => STAGES.map(() => status);
const P = ContentPackageStatus;

describe("listagem de PRODUÇÃO: todos os status", () => {
  it("rascunho: nada produzido", () => {
    expect(productionListStatus(item(P.DRAFT, {}, [], 0))).toBe(ProductionListStatus.NOT_STARTED);
    expect(productionListStatusView(item(P.DRAFT, {}, [], 0)).action).toBe("Começar produção");
  });

  it("em produção: há conteúdo e nenhuma categoria está pronta", () => {
    const i = item(P.IN_PROGRESS, { [ContentAudience.BABY]: [S.DRAFT, S.NOT_STARTED, S.NOT_STARTED, S.NOT_STARTED, S.NOT_STARTED] });
    expect(productionListStatus(i)).toBe(ProductionListStatus.IN_PRODUCTION);
    expect(productionListStatusView(i).action).toBe("Continuar produção");
  });

  it("pronto para enviar: uma categoria concluída e nada enviado", () => {
    const one = item(P.IN_PROGRESS, { [ContentAudience.BABY]: five(S.PRODUCER_APPROVED) });
    expect(productionListStatus(one)).toBe(ProductionListStatus.READY_TO_SEND);
    expect(productionListStatusView(one).action).toBe("Enviar para revisão");
    const everything = item(P.PACKAGE_READY, Object.fromEntries(ALL.map((audience) => [audience, five(S.PRODUCER_APPROVED)])));
    expect(productionListStatus(everything)).toBe(ProductionListStatus.READY_TO_SEND);
  });

  it("SÓ PARTE das categorias na revisão: 'Parte em revisão' e botão 'Continuar produção' (nunca 'Revisar')", () => {
    const i = item(P.IN_REVIEW, { [ContentAudience.BABY]: [S.IN_REVIEW, S.IN_REVIEW, S.IN_REVIEW, S.IN_REVIEW, S.IN_REVIEW] });
    expect(productionListStatus(i)).toBe(ProductionListStatus.PARTIALLY_SENT);
    const view = productionListStatusView(i);
    expect(view.label).toBe("Parte em revisão");
    expect(view.action).toBe("Continuar produção");
    expect(view.action).not.toMatch(/revis/i);
  });

  it("uma ou mais categorias na revisão, mas não todas, continua sendo produção", () => {
    const two = item(P.IN_REVIEW, {
      [ContentAudience.BABY]: five(S.IN_REVIEW),
      [ContentAudience.CHILD]: five(S.IN_REVIEW),
    });
    expect(productionListStatus(two)).toBe(ProductionListStatus.PARTIALLY_SENT);
    const three = item(P.IN_REVIEW, {
      [ContentAudience.BABY]: five(S.IN_REVIEW),
      [ContentAudience.CHILD]: five(S.APPROVED),
      [ContentAudience.TEEN]: five(S.IN_REVIEW),
    });
    expect(productionListStatus(three)).toBe(ProductionListStatus.PARTIALLY_SENT);
  });

  it("todas as categorias enviadas: 'Em revisão' e o botão só mostra o material", () => {
    const i = item(P.IN_REVIEW, Object.fromEntries(ALL.map((audience) => [audience, five(S.IN_REVIEW)])));
    expect(productionListStatus(i)).toBe(ProductionListStatus.ALL_SENT);
    expect(productionListStatusView(i).action).toBe("Ver material");
  });

  it("a revisão devolveu uma etapa: ajustes pedidos", () => {
    const i = item(P.CHANGES_REQUESTED, { [ContentAudience.BABY]: [S.CHANGES_REQUESTED, S.APPROVED, S.APPROVED, S.APPROVED, S.APPROVED] });
    expect(productionListStatus(i)).toBe(ProductionListStatus.CHANGES_REQUESTED);
    expect(productionListStatusView(i).action).toBe("Fazer os ajustes pedidos");
  });

  it("BABY já publicado e o resto em produção: 'Publicado em parte' e 'Continuar produção'", () => {
    const i = item(P.IN_PROGRESS, { [ContentAudience.BABY]: five(S.APPROVED) }, [ContentAudience.BABY]);
    expect(productionListStatus(i)).toBe(ProductionListStatus.PARTIALLY_PUBLISHED);
    expect(productionListStatusView(i).action).toBe("Continuar produção");
  });

  it("BABY publicado e crianças enviadas: só as crianças contam (as que faltam estão todas enviadas)", () => {
    const i = item(
      P.IN_REVIEW,
      {
        [ContentAudience.BABY]: five(S.APPROVED),
        [ContentAudience.CHILD]: five(S.IN_REVIEW),
        [ContentAudience.TEEN]: five(S.IN_REVIEW),
        [ContentAudience.ADULT]: five(S.IN_REVIEW),
      },
      [ContentAudience.BABY],
    );
    expect(productionListStatus(i)).toBe(ProductionListStatus.ALL_SENT);
  });

  it("BABY publicado e crianças enviadas, adolescentes ainda não: parte em revisão", () => {
    const i = item(P.IN_REVIEW, { [ContentAudience.BABY]: five(S.APPROVED), [ContentAudience.CHILD]: five(S.IN_REVIEW) }, [
      ContentAudience.BABY,
    ]);
    expect(productionListStatus(i)).toBe(ProductionListStatus.PARTIALLY_SENT);
  });

  it("todas as categorias publicadas (ou pacote antigo PUBLISHED): publicado", () => {
    expect(productionListStatus(item(P.PUBLISHED, Object.fromEntries(ALL.map((audience) => [audience, five(S.APPROVED)])), ALL))).toBe(
      ProductionListStatus.PUBLISHED,
    );
    // pacote antigo: publishedAudiences vem completo, mas mesmo vazio o status PUBLISHED vale
    expect(productionListStatus(item(P.PUBLISHED, Object.fromEntries(ALL.map((audience) => [audience, five(S.APPROVED)])), []))).toBe(
      ProductionListStatus.PUBLISHED,
    );
    expect(productionListStatusView(item(P.PUBLISHED, {}, ALL)).action).toBe("Ver material");
  });

  it("arquivado", () => {
    expect(productionListStatus(item(P.ARCHIVED, {}))).toBe(ProductionListStatus.ARCHIVED);
  });

  it("NENHUM status de produção usa a palavra 'revisar'/'revisão' no botão, exceto 'Enviar para revisão' (enviar é da produção)", () => {
    for (const view of Object.values(PRODUCTION_LIST_STATUS_VIEWS)) {
      expect(view.action).not.toMatch(/Revisar|Iniciar revisão|Continuar revisão/);
    }
  });

  it("todos os status de produção têm etiqueta, cor e botão", () => {
    for (const status of Object.values(ProductionListStatus)) {
      const view = PRODUCTION_LIST_STATUS_VIEWS[status];
      expect(view.label).toBeTruthy();
      expect(view.action).toBeTruthy();
    }
  });
});

describe("listagem de REVISÃO: todos os status", () => {
  it("enviado e sem nenhuma decisão: 'Pendente de revisão' e 'Iniciar revisão'", () => {
    const i = item(P.IN_REVIEW, { [ContentAudience.BABY]: five(S.IN_REVIEW) });
    expect(reviewListStatus(i)).toBe(ReviewListStatus.AWAITING);
    expect(reviewListStatusView(i).action).toBe("Iniciar revisão");
  });

  it("parte decidida e parte esperando: 'Revisão em andamento' e 'Continuar revisão'", () => {
    const i = item(P.IN_REVIEW, { [ContentAudience.BABY]: [S.APPROVED, S.IN_REVIEW, S.IN_REVIEW, S.IN_REVIEW, S.IN_REVIEW] });
    expect(reviewListStatus(i)).toBe(ReviewListStatus.IN_PROGRESS);
    expect(reviewListStatusView(i).action).toBe("Continuar revisão");
    const returned = item(P.IN_REVIEW, {
      [ContentAudience.BABY]: [S.CHANGES_REQUESTED, S.IN_REVIEW, S.IN_REVIEW, S.IN_REVIEW, S.IN_REVIEW],
    });
    expect(reviewListStatus(returned)).toBe(ReviewListStatus.IN_PROGRESS);
  });

  it("nada mais a decidir e algo voltou à produção: 'Ajustes solicitados'", () => {
    const i = item(P.CHANGES_REQUESTED, { [ContentAudience.BABY]: [S.CHANGES_REQUESTED, S.APPROVED, S.APPROVED, S.APPROVED, S.APPROVED] });
    expect(reviewListStatus(i)).toBe(ReviewListStatus.CHANGES_REQUESTED);
    expect(reviewListStatusView(i).action).toBe("Acompanhar ajustes");
  });

  it("tudo o que foi enviado está aprovado: pronto para publicar", () => {
    const i = item(P.READY_FOR_PUBLICATION, { [ContentAudience.BABY]: five(S.APPROVED) });
    expect(reviewListStatus(i)).toBe(ReviewListStatus.READY_TO_PUBLISH);
    expect(reviewListStatusView(i).action).toBe("Publicar material");
  });

  it("BABY aprovado e crianças ainda esperando: a revisão continua (há o que decidir)", () => {
    const i = item(P.READY_FOR_PUBLICATION, { [ContentAudience.BABY]: five(S.APPROVED), [ContentAudience.CHILD]: five(S.IN_REVIEW) });
    expect(reviewListStatus(i)).toBe(ReviewListStatus.IN_PROGRESS);
  });

  it("categoria já publicada não entra na conta: só as crianças enviadas contam e a revisão delas começa do zero", () => {
    const i = item(P.IN_REVIEW, { [ContentAudience.BABY]: five(S.APPROVED), [ContentAudience.CHILD]: five(S.IN_REVIEW) }, [
      ContentAudience.BABY,
    ]);
    expect(reviewListStatus(i)).toBe(ReviewListStatus.AWAITING);
    expect(reviewListStatusView(i).action).toBe("Iniciar revisão");
  });

  it("publicando, publicado e não enviado", () => {
    expect(reviewListStatus(item(P.PUBLISHING, { [ContentAudience.BABY]: five(S.APPROVED) }))).toBe(ReviewListStatus.PUBLISHING);
    expect(reviewListStatus(item(P.PUBLISHED, Object.fromEntries(ALL.map((audience) => [audience, five(S.APPROVED)])), ALL))).toBe(
      ReviewListStatus.PUBLISHED,
    );
    expect(reviewListStatus(item(P.IN_PROGRESS, { [ContentAudience.BABY]: five(S.DRAFT) }))).toBe(ReviewListStatus.NOT_SENT);
    expect(reviewListStatusView(item(P.PUBLISHED, {}, ALL)).action).toBe("Ver material publicado");
  });

  it("'Iniciar/Continuar revisão' só existe na revisão: nenhuma ação da produção usa essas palavras", () => {
    const reviewActions = Object.values(REVIEW_LIST_STATUS_VIEWS).map((view) => view.action);
    expect(reviewActions).toContain("Iniciar revisão");
    expect(reviewActions).toContain("Continuar revisão");
    for (const view of Object.values(PRODUCTION_LIST_STATUS_VIEWS))
      expect(view.action).not.toMatch(/Iniciar revisão|Continuar revisão|Revisar material/);
  });

  it("todos os status de revisão têm etiqueta, cor e botão", () => {
    for (const status of Object.values(ReviewListStatus)) {
      const view = REVIEW_LIST_STATUS_VIEWS[status];
      expect(view.label).toBeTruthy();
      expect(view.action).toBeTruthy();
    }
  });
});

describe("botão principal do cartão de produção", () => {
  const base = (status: ContentPackageStatus) => ({ ...item(status, {}, [], 2), failedStagesCount: 0, generatingStagesCount: 0 });

  it("falha e geração em andamento mandam no botão; depois, o status do material", () => {
    expect(productionCardAction({ ...base(P.IN_PROGRESS), failedStagesCount: 1, generatingStagesCount: 1 }).label).toBe(
      "Resolver falha na geração",
    );
    expect(productionCardAction({ ...base(P.IN_PROGRESS), generatingStagesCount: 1 }).label).toBe("Acompanhar geração");
    expect(productionCardAction(base(P.IN_PROGRESS)).label).toBe("Continuar produção");
    expect(productionCardAction({ ...base(P.IN_PROGRESS), stagesWithContentCount: 0 }).label).toBe("Começar produção");
  });

  it("arquivado só mostra o material, mesmo com falha registrada", () => {
    expect(productionCardAction({ ...base(P.ARCHIVED), failedStagesCount: 3 }).label).toBe("Ver material");
  });

  it("material com só parte das categorias na revisão NUNCA mostra 'Revisar material'", () => {
    const partial = { ...item(P.IN_REVIEW, { [ContentAudience.BABY]: five(S.IN_REVIEW) }), failedStagesCount: 0, generatingStagesCount: 0 };
    expect(productionCardAction(partial).label).toBe("Continuar produção");
  });
});
