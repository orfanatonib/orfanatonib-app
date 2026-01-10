import { RootState } from '../index';
import { FeatureFlag } from './featureFlagsSlice';

// Selector to get all feature flags
export const selectAllFeatureFlags = (state: RootState): FeatureFlag[] =>
    state.featureFlags.flags;

// Selector to get loading state
export const selectFeatureFlagsLoading = (state: RootState): boolean =>
    state.featureFlags.loading;

// Selector to get error state
export const selectFeatureFlagsError = (state: RootState): string | null =>
    state.featureFlags.error;

// Selector to get last fetched timestamp
export const selectFeatureFlagsLastFetched = (state: RootState): number | null =>
    state.featureFlags.lastFetched;

// Selector to get enabled feature flags only
export const selectEnabledFeatureFlags = (state: RootState): FeatureFlag[] =>
    state.featureFlags.flags.filter(flag => flag.enabled);

// Selector to get a specific feature flag by key
export const selectFeatureFlagByKey = (key: string) => (state: RootState): FeatureFlag | undefined =>
    state.featureFlags.flags.find(flag => flag.key === key);

// Selector to check if a specific feature is enabled
export const selectIsFeatureEnabled = (key: string) => (state: RootState): boolean => {
    const flag = state.featureFlags.flags.find(flag => flag.key === key);
    return flag?.enabled ?? false;
};

// Selector to get feature flags by environment
export const selectFeatureFlagsByEnvironment = (environment: string) => (state: RootState): FeatureFlag[] =>
    state.featureFlags.flags.filter(flag => flag.environment === environment);
