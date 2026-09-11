import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch } from '@/store/slices';
import {
  selectAllFeatureFlags,
  selectFeatureFlagsError,
  selectFeatureFlagsLastFetched,
  selectFeatureFlagsLoading,
  selectIsFeatureEnabled,
} from '@/store/selectors/featureFlagsSelectors';
import {
  clearError,
  fetchFeatureFlags,
  resetFeatureFlags,
} from '@/store/slices/feature-flags/featureFlagsSlice';

import type { FeatureFlagsMap } from '../types';

export interface UseFeatureFlagsReturn {
  flags: FeatureFlagsMap;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  refetch: () => void;
  clearError: () => void;
  reset: () => void;
}

export function useFeatureFlags(): UseFeatureFlagsReturn {
  const dispatch = useDispatch<AppDispatch>();
  const flags = useSelector(selectAllFeatureFlags);
  const loading = useSelector(selectFeatureFlagsLoading);
  const error = useSelector(selectFeatureFlagsError);
  const lastFetched = useSelector(selectFeatureFlagsLastFetched);

  return {
    flags,
    loading,
    error,
    lastFetched,
    refetch: () => {
      void dispatch(fetchFeatureFlags());
    },
    clearError: () => {
      dispatch(clearError());
    },
    reset: () => {
      dispatch(resetFeatureFlags());
    },
  };
}

export function useIsFeatureEnabled(key: string): boolean {
  return useSelector(selectIsFeatureEnabled(key));
}
