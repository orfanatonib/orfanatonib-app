import { useEffect, useMemo, useState } from "react";
import type React from "react";

import {
  ADMIN_NAVIGATION_FILTER_ALL_ID,
  type AdminNavigationFilterId,
  type AdminNavigationSectionId,
  getAdminNavigationSectionForPath,
  useVisibleAdminNavigation,
} from "../navigation";
import {
  getAvailableFilters,
  getSectionsForMobileTab,
  isFilterStillAvailable,
} from "./utils";

/** Estado do menu lateral do painel: seções visíveis (papel × flag), acordeão e filtro do celular. */
export function useAdminNavigation(pathname: string, isMobile: boolean) {
  const sections = useVisibleAdminNavigation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<AdminNavigationFilterId>(
    ADMIN_NAVIGATION_FILTER_ALL_ID,
  );
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [expanded, setExpanded] = useState<AdminNavigationSectionId | null>(
    () => getAdminNavigationSectionForPath(pathname),
  );

  const availableFilters = useMemo(
    () => getAvailableFilters(sections),
    [sections],
  );

  useEffect(() => {
    const target = getAdminNavigationSectionForPath(pathname);
    setExpanded((previous) => (previous === target ? previous : target));
  }, [pathname]);

  useEffect(() => {
    if (!isFilterStillAvailable(mobileTab, sections))
      setMobileTab(ADMIN_NAVIGATION_FILTER_ALL_ID);
  }, [mobileTab, sections]);

  const visibleSections = getSectionsForMobileTab(
    sections,
    isMobile,
    mobileTab,
  );

  const handleAccordion =
    (panel: AdminNavigationSectionId) =>
    (_event: React.SyntheticEvent, isExpanding: boolean) =>
      setExpanded((previous) =>
        isExpanding ? panel : previous === panel ? null : previous,
      );

  return {
    sections,
    visibleSections,
    availableFilters,
    mobileOpen,
    mobileTab,
    desktopOpen,
    expanded,
    setMobileTab,
    toggleMobileDrawer: () => setMobileOpen((isOpen) => !isOpen),
    closeMobileDrawer: () => setMobileOpen(false),
    toggleDesktopDrawer: () => setDesktopOpen((isOpen) => !isOpen),
    handleAccordion,
  };
}
