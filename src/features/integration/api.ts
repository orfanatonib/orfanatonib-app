import api from "@/config/axiosConfig";
import type {
  IntegrationResponseDto,
  PaginatedResponseDto,
  QueryIntegrationDto,
  CreateIntegrationDto,
  UpdateIntegrationDto,
} from "./types";

export type ListIntegrationsParams = QueryIntegrationDto;

export type ApiMessage = { message?: string };

export async function apiCreateIntegration(
  data: CreateIntegrationDto,
  file?: File
): Promise<IntegrationResponseDto> {
  const formData = new FormData();

  // Adiciona os dados JSON
  formData.append('integrationData', JSON.stringify(data));

  // Adiciona o arquivo se existir
  if (file) {
    formData.append('file', file);
  }

  const { data: response } = await api.post<IntegrationResponseDto>(
    '/integrations',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
}

export async function apiListIntegrations(
  params: ListIntegrationsParams
): Promise<PaginatedResponseDto<IntegrationResponseDto>> {
  const { data } = await api.get<PaginatedResponseDto<IntegrationResponseDto>>(
    "/integrations",
    { params }
  );
  return data;
}

export async function apiListIntegrationsSimple(): Promise<IntegrationResponseDto[]> {
  const { data } = await api.get<IntegrationResponseDto[]>("/integrations/simple");
  return data;
}

export async function apiGetIntegration(integrationId: string): Promise<IntegrationResponseDto> {
  const { data } = await api.get<IntegrationResponseDto>(
    `/integrations/${integrationId}`
  );
  return data;
}

export async function apiUpdateIntegration(
  integrationId: string,
  data: UpdateIntegrationDto,
  file?: File
): Promise<IntegrationResponseDto> {
  const formData = new FormData();

  // Adiciona os dados JSON
  formData.append('integrationData', JSON.stringify(data));

  // Adiciona o arquivo se existir
  if (file) {
    formData.append('file', file);
  }

  const { data: response } = await api.put<IntegrationResponseDto>(
    `/integrations/${integrationId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
}

export async function apiDeleteIntegration(integrationId: string): Promise<void> {
  await api.delete(`/integrations/${integrationId}`);
}
