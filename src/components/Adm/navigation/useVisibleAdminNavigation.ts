import { useMemo } from "react";
import { useSelector } from "react-redux";

import { selectAllFeatureFlags } from "@/store/selectors/featureFlagsSelectors";
import type { RootState } from "@/store/slices";

import { getVisibleAdminNavigationSections } from "./utils";
import type { AdminNavigationSection } from "./types";

/**
 * Seções do menu liberadas para o usuário logado (papel × feature flags).
 * Fonte única do menu lateral e do painel: nenhum dos dois repete lista de flags.
 */
export function useVisibleAdminNavigation(): AdminNavigationSection[] {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const featureFlags = useSelector(selectAllFeatureFlags);

  return useMemo(
    () =>
      getVisibleAdminNavigationSections({
        isAuthenticated,
        role: user?.role,
        featureFlags,
      }),
    [featureFlags, isAuthenticated, user?.role],
  );
}
