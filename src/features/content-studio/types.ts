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
  /** Documento rico editado à mão; `null` quando ninguém editou o documento (a prévia monta dos campos). */
  contentDocument: TiptapDocument | null;
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
  /** Faixas etárias do material, da mais nova para a mais velha. */
  audiences: ContentAudience[];
  stagesCount: number;
  requiredStagesCount: number;
  approvedStagesCount: number;
  stagesWithContentCount: number;
  generatingStagesCount: number;
  failedStagesCount: number;
  /** Uma etapa por segmento (faixa da mais nova à mais velha, etapas na ordem de produção). */
  stageSegments: ContentStageSegment[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentStageSegment {
  audience: ContentAudience;
  stageType: ContentStageType;
  status: ContentStageStatus;
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
  /** Várias situações de uma vez (a API recebe separadas por vírgula). */
  statuses?: readonly ContentPackageStatus[];
  reviewQueue?: boolean;
  audience?: ContentAudience;
  startDate?: string;
  endDate?: string;
  sort?: ContentPackageSort;
  order?: "ASC" | "DESC";
}

export type ContentPackageSort = "updatedAt" | "createdAt" | "theme";

export interface CreateContentPackagePayload {
  audience?: ContentAudience;
  theme: string;
  biblicalReferences: string;
  canonicalObjective: string;
  canonicalNotes?: string | null;
}

export interface RequestStageGenerationPayload {
  revisionInstructions?: string;
  capability: AiGenerationCapability;
  idempotencyKey: string;
}

export interface SaveStageContentPayload {
  structuredContent: Record<string, unknown>;
  /** Documento rico editado à mão; omitido = a prévia/exportação voltam a ser montadas dos campos. */
  contentDocument?: TiptapDocument;
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

/** Documento rico (TipTap/ProseMirror) de uma etapa: o que o editor do Estúdio lê e grava. */
export interface TiptapDocument {
  type: "doc";
  content: Array<Record<string, unknown>>;
}

/** Documento de uma etapa para o editor (`edited` diz se foi editado à mão ou montado dos campos). */
export interface StageDocumentResponse {
  document: TiptapDocument;
  edited: boolean;
  versionId: string | null;
}

export enum ExportFormat {
  DOCX = "docx",
  PDF = "pdf",
}

/** Estado da publicação do material como página de materiais para visita (espelha a API). */
export enum ContentPublicationStatus {
  PENDING = "PENDING",
  PUBLISHING = "PUBLISHING",
  PUBLISHED = "PUBLISHED",
  FAILED = "FAILED",
  UNCERTAIN = "UNCERTAIN",
}

/** Testamento da página publicada (espelha `TestamentType` da API). */
export enum PublicationTestament {
  OLD_TESTAMENT = "OLD_TESTAMENT",
  NEW_TESTAMENT = "NEW_TESTAMENT",
}

export interface PublishContentPackagePayload {
  idempotencyKey: string;
  testament: PublicationTestament;
}

export interface ContentPublicationResponse {
  id: string;
  packageId: string;
  status: ContentPublicationStatus;
  targetType: string;
  visitMaterialPageId: string | null;
  /** Caminho público da página (sem barra inicial); `null` se ainda não existe. */
  visitMaterialPagePath: string | null;
  publishedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export enum PublicationPhase {
  IDLE = "IDLE",
  PUBLISHING = "PUBLISHING",
  PUBLISHED = "PUBLISHED",
  FAILED = "FAILED",
}

export interface PublicationState {
  phase: PublicationPhase;
  publication: ContentPublicationResponse | null;
  /** Texto em português já pronto para a tela (falha ou resultado incerto). */
  message: string | null;
}
