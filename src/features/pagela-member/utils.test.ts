import { describe, expect, it } from "vitest";

import { clampWeek, getISOWeekYear, toLabelVisit, toLabelWeek, todayISO } from "./utils";

describe("utils da pagela", () => {
  it("clampWeek limita entre 1 e 53", () => {
    expect([clampWeek(0), clampWeek(1), clampWeek(30), clampWeek(53), clampWeek(99)]).toEqual([1, 1, 30, 53, 53]);
  });

  it("rótulos com zero à esquerda", () => {
    expect(toLabelVisit(2026, 3)).toBe("Ano: 2026 Visita: 03");
    expect(toLabelWeek(2026, 7)).toBe("Ano: 2026 • Semana: 07");
  });

  it.each([
    [new Date(2026, 0, 5), 2026, 2],
    [new Date(2025, 11, 29), 2026, 1],
    [new Date(2021, 0, 3), 2020, 53],
  ])("semana ISO de %s", (date, year, week) => {
    expect(getISOWeekYear(date)).toEqual({ year, week });
  });

  it("todayISO tem o formato AAAA-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
