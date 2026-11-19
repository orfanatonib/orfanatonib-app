export enum FeatureFlagKeys {
  PUBLIC_REGISTRATION = 'public_registration',
  GOOGLE_LOGIN = 'google_login',
  PASSWORD_RECOVERY = 'password_recovery',
  CONTACT_FORM = 'contact_form',
  EVENTS_SECTION = 'events_section',
  SHELTER_FEED = 'shelter_feed',
  HOME_COMMENTS = 'home_comments',
  PUBLIC_GALLERIES = 'public_galleries',
  PUBLIC_VIDEOS = 'public_videos',
  SHELTER_PAGES = 'shelter_pages',
  ABOUT_PAGE = 'about_page',
  SHELTER_ADDRESS = 'shelter_address',

  MEMBER_AREA = 'member_area',
  VISIT_MATERIALS = 'visit_materials',
  DOCUMENTS_LIBRARY = 'documents_library',
  TRAINING_VIDEOS = 'training_videos',
  IDEAS_SHARING = 'ideas_sharing',
  IDEA_SUBMISSION = 'idea_submission',
  SHELTER_PHOTO_UPLOAD = 'shelter_photo_upload',
  SITE_FEEDBACK = 'site_feedback',
  MEMBER_MANUAL = 'member_manual',
  WEEKLY_MEDITATION = 'weekly_meditation',
  INFORMATIVE_BANNERS = 'informative_banners',
  COMMENT_SUBMISSION = 'comment_submission',
  SHELTERED_AREA = 'sheltered_area',
  ACCEPTED_CHRISTS = 'accepted_christs',
  ATTENDANCE = 'attendance',
  INTEGRATION = 'integration',

  COMMENT_MODERATION = 'comment_moderation',
  DOCUMENT_MANAGEMENT = 'document_management',
  INFORMATIVE_MANAGEMENT = 'informative_management',
  FEEDBACK_MANAGEMENT = 'feedback_management',
  CONTACT_MANAGEMENT = 'contact_management',
  PAGE_MANAGEMENT = 'page_management',
  MEDITATION_MANAGEMENT = 'meditation_management',
  EVENT_MANAGEMENT = 'event_management',
  PHOTO_MODERATION = 'photo_moderation',
  IDEA_MODERATION = 'idea_moderation',
  USER_MANAGEMENT = 'user_management',
  LEADER_MANAGEMENT = 'leader_management',
  MEMBER_MANAGEMENT = 'member_management',
  SHELTER_MANAGEMENT = 'shelter_management',
  SHELTERED_MANAGEMENT = 'sheltered_management',
  PAGELAS = 'pagelas',
  SHELTER_SCHEDULE = 'shelter_schedule',
  CRIMINAL_RECORDS = 'criminal_records',
  VISIT_REPORTS = 'visit_reports',
  OBSERVABILITY_AUDIT = 'observability_audit',

  CONTENT_STUDIO = 'content_studio',
  CONTENT_STUDIO_GENERATION = 'content_studio_generation',
  CONTENT_STUDIO_REVIEW = 'content_studio_review',
  CONTENT_STUDIO_PUBLICATION = 'content_studio_publication',
  CONTENT_STUDIO_PROVIDER_ADMIN = 'content_studio_provider_admin',

    EMAIL_DELIVERY = 'email_delivery',
}

export enum FeatureFlagTargetRole {
  ADMIN = 'admin',
  LEADER = 'leader',
  MEMBER = 'member',
}

export type FeatureFlagAudience =
  | 'EVERYONE'
  | 'ADMIN'
  | 'LEADER'
  | 'MEMBER'
  | 'ADMIN_LEADER'
  | 'ADMIN_MEMBER'
  | 'LEADER_MEMBER'
  | 'ALL_ROLES';

export interface FeatureFlagResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  targetRoles: FeatureFlagTargetRole[];
  audience: FeatureFlagAudience;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedFeatureFlags {
  data: FeatureFlagResponse[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    orderBy?: string;
    order?: 'ASC' | 'DESC';
  };
}

export interface FeatureFlagStats {
  total: number;
  enabled: number;
  disabled: number;
  byAudience: Record<FeatureFlagAudience, number>;
}

export type FeatureFlagSortField = 'name' | 'key' | 'createdAt' | 'updatedAt';
export type FeatureFlagSortOrder = 'ASC' | 'DESC';

export interface FeatureFlagQuery {
  page?: number;
  limit?: number;
  searchString?: string;
  enabled?: boolean;
  audience?: FeatureFlagAudience;
  sort?: FeatureFlagSortField;
  order?: FeatureFlagSortOrder;
}

export interface FeatureFlagListFilters {
  status: string;
  audience: string;
  sort: FeatureFlagSortField;
  order: FeatureFlagSortOrder;
}

export interface CreateFeatureFlagRequest {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  targetRoles?: FeatureFlagTargetRole[];
  metadata?: Record<string, unknown>;
}

export interface UpdateFeatureFlagRequest {
  key?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  targetRoles?: FeatureFlagTargetRole[];
  metadata?: Record<string, unknown> | null;
}

export interface FeatureFlagFormValues {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  audience: FeatureFlagAudience;
  metadataJson: string;
}

export interface FeatureFlagFormErrors {
  key: boolean;
  name: boolean;
  metadataJson: boolean;
}

export type FeatureFlagsMap = Record<string, boolean>;
