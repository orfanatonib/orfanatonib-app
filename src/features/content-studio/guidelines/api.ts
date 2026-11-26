import api from "@/config/axiosConfig";

import { PROMPT_PREFERENCES_ENDPOINT } from "./constants";
import type { ContentAudience, ContentStageType } from "../types";
import type { PromptPreference } from "./types";

export async function getPromptPreferences(audience: ContentAudience, signal?: AbortSignal): Promise<PromptPreference[]> {
  const { data } = await api.get<PromptPreference[]>(PROMPT_PREFERENCES_ENDPOINT, { params: { audience }, signal, skipGlobalError: true });
  return data;
}

/** `lockVersion` nulo = a etapa nunca foi salva; a API recusa (409) se outra aba/aparelho salvou antes. */
export async function savePromptPreference(
  audience: ContentAudience,
  stage: ContentStageType,
  customPrompt: string,
  lockVersion: number | null,
): Promise<PromptPreference> {
  const { data } = await api.patch<PromptPreference>(
    PROMPT_PREFERENCES_ENDPOINT,
    { audience, stage, customPrompt, lockVersion: lockVersion ?? undefined },
    { skipGlobalError: true },
  );
  return data;
}

export async function resetPromptPreference(audience: ContentAudience, stage: ContentStageType, lockVersion: number | null): Promise<PromptPreference> {
  const { data } = await api.post<PromptPreference>(
    `${PROMPT_PREFERENCES_ENDPOINT}/reset`,
    { audience, stage, lockVersion: lockVersion ?? undefined },
    { skipGlobalError: true },
  );
  return data;
}
