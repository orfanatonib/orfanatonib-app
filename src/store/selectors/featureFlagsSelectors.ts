import type { FeatureFlagsMap } from '@/features/feature-flags/types';

import type { RootState } from '../slices';

export const selectAllFeatureFlags = (state: RootState): FeatureFlagsMap =>
  state.featureFlags.flags;

export const selectFeatureFlagsLoading = (state: RootState): boolean =>
  state.featureFlags.loading;

export const selectFeatureFlagsError = (state: RootState): string | null =>
  state.featureFlags.error;

export const selectFeatureFlagsLastFetched = (
  state: RootState,
): number | null => state.featureFlags.lastFetched;

export const selectIsFeatureEnabled =
  (key: string) =>
  (state: RootState): boolean =>
    state.featureFlags.flags[key] ?? false;
