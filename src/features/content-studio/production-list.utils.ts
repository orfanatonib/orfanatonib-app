import { PRODUCTION_DEFAULT_SORT, PRODUCTION_LIST_PARAMS, PRODUCTION_SORT_OPTIONS, PRODUCTION_STATUS_FILTER_OPTIONS } from "./production-list.constants";
import { ContentAudience, ContentPackageStatus, ContentStageStatus, type ContentPackageListItemResponse, type QueryContentPackagesParams } from "./types";

export interface ProductionListState {
  status: ContentPackageStatus | "";
  audience: ContentAudience | "";
  sort: string;
  search: string;
  page: number;
}

const isStatus = (value: string): value is ContentPackageStatus => PRODUCTION_STATUS_FILTER_OPTIONS.some((option) => option.value === value);
const isAudience = (value: string): value is ContentAudience => (Object.values(ContentAudience) as string[]).includes(value);
const isSort = (value: string) => PRODUCTION_SORT_OPTIONS.some((option) => option.value === value);

/** Filtros lidos da URL; o que não é válido volta ao padrão. */
export function readProductionListState(params: URLSearchParams): ProductionListState {
  const status = params.get(PRODUCTION_LIST_PARAMS.status) ?? "";
  const audience = params.get(PRODUCTION_LIST_PARAMS.audience) ?? "";
  const sort = params.get(PRODUCTION_LIST_PARAMS.sort) ?? "";
  return {
    status: isStatus(status) ? status : "",
    audience: isAudience(audience) ? audience : "",
    sort: isSort(sort) ? sort : PRODUCTION_DEFAULT_SORT,
    search: params.get(PRODUCTION_LIST_PARAMS.search) ?? "",
    page: Math.max(1, Math.floor(Number(params.get(PRODUCTION_LIST_PARAMS.page))) || 1),
  };
}

/** Grava na URL só o que difere do padrão (o endereço limpo continua sendo a lista sem filtro). */
export function writeProductionListState(current: URLSearchParams, state: ProductionListState): URLSearchParams {
  const next = new URLSearchParams(current);
  const set = (key: string, value: string, fallback = "") => {
    if (value && value !== fallback) next.set(key, value);
    else next.delete(key);
  };
  set(PRODUCTION_LIST_PARAMS.status, state.status);
  set(PRODUCTION_LIST_PARAMS.audience, state.audience);
  set(PRODUCTION_LIST_PARAMS.sort, state.sort, PRODUCTION_DEFAULT_SORT);
  set(PRODUCTION_LIST_PARAMS.search, state.search.trim());
  set(PRODUCTION_LIST_PARAMS.page, String(state.page), "1");
  return next;
}

/** Estado da URL + tamanho da página → parâmetros da API. */
export function productionQuery(state: ProductionListState, limit: number): QueryContentPackagesParams {
  const option = PRODUCTION_SORT_OPTIONS.find((item) => item.value === state.sort) ?? PRODUCTION_SORT_OPTIONS[0];
  return {
    page: state.page,
    limit,
    search: state.search.trim() || undefined,
    status: state.status || undefined,
    audience: state.audience || undefined,
    sort: option.sort,
    order: option.order,
  };
}

export type StageTone = "done" | "produced" | "working" | "problem" | "stale" | "todo";

/** Cor do segmento de cada etapa na barra do cartão. */
export function stageTone(status: ContentStageStatus): StageTone {
  switch (status) {
    case ContentStageStatus.APPROVED:
      return "done";
    case ContentStageStatus.PRODUCER_APPROVED:
    case ContentStageStatus.IN_REVIEW:
      return "produced";
    case ContentStageStatus.GENERATING:
    case ContentStageStatus.DRAFT:
    case ContentStageStatus.CHANGES_REQUESTED:
      return "working";
    case ContentStageStatus.FAILED:
      return "problem";
    case ContentStageStatus.STALE:
      return "stale";
    default:
      return "todo";
  }
}

export interface NextStep {
  label: string;
  color: "primary" | "info" | "error" | "warning" | "success" | "inherit";
}

/** O que fazer agora com o material (o texto do botão principal do cartão). */
export function nextStep(
  item: Pick<ContentPackageListItemResponse, "status" | "failedStagesCount" | "generatingStagesCount" | "stagesWithContentCount">,
): NextStep {
  if (item.status === ContentPackageStatus.ARCHIVED) return { label: "Ver material", color: "inherit" };
  if (item.failedStagesCount > 0) return { label: "Resolver falha na geração", color: "error" };
  if (item.generatingStagesCount > 0) return { label: "Acompanhar geração", color: "info" };
  switch (item.status) {
    case ContentPackageStatus.PACKAGE_READY:
    case ContentPackageStatus.IN_REVIEW:
      return { label: "Revisar material", color: "warning" };
    case ContentPackageStatus.CHANGES_REQUESTED:
      return { label: "Fazer os ajustes pedidos", color: "warning" };
    case ContentPackageStatus.READY_FOR_PUBLICATION:
    case ContentPackageStatus.PUBLISHING:
    case ContentPackageStatus.PUBLISHED:
      return { label: "Ver material", color: "success" };
    default:
      return item.stagesWithContentCount === 0 ? { label: "Começar produção", color: "primary" } : { label: "Continuar produção", color: "primary" };
  }
}

/** O PDF só existe quando alguma etapa já tem conteúdo salvo. */
export const canExportPackage = (item: Pick<ContentPackageListItemResponse, "stagesWithContentCount">): boolean => item.stagesWithContentCount > 0;

/** Arquivar espera a geração terminar; arquivado não arquiva de novo. */
export const canArchivePackage = (item: Pick<ContentPackageListItemResponse, "status" | "generatingStagesCount">): boolean =>
  item.status !== ContentPackageStatus.ARCHIVED && item.generatingStagesCount === 0;

/** "Mexido há 3 horas" — o tempo relativo em português. */
export function relativeTimeLabel(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 60_000) return "agora há pouco";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? "mês" : "meses"}`;
}
