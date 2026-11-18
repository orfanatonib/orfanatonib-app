import {
  ADMIN_NAVIGATION_FILTER_ALL_ID,
  ADMIN_NAVIGATION_SECTIONS,
} from "./constants";
import type {
  AdminNavigationFilterId,
  AdminNavigationItem,
  AdminNavigationSection,
  AdminNavigationSectionId,
  AdminNavigationVisibility,
} from "./types";

export function isAdminNavigationItemVisible(
  item: AdminNavigationItem,
  visibility: AdminNavigationVisibility,
): boolean {
  if (!visibility.isAuthenticated || !visibility.role) return false;
  if (!item.allowedRoles.some((role) => role === visibility.role)) return false;

  const requiredFlags = [
    ...(item.requiredFeatureFlag ? [item.requiredFeatureFlag] : []),
    ...(item.requiredFeatureFlags ?? []),
  ];
  return requiredFlags.every((flag) => visibility.featureFlags[flag] === true);
}

export function getVisibleAdminNavigationSections(
  visibility: AdminNavigationVisibility,
  sections: readonly AdminNavigationSection[] = ADMIN_NAVIGATION_SECTIONS,
): AdminNavigationSection[] {
  return sections.reduce<AdminNavigationSection[]>(
    (visibleSections, section) => {
      const items = section.items.filter((item) =>
        isAdminNavigationItemVisible(item, visibility),
      );

      if (items.length > 0) visibleSections.push({ ...section, items });
      return visibleSections;
    },
    [],
  );
}

export function isAdminNavigationItemActive(
  item: AdminNavigationItem,
  pathname: string,
): boolean {
  if (item.exact && pathname === item.path) return true;
  const prefixes = [
    ...(item.exact ? [] : [item.path]),
    ...(item.activePathPrefixes ?? []),
  ];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getAdminNavigationSectionForPath(
  pathname: string,
  sections: readonly AdminNavigationSection[] = ADMIN_NAVIGATION_SECTIONS,
): AdminNavigationSectionId | null {
  return (
    sections.find((section) =>
      section.items.some((item) => isAdminNavigationItemActive(item, pathname)),
    )?.id ?? null
  );
}

export function filterAdminNavigationSections(
  sections: readonly AdminNavigationSection[],
  filterId: AdminNavigationFilterId,
  query: string,
): AdminNavigationSection[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  return sections.reduce<AdminNavigationSection[]>(
    (filteredSections, section) => {
      if (
        filterId !== ADMIN_NAVIGATION_FILTER_ALL_ID &&
        section.id !== filterId
      ) {
        return filteredSections;
      }

      const items = normalizedQuery
        ? section.items.filter((item) =>
            `${item.label} ${item.description}`
              .toLocaleLowerCase("pt-BR")
              .includes(normalizedQuery),
          )
        : [...section.items];

      if (items.length > 0) filteredSections.push({ ...section, items });
      return filteredSections;
    },
    [],
  );
}
