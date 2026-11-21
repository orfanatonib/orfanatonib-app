import { useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import type { FeatureFlagKeys } from '@/features/feature-flags/types';
import { selectIsFeatureEnabled } from '@/store/selectors/featureFlagsSelectors';
import type { RootState } from '@/store/slices';

import { SHELL_NAV_FLAGS, visibleShellUserMenuEntries } from './shellNav';
import { visiblePublicNavItems } from './publicNav';

type EnabledFlags = Partial<Record<FeatureFlagKeys, boolean>>;

/** Menu da casca para o usuário atual: itens públicos e do menu do usuário, já filtrados por papel × flag. */
export function useShellNavigation() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const enabled = useSelector(
    (state: RootState) =>
      SHELL_NAV_FLAGS.reduce<EnabledFlags>((acc, flag) => {
        acc[flag] = selectIsFeatureEnabled(flag)(state);
        return acc;
      }, {}),
    shallowEqual,
  );
  const isEnabled = useCallback((flag: FeatureFlagKeys) => enabled[flag] === true, [enabled]);
  const role = user?.role;

  return {
    isAuthenticated,
    user,
    publicItems: visiblePublicNavItems(isEnabled),
    userMenuEntries: visibleShellUserMenuEntries({ isAuthenticated, role, isEnabled }),
  };
}
