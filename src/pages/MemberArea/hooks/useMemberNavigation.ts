import { useVisibleRoutes } from '@/features/feature-flags';
import { selectAllFeatureFlags } from '@/store/selectors/featureFlagsSelectors';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { RootState } from '@/store/slices';
import { useAuthRole } from '@/utils/useAuthRole';
import { MEMBER_NAV_ITEMS } from '../constants/navigation';
import type { MemberNavItemDefinition, MemberNavItemId } from '../types/navigation';
import { filterNavItems, resolveActiveNavItemId } from '../utils/navigation';

export interface MemberNavigationState {
  navItems: MemberNavItemDefinition[];
  activeId: MemberNavItemId | null;
  activeItem: MemberNavItemDefinition | null;
}

/** Itens visíveis do menu e o item ativo; compartilhado pela sidebar e pelo cabeçalho da casca. */
export function useMemberNavigation(): MemberNavigationState {
  const { pathname } = useLocation();
  const { isAdminOrLeader } = useAuthRole();
  const dynamicRoutes = useVisibleRoutes();
  const featureFlags = useSelector(selectAllFeatureFlags);

  const navItems = useMemo(
    () =>
      filterNavItems(MEMBER_NAV_ITEMS, {
        isAdminOrLeader,
        isFeatureEnabled: (key) => featureFlags[key] === true,
      }),
    [isAdminOrLeader, featureFlags],
  );
  const activeId = useMemo(
    () => resolveActiveNavItemId(navItems, pathname, dynamicRoutes),
    [navItems, pathname, dynamicRoutes],
  );
  const activeItem = useMemo(
    () => navItems.find((item) => item.id === activeId) ?? null,
    [navItems, activeId],
  );

  return { navItems, activeId, activeItem };
}
