import Dashboard from "@mui/icons-material/Dashboard";

import { ADMIN_NAVIGATION_SECTIONS } from "./sections";
import type { AdminNavigationFilter } from "./types";

export { ADMIN_NAVIGATION_SECTIONS };

export const ADMIN_OVERVIEW_ITEM = {
  label: "Visão geral",
  path: "/adm",
  icon: Dashboard,
} as const;

export const ADMIN_NAVIGATION_FILTER_ALL_ID = "all" as const;

export const ADMIN_NAVIGATION_FILTERS: readonly AdminNavigationFilter[] = [
  { id: ADMIN_NAVIGATION_FILTER_ALL_ID, label: "Tudo" },
  ...ADMIN_NAVIGATION_SECTIONS.map(({ id, title }) => ({ id, label: title })),
];

export const ADMIN_NAVIGATION_TEST_IDS = {
  LAYOUT: "admin-layout",
  MAIN: "admin-main",
  DASHBOARD: "admin-dashboard",
  SIDEBAR: "admin-sidebar",
  SIDEBAR_NAVIGATION: "admin-sidebar-navigation",
  SIDEBAR_OVERVIEW: "admin-sidebar-overview",
  SIDEBAR_GROUP_PREFIX: "admin-sidebar-group",
  SIDEBAR_GROUP_TOGGLE_PREFIX: "admin-sidebar-group-toggle",
  SIDEBAR_ITEM_PREFIX: "admin-sidebar-item",
  SIDEBAR_FILTER_PREFIX: "admin-sidebar-filter",
  SIDEBAR_COLLAPSE: "admin-sidebar-collapse",
  SIDEBAR_OPEN: "admin-sidebar-open",
  DASHBOARD_FILTER_PREFIX: "admin-dashboard-filter",
  DASHBOARD_CARD_PREFIX: "admin-dashboard-card",
  DASHBOARD_SEARCH: "admin-dashboard-search",
  DASHBOARD_EMPTY: "admin-dashboard-empty",
  DASHBOARD_SCROLL_TOP: "admin-dashboard-scroll-top",
} as const;

export const ADMIN_DRAWER_WIDTH_PX = 240;
export const ADMIN_MINI_DRAWER_WIDTH_PX = 72;
export const ADMIN_HEADER_HEIGHT_PX = 64;
export const ADMIN_FOOTER_HEIGHT_PX = 88;
