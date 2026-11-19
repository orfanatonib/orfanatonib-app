import api from "@/config/axiosConfig";

import type {
  AiProviderResponse,
  ApproveReviewStagePayload,
  ContentGenerationJobResponse,
  ContentPackageListItemResponse,
  ContentPackageResponse,
  ContentStudioCatalogResponse,
  ContentStudioDashboardResponse,
  ContentStudioDashboardQuery,
  CreateContentPackagePayload,
  PaginatedContentPackagesResponse,
  QueryContentPackagesParams,
  RequestStageChangesPayload,
  RequestStageGenerationPayload,
  SaveStageContentPayload,
} from "./types";

export async function getContentStudioCatalog(
  signal?: AbortSignal,
): Promise<ContentStudioCatalogResponse> {
  const { data } = await api.get<ContentStudioCatalogResponse>(
    "/content-studio/catalog",
    {
      signal,
    },
  );
  return data;
}

export async function getAiProviders(
  signal?: AbortSignal,
): Promise<AiProviderResponse[]> {
  const { data } = await api.get<AiProviderResponse[]>(
    "/ai-management/providers",
    { signal },
  );
  return data;
}

export async function getContentPackages(
  params: QueryContentPackagesParams,
  signal?: AbortSignal,
): Promise<PaginatedContentPackagesResponse> {
  const { data } = await api.get<PaginatedContentPackagesResponse>(
    "/content-studio/packages",
    { params, signal },
  );
  return data;
}

export async function getContentPackage(
  id: string,
  signal?: AbortSignal,
): Promise<ContentPackageResponse> {
  const { data } = await api.get<ContentPackageResponse>(
    `/content-studio/packages/${id}`,
    { signal },
  );
  return data;
}

export async function createContentPackage(
  payload: CreateContentPackagePayload,
): Promise<ContentPackageResponse> {
  const { data } = await api.post<ContentPackageResponse>(
    "/content-studio/packages",
    payload,
  );
  return data;
}

export async function requestStageGeneration(
  packageId: string,
  stageId: string,
  payload: RequestStageGenerationPayload,
): Promise<ContentGenerationJobResponse> {
  const { data } = await api.post<ContentGenerationJobResponse>(
    `/content-studio/packages/${packageId}/stages/${stageId}/generations`,
    payload,
  );
  return data;
}

/** Andamento da última geração da etapa; `null` se nunca houve. */
export async function getLatestStageGeneration(
  packageId: string,
  stageId: string,
): Promise<ContentGenerationJobResponse | null> {
  const { data } = await api.get<ContentGenerationJobResponse | "">(
    `/content-studio/packages/${packageId}/stages/${stageId}/generations/latest`,
  );
  return data || null;
}

export async function saveStageContent(
  packageId: string,
  stageId: string,
  payload: SaveStageContentPayload,
): Promise<ContentPackageResponse> {
  const { data } = await api.patch<ContentPackageResponse>(
    `/content-studio/packages/${packageId}/stages/${stageId}/content`,
    payload,
  );
  return data;
}

export async function completeProductionStage(
  packageId: string,
  stageId: string,
): Promise<ContentPackageResponse> {
  const { data } = await api.post<ContentPackageResponse>(
    `/content-studio/packages/${packageId}/stages/${stageId}/complete-production`,
  );
  return data;
}

export async function submitPackageReview(
  packageId: string,
): Promise<ContentPackageResponse> {
  const { data } = await api.post<ContentPackageResponse>(
    `/content-studio/packages/${packageId}/submit-review`,
  );
  return data;
}

export async function approveReviewStage(
  packageId: string,
  stageId: string,
  payload: ApproveReviewStagePayload,
): Promise<ContentPackageResponse> {
  const { data } = await api.post<ContentPackageResponse>(
    `/content-studio/packages/${packageId}/stages/${stageId}/approve`,
    payload,
  );
  return data;
}

export async function requestStageChanges(
  packageId: string,
  stageId: string,
  payload: RequestStageChangesPayload,
): Promise<ContentPackageResponse> {
  const { data } = await api.post<ContentPackageResponse>(
    `/content-studio/packages/${packageId}/stages/${stageId}/request-changes`,
    payload,
  );
  return data;
}

export async function resolveReviewComment(
  packageId: string,
  commentId: string,
): Promise<ContentPackageResponse> {
  const { data } = await api.post<ContentPackageResponse>(
    `/content-studio/packages/${packageId}/review-comments/${commentId}/resolve`,
  );
  return data;
}

export async function getContentStudioDashboard(
  params: ContentStudioDashboardQuery = {},
  signal?: AbortSignal,
): Promise<ContentStudioDashboardResponse> {
  const { data } = await api.get<ContentStudioDashboardResponse>(
    "/content-studio/dashboard",
    {
      params,
      signal,
    },
  );
  return data;
}

export async function archiveContentPackage(
  packageId: string,
): Promise<ContentPackageResponse> {
  const { data } = await api.post<ContentPackageResponse>(
    `/content-studio/packages/${packageId}/archive`,
  );
  return data;
}

export async function cancelStageGeneration(
  packageId: string,
  stageId: string,
): Promise<ContentGenerationJobResponse> {
  const { data } = await api.delete<ContentGenerationJobResponse>(
    `/content-studio/packages/${packageId}/stages/${stageId}/generations`,
  );
  return data;
}
