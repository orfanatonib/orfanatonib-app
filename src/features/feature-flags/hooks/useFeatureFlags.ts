import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/slices';
import {
    fetchFeatureFlags,
    clearError,
    resetFeatureFlags,
} from '@/store/slices/feature-flags/featureFlagsSlice';
import {
    selectAllFeatureFlags,
    selectFeatureFlagsLoading,
    selectFeatureFlagsError,
    selectFeatureFlagsLastFetched,
    selectEnabledFeatureFlags,
    selectFeatureFlagByKey,
    selectIsFeatureEnabled,
    selectFeatureFlagsByEnvironment,
} from '@/store/selectors/featureFlagsSelectors';
import type { FeatureFlag } from '@/store/slices/feature-flags/featureFlagsSlice';

interface UseFeatureFlagsOptions {
    autoFetch?: boolean;
    refetchInterval?: number; // in milliseconds
}

interface UseFeatureFlagsReturn {
    flags: FeatureFlag[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    refetch: () => void;
    clearError: () => void;
    reset: () => void;
}

/**
 * Custom hook to manage feature flags
 * @param options - Configuration options
 * @param options.autoFetch - Automatically fetch flags on mount (default: true)
 * @param options.refetchInterval - Auto-refetch interval in milliseconds (optional)
 * @returns Feature flags state and control functions
 */
export const useFeatureFlags = (options: UseFeatureFlagsOptions = {}): UseFeatureFlagsReturn => {
    const { autoFetch = true, refetchInterval } = options;
    const dispatch = useDispatch<AppDispatch>();

    const flags = useSelector(selectAllFeatureFlags);
    const loading = useSelector(selectFeatureFlagsLoading);
    const error = useSelector(selectFeatureFlagsError);
    const lastFetched = useSelector(selectFeatureFlagsLastFetched);

    const refetch = () => {
        dispatch(fetchFeatureFlags());
    };

    const handleClearError = () => {
        dispatch(clearError());
    };

    const reset = () => {
        dispatch(resetFeatureFlags());
    };

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            refetch();
        }
    }, [autoFetch]);

    // Auto-refetch interval
    useEffect(() => {
        if (refetchInterval && refetchInterval > 0) {
            const intervalId = setInterval(() => {
                refetch();
            }, refetchInterval);

            return () => clearInterval(intervalId);
        }
    }, [refetchInterval]);

    return {
        flags,
        loading,
        error,
        lastFetched,
        refetch,
        clearError: handleClearError,
        reset,
    };
};

/**
 * Hook to get enabled feature flags only
 */
export const useEnabledFeatureFlags = (): FeatureFlag[] => {
    return useSelector(selectEnabledFeatureFlags);
};

/**
 * Hook to get a specific feature flag by key
 * @param key - Feature flag key
 */
export const useFeatureFlag = (key: string): FeatureFlag | undefined => {
    return useSelector(selectFeatureFlagByKey(key));
};

/**
 * Hook to check if a feature is enabled
 * @param key - Feature flag key
 * @returns true if the feature is enabled, false otherwise
 */
export const useIsFeatureEnabled = (key: string): boolean => {
    return useSelector(selectIsFeatureEnabled(key));
};

/**
 * Hook to get feature flags by environment
 * @param environment - Environment name (e.g., 'staging', 'production')
 */
export const useFeatureFlagsByEnvironment = (environment: string): FeatureFlag[] => {
    return useSelector(selectFeatureFlagsByEnvironment(environment));
};
