import { ContentPackageStatus, type ContentAudience, type ContentAudienceDefinitionResponse, type ContentPackageListItemResponse } from "./types";

export const pluralize = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/** "1 material para visita" / "8 materiais para visita". */
export const formatMaterialsCount = (total: number): string =>
  `${total} ${pluralize(total, "material para visita", "materiais para visita")}`;

export interface StageProgress {
  approved: number;
  required: number;
  /** 0–100, inteiro. */
  percent: number;
  label: string;
}

/** Andamento do material: etapas obrigatórias já aprovadas. */
export function stageProgress(item: Pick<ContentPackageListItemResponse, "approvedStagesCount" | "requiredStagesCount">): StageProgress {
  const required = Math.max(0, item.requiredStagesCount);
  const approved = Math.min(Math.max(0, item.approvedStagesCount), required);
  const percent = required === 0 ? 0 : Math.round((approved / required) * 100);
  return {
    approved,
    required,
    percent,
    label:
      required === 0
        ? "Sem etapas obrigatórias"
        : `${approved} de ${required} ${pluralize(required, "etapa aprovada", "etapas aprovadas")}`,
  };
}

/** Nomes das faixas de um material, na ordem recebida (a API já manda da mais nova para a mais velha). */
export function audienceNames(audiences: readonly ContentAudience[], catalog: readonly ContentAudienceDefinitionResponse[]): string[] {
  const byKey = new Map(catalog.map((definition) => [definition.audience, definition.name]));
  return audiences.map((audience) => byKey.get(audience) ?? audience);
}

/** Atalhos de situação da listagem (a lista completa continua no seletor "Mais situações"). */
export const QUICK_STATUS_FILTERS: ReadonlyArray<{ label: string; status: ContentPackageStatus | "" }> = [
  { label: "Todos", status: "" },
  { label: "Em produção", status: ContentPackageStatus.IN_PROGRESS },
  { label: "Em revisão", status: ContentPackageStatus.IN_REVIEW },
  { label: "Ajustes solicitados", status: ContentPackageStatus.CHANGES_REQUESTED },
  { label: "Prontos", status: ContentPackageStatus.READY_FOR_PUBLICATION },
  { label: "Publicados", status: ContentPackageStatus.PUBLISHED },
  { label: "Arquivados", status: ContentPackageStatus.ARCHIVED },
];

/** "1–8 de 8" (o padrão do MUI vem em inglês). */
export const displayedRowsLabel = ({ from, to, count }: { from: number; to: number; count: number }): string =>
  `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`;
