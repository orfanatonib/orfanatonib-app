import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  ageDetailed,
  ageFrom,
  brToISO,
  fmtBR,
  fmtDateOnly,
  fmtDT,
  formatDate,
  gLabel,
  isoToBR,
  isValidBRDate,
  summaryLabel,
  tenureFrom,
  timeDifference,
  weekdayLabel,
} from "./dateUtils";

// O produto roda em Manaus (UTC-4): é onde o bug do "dia anterior" aparece.
process.env.TZ = "America/Manaus";

describe("ambiente de teste", () => {
  it("usa o fuso de Manaus", () => {
    expect(new Date("2026-09-01T00:00:00Z").getDate()).toBe(31);
  });
});

describe("formatDate / fmtDateOnly / fmtDT", () => {
  it("vazio vira travessão", () => {
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate(null)).toBe("—");
    expect(fmtDateOnly("")).toBe("—");
  });

  it("instante completo respeita o fuso local", () => {
    expect(formatDate("2026-09-01T15:30:00Z")).toBe("01/09/2026");
    expect(fmtDT("2026-09-01T15:30:00Z")).toContain("01/09/2026");
  });

  it("dia puro do banco aparece no dia certo (regressão: antes mostrava o dia anterior em UTC-4)", () => {
    expect(formatDate("2026-09-01")).toBe("01/09/2026");
    expect(fmtDateOnly("2026-09-01")).toBe("01/09/2026");
  });
});

describe("gLabel", () => {
  it.each([
    ["M", "Masculino"], ["masculino", "Masculino"],
    ["F", "Feminino"], ["feminino", "Feminino"],
    [undefined, "—"],
  ])("%s → %s", (input, expected) => {
    expect(gLabel(input as never)).toBe(expected);
  });
});

describe("fmtBR e summaryLabel", () => {
  it("fmtBR lê o dia como local (sem deslocar)", () => {
    expect(fmtBR("2026-09-01")).toBe("01/09/2026");
    expect(fmtBR("")).toBe("");
  });

  it.each([
    [undefined, undefined, ""],
    ["2026-09-01", "2026-09-01", "01/09/2026"],
    ["2026-09-01", "2026-09-30", "01/09/2026 — 30/09/2026"],
    ["2026-09-01", undefined, "01/09/2026 — "],
    [undefined, "2026-09-30", "— 30/09/2026"],
  ])("summaryLabel(%s, %s)", (from, to, expected) => {
    expect(summaryLabel(from, to)).toBe(expected);
  });
});

describe("weekdayLabel", () => {
  it("traduz os 7 dias e preserva desconhecidos", () => {
    expect(weekdayLabel("MONDAY")).toBe("Segunda-feira");
    expect(weekdayLabel("SUNDAY")).toBe("Domingo");
    expect(weekdayLabel("FOO")).toBe("FOO");
    expect(weekdayLabel(null)).toBe("—");
  });
});

describe("idade e tempo (relógio fixo)", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00-04:00"));
  });
  afterAll(() => vi.useRealTimers());

  it("ageFrom conta anos completos", () => {
    expect(ageFrom("2000-09-14T12:00:00-04:00")).toBe(26);
    expect(ageFrom("2000-09-16T12:00:00-04:00")).toBe(25);
    expect(ageFrom(null)).toBeNull();
    expect(ageFrom("lixo")).toBeNull();
    expect(ageFrom("2030-01-01T12:00:00-04:00")).toBeNull();
  });

  it("ageFrom com dia puro não erra o dia do aniversário (regressão do deslocamento UTC)", () => {
    expect(ageFrom("2000-09-15")).toBe(26);
    expect(ageFrom("2000-09-16")).toBe(25);
  });

  it("timeDifference descreve anos e meses", () => {
    expect(timeDifference("2026-09-10T12:00:00-04:00")).toBe("menos de 1 mês");
    expect(timeDifference("2026-08-15T12:00:00-04:00")).toBe("1 mês");
    expect(timeDifference("2026-06-15T12:00:00-04:00")).toBe("3 meses");
    expect(timeDifference("2025-09-15T12:00:00-04:00")).toBe("1 ano");
    expect(timeDifference("2024-09-15T12:00:00-04:00")).toBe("2 anos");
    expect(timeDifference("2024-06-15T12:00:00-04:00")).toBe("2 anos e 3 meses");
    expect(timeDifference("2025-08-15T12:00:00-04:00")).toBe("1 ano e 1 mês");
    // mês de nascimento "à frente" do mês atual: empresta 12 meses do ano
    expect(timeDifference("2025-11-15T12:00:00-04:00")).toBe("10 meses");
    expect(timeDifference("2024-11-15T12:00:00-04:00")).toBe("1 ano e 10 meses");
    // data futura não tem diferença
    expect(timeDifference("2030-01-01T12:00:00-04:00")).toBeNull();
    expect(timeDifference(null)).toBeNull();
    expect(timeDifference("lixo")).toBeNull();
    expect(timeDifference("2027-01-01T12:00:00-04:00")).toBeNull();
  });

  it("aliases apontam para a mesma função", () => {
    expect(ageDetailed).toBe(timeDifference);
    expect(tenureFrom).toBe(timeDifference);
  });
});

describe("datas brasileiras", () => {
  it.each([
    ["01/09/2026", true], ["29/02/2024", true],
    ["29/02/2023", false], ["31/04/2020", false], ["32/01/2020", false],
    ["00/01/2020", false], ["01/13/2020", false], ["1/9/2020", false],
    ["01-09-2020", false], ["", false], ["01/09/2/26", false], ["ab/09/2020", false], ["01/ab/2020", false], ["01/09/abcd", false], ["01/01/1899", false], ["01/01/2999", false],
  ])("isValidBRDate(%s) = %s", (value, expected) => {
    expect(isValidBRDate(value)).toBe(expected);
  });

  it("isoToBR e brToISO fazem ida e volta", () => {
    expect(isoToBR("2026-09-01")).toBe("01/09/2026");
    expect(isoToBR("")).toBe("");
    expect(brToISO("01/09/2020")).toBe("2020-09-01");
    expect(brToISO("")).toBe("");
    expect(brToISO(isoToBR("2020-02-29"))).toBe("2020-02-29");
  });

  it("brToISO recusa data inválida", () => {
    expect(() => brToISO("31/02/2020")).toThrow("Data brasileira inválida");
  });
});

describe("fmtDate (instante com fuso)", () => {
  it("vazio vira travessão e respeita o fuso informado", async () => {
    const { fmtDate } = await import("./dateUtils");
    expect(fmtDate(undefined)).toBe("—");
    expect(fmtDate("2026-09-01T03:30:00Z")).toContain("31/08/2026");
    expect(fmtDate(new Date("2026-09-01T03:30:00Z"), "UTC")).toContain("01/09/2026");
  });
});

describe("formatDayBR (dia puro do banco)", () => {
  it("não desloca o dia pelo fuso", async () => {
    const { formatDayBR } = await import("./dateUtils");
    expect(formatDayBR("2026-09-01")).toBe("01/09/2026");
    expect(formatDayBR("2026-09-01T12:00:00Z")).toBe("01/09/2026");
    expect(formatDayBR(null)).toBe("Data a definir");
    expect(formatDayBR("", "—")).toBe("—");
    expect(formatDayBR("lixo")).toBe("Data inválida");
    // fora do formato ISO: converte como instante
    expect(formatDayBR("September 1, 2026 12:00:00")).toBe("01/09/2026");
  });
});
