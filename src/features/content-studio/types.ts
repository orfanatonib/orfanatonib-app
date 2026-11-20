export enum ContentAudience {
  BABY = "BABY",
  CHILD = "CHILD",
  TEEN = "TEEN",
  ADULT = "ADULT",
}

export enum ContentStageType {
  LESSON = "LESSON",
  LESSON_VISUALS = "LESSON_VISUALS",
  VERSE_VISUALS = "VERSE_VISUALS",
  VERSE_FIXATION = "VERSE_FIXATION",
  STANDARD_GAME = "STANDARD_GAME",
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
  /** Envio (ou reenvio) do item para a revisão; `reviewerId` guarda quem enviou. */
  SUBMITTED = "SUBMITTED",
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
  /** Quando a categoria foi publicada em Materiais de Visita (`null` = ainda não); categoria publicada fica travada. */
  publishedAt: string | null;
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
  /** Imagem de apresentação (capa) do material; `null` até ser gerada. Não passa por revisão. */
  coverImageUrl: string | null;
  /** A capa está sendo desenhada agora. */
  coverGenerating: boolean;
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
  /** Faixas já publicadas em Materiais de Visita (da mais nova à mais velha). */
  publishedAudiences: ContentAudience[];
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
  theme: string;
  biblicalReferences: string;
  canonicalObjective: string;
  canonicalNotes?: string | null;
}

/** Escolhas dos visuais da lição (as mesmas perguntas do Clubinho). */
export enum VisualFormat {
  CUTOUT_KIT = "CUTOUT_KIT",
  STORY_SCENES = "STORY_SCENES",
}

export enum VisualStyle {
  CUTE_CARTOON = "CUTE_CARTOON",
  ILLUSTRATED = "ILLUSTRATED",
  CLASSIC_CARTOON = "CLASSIC_CARTOON",
  MODERN_ILLUSTRATION = "MODERN_ILLUSTRATION",
  GRAPHIC_NOVEL = "GRAPHIC_NOVEL",
  EDITORIAL_PAINTING = "EDITORIAL_PAINTING",
  SOFT_WATERCOLOR = "SOFT_WATERCOLOR",
}

export enum VisualOrientation {
  LANDSCAPE = "LANDSCAPE",
  PORTRAIT = "PORTRAIT",
}

export interface VisualConfig {
  quantity: number;
  format: VisualFormat;
  style: VisualStyle;
  orientation: VisualOrientation;
  instructions?: string;
}

export interface RequestStageGenerationPayload {
  revisionInstructions?: string;
  capability: AiGenerationCapability;
  idempotencyKey: string;
  /** Obrigatório na etapa "Visuais da lição". */
  visualConfig?: VisualConfig;
}

/** Fases de um job de texto, na ordem em que acontecem. */
export type TextJobStep = "PREPARING" | "WRITING" | "VALIDATING" | "SAVING";

/** Andamento de um job de texto: fase atual e quando a execução começou. */
export interface TextJobProgress {
  phase: "TEXT";
  step: TextJobStep;
  startedAt: string;
}

/** Andamento da fase de imagens de um job. */
export interface ImageJobProgress {
  phase: "IMAGES";
  done: number;
  total: number;
  failed: string[];
}

export interface StageImageItem {
  slot: string;
  title: string;
  assetId: string | null;
  url: string | null;
  updatedAt: string | null;
}

export interface StageImagesResponse {
  versionId: string | null;
  items: StageImageItem[];
}

export interface RegenerateStageImagesPayload {
  slots?: string[];
  instructions?: string;
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
  progress: ImageJobProgress | TextJobProgress | null;
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
  /** Categorias que esta publicação levou à página (`null` = publicação antiga, que levava o pacote inteiro). */
  audiences: ContentAudience[] | null;
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

/** Uma geração (job) na visão do Estúdio, com o material e a categoria a que pertence. */
export interface GenerationActivityItem {
  jobId: string;
  stageId: string;
  packageId: string;
  theme: string;
  biblicalReferences: string;
  trackId: string;
  audience: ContentAudience;
  stageType: ContentStageType;
  capability: AiGenerationCapability;
  status: string;
  attempts: number;
  progress: ImageJobProgress | TextJobProgress | null;
  errorCode: string | null;
  startedAt: string;
  updatedAt: string;
  heartbeatAt: string | null;
}

export interface GenerationFinishedItem extends GenerationActivityItem {
  durationMs: number;
}

/** O que o Estúdio está gerando agora (todos os administradores), as vagas que sobram e o histórico recente. */
export interface GenerationActivityResponse {
  limits: { maxPerCategory: number; maxPackages: number; maxTotal: number };
  usage: {
    activeJobs: number;
    activeCategories: number;
    activePackages: number;
    freeCategorySlots: number;
    freePackageSlots: number;
  };
  active: GenerationActivityItem[];
  recent: GenerationFinishedItem[];
  last24h: { succeeded: number; failed: number; cancelled: number; averageDurationMs: number | null };
}
