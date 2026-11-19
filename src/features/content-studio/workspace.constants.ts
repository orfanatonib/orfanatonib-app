import {
  ContentAudience,
  ContentStageStatus,
  ContentPackageStatus,
  type CreateContentPackagePayload,
} from "./types";
export const GENERATION_ALLOWED_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.NOT_STARTED,
  ContentStageStatus.DRAFT,
  ContentStageStatus.FAILED,
  ContentStageStatus.STALE,
  ContentStageStatus.CHANGES_REQUESTED,
];

export const MANUAL_EDIT_ALLOWED_STATUSES: readonly ContentStageStatus[] = [
  ContentStageStatus.NOT_STARTED,
  ContentStageStatus.GENERATING,
  ContentStageStatus.DRAFT,
  ContentStageStatus.PRODUCER_APPROVED,
  ContentStageStatus.FAILED,
  ContentStageStatus.STALE,
  ContentStageStatus.CHANGES_REQUESTED,
  ContentStageStatus.APPROVED,
];

export const PACKAGE_PRODUCTION_LOCKED_STATUSES: readonly ContentPackageStatus[] =
  [
    ContentPackageStatus.IN_REVIEW,
    ContentPackageStatus.PUBLISHING,
    ContentPackageStatus.PUBLISHED,
    ContentPackageStatus.ARCHIVED,
  ];

export const GENERATION_POLL_MS = 4000;
export const REVISION_INSTRUCTIONS_MAX_LENGTH = 2000;
export const INITIAL_PACKAGE_STATE = {
  contentPackage: null,
  loading: true,
  error: false,
};

export const STUDIO_PAGE_SIZE = 10;
export const EMPTY_STUDIO_FORM: CreateContentPackagePayload = {
  audience: ContentAudience.CHILD,
  theme: "",
  biblicalReferences: "",
  canonicalObjective: "",
  canonicalNotes: "",
};
