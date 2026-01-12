import { RootState } from '../slices';
import { FeatureFlag } from '../slices/feature-flags/featureFlagsSlice';

export const selectAllFeatureFlags = (state: RootState): FeatureFlag[] =>
    state.featureFlags.flags;

export const selectFeatureFlagsLoading = (state: RootState): boolean =>
    state.featureFlags.loading;

export const selectFeatureFlagsError = (state: RootState): string | null =>
    state.featureFlags.error;

export const selectFeatureFlagsLastFetched = (state: RootState): number | null =>
    state.featureFlags.lastFetched;

export const selectEnabledFeatureFlags = (state: RootState): FeatureFlag[] =>
    state.featureFlags.flags.filter(flag => flag.enabled);

export const selectFeatureFlagByKey = (key: string) => (state: RootState): FeatureFlag | undefined =>
    state.featureFlags.flags.find(flag => flag.key === key);

export const selectIsFeatureEnabled = (key: string) => (state: RootState): boolean => {
    const flag = state.featureFlags.flags.find(flag => flag.key === key);
    return flag?.enabled ?? false;
};

export const selectFeatureFlagsByEnvironment = (environment: string) => (state: RootState): FeatureFlag[] =>
    state.featureFlags.flags.filter(flag => flag.environment === environment);
