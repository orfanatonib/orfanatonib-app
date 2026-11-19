import type { ContentAudience, ContentStageType } from "../types";

/** Uma etapa de um público: regras oficiais + a orientação própria do administrador (se houver). */
export interface PromptPreference {
  stage: ContentStageType;
  basePrompt: string;
  customPrompt: string | null;
  effectivePrompt: string;
  /** `null` enquanto o administrador nunca salvou nem restaurou esta etapa. */
  lockVersion: number | null;
  updatedAt: string | null;
}

/** Texto digitado e ainda não salvo, junto da versão em que ele se baseia. */
export interface PromptLocalDraft {
  value: string;
  base: PromptPreference;
}
export type PromptLocalDrafts = Partial<Record<ContentStageType, PromptLocalDraft>>;
export type PromptAudienceDrafts = Partial<Record<ContentAudience, PromptLocalDrafts>>;

export interface PersistedPromptDraft {
  value: string;
  lockVersion: number | null;
}
export type PersistedPromptDrafts = Partial<Record<ContentAudience, Partial<Record<ContentStageType, PersistedPromptDraft>>>>;

export interface SavePromptVariables {
  item: PromptPreference;
  draft: PromptLocalDraft;
}

export enum PromptFeedbackSeverity {
  SUCCESS = "success",
  ERROR = "error",
}
export interface PromptFeedback {
  severity: PromptFeedbackSeverity;
  text: string;
}
