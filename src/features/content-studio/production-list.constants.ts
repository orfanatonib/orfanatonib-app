import { ContentPackageStatus } from "./types";
import type { ContentPackageSort } from "./types";

/** Parâmetros da URL da listagem (filtros, busca e página moram nela: voltar de um material devolve a lista como estava). */
export const PRODUCTION_LIST_PARAMS = {
  status: "situacao",
  audience: "faixa",
  sort: "ordem",
  search: "busca",
  page: "pagina",
} as const;

export interface ProductionSortOption {
  /** Valor na URL: `campo:DIREÇÃO`. */
  value: string;
  label: string;
  sort: ContentPackageSort;
  order: "ASC" | "DESC";
}

export const PRODUCTION_SORT_OPTIONS: readonly ProductionSortOption[] = [
  { value: "updatedAt:DESC", label: "Mexidos recentemente", sort: "updatedAt", order: "DESC" },
  { value: "createdAt:DESC", label: "Mais novos", sort: "createdAt", order: "DESC" },
  { value: "createdAt:ASC", label: "Mais antigos", sort: "createdAt", order: "ASC" },
  { value: "theme:ASC", label: "Tema (A–Z)", sort: "theme", order: "ASC" },
];
export const PRODUCTION_DEFAULT_SORT = PRODUCTION_SORT_OPTIONS[0].value;

export const PRODUCTION_PAGE_SIZE_OPTIONS = [6, 12, 24];
export const PRODUCTION_DEFAULT_PAGE_SIZE = 12;
export const PRODUCTION_SEARCH_DEBOUNCE_MS = 400;

export const PRODUCTION_STATUS_FILTER_OPTIONS: ReadonlyArray<{ value: ContentPackageStatus; label: string }> = [
  { value: ContentPackageStatus.IN_PROGRESS, label: "Em produção" },
  { value: ContentPackageStatus.PACKAGE_READY, label: "Pronto para revisão" },
  { value: ContentPackageStatus.IN_REVIEW, label: "Em revisão" },
  { value: ContentPackageStatus.CHANGES_REQUESTED, label: "Ajustes solicitados" },
  { value: ContentPackageStatus.READY_FOR_PUBLICATION, label: "Pronto para publicar" },
  { value: ContentPackageStatus.PUBLISHED, label: "Publicado" },
  { value: ContentPackageStatus.ARCHIVED, label: "Arquivado" },
];

export const PRODUCTION_LIST_TEXTS = {
  title: "Materiais para visita",
  searchPlaceholder: "Buscar por tema ou referência bíblica...",
  emptyTitle: "Nenhum material encontrado",
  emptySubtitle: "Crie o primeiro material para visita ou ajuste os filtros.",
  failedBadge: "Falhou",
  generatingBadge: "Gerando",
  pdfTooltip: "Baixar PDF do material",
  archiveTooltip: "Arquivar material",
  archiveBlockedTooltip: "Espere a geração terminar para arquivar",
} as const;
