import { describe, expect, it } from "vitest";

import { GenerationJobStatus, generationErrorMessage, generationStatusLabel, isGenerationActive } from "./generation.utils";

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
