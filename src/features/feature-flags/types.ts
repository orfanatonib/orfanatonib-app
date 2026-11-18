export enum FeatureFlagKeys {
  SHELTER_ADDRESS = 'shelter-address',
  SHELTER_MANAGEMENT = 'shelter-management',
  SHELTER_PAGELAS = 'shelter-pagelas',
  CONTENT_STUDIO = 'content-studio',
  CONTENT_STUDIO_GENERATION = 'content-studio-generation',
  CONTENT_STUDIO_REVIEW = 'content-studio-review',
  CONTENT_STUDIO_PUBLICATION = 'content-studio-publication',
  CONTENT_STUDIO_PROVIDER_ADMIN = 'content-studio-provider-admin',
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
  environment: string | null;
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
  environment?: string;
  targetRoles?: FeatureFlagTargetRole[];
  metadata?: Record<string, unknown>;
}

export interface UpdateFeatureFlagRequest {
  key?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  environment?: string;
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
