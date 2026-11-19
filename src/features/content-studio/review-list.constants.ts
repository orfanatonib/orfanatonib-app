import { ContentPackageStatus } from "./types";

/** Recortes da fila de revisão. */
export enum ReviewQueueView {
  TO_REVIEW = "TO_REVIEW",
  READY = "READY",
  RETURNED = "RETURNED",
  PUBLISHED = "PUBLISHED",
  ALL = "ALL",
}

export interface ReviewQueueViewDefinition {
  view: ReviewQueueView;
  label: string;
  statuses: readonly ContentPackageStatus[];
  /** Destaca o recorte quando há material nele: é trabalho esperando. */
  urgent?: boolean;
}

/**
 * A fila é dividida em recortes — o que espera o revisor, o que está pronto para publicar, o que voltou à
 * produção e o que já saiu —, cada um com a sua contagem. Sem isso, os publicados escondem o que precisa de decisão.
 */
export const REVIEW_QUEUE_VIEWS: readonly ReviewQueueViewDefinition[] = [
  { view: ReviewQueueView.TO_REVIEW, label: "Para revisar", statuses: [ContentPackageStatus.PACKAGE_READY, ContentPackageStatus.IN_REVIEW], urgent: true },
  { view: ReviewQueueView.READY, label: "Prontos para publicar", statuses: [ContentPackageStatus.READY_FOR_PUBLICATION, ContentPackageStatus.PUBLISHING], urgent: true },
  { view: ReviewQueueView.RETURNED, label: "Devolvidos à produção", statuses: [ContentPackageStatus.CHANGES_REQUESTED] },
  { view: ReviewQueueView.PUBLISHED, label: "Publicados", statuses: [ContentPackageStatus.PUBLISHED] },
  {
    view: ReviewQueueView.ALL,
    label: "Todos",
    statuses: [
      ContentPackageStatus.PACKAGE_READY,
      ContentPackageStatus.IN_REVIEW,
      ContentPackageStatus.CHANGES_REQUESTED,
      ContentPackageStatus.READY_FOR_PUBLICATION,
      ContentPackageStatus.PUBLISHING,
      ContentPackageStatus.PUBLISHED,
    ],
  },
];

export const REVIEW_PARAMS = { view: "recorte", audience: "faixa", search: "busca", page: "pagina" } as const;
export const REVIEW_DEFAULT_VIEW = ReviewQueueView.TO_REVIEW;
export const REVIEW_PAGE_SIZE_OPTIONS = [6, 12, 24];
export const REVIEW_DEFAULT_PAGE_SIZE = 12;

export const REVIEW_EMPTY_TEXTS: Record<ReviewQueueView, { title: string; subtitle: string }> = {
  [ReviewQueueView.ALL]: { title: "Nenhum material na fila", subtitle: "Os materiais aparecem aqui quando a produção conclui todas as etapas obrigatórias." },
  [ReviewQueueView.TO_REVIEW]: { title: "Nada aguardando revisão", subtitle: "Nenhum material espera a sua decisão agora." },
  [ReviewQueueView.RETURNED]: { title: "Nenhum material devolvido", subtitle: "Não há material com ajustes pendentes na produção." },
  [ReviewQueueView.READY]: { title: "Nada pronto para publicar", subtitle: "Um material fica pronto quando todas as etapas obrigatórias são aprovadas." },
  [ReviewQueueView.PUBLISHED]: { title: "Nenhum material publicado", subtitle: "Os materiais publicados pelo Estúdio aparecem aqui." },
};

export const REVIEW_TEXTS = {
  listTitle: "Revisão editorial",
  searchPlaceholder: "Buscar por tema ou referência bíblica...",
  loadError: "Não foi possível carregar a fila de revisão. Tente novamente.",
} as const;
