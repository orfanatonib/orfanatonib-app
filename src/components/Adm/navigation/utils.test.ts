import { describe, expect, it } from "vitest";

import { FeatureFlagKeys } from "@/features/feature-flags/types";

import {
  ADMIN_NAVIGATION_FILTER_ALL_ID,
  ADMIN_NAVIGATION_SECTIONS,
} from "./constants";
import {
  AdminNavigationItemId,
  AdminNavigationRole,
  AdminNavigationSectionId,
} from "./types";
import {
  filterAdminNavigationSections,
  getAdminNavigationSectionForPath,
  getVisibleAdminNavigationSections,
  isAdminNavigationItemActive,
} from "./utils";

const enabledFlags = Object.fromEntries(
  Object.values(FeatureFlagKeys).map((flag) => [flag, true]),
) as Record<FeatureFlagKeys, boolean>;

describe("admin navigation", () => {
  it("keeps the task-oriented section and item order", () => {
    expect(ADMIN_NAVIGATION_SECTIONS.map((section) => section.id)).toEqual([
      AdminNavigationSectionId.CONTENT_STUDIO,
      AdminNavigationSectionId.PEOPLE,
      AdminNavigationSectionId.SHELTERS_AND_VISITS,
      AdminNavigationSectionId.CONTENT,
      AdminNavigationSectionId.MATERIALS_AND_IDEAS,
      AdminNavigationSectionId.MEDIA,
      AdminNavigationSectionId.COMMUNICATION,
    ]);

    expect(ADMIN_NAVIGATION_SECTIONS[0].items.map((item) => item.id)).toEqual([
      AdminNavigationItemId.CONTENT_STUDIO,
      AdminNavigationItemId.CONTENT_STUDIO_PRODUCTION,
      AdminNavigationItemId.CONTENT_STUDIO_REVIEW,
      AdminNavigationItemId.CONTENT_STUDIO_GUIDELINES,
    ]);
    expect(ADMIN_NAVIGATION_SECTIONS[1].items.map((item) => item.id)).toEqual([
      AdminNavigationItemId.SHELTERED,
      AdminNavigationItemId.MEMBERS,
      AdminNavigationItemId.LEADERS,
      AdminNavigationItemId.PROFILES,
      AdminNavigationItemId.USERS,
      AdminNavigationItemId.BACKGROUND_CHECKS,
    ]);
    expect(ADMIN_NAVIGATION_SECTIONS[2].items.map((item) => item.id)).toEqual([
      AdminNavigationItemId.SHELTERS,
      AdminNavigationItemId.SCHEDULES,
      AdminNavigationItemId.ATTENDANCE,
      AdminNavigationItemId.VISIT_REPORTS,
      AdminNavigationItemId.PAGELAS,
      AdminNavigationItemId.FEED_COMMENTS,
    ]);
  });

  it("limits leader navigation without duplicating permission rules", () => {
    const sections = getVisibleAdminNavigationSections({
      isAuthenticated: true,
      role: AdminNavigationRole.LEADER,
      featureFlags: enabledFlags,
    });

    expect(sections.map((section) => section.id)).toEqual([
      AdminNavigationSectionId.PEOPLE,
      AdminNavigationSectionId.SHELTERS_AND_VISITS,
    ]);
    expect(sections[0].items.map((item) => item.id)).toEqual([
      AdminNavigationItemId.SHELTERED,
      AdminNavigationItemId.MEMBERS,
      AdminNavigationItemId.PROFILES,
      AdminNavigationItemId.BACKGROUND_CHECKS,
    ]);
  });

  it("removes feature-flagged items when their flags are disabled", () => {
    const sections = getVisibleAdminNavigationSections({
      isAuthenticated: true,
      role: AdminNavigationRole.ADMIN,
      featureFlags: {
        [FeatureFlagKeys.SHELTERED_MANAGEMENT]: false,
        [FeatureFlagKeys.PAGELAS]: false,
        [FeatureFlagKeys.CONTENT_STUDIO]: true,
        [FeatureFlagKeys.CONTENT_STUDIO_REVIEW]: false,
        [FeatureFlagKeys.CONTENT_STUDIO_PROVIDER_ADMIN]: false,
      },
    });
    const itemIds = sections.flatMap((section) =>
      section.items.map((item) => item.id),
    );

    expect(itemIds).not.toContain(AdminNavigationItemId.SHELTERED);
    expect(itemIds).not.toContain(AdminNavigationItemId.PAGELAS);
    expect(itemIds).toContain(AdminNavigationItemId.CONTENT_STUDIO);
    expect(itemIds).not.toContain(AdminNavigationItemId.CONTENT_STUDIO_REVIEW);
    expect(itemIds).not.toContain(
      AdminNavigationItemId.CONTENT_STUDIO_PROVIDERS,
    );
  });

  it("maps listing, editing and pending routes back to the correct section", () => {
    expect(getAdminNavigationSectionForPath("/adm/membros")).toBe(
      AdminNavigationSectionId.PEOPLE,
    );
    expect(getAdminNavigationSectionForPath("/adm/estudio/revisao")).toBe(
      AdminNavigationSectionId.CONTENT_STUDIO,
    );
    expect(getAdminNavigationSectionForPath("/adm/editar-pagina-visita")).toBe(
      AdminNavigationSectionId.MATERIALS_AND_IDEAS,
    );
    expect(getAdminNavigationSectionForPath("/adm/relatorios/pendencias")).toBe(
      AdminNavigationSectionId.SHELTERS_AND_VISITS,
    );
    expect(getAdminNavigationSectionForPath("/adm")).toBeNull();
  });

  it("highlights only the active Estúdio submenu", () => {
    const studioItems = ADMIN_NAVIGATION_SECTIONS[0].items;
    const dashboard = studioItems.find(
      (item) => item.id === AdminNavigationItemId.CONTENT_STUDIO,
    )!;
    const production = studioItems.find(
      (item) => item.id === AdminNavigationItemId.CONTENT_STUDIO_PRODUCTION,
    )!;
    const review = studioItems.find(
      (item) => item.id === AdminNavigationItemId.CONTENT_STUDIO_REVIEW,
    )!;

    expect(isAdminNavigationItemActive(dashboard, "/adm/estudio")).toBe(true);
    expect(
      isAdminNavigationItemActive(dashboard, "/adm/estudio/producao"),
    ).toBe(false);
    expect(
      isAdminNavigationItemActive(production, "/adm/estudio/pacotes/pkg-1"),
    ).toBe(true);
    expect(isAdminNavigationItemActive(review, "/adm/estudio/revisao")).toBe(
      true,
    );
  });

  it("filters the shared catalog by section and search text", () => {
    const filtered = filterAdminNavigationSections(
      ADMIN_NAVIGATION_SECTIONS,
      ADMIN_NAVIGATION_FILTER_ALL_ID,
      "vídeos",
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(AdminNavigationSectionId.MEDIA);
    expect(filtered[0].items.map((item) => item.id)).toEqual([
      AdminNavigationItemId.VIDEOS,
    ]);
  });
});
