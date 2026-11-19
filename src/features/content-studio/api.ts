import api from "@/config/axiosConfig";

import { PUBLISH_REQUEST_TIMEOUT_MS } from "./publication.constants";
import { parseSseText } from "./sse.utils";
import type { ExportFormat } from "./types";
import type {
  AiProviderResponse,
  ApproveReviewStagePayload,
  ContentGenerationJobResponse,
  ContentPackageListItemResponse,
  ContentPackageResponse,
  ContentPublicationResponse,
  PublishContentPackagePayload,
  ContentStudioCatalogResponse,
  ContentStudioDashboardResponse,
  ContentStudioDashboardQuery,
  CreateContentPackagePayload,
  PaginatedContentPackagesResponse,
  QueryContentPackagesParams,
  RequestStageChangesPayload,
  RequestStageGenerationPayload,
  SaveStageContentPayload,
  StageDocumentResponse,
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
  const { statuses, ...rest } = params;
  const { data } = await api.get<PaginatedContentPackagesResponse>(
    "/content-studio/packages",
    {
      params: { ...rest, ...(statuses?.length ? { statuses: statuses.join(",") } : {}) },
      signal,
    },
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

export async function getStageDocument(
  packageId: string,
  stageId: string,
  signal?: AbortSignal,
): Promise<StageDocumentResponse> {
  const { data } = await api.get<StageDocumentResponse>(
    `/content-studio/packages/${packageId}/stages/${stageId}/document`,
    { signal },
  );
  return data;
}

/** Caminho (relativo ao pacote) de cada exportação. */
export const exportPath = {
  stage: (stageId: string, format: ExportFormat) =>
    `stages/${stageId}/export/${format}`,
  track: (audience: string, format: ExportFormat) =>
    `tracks/${audience}/export/${format}`,
  all: (format: ExportFormat) => `export/${format}`,
};

export async function fetchExport(
  packageId: string,
  path: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/content-studio/packages/${packageId}/${path}`,
    {
      responseType: "blob",
      signal,
      skipGlobalError: true,
    },
  );
  return data;
}

/** Baixa o arquivo gerado pela API com o nome que ela sugeriu. */
export async function downloadExport(
  packageId: string,
  path: string,
  fileName: string,
): Promise<void> {
  const blob = await fetchExport(packageId, path);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export interface GenerationStreamHandlers {
  onJobs: (jobs: ContentGenerationJobResponse[]) => void;
}

/**
 * Abre o stream SSE de andamento das gerações do pacote. Resolve quando o servidor encerra (tempo/ociosidade)
 * ou o `signal` aborta; rejeita se a conexão falhar (o chamador cai para polling).
 */
export async function streamPackageGenerations(
  packageId: string,
  signal: AbortSignal,
  handlers: GenerationStreamHandlers,
): Promise<void> {
  let offset = 0;
  await api.get<string>(
    `/content-studio/packages/${packageId}/generations/stream`,
    {
      responseType: "text",
      timeout: 0,
      signal,
      skipGlobalError: true,
      headers: { Accept: "text/event-stream" },
      transformResponse: (value: string) => value,
      onDownloadProgress: (progress) => {
        const target = progress.event?.target as XMLHttpRequest | undefined;
        const parsed = parseSseText(target?.responseText ?? "", offset);
        offset = parsed.offset;
        for (const message of parsed.messages) {
          if (message.event !== "jobs") continue;
          try {
            handlers.onJobs(
              JSON.parse(message.data) as ContentGenerationJobResponse[],
            );
          } catch {
            // quadro inválido: ignora; o próximo estado corrige
          }
        }
      },
    },
  );
}

/** Publica o material aprovado como página de materiais para visita (idempotente pela chave). */
export async function publishContentPackage(
  packageId: string,
  payload: PublishContentPackagePayload,
): Promise<ContentPublicationResponse> {
  const { data } = await api.post<ContentPublicationResponse>(
    `/content-studio/packages/${packageId}/publish`,
    payload,
    { timeout: PUBLISH_REQUEST_TIMEOUT_MS },
  );
  return data;
}

/** Última publicação do material; `null` se nunca houve (a API responde 204). */
export async function getContentPackagePublication(
  packageId: string,
  signal?: AbortSignal,
): Promise<ContentPublicationResponse | null> {
  const { data } = await api.get<ContentPublicationResponse | "">(
    `/content-studio/packages/${packageId}/publication`,
    { signal },
  );
  return data || null;
}
