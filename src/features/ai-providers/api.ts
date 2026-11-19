import apiAxios from '@/config/axiosConfig';
import {
  AI_PROVIDER_SETTINGS_ENDPOINT,
  AI_USAGE_ENDPOINT,
  GEMINI_HEALTH_ENDPOINT,
  OPENAI_HEALTH_ENDPOINT,
  GEMINI_MODELS_ENDPOINT,
  OPENAI_MODELS_ENDPOINT,
} from './constants';
import { LlmProviderType } from './types';
import type {
  AiProviderHealthResult,
  AiProviderSettings,
  AiUsageResponse,
  GeminiModelsResponse,
  SaveAiProviderSettingsRequest,
  OpenAiModelsResponse,
} from './types';
import { publicAiProviderSettings } from './utils';

export async function apiGetOpenAiModels(signal?: AbortSignal): Promise<OpenAiModelsResponse> {
  return (await apiAxios.get<OpenAiModelsResponse>(OPENAI_MODELS_ENDPOINT, { signal })).data;
}

export async function apiGetGeminiModels(signal?: AbortSignal): Promise<GeminiModelsResponse> {
  return (await apiAxios.get<GeminiModelsResponse>(GEMINI_MODELS_ENDPOINT, { signal })).data;
}

export async function apiGetAiProviderSettings(signal?: AbortSignal): Promise<AiProviderSettings> {
  return publicAiProviderSettings(
    (
      await apiAxios.get<AiProviderSettings>(AI_PROVIDER_SETTINGS_ENDPOINT, {
        skipGlobalError: true,
        signal,
      })
    ).data
  );
}

export async function apiSaveAiProviderSettings(
  settings: SaveAiProviderSettingsRequest
): Promise<AiProviderSettings> {
  return publicAiProviderSettings(
    (
      await apiAxios.put<AiProviderSettings>(AI_PROVIDER_SETTINGS_ENDPOINT, settings, {
        skipGlobalError: true,
      })
    ).data
  );
}

export async function apiCheckProviderHealth(
  provider: LlmProviderType
): Promise<AiProviderHealthResult> {
  const endpoint =
    provider === LlmProviderType.OPENAI ? OPENAI_HEALTH_ENDPOINT : GEMINI_HEALTH_ENDPOINT;
  return (await apiAxios.post<AiProviderHealthResult>(endpoint, undefined, { skipGlobalError: true }))
    .data;
}

export async function apiGetAiUsage(days: number, signal?: AbortSignal): Promise<AiUsageResponse> {
  return (
    await apiAxios.get<AiUsageResponse>(AI_USAGE_ENDPOINT, {
      params: { days },
      skipGlobalError: true,
      signal,
    })
  ).data;
}
