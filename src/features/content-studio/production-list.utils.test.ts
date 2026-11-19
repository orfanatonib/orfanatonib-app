import { describe, expect, it } from "vitest";

import {
  canArchivePackage,
  canExportPackage,
  nextStep,
  productionQuery,
  readProductionListState,
  relativeTimeLabel,
  stageTone,
  writeProductionListState,
} from "./production-list.utils";
import { ContentAudience, ContentPackageStatus, ContentStageStatus } from "./types";

const counts = { failedStagesCount: 0, generatingStagesCount: 0, stagesWithContentCount: 0 };

describe("estado da URL", () => {
  it("lê valores válidos e ignora os inválidos", () => {
    const state = readProductionListState(new URLSearchParams("situacao=IN_REVIEW&faixa=TEEN&ordem=theme:ASC&busca=Davi&pagina=3"));
    expect(state).toEqual({ status: ContentPackageStatus.IN_REVIEW, audience: ContentAudience.TEEN, sort: "theme:ASC", search: "Davi", page: 3 });
    const bad = readProductionListState(new URLSearchParams("situacao=X&faixa=Y&ordem=z&pagina=-4"));
    expect(bad).toEqual({ status: "", audience: "", sort: "updatedAt:DESC", search: "", page: 1 });
  });
  it("grava só o que difere do padrão e preserva parâmetros alheios", () => {
    const base = { status: "" as const, audience: "" as const, sort: "updatedAt:DESC", search: "", page: 1 };
    expect(writeProductionListState(new URLSearchParams("outro=1"), base).toString()).toBe("outro=1");
    const written = writeProductionListState(new URLSearchParams(), { ...base, status: ContentPackageStatus.ARCHIVED, search: " Davi ", page: 2 });
    expect(written.get("situacao")).toBe("ARCHIVED");
    expect(written.get("busca")).toBe("Davi");
    expect(written.get("pagina")).toBe("2");
    expect(written.has("ordem")).toBe(false);
  });
  it("monta a consulta da API com ordenação", () => {
    expect(productionQuery({ status: "", audience: ContentAudience.BABY, sort: "createdAt:ASC", search: " ", page: 2 }, 12)).toEqual({
      page: 2,
      limit: 12,
      search: undefined,
      status: undefined,
      audience: ContentAudience.BABY,
      sort: "createdAt",
      order: "ASC",
    });
  });
});

describe("cartão", () => {
  it("tom de cada situação de etapa", () => {
    expect(stageTone(ContentStageStatus.APPROVED)).toBe("done");
    expect(stageTone(ContentStageStatus.GENERATING)).toBe("working");
    expect(stageTone(ContentStageStatus.FAILED)).toBe("problem");
    expect(stageTone(ContentStageStatus.STALE)).toBe("stale");
    expect(stageTone(ContentStageStatus.NOT_STARTED)).toBe("todo");
  });
  it("próximo passo: falha e geração mandam; depois a situação", () => {
    const base = { status: ContentPackageStatus.IN_PROGRESS, ...counts };
    expect(nextStep({ ...base, failedStagesCount: 1, generatingStagesCount: 1 }).label).toBe("Resolver falha na geração");
    expect(nextStep({ ...base, generatingStagesCount: 1 }).label).toBe("Acompanhar geração");
    expect(nextStep(base).label).toBe("Começar produção");
    expect(nextStep({ ...base, stagesWithContentCount: 2 }).label).toBe("Continuar produção");
    expect(nextStep({ ...base, status: ContentPackageStatus.IN_REVIEW }).label).toBe("Revisar material");
    expect(nextStep({ ...base, status: ContentPackageStatus.ARCHIVED, failedStagesCount: 3 }).label).toBe("Ver material");
  });
  it("PDF e arquivar", () => {
    expect(canExportPackage({ stagesWithContentCount: 0 })).toBe(false);
    expect(canExportPackage({ stagesWithContentCount: 1 })).toBe(true);
    expect(canArchivePackage({ status: ContentPackageStatus.IN_PROGRESS, generatingStagesCount: 0 })).toBe(true);
    expect(canArchivePackage({ status: ContentPackageStatus.IN_PROGRESS, generatingStagesCount: 1 })).toBe(false);
    expect(canArchivePackage({ status: ContentPackageStatus.ARCHIVED, generatingStagesCount: 0 })).toBe(false);
  });
  it("tempo relativo em português", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    expect(relativeTimeLabel("2026-01-10T11:59:50Z", now)).toBe("agora há pouco");
    expect(relativeTimeLabel("2026-01-10T11:30:00Z", now)).toBe("há 30 min");
    expect(relativeTimeLabel("2026-01-10T11:00:00Z", now)).toBe("há 1 hora");
    expect(relativeTimeLabel("2026-01-07T12:00:00Z", now)).toBe("há 3 dias");
    expect(relativeTimeLabel("2025-10-01T12:00:00Z", now)).toBe("há 3 meses");
  });
});
