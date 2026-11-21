import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectFeatureFlagsLastFetched } from '@/store/selectors/featureFlagsSelectors';
import type { AppDispatch } from '@/store/slices';
import { fetchFeatureFlags } from '@/store/slices/feature-flags/featureFlagsSlice';

import { FEATURE_FLAGS_FOCUS_REFETCH_MIN_MS } from '../constants';
import { shouldRefetchFlags } from '../utils/refetchPolicy';

/**
 * Relê o mapa de flags quando a pessoa volta para a aba. Sem isso, quem deixa a
 * aba aberta por horas só vê uma flag desligada depois de recarregar a página.
 * A releitura é silenciosa (não vira spinner) e respeita um intervalo mínimo.
 */
export function useRefetchFlagsOnFocus(): void {
  const dispatch = useDispatch<AppDispatch>();
  const lastFetched = useSelector(selectFeatureFlagsLastFetched);

  useEffect(() => {
    const refetch = () => {
      if (
        shouldRefetchFlags({
          visible: document.visibilityState === 'visible',
          lastFetched,
          now: Date.now(),
          minIntervalMs: FEATURE_FLAGS_FOCUS_REFETCH_MIN_MS,
        })
      ) {
        void dispatch(fetchFeatureFlags({ silent: true }));
      }
    };
    document.addEventListener('visibilitychange', refetch);
    window.addEventListener('focus', refetch);
    return () => {
      document.removeEventListener('visibilitychange', refetch);
      window.removeEventListener('focus', refetch);
    };
  }, [dispatch, lastFetched]);
}
