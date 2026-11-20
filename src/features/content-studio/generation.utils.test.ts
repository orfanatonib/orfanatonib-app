import { describe, expect, it } from "vitest";

import { GenerationJobStatus, generationErrorMessage, generationStatusLabel, isCategoryBusy, isGenerationActive, isStageWorking } from "./generation.utils";
import { ContentStageStatus } from "./types";

describe("generation.utils", () => {
  it("ativo = fila, rodando ou nova tentativa; o resto é terminal", () => {
    for (const s of ["PENDING", "RUNNING", "RETRY_SCHEDULED"]) expect(isGenerationActive({ status: s })).toBe(true);
    for (const s of ["SUCCEEDED", "FAILED", "CANCELLED"]) expect(isGenerationActive({ status: s })).toBe(false);
    expect(isGenerationActive(null)).toBe(false);
  });

  it("todo estado tem rótulo e estado desconhecido não quebra", () => {
    for (const s of Object.values(GenerationJobStatus)) expect(generationStatusLabel(s)).toBeTruthy();
    expect(generationStatusLabel("OUTRO")).toBeTruthy();
  });

  it("mensagem por tipo de erro, com fallback genérico", () => {
    expect(generationErrorMessage({ errorCode: "QUOTA" })).toContain("cota");
    expect(generationErrorMessage({ errorCode: "NETWORK" })).toContain("rede");
    expect(generationErrorMessage({ errorCode: "NOVO_TIPO" })).toContain("Não foi possível gerar");
    expect(generationErrorMessage(null)).toContain("Não foi possível gerar");
  });
});

describe("isCategoryBusy", () => {
  const stages = [
    { id: "a", status: ContentStageStatus.DRAFT },
    { id: "b", status: ContentStageStatus.GENERATING },
    { id: "c", status: ContentStageStatus.NOT_STARTED },
  ];

  it("outra etapa da categoria gerando bloqueia as demais", () => {
    expect(isCategoryBusy(stages, "a", {})).toBe(true);
    expect(isCategoryBusy(stages, "c", {})).toBe(true);
  });

  it("a própria etapa gerando não se bloqueia", () => {
    expect(isCategoryBusy(stages, "b", {})).toBe(false);
  });

  it("job ativo conhecido pelo stream também conta", () => {
    expect(isCategoryBusy([stages[0], stages[2]], "a", { c: { status: GenerationJobStatus.RUNNING } })).toBe(true);
    expect(isCategoryBusy([stages[0], stages[2]], "a", { c: { status: GenerationJobStatus.SUCCEEDED } })).toBe(false);
  });
});

describe("isStageWorking / progressJobFor", () => {
  const job = (status: GenerationJobStatus) => ({ status });

  it("etapa em rascunho com job de imagens ativo continua trabalhando", () => {
    expect(isStageWorking({ status: ContentStageStatus.DRAFT }, job(GenerationJobStatus.RUNNING), false)).toBe(true);
  });

  it("a ponte texto → imagens mantém o painel", () => {
    expect(isStageWorking({ status: ContentStageStatus.DRAFT }, job(GenerationJobStatus.SUCCEEDED), true)).toBe(true);
  });

  it("só termina quando nada está ativo", () => {
    expect(isStageWorking({ status: ContentStageStatus.DRAFT }, job(GenerationJobStatus.SUCCEEDED), false)).toBe(false);
    expect(isStageWorking({ status: ContentStageStatus.DRAFT }, null, false)).toBe(false);
  });
});
