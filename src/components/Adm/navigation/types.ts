import type { SvgIconProps } from "@mui/material";
import type { ElementType } from "react";

import type { FeatureFlagKeys } from "@/features/feature-flags/types";

export enum AdminNavigationRole {
  ADMIN = "admin",
  LEADER = "leader",
}

export enum AdminNavigationSectionId {
  PEOPLE = "people",
  SHELTERS_AND_VISITS = "shelters-and-visits",
  CONTENT_STUDIO = "content-studio",
  CONTENT = "content",
  PAGES_AND_MEDIA = "pages-and-media",
  INTERACTION = "interaction",
  MESSAGES = "messages",
}

export enum AdminNavigationItemId {
  SHELTERED = "sheltered",
  MEMBERS = "members",
  LEADERS = "leaders",
  PROFILES = "profiles",
  USERS = "users",
  BACKGROUND_CHECKS = "background-checks",
  SHELTERS = "shelters",
  SCHEDULES = "schedules",
  ATTENDANCE = "attendance",
  VISIT_REPORTS = "visit-reports",
  PAGELAS = "pagelas",
  FEED_COMMENTS = "feed-comments",
  CREATE_PAGE = "create-page",
  CONTENT_STUDIO = "content-studio",
  CONTENT_STUDIO_PRODUCTION = "content-studio-production",
  CONTENT_STUDIO_REVIEW = "content-studio-review",
  CONTENT_STUDIO_GUIDELINES = "content-studio-guidelines",
  CONTENT_STUDIO_PROVIDERS = "content-studio-providers",
  MEDITATIONS = "meditations",
  DOCUMENTS = "documents",
  INFORMATIVE_BANNERS = "informative-banners",
  VISIT_MATERIALS = "visit-materials",
  IDEAS_PAGES = "ideas-pages",
  SHARED_IDEAS = "shared-ideas",
  PHOTO_GALLERIES = "photo-galleries",
  SHELTER_PHOTOS = "shelter-photos",
  VIDEOS = "videos",
  COMMENTS = "comments",
  CONTACTS = "contacts",
  FEEDBACKS = "feedbacks",
}

export type AdminNavigationFilterId = AdminNavigationSectionId | "all";

export interface AdminNavigationItem {
  readonly id: AdminNavigationItemId;
  readonly label: string;
  readonly description: string;
  readonly path: string;
  readonly exact?: boolean;
  readonly activePathPrefixes?: readonly string[];
  readonly icon: ElementType<SvgIconProps>;
  readonly allowedRoles: readonly AdminNavigationRole[];
  readonly requiredFeatureFlag?: FeatureFlagKeys;
  readonly requiredFeatureFlags?: readonly FeatureFlagKeys[];
}

export interface AdminNavigationSection {
  readonly id: AdminNavigationSectionId;
  readonly title: string;
  readonly icon: ElementType<SvgIconProps>;
  readonly items: readonly AdminNavigationItem[];
}

export interface AdminNavigationFilter {
  readonly id: AdminNavigationFilterId;
  readonly label: string;
}

export interface AdminNavigationVisibility {
  readonly isAuthenticated: boolean;
  readonly role: string | null | undefined;
  readonly featureFlags: Readonly<Partial<Record<FeatureFlagKeys, boolean>>>;
}
