import api from "@/config/axiosConfig";
import type {
  AtendenteResponseDto,
  PaginatedAtendenteResponseDto,
  QueryAtendenteDto,
  CreateAtendenteDto,
  UpdateAtendenteDto,
} from "./types";
import { apiListIntegrationsSimple } from "@/features/integration/api";
import { apiListUsersSimple } from "@/features/users/api";

export type ListAtendentesParams = QueryAtendenteDto;

export async function apiListAtendentes(
  params: ListAtendentesParams
): Promise<PaginatedAtendenteResponseDto> {
  const { data } = await api.get<PaginatedAtendenteResponseDto>(
    "/antecedentes-criminais",
    { params }
  );
  return data;
}

export async function apiGetAtendente(id: string): Promise<AtendenteResponseDto> {
  const { data } = await api.get<AtendenteResponseDto>(`/antecedentes-criminais/${id}`);
  return data;
}

export async function apiCreateAtendente(
  payload: CreateAtendenteDto,
  file: File
): Promise<AtendenteResponseDto> {
  const formData = new FormData();
  formData.append("atendenteData", JSON.stringify(payload));
  formData.append("pdf", file);
  const { data } = await api.post<AtendenteResponseDto>("/antecedentes-criminais", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function apiUpdateAtendente(
  id: string,
  payload: UpdateAtendenteDto,
  file?: File
): Promise<AtendenteResponseDto> {
  const formData = new FormData();
  formData.append("atendenteData", JSON.stringify(payload));
  if (file) formData.append("pdf", file);
  const { data } = await api.put<AtendenteResponseDto>(
    `/antecedentes-criminais/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function apiDeleteAtendente(id: string): Promise<void> {
  await api.delete(`/antecedentes-criminais/${id}`);
}

export { apiListIntegrationsSimple } from "@/features/integration/api";
export { apiListUsersSimple } from "@/features/users/api";
