import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '@/store/slices';
import { selectAllFeatureFlags } from '@/store/selectors/featureFlagsSelectors';

import { filterVisibleRoutes } from '../routeTypeFlags';
import type { FeatureFlagKeys } from '../types';

/** Rotas dinâmicas já filtradas pela flag do tipo: uma página de tipo desligado não existe nem no menu, nem nos cards, nem como rota. */
export function useVisibleRoutes() {
  const routes = useSelector((state: RootState) => state.routes.routes);
  const flags = useSelector(selectAllFeatureFlags);
  return useMemo(
    () => filterVisibleRoutes(routes, (flag: FeatureFlagKeys) => flags[flag] === true),
    [routes, flags],
  );
}
