export enum ContentAudience {
  BABY = "BABY",
  CHILD = "CHILD",
  TEEN = "TEEN",
  ADULT = "ADULT",
}

export enum ContentStageType {
  CANONICAL_BASE = "CANONICAL_BASE",
  LESSON = "LESSON",
  DISCUSSION = "DISCUSSION",
  ACTIVITY = "ACTIVITY",
  VISUAL = "VISUAL",
  FACILITATOR_GUIDANCE = "FACILITATOR_GUIDANCE",
}

export enum ContentPackageStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  PACKAGE_READY = "PACKAGE_READY",
  IN_REVIEW = "IN_REVIEW",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  READY_FOR_PUBLICATION = "READY_FOR_PUBLICATION",
  PUBLISHING = "PUBLISHING",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum ContentStageStatus {
  NOT_STARTED = "NOT_STARTED",
  GENERATING = "GENERATING",
  DRAFT = "DRAFT",
  PRODUCER_APPROVED = "PRODUCER_APPROVED",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  FAILED = "FAILED",
  STALE = "STALE",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  NOT_REQUIRED = "NOT_REQUIRED",
}

export enum ContentReviewCommentStatus {
  OPEN = "OPEN",
  RESOLVED = "RESOLVED",
}

export enum ContentReviewDecisionType {
  APPROVED = "APPROVED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
}

export interface ContentStageDefinitionResponse {
  type: ContentStageType;
  name: string;
  position: number;
  required: boolean;
  dependencies: ContentStageType[];
}

export interface ContentAudienceDefinitionResponse {
  audience: ContentAudience;
  name: string;
  minimumAge: number;
  maximumAge: number | null;
  stages: ContentStageDefinitionResponse[];
}

export interface ContentStudioCapabilitiesResponse {
  generation: boolean;
  review: boolean;
  publication: boolean;
  providerAdministration: boolean;
}

export interface ContentStudioCatalogResponse {
  version: string;
  allAudiencesRequired: boolean;
  audiences: ContentAudienceDefinitionResponse[];
  capabilities: ContentStudioCapabilitiesResponse;
}

export interface ContentStudioCatalogState {
  catalog: ContentStudioCatalogResponse | null;
  loading: boolean;
  error: boolean;
}

export interface ContentStageResponse {
  id: string;
  stageType: ContentStageType;
  position: number;
  required: boolean;
  dependencies: ContentStageType[];
  status: ContentStageStatus;
  currentVersionId: string | null;
  lockVersion: number;
  currentVersion: ContentVersionResponse | null;
  reviewComments: ContentReviewCommentResponse[];
  reviewDecisions: ContentReviewDecisionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentReviewCommentResponse {
  id: string;
  versionId: string;
  blockKey: string | null;
  message: string;
  status: ContentReviewCommentStatus;
  authorId: string;
  createdAt: string;
}

export interface ContentReviewDecisionResponse {
  id: string;
  versionId: string;
  versionNumber: number | null;
  contentChecksum: string;
  decision: ContentReviewDecisionType;
  reviewerId: string;
  relatedCommentId: string | null;
  decidedAt: string;
}

export interface ContentVersionResponse {
  id: string;
  stageId: string;
  versionNumber: number;
  structuredContent: Record<string, unknown>;
  contentChecksum: string;
  templateVersion: string;
  generationSnapshot: Record<string, unknown> | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentTrackResponse {
  id: string;
  audience: ContentAudience;
  audienceName: string;
  minimumAge: number;
  maximumAge: number | null;
  stages: ContentStageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentPackageResponse {
  id: string;
  theme: string;
  biblicalReferences: string;
  canonicalObjective: string;
  canonicalNotes: string | null;
  templateCatalogVersion: string;
  status: ContentPackageStatus;
  createdById: string;
  archivedAt: string | null;
  lockVersion: number;
  tracks: ContentTrackResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentPackageListItemResponse {
  id: string;
  theme: string;
  biblicalReferences: string;
  status: ContentPackageStatus;
  templateCatalogVersion: string;
  createdById: string;
  tracksCount: number;
  stagesCount: number;
  requiredStagesCount: number;
  approvedStagesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContentPackagesResponse {
  data: ContentPackageListItemResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryContentPackagesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContentPackageStatus;
  reviewQueue?: boolean;
  audience?: ContentAudience;
  startDate?: string;
  endDate?: string;
}

export interface CreateContentPackagePayload {
  theme: string;
  biblicalReferences: string;
  canonicalObjective: string;
  canonicalNotes?: string | null;
}

export interface RequestStageGenerationPayload {
  capability: AiGenerationCapability;
  idempotencyKey: string;
}

export interface SaveStageContentPayload {
  structuredContent: Record<string, unknown>;
  templateVersion?: string;
}

export interface RequestStageChangesPayload {
  versionId: string;
  lockVersion: number;
  contentChecksum: string;
  blockKey?: string | null;
  message: string;
}

export interface ApproveReviewStagePayload {
  versionId: string;
  lockVersion: number;
  contentChecksum: string;
}

export interface ContentGenerationJobResponse {
  id: string;
  stageId: string;
  idempotencyKey: string;
  capability: AiGenerationCapability;
  status: string;
  attempts: number;
  availableAt: string;
  workerId: string | null;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentPackagesState {
  packages: ContentPackageListItemResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: boolean;
}

export interface ContentPackageState {
  contentPackage: ContentPackageResponse | null;
  loading: boolean;
  error: boolean;
}

export enum AiProvider {
  OPENAI = "OPENAI",
  GEMINI = "GEMINI",
}

export enum AiProviderHealth {
  HEALTHY = "HEALTHY",
  DEGRADED = "DEGRADED",
  UNAVAILABLE = "UNAVAILABLE",
  UNKNOWN = "UNKNOWN",
}

export enum AiGenerationCapability {
  TEXT_STRUCTURED = "TEXT_STRUCTURED",
  IMAGE_GENERATION = "IMAGE_GENERATION",
}

export interface AiConfiguredModelResponse {
  id: string;
  capabilities: AiGenerationCapability[];
}

export interface AiProviderResponse {
  provider: AiProvider;
  enabled: boolean;
  credentialConfigured: boolean;
  health: AiProviderHealth;
  models: AiConfiguredModelResponse[];
  configurationSource: "DEPLOYMENT";
}

export interface AiProvidersState {
  providers: AiProviderResponse[];
  loading: boolean;
  error: boolean;
}

export interface ContentStudioDashboardPackages {
  total: number;
  byStatus: Record<ContentPackageStatus, number>;
  inProduction: number;
  awaitingReview: number;
  readyForPublication: number;
  publishedTotal: number;
}

export interface ContentStudioDashboardStages {
  total: number;
  approved: number;
  pendingReview: number;
  changesRequested: number;
  failed: number;
}

export interface ContentStudioDashboardJobs {
  pending: number;
  running: number;
  failed: number;
}

export interface ContentStudioDashboardResponse {
  packages: ContentStudioDashboardPackages;
  stages: ContentStudioDashboardStages;
  jobs: ContentStudioDashboardJobs;
  recent: ContentPackageListItemResponse[];
}

export interface ContentStudioDashboardQuery {
  startDate?: string;
  endDate?: string;
  audience?: ContentAudience;
}

export interface ContentStudioDashboardState {
  dashboard: ContentStudioDashboardResponse | null;
  loading: boolean;
  error: boolean;
}
