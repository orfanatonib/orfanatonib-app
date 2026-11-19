import dayjs, { type Dayjs } from "dayjs";

import { ContentPackageStatus } from "./types";

export const PERIOD_VALUE_FORMAT = "YYYY-MM-DD";

export enum PeriodPreset {
  LAST_7_DAYS = "LAST_7_DAYS",
  LAST_30_DAYS = "LAST_30_DAYS",
  THIS_MONTH = "THIS_MONTH",
}

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  [PeriodPreset.LAST_7_DAYS]: "Últimos 7 dias",
  [PeriodPreset.LAST_30_DAYS]: "Últimos 30 dias",
  [PeriodPreset.THIS_MONTH]: "Este mês",
};

export interface Period {
  startDate: string;
  endDate: string;
}

/** Período de um atalho, em `YYYY-MM-DD`; `today` é injetado para o cálculo ser testável. */
export function periodForPreset(preset: PeriodPreset, today: Dayjs = dayjs()): Period {
  const end = today.format(PERIOD_VALUE_FORMAT);
  switch (preset) {
    case PeriodPreset.LAST_7_DAYS:
      return { startDate: today.subtract(6, "day").format(PERIOD_VALUE_FORMAT), endDate: end };
    case PeriodPreset.LAST_30_DAYS:
      return { startDate: today.subtract(29, "day").format(PERIOD_VALUE_FORMAT), endDate: end };
    case PeriodPreset.THIS_MONTH:
      return { startDate: today.startOf("month").format(PERIOD_VALUE_FORMAT), endDate: end };
  }
}

/** Atalho cujo período é exatamente o que está nos campos (para destacar o chip ativo). */
export function activePreset(period: Period, today: Dayjs = dayjs()): PeriodPreset | null {
  return (
    Object.values(PeriodPreset).find((preset) => {
      const candidate = periodForPreset(preset, today);
      return candidate.startDate === period.startDate && candidate.endDate === period.endDate;
    }) ?? null
  );
}

/** `true` quando o início é posterior ao fim (a API recusa com 400). */
export function isPeriodInverted({ startDate, endDate }: Period): boolean {
  return !!startDate && !!endDate && startDate > endDate;
}

type ChipColor = "default" | "primary" | "info" | "warning" | "success" | "error";

/** Cor do chip de situação do pacote: o que pede ação aparece em destaque. */
export const PACKAGE_STATUS_COLORS: Record<ContentPackageStatus, ChipColor> = {
  [ContentPackageStatus.DRAFT]: "default",
  [ContentPackageStatus.IN_PROGRESS]: "primary",
  [ContentPackageStatus.PACKAGE_READY]: "info",
  [ContentPackageStatus.IN_REVIEW]: "info",
  [ContentPackageStatus.CHANGES_REQUESTED]: "warning",
  [ContentPackageStatus.READY_FOR_PUBLICATION]: "success",
  [ContentPackageStatus.PUBLISHING]: "info",
  [ContentPackageStatus.PUBLISHED]: "success",
  [ContentPackageStatus.ARCHIVED]: "default",
};
