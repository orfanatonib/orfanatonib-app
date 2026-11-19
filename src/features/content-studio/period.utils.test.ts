import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { PACKAGE_STATUS_COLORS, PeriodPreset, activePreset, isPeriodInverted, periodForPreset } from "./period.utils";
import { ContentPackageStatus } from "./types";

const today = dayjs("2026-11-19");

describe("períodos rápidos", () => {
  it("últimos 7 dias inclui hoje (7 dias no total)", () => {
    expect(periodForPreset(PeriodPreset.LAST_7_DAYS, today)).toEqual({ startDate: "2026-11-13", endDate: "2026-11-19" });
  });

  it("últimos 30 dias cruza o mês", () => {
    expect(periodForPreset(PeriodPreset.LAST_30_DAYS, today)).toEqual({ startDate: "2026-10-21", endDate: "2026-11-19" });
  });

  it("este mês vai do dia 1 até hoje", () => {
    expect(periodForPreset(PeriodPreset.THIS_MONTH, today)).toEqual({ startDate: "2026-11-01", endDate: "2026-11-19" });
  });

  it("o atalho ativo só existe quando os dois campos batem exatamente", () => {
    expect(activePreset(periodForPreset(PeriodPreset.LAST_30_DAYS, today), today)).toBe(PeriodPreset.LAST_30_DAYS);
    expect(activePreset({ startDate: "2026-11-01", endDate: "2026-11-18" }, today)).toBeNull();
    expect(activePreset({ startDate: "", endDate: "" }, today)).toBeNull();
  });
});

describe("isPeriodInverted", () => {
  it("só é invertido quando os dois dias existem e o início vem depois do fim", () => {
    expect(isPeriodInverted({ startDate: "2026-12-10", endDate: "2026-12-01" })).toBe(true);
    expect(isPeriodInverted({ startDate: "2026-12-01", endDate: "2026-12-01" })).toBe(false);
    expect(isPeriodInverted({ startDate: "2026-12-10", endDate: "" })).toBe(false);
  });
});

describe("PACKAGE_STATUS_COLORS", () => {
  it("todo estado de pacote tem cor", () => {
    for (const status of Object.values(ContentPackageStatus)) expect(PACKAGE_STATUS_COLORS[status]).toBeTruthy();
  });
});
