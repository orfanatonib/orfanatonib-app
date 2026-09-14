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
} from "./utils";

const enabledFlags = {
  [FeatureFlagKeys.SHELTER_MANAGEMENT]: true,
  [FeatureFlagKeys.SHELTER_PAGELAS]: true,
};

describe("admin navigation", () => {
  it("keeps the task-oriented section and item order", () => {
    expect(ADMIN_NAVIGATION_SECTIONS.map((section) => section.id)).toEqual([
      AdminNavigationSectionId.PEOPLE,
      AdminNavigationSectionId.SHELTERS_AND_VISITS,
      AdminNavigationSectionId.CONTENT,
      AdminNavigationSectionId.MATERIALS_AND_IDEAS,
      AdminNavigationSectionId.MEDIA,
      AdminNavigationSectionId.COMMUNICATION,
    ]);

    expect(ADMIN_NAVIGATION_SECTIONS[0].items.map((item) => item.id)).toEqual([
      AdminNavigationItemId.SHELTERED,
      AdminNavigationItemId.MEMBERS,
      AdminNavigationItemId.LEADERS,
      AdminNavigationItemId.PROFILES,
      AdminNavigationItemId.USERS,
      AdminNavigationItemId.BACKGROUND_CHECKS,
    ]);
    expect(ADMIN_NAVIGATION_SECTIONS[1].items.map((item) => item.id)).toEqual([
      AdminNavigationItemId.SHELTERS,
      AdminNavigationItemId.SCHEDULES,
      AdminNavigationItemId.ATTENDANCE,
      AdminNavigationItemId.VISIT_REPORTS,
      AdminNavigationItemId.PAGELAS,
      AdminNavigationItemId.FM_INTEGRATIONS,
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
        [FeatureFlagKeys.SHELTER_MANAGEMENT]: false,
        [FeatureFlagKeys.SHELTER_PAGELAS]: false,
      },
    });
    const itemIds = sections.flatMap((section) =>
      section.items.map((item) => item.id),
    );

    expect(itemIds).not.toContain(AdminNavigationItemId.SHELTERED);
    expect(itemIds).not.toContain(AdminNavigationItemId.PAGELAS);
  });

  it("maps listing, editing and pending routes back to the correct section", () => {
    expect(getAdminNavigationSectionForPath("/adm/membros")).toBe(
      AdminNavigationSectionId.PEOPLE,
    );
    expect(getAdminNavigationSectionForPath("/adm/editar-pagina-visita")).toBe(
      AdminNavigationSectionId.MATERIALS_AND_IDEAS,
    );
    expect(getAdminNavigationSectionForPath("/adm/relatorios/pendencias")).toBe(
      AdminNavigationSectionId.SHELTERS_AND_VISITS,
    );
    expect(getAdminNavigationSectionForPath("/adm")).toBeNull();
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
