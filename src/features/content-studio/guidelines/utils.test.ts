import { describe, expect, it } from "vitest";

import { firstName, isClearingSavedPrompt, promptCustomisationSummary, promptSavedLabel, promptSummaryLabel, promptValidationMessage } from "./utils";
import { ContentStageType } from "../types";
import type { PromptPreference } from "./types";

const pref = (customPrompt: string | null): PromptPreference => ({
  stage: ContentStageType.LESSON,
  basePrompt: "b",
  customPrompt,
  effectivePrompt: "b",
  lockVersion: null,
  updatedAt: null,
});

describe("utils das orientações", () => {
  it("resumo e rótulo", () => {
    expect(promptCustomisationSummary([pref("x"), pref(null), pref("  ")])).toEqual({ customised: 1, total: 3 });
    expect(promptSummaryLabel({ customised: 0, total: 6 })).toBe("Todas as etapas no padrão oficial");
    expect(promptSummaryLabel({ customised: 1, total: 6 })).toBe("1 etapa personalizada de 6");
    expect(promptSummaryLabel({ customised: 3, total: 6 })).toBe("3 etapas personalizadas de 6");
    expect(promptSummaryLabel({ customised: 0, total: 0 })).toBe("");
  });
  it("apagar o que estava salvo é voltar ao padrão", () => {
    expect(isClearingSavedPrompt("  ", pref("salvo"))).toBe(true);
    expect(isClearingSavedPrompt("", pref(null))).toBe(false);
    expect(isClearingSavedPrompt("novo", pref("salvo"))).toBe(false);
  });
  it("mensagem de validação", () => {
    expect(promptValidationMessage("")).toBeNull();
    expect(promptValidationMessage("curto")).toMatch(/pelo menos 10/);
    expect(promptValidationMessage("a".repeat(6_001))).toMatch(/6000/);
    expect(promptValidationMessage("Use frases curtas.")).toBeNull();
  });
  it("data de salvamento e primeiro nome", () => {
    expect(promptSavedLabel(null)).toBe("");
    expect(promptSavedLabel("lixo")).toBe("");
    expect(promptSavedLabel("2026-01-02T15:30:00Z")).toMatch(/^salva em .+ às \d{2}:\d{2}$/);
    expect(firstName("Maria da Silva")).toBe("Maria");
    expect(firstName(null)).toBe("");
  });
});
