import { REVIEW_DEFAULT_VIEW, REVIEW_PARAMS, REVIEW_QUEUE_VIEWS, ReviewQueueView } from "./review-list.constants";
import { ContentAudience, ContentPackageStatus, ContentStageStatus, type ContentPackageListItemResponse } from "./types";

export interface ReviewListState {
  view: ReviewQueueView;
  audience: ContentAudience | "";
  search: string;
  page: number;
}

const isView = (value: string): value is ReviewQueueView => REVIEW_QUEUE_VIEWS.some((item) => item.view === value);
const isAudience = (value: string): value is ContentAudience => (Object.values(ContentAudience) as string[]).includes(value);

/** Situações do recorte (o padrão se o recorte for desconhecido). */
export function reviewViewStatuses(view: ReviewQueueView): readonly ContentPackageStatus[] {
  return (REVIEW_QUEUE_VIEWS.find((item) => item.view === view) ?? REVIEW_QUEUE_VIEWS[0]).statuses;
}

/** O painel do Estúdio abre a fila já no recorte certo (`?situacao=IN_REVIEW`): situação fora da fila cai em "Todos". */
export function reviewViewFromStatus(status: string | null | undefined): ReviewQueueView {
  if (!status) return REVIEW_DEFAULT_VIEW;
  return REVIEW_QUEUE_VIEWS.find((item) => item.view !== ReviewQueueView.ALL && (item.statuses as readonly string[]).includes(status))?.view ?? ReviewQueueView.ALL;
}

export function readReviewListState(params: URLSearchParams): ReviewListState {
  const view = params.get(REVIEW_PARAMS.view) ?? "";
  const audience = params.get(REVIEW_PARAMS.audience) ?? "";
  return {
    view: isView(view) ? view : reviewViewFromStatus(params.get("situacao")),
    audience: isAudience(audience) ? audience : "",
    search: params.get(REVIEW_PARAMS.search) ?? "",
    page: Math.max(1, Math.floor(Number(params.get(REVIEW_PARAMS.page))) || 1),
  };
}

/** Só grava o que difere do padrão; a URL limpa é a fila "Para revisar". */
export function writeReviewListState(current: URLSearchParams, state: ReviewListState): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete("situacao");
  const set = (key: string, value: string, fallback = "") => {
    if (value && value !== fallback) next.set(key, value);
    else next.delete(key);
  };
  set(REVIEW_PARAMS.view, state.view, REVIEW_DEFAULT_VIEW);
  set(REVIEW_PARAMS.audience, state.audience);
  set(REVIEW_PARAMS.search, state.search.trim());
  set(REVIEW_PARAMS.page, String(state.page), "1");
  return next;
}

/** Quantos materiais há em cada recorte, a partir da contagem por situação do painel. */
export function reviewQueueCounts(byStatus: Partial<Record<ContentPackageStatus, number>> | undefined): Record<ReviewQueueView, number> {
  return Object.fromEntries(REVIEW_QUEUE_VIEWS.map((item) => [item.view, item.statuses.reduce((sum, status) => sum + (byStatus?.[status] ?? 0), 0)])) as Record<
    ReviewQueueView,
    number
  >;
}

export interface ReviewPackageSummary {
  approved: number;
  awaiting: number;
  returned: number;
  total: number;
  percent: number;
}

/** Onde o material está na revisão: etapas aprovadas, aguardando decisão e devolvidas. */
export function reviewPackageSummary(item: Pick<ContentPackageListItemResponse, "stageSegments" | "requiredStagesCount" | "approvedStagesCount">): ReviewPackageSummary {
  const segments = item.stageSegments ?? [];
  const count = (status: ContentStageStatus) => segments.filter((segment) => segment.status === status).length;
  const total = Math.max(0, item.requiredStagesCount);
  const approved = Math.min(Math.max(0, item.approvedStagesCount), total);
  return {
    approved,
    awaiting: count(ContentStageStatus.IN_REVIEW),
    returned: count(ContentStageStatus.CHANGES_REQUESTED),
    total,
    percent: total > 0 ? Math.round((approved / total) * 100) : 0,
  };
}

/** Uma linha que diz o que falta, no lugar de repetir a mesma fração. */
export function reviewProgressText(summary: ReviewPackageSummary): string {
  const parts = [`${summary.approved} de ${summary.total} etapas aprovadas`];
  if (summary.awaiting > 0) parts.push(`${summary.awaiting} ${summary.awaiting === 1 ? "aguarda" : "aguardam"} sua decisão`);
  if (summary.returned > 0) parts.push(`${summary.returned} ${summary.returned === 1 ? "devolvida" : "devolvidas"}`);
  return parts.join(" · ");
}

export interface ReviewCardAction {
  label: string;
  variant: "contained" | "outlined";
  color: "primary" | "warning" | "success";
}

/** O que o botão do cartão diz e como se destaca, conforme o que o material precisa. */
export function reviewCardAction(status: ContentPackageStatus): ReviewCardAction {
  switch (status) {
    case ContentPackageStatus.PACKAGE_READY:
      return { label: "Iniciar revisão", variant: "contained", color: "primary" };
    case ContentPackageStatus.IN_REVIEW:
      return { label: "Continuar revisão", variant: "contained", color: "primary" };
    case ContentPackageStatus.CHANGES_REQUESTED:
      return { label: "Acompanhar ajustes", variant: "outlined", color: "warning" };
    case ContentPackageStatus.READY_FOR_PUBLICATION:
      return { label: "Ver material aprovado", variant: "contained", color: "success" };
    case ContentPackageStatus.PUBLISHING:
      return { label: "Acompanhar publicação", variant: "outlined", color: "primary" };
    default:
      return { label: "Ver material publicado", variant: "outlined", color: "primary" };
  }
}
