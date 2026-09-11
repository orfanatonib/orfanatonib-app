import type { AxiosRequestConfig } from 'axios';

import apiAxios from '@/config/axiosConfig';

import { FEATURE_FLAGS_ENDPOINT } from './constants';
import type {
  CreateFeatureFlagRequest,
  FeatureFlagQuery,
  FeatureFlagResponse,
  FeatureFlagsMap,
  FeatureFlagStats,
  PaginatedFeatureFlags,
  UpdateFeatureFlagRequest,
} from './types';

function flagPath(key: string): string {
  return `${FEATURE_FLAGS_ENDPOINT}/${encodeURIComponent(key)}`;
}

export async function apiListFeatureFlags(
  query: FeatureFlagQuery,
  config?: AxiosRequestConfig,
): Promise<PaginatedFeatureFlags> {
  const response = await apiAxios.get<PaginatedFeatureFlags>(
    FEATURE_FLAGS_ENDPOINT,
    { ...config, params: query },
  );
  return response.data;
}

export async function apiGetFeatureFlagsMap(
  config?: AxiosRequestConfig,
): Promise<FeatureFlagsMap> {
  const response = await apiAxios.get<FeatureFlagsMap>(
    `${FEATURE_FLAGS_ENDPOINT}/map`,
    config,
  );
  return response.data;
}

export async function apiGetFeatureFlagStats(
  config?: AxiosRequestConfig,
): Promise<FeatureFlagStats> {
  const response = await apiAxios.get<FeatureFlagStats>(
    `${FEATURE_FLAGS_ENDPOINT}/stats`,
    config,
  );
  return response.data;
}

export async function apiCreateFeatureFlag(
  payload: CreateFeatureFlagRequest,
): Promise<FeatureFlagResponse> {
  const response = await apiAxios.post<FeatureFlagResponse>(
    FEATURE_FLAGS_ENDPOINT,
    payload,
  );
  return response.data;
}

export async function apiUpdateFeatureFlag(
  key: string,
  payload: UpdateFeatureFlagRequest,
): Promise<FeatureFlagResponse> {
  const response = await apiAxios.patch<FeatureFlagResponse>(
    flagPath(key),
    payload,
  );
  return response.data;
}

export async function apiToggleFeatureFlag(
  key: string,
): Promise<FeatureFlagResponse> {
  const response = await apiAxios.patch<FeatureFlagResponse>(
    `${flagPath(key)}/toggle`,
  );
  return response.data;
}

export async function apiDeleteFeatureFlag(key: string): Promise<void> {
  await apiAxios.delete(flagPath(key));
}

export async function apiSyncFeatureFlagCatalog(): Promise<{
  message: string;
  count: number;
  created: FeatureFlagResponse[];
  retired: string[];
}> {
  const response = await apiAxios.post<{
    message: string;
    count: number;
    created: FeatureFlagResponse[];
    retired: string[];
  }>(`${FEATURE_FLAGS_ENDPOINT}/seed`);
  return response.data;
}
