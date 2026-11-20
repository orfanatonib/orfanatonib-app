import {
  FAILED_STAGE_ACTION,
  GENERATING_STAGE_ACTION,
  PRODUCTION_LIST_STATUS_VIEWS,
  REVIEW_LIST_STATUS_VIEWS,
} from "./package-list-status.constants";
import { ProductionListStatus, ReviewListStatus, type ListStatusView } from "./package-list-status.types";
import { RELEASED_STAGE_STATUSES } from "./review-workspace.constants";
import {
  ContentAudience,
  ContentPackageStatus,
  ContentStageStatus,
  type ContentPackageListItemResponse,
  type ContentStageSegment,
} from "./types";

type ListItem = Pick<
  ContentPackageListItemResponse,
  "status" | "audiences" | "publishedAudiences" | "stageSegments" | "stagesWithContentCount"
>;

const isReleased = (status: ContentStageStatus): boolean => RELEASED_STAGE_STATUSES.includes(status);

/** Faixas que ainda não estão em Materiais de Visita (as publicadas já saíram do caminho da produção e da revisão). */
function pendingAudiences(item: Pick<ListItem, "audiences" | "publishedAudiences" | "status">): ContentAudience[] {
  const published = new Set(item.status === ContentPackageStatus.PUBLISHED ? item.audiences : (item.publishedAudiences ?? []));
  return (item.audiences ?? []).filter((audience) => !published.has(audience));
}

const segmentsOf = (item: Pick<ListItem, "stageSegments">, audiences: readonly ContentAudience[]): ContentStageSegment[] =>
  (item.stageSegments ?? []).filter((segment) => audiences.includes(segment.audience));

/**
 * Status do material para a listagem de PRODUÇÃO. Olha só as categorias que ainda não foram publicadas: o que já está
 * em Materiais de Visita não pede mais nada da produção.
 */
export function productionListStatus(item: ListItem): ProductionListStatus {
  if (item.status === ContentPackageStatus.ARCHIVED) return ProductionListStatus.ARCHIVED;
  const remaining = pendingAudiences(item);
  const published = (item.audiences ?? []).length - remaining.length;
  if (remaining.length === 0 && (item.audiences ?? []).length > 0) return ProductionListStatus.PUBLISHED;

  const segments = segmentsOf(item, remaining);
  if (segments.some((segment) => segment.status === ContentStageStatus.CHANGES_REQUESTED)) return ProductionListStatus.CHANGES_REQUESTED;

  const sent = remaining.filter((audience) => segments.some((segment) => segment.audience === audience && isReleased(segment.status)));
  if (sent.length > 0) return sent.length === remaining.length ? ProductionListStatus.ALL_SENT : ProductionListStatus.PARTIALLY_SENT;

  if (published > 0) return ProductionListStatus.PARTIALLY_PUBLISHED;

  const readyToSend = remaining.some((audience) => {
    const own = segments.filter((segment) => segment.audience === audience);
    return own.length > 0 && own.every((segment) => segment.status === ContentStageStatus.PRODUCER_APPROVED);
  });
  if (readyToSend || item.status === ContentPackageStatus.PACKAGE_READY) return ProductionListStatus.READY_TO_SEND;
  return item.stagesWithContentCount === 0 ? ProductionListStatus.NOT_STARTED : ProductionListStatus.IN_PRODUCTION;
}

/** Status do material para a listagem de REVISÃO: o que o revisor ainda tem de decidir, nas categorias enviadas. */
export function reviewListStatus(item: ListItem): ReviewListStatus {
  if (item.status === ContentPackageStatus.PUBLISHING) return ReviewListStatus.PUBLISHING;
  const remaining = pendingAudiences(item);
  if (remaining.length === 0 && (item.audiences ?? []).length > 0) return ReviewListStatus.PUBLISHED;

  const sent = segmentsOf(item, remaining).filter((segment) => isReleased(segment.status));
  if (sent.length === 0) return ReviewListStatus.NOT_SENT;
  const count = (status: ContentStageStatus) => sent.filter((segment) => segment.status === status).length;
  const awaiting = count(ContentStageStatus.IN_REVIEW);
  const approved = count(ContentStageStatus.APPROVED);
  const returned = count(ContentStageStatus.CHANGES_REQUESTED);
  if (awaiting > 0) return approved + returned === 0 ? ReviewListStatus.AWAITING : ReviewListStatus.IN_PROGRESS;
  if (returned > 0) return ReviewListStatus.CHANGES_REQUESTED;
  return ReviewListStatus.READY_TO_PUBLISH;
}

export const productionListStatusView = (item: ListItem): ListStatusView => PRODUCTION_LIST_STATUS_VIEWS[productionListStatus(item)];
export const reviewListStatusView = (item: ListItem): ListStatusView => REVIEW_LIST_STATUS_VIEWS[reviewListStatus(item)];

export interface ProductionCardAction {
  label: string;
  color: "primary" | "info" | "error" | "warning" | "success" | "inherit";
}

/** O botão principal do cartão de produção: falha e geração em andamento mandam; depois, o status do material. Arquivado só mostra. */
export function productionCardAction(
  item: ListItem & Pick<ContentPackageListItemResponse, "failedStagesCount" | "generatingStagesCount">,
): ProductionCardAction {
  const view = productionListStatusView(item);
  if (item.status === ContentPackageStatus.ARCHIVED) return { label: view.action, color: view.actionColor };
  if (item.failedStagesCount > 0) return { label: FAILED_STAGE_ACTION.label, color: FAILED_STAGE_ACTION.color };
  if (item.generatingStagesCount > 0) return { label: GENERATING_STAGE_ACTION.label, color: GENERATING_STAGE_ACTION.color };
  return { label: view.action, color: view.actionColor };
}
