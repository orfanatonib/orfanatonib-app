import { describe, expect, it } from "vitest";

import { QUICK_STATUS_FILTERS, audienceNames, displayedRowsLabel, formatMaterialsCount, pluralize, stageProgress } from "./production.utils";
import { ContentAudience, ContentPackageStatus } from "./types";

describe("production.utils", () => {
  it("pluralize e contagem de materiais", () => {
    expect(pluralize(1, "faixa", "faixas")).toBe("faixa");
    expect(pluralize(0, "faixa", "faixas")).toBe("faixas");
    expect(formatMaterialsCount(1)).toBe("1 material para visita");
    expect(formatMaterialsCount(8)).toBe("8 materiais para visita");
    expect(formatMaterialsCount(0)).toBe("0 materiais para visita");
  });

  it("andamento: porcentagem, limites e rótulo no singular/plural", () => {
    expect(stageProgress({ approvedStagesCount: 2, requiredStagesCount: 5 })).toMatchObject({ percent: 40, label: "2 de 5 etapas concluídas" });
    expect(stageProgress({ approvedStagesCount: 1, requiredStagesCount: 1 })).toMatchObject({ percent: 100, label: "1 de 1 etapa concluída" });
    expect(stageProgress({ approvedStagesCount: 9, requiredStagesCount: 4 }).approved).toBe(4);
    expect(stageProgress({ approvedStagesCount: 0, requiredStagesCount: 0 })).toMatchObject({ percent: 0, label: "Sem etapas obrigatórias" });
  });

  it("nomes das faixas pelo catálogo, com a chave como reserva", () => {
    const catalog = [{ audience: ContentAudience.CHILD, name: "Crianças" }] as never;
    expect(audienceNames([ContentAudience.CHILD, ContentAudience.TEEN], catalog)).toEqual(["Crianças", "TEEN"]);
  });

  it("atalhos de situação começam em 'Todos' e não repetem situação", () => {
    expect(QUICK_STATUS_FILTERS[0]).toEqual({ label: "Todos", status: "" });
    const statuses = QUICK_STATUS_FILTERS.map((f) => f.status);
    expect(new Set(statuses).size).toBe(statuses.length);
    expect(statuses).toContain(ContentPackageStatus.IN_REVIEW);
  });

  it("paginação em português", () => {
    expect(displayedRowsLabel({ from: 1, to: 8, count: 8 })).toBe("1–8 de 8");
    expect(displayedRowsLabel({ from: 1, to: 10, count: -1 })).toBe("1–10 de mais de 10");
  });
});
