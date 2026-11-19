import { PROMPT_COMPLEMENTARY_HEADER, PROMPT_MAX_LENGTH, PROMPT_MIN_LENGTH } from "./constants";
import type { ContentAudience, ContentStageType } from "../types";
import type { PersistedPromptDraft, PersistedPromptDrafts, PromptAudienceDrafts, PromptLocalDraft, PromptLocalDrafts, PromptPreference } from "./types";

/** O texto que aparece no campo: o digitado (ainda não salvo) ou o salvo. */
export function resolvePromptDraftValue(draft: PromptLocalDraft | undefined, preference: PromptPreference | undefined): string {
  return draft?.value ?? preference?.customPrompt ?? "";
}

export function editPromptDraft(current: PromptLocalDraft | undefined, base: PromptPreference, value: string): PromptLocalDraft {
  return { base: current?.base ?? base, value };
}

/** O que mudou no servidor desde que o rascunho começou? (outra aba ou aparelho salvou antes) */
export function isPromptDraftOutdated(draft: PromptLocalDraft | undefined, current: PromptPreference | undefined): boolean {
  return Boolean(draft && current && draft.base.lockVersion !== current.lockVersion);
}

/** Mantém o texto digitado e adota a versão atual do servidor como nova base. */
export function rebasePromptDraft(draft: PromptLocalDraft, current: PromptPreference): PromptLocalDraft {
  return { value: draft.value, base: current };
}

/**
 * Depois de um salvamento: some o rascunho que foi enviado; se o usuário digitou mais durante o envio,
 * o rascunho novo continua, agora baseado na versão recém-salva.
 */
export function acknowledgePromptDraft(drafts: PromptLocalDrafts, sent: PromptLocalDraft | undefined, saved: PromptPreference): PromptLocalDrafts {
  const current = drafts[saved.stage];
  if (current === sent) {
    const next = { ...drafts };
    delete next[saved.stage];
    return next;
  }
  if (!current || current.base !== sent?.base) return drafts;
  return { ...drafts, [saved.stage]: { ...current, base: saved } };
}

/** Prévia local (texto ainda não salvo) com o mesmo molde que a API usa. */
export function composeEffectivePromptPreview(basePrompt: string, customValue: string): string {
  const trimmed = customValue.trim();
  return trimmed ? `${basePrompt}\n\n${PROMPT_COMPLEMENTARY_HEADER}\n${trimmed}` : basePrompt;
}

/** O que a IA recebe: o texto salvo vem composto pela API; o digitado é composto aqui. */
export function resolveEffectivePromptPreview(preference: PromptPreference, value: string): string {
  if (value.trim() === (preference.customPrompt ?? "").trim() && preference.effectivePrompt) return preference.effectivePrompt;
  return composeEffectivePromptPreview(preference.basePrompt, value);
}

export function isValidComplementaryPrompt(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= PROMPT_MIN_LENGTH && value.length <= PROMPT_MAX_LENGTH;
}

/** O texto repete as regras oficiais (elas já vão à IA; repetir só gasta o limite)? */
export function hasDuplicatedBasePrompt(value: string, basePrompt: string): boolean {
  const base = basePrompt.trim();
  if (!value.trim()) return false;
  return (base.length >= 20 && value.includes(base)) || value.includes(PROMPT_COMPLEMENTARY_HEADER);
}

export function stripDuplicatedBasePrompt(value: string, basePrompt: string): string {
  let cleaned = value;
  const base = basePrompt.trim();
  if (base) cleaned = cleaned.split(base).join("");
  return cleaned.split(PROMPT_COMPLEMENTARY_HEADER).join("").trim();
}

// ---------- rascunhos guardados no navegador ----------

export function isPersistedPromptDrafts(value: unknown): value is PersistedPromptDrafts {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(
    (audience) =>
      Boolean(audience) &&
      typeof audience === "object" &&
      Object.values(audience as object).every((item) => Boolean(item) && typeof item === "object" && typeof (item as PersistedPromptDraft).value === "string"),
  );
}

export function toPersistedPromptDrafts(drafts: PromptAudienceDrafts): PersistedPromptDrafts {
  const result: PersistedPromptDrafts = {};
  for (const [audience, stages] of Object.entries(drafts) as Array<[ContentAudience, PromptLocalDrafts | undefined]>) {
    for (const [stage, draft] of Object.entries(stages ?? {}) as Array<[ContentStageType, PromptLocalDraft | undefined]>) {
      if (!draft) continue;
      result[audience] = { ...result[audience], [stage]: { value: draft.value, lockVersion: draft.base.lockVersion } };
    }
  }
  return result;
}

/** Reconstrói os rascunhos quando as orientações em que eles se baseavam voltam a carregar. */
export function restorePromptDrafts(
  persisted: Partial<Record<ContentStageType, PersistedPromptDraft>> | undefined,
  preferences: readonly PromptPreference[],
): PromptLocalDrafts {
  const result: PromptLocalDrafts = {};
  for (const preference of preferences) {
    const saved = persisted?.[preference.stage];
    if (!saved || saved.value === (preference.customPrompt ?? "")) continue;
    result[preference.stage] = { value: saved.value, base: { ...preference, lockVersion: saved.lockVersion } };
  }
  return result;
}
