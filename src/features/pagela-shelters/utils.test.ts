import { describe, expect, it } from "vitest";

import { WEEKDAY_PT, fmtDate } from "./utils";

describe("utils de pagela-shelters", () => {
  it("todos os dias da semana têm rótulo em português", () => {
    expect(Object.keys(WEEKDAY_PT)).toHaveLength(7);
    expect(WEEKDAY_PT.saturday).toBe("Sábado");
  });

  it("fmtDate formata ISO e devolve o texto original quando não é data", () => {
    expect(fmtDate("2026-01-05")).toBe("05/01/2026");
    expect(fmtDate("sem data")).toBe("sem data");
  });
});
