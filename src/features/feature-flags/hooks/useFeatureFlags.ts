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

    useEffect(() => {
        if (autoFetch) {
            refetch();
        }
    }, [autoFetch]);

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

export const useEnabledFeatureFlags = (): FeatureFlag[] => {
    return useSelector(selectEnabledFeatureFlags);
};

export const useFeatureFlag = (key: string): FeatureFlag | undefined => {
    return useSelector(selectFeatureFlagByKey(key));
};

export const useIsFeatureEnabled = (key: string): boolean => {
    return useSelector(selectIsFeatureEnabled(key));
};

export const useFeatureFlagsByEnvironment = (environment: string): FeatureFlag[] => {
    return useSelector(selectFeatureFlagsByEnvironment(environment));
};
