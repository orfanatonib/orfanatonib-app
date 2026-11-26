import { describe, expect, it } from "vitest";

import {
  acknowledgePromptDraft,
  composeEffectivePromptPreview,
  editPromptDraft,
  hasDuplicatedBasePrompt,
  isPersistedPromptDrafts,
  isPromptDraftOutdated,
  isValidComplementaryPrompt,
  rebasePromptDraft,
  resolveEffectivePromptPreview,
  resolvePromptDraftValue,
  restorePromptDrafts,
  stripDuplicatedBasePrompt,
  toPersistedPromptDrafts,
} from "./drafts";
import { ContentAudience, ContentStageType } from "../types";
import type { PromptPreference } from "./types";

const pref = (over: Partial<PromptPreference> = {}): PromptPreference => ({
  stage: ContentStageType.LESSON,
  basePrompt: "REGRAS OFICIAIS DA ETAPA DE LIÇÃO PARA ESTE PÚBLICO",
  customPrompt: null,
  effectivePrompt: "REGRAS OFICIAIS DA ETAPA DE LIÇÃO PARA ESTE PÚBLICO",
  lockVersion: null,
  updatedAt: null,
  ...over,
});

describe("rascunhos de orientação", () => {
  it("o campo mostra o digitado, senão o salvo, senão vazio", () => {
    const base = pref({ customPrompt: "salvo" });
    expect(resolvePromptDraftValue(undefined, base)).toBe("salvo");
    expect(resolvePromptDraftValue({ value: "digitado", base }, base)).toBe("digitado");
    expect(resolvePromptDraftValue(undefined, undefined)).toBe("");
  });

  it("editar mantém a base do primeiro rascunho; versão mudada no servidor marca como desatualizado", () => {
    const first = editPromptDraft(undefined, pref({ lockVersion: 1 }), "a");
    const second = editPromptDraft(first, pref({ lockVersion: 2 }), "ab");
    expect(second.base.lockVersion).toBe(1);
    expect(isPromptDraftOutdated(second, pref({ lockVersion: 2 }))).toBe(true);
    expect(isPromptDraftOutdated(second, pref({ lockVersion: 1 }))).toBe(false);
    expect(rebasePromptDraft(second, pref({ lockVersion: 2 })).base.lockVersion).toBe(2);
  });

  it("depois de salvar o rascunho some; o que foi digitado durante o envio continua sobre a nova base", () => {
    const sent = editPromptDraft(undefined, pref({ lockVersion: 1 }), "texto enviado");
    const saved = pref({ lockVersion: 2, customPrompt: "texto enviado" });
    expect(acknowledgePromptDraft({ LESSON: sent }, sent, saved)).toEqual({});
    const typedMore = { ...sent, value: "texto enviado e mais um pouco" };
    const next = acknowledgePromptDraft({ LESSON: typedMore }, sent, saved);
    expect(next.LESSON?.base).toBe(saved);
    expect(next.LESSON?.value).toBe("texto enviado e mais um pouco");
  });

  it("prévia: o salvo vem da API; o digitado é composto com o mesmo molde", () => {
    const saved = pref({ customPrompt: "meu texto", effectivePrompt: "DA API" });
    expect(resolveEffectivePromptPreview(saved, "meu texto")).toBe("DA API");
    expect(resolveEffectivePromptPreview(saved, "outro texto")).toBe(`${saved.basePrompt}\n\nPERSONALIZAÇÃO DO ADMINISTRADOR:\noutro texto`);
    expect(composeEffectivePromptPreview("BASE", "  ")).toBe("BASE");
  });

  it("validade: mínimo de 10 e máximo de 6.000 caracteres", () => {
    expect(isValidComplementaryPrompt("curto")).toBe(false);
    expect(isValidComplementaryPrompt("Use frases curtas.")).toBe(true);
    expect(isValidComplementaryPrompt("a".repeat(6_001))).toBe(false);
  });

  it("detecta e remove as regras oficiais coladas na orientação", () => {
    const base = "REGRAS OFICIAIS DA ETAPA DE LIÇÃO PARA ESTE PÚBLICO";
    const value = `${base}\n\nUse exemplos de abrigo.`;
    expect(hasDuplicatedBasePrompt(value, base)).toBe(true);
    expect(hasDuplicatedBasePrompt("Use exemplos de abrigo.", base)).toBe(false);
    expect(stripDuplicatedBasePrompt(value, base)).toBe("Use exemplos de abrigo.");
  });

  it("guarda e restaura rascunhos, descartando o que já é igual ao salvo", () => {
    const base = pref({ lockVersion: 3, customPrompt: "salvo" });
    const persisted = toPersistedPromptDrafts({ [ContentAudience.TEEN]: { LESSON: { value: "digitado", base } } });
    expect(persisted).toEqual({ TEEN: { LESSON: { value: "digitado", lockVersion: 3 } } });
    expect(isPersistedPromptDrafts(persisted)).toBe(true);
    expect(isPersistedPromptDrafts({ TEEN: { LESSON: { value: 1 } } })).toBe(false);
    const restored = restorePromptDrafts(persisted.TEEN, [base]);
    expect(restored.LESSON).toMatchObject({ value: "digitado", base: { lockVersion: 3 } });
    expect(restorePromptDrafts({ LESSON: { value: "salvo", lockVersion: 3 } }, [base])).toEqual({});
  });
});
