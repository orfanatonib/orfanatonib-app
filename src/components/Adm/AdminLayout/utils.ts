import { CONTENT_STUDIO_ROUTE_PREFIX } from "./constants";
import {
  ADMIN_DRAWER_WIDTH_PX,
  ADMIN_MINI_DRAWER_WIDTH_PX,
  ADMIN_NAVIGATION_FILTER_ALL_ID,
  ADMIN_NAVIGATION_FILTERS,
} from "../navigation";
import type {
  AdminNavigationFilter,
  AdminNavigationFilterId,
  AdminNavigationSection,
} from "../navigation";
import type { AdminSidebarLayoutState } from "./types";

/** O mini-drawer (só ícones) existe apenas no desktop com o menu recolhido. */
export function isMiniDrawer({
  isMobile,
  desktopOpen,
}: AdminSidebarLayoutState): boolean {
  return !isMobile && !desktopOpen;
}

export function getDrawerWidth(state: AdminSidebarLayoutState): number {
  return isMiniDrawer(state)
    ? ADMIN_MINI_DRAWER_WIDTH_PX
    : ADMIN_DRAWER_WIDTH_PX;
}

/** Filtros do celular: "Tudo" + as seções que o usuário realmente vê. */
export function getAvailableFilters(
  sections: readonly AdminNavigationSection[],
): AdminNavigationFilter[] {
  return ADMIN_NAVIGATION_FILTERS.filter(
    (filter) =>
      filter.id === ADMIN_NAVIGATION_FILTER_ALL_ID ||
      sections.some((section) => section.id === filter.id),
  );
}

/** Se o filtro escolhido sumiu (flag desligada, papel), volta para "Tudo". */
export function isFilterStillAvailable(
  filter: AdminNavigationFilterId,
  sections: readonly AdminNavigationSection[],
): boolean {
  return (
    filter === ADMIN_NAVIGATION_FILTER_ALL_ID ||
    sections.some((section) => section.id === filter)
  );
}

export function getSectionsForMobileTab(
  sections: readonly AdminNavigationSection[],
  isMobile: boolean,
  mobileTab: AdminNavigationFilterId,
): readonly AdminNavigationSection[] {
  return isMobile && mobileTab !== ADMIN_NAVIGATION_FILTER_ALL_ID
    ? sections.filter((s) => s.id === mobileTab)
    : sections;
}

export function isContentStudioPath(pathname: string): boolean {
  return pathname.startsWith(CONTENT_STUDIO_ROUTE_PREFIX);
}
