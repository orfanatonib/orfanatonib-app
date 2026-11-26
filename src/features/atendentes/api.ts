import api from "@/config/axiosConfig";
import { buildListQuery } from "@/components/common/admin-shell/listQuery";
import type { AdminListFetcher } from "@/components/common/admin-shell/types";
import { ATENDENTES_ENDPOINT } from "./constants";
import type {
  AtendenteResponseDto,
  PaginatedAtendenteResponseDto,
  CreateAtendenteDto,
  UpdateAtendenteDto,
} from "./types";
import type { AtendenteFiles } from "./types";

/**
 * Página filtrada, ordenada e paginada no servidor. Esta rota responde `{ data, total, totalPages }`
 * (e não `{ data, meta }`), então o envelope é convertido aqui.
 */
export const fetchAtendentesPage: AdminListFetcher<AtendenteResponseDto> = async (params, signal) => {
  const { data } = await api.get<PaginatedAtendenteResponseDto>(ATENDENTES_ENDPOINT, {
    params: buildListQuery(params),
    signal,
  });
  return { items: data.data, total: data.total, totalPages: Math.max(1, data.totalPages) };
};

export async function apiGetAtendente(id: string): Promise<AtendenteResponseDto> {
  const { data } = await api.get<AtendenteResponseDto>(`${ATENDENTES_ENDPOINT}/${id}`);
  return data;
}

export async function apiCreateAtendente(
  payload: CreateAtendenteDto,
  files: AtendenteFiles
): Promise<AtendenteResponseDto> {
  const formData = new FormData();
  formData.append("atendenteData", JSON.stringify(payload));
  if (files.estadual) formData.append("estadual", files.estadual);
  if (files.federal) formData.append("federal", files.federal);
  const { data } = await api.post<AtendenteResponseDto>(ATENDENTES_ENDPOINT, formData);
  return data;
}

export async function apiUpdateAtendente(
  id: string,
  payload: UpdateAtendenteDto,
  files?: AtendenteFiles
): Promise<AtendenteResponseDto> {
  const formData = new FormData();
  formData.append("atendenteData", JSON.stringify(payload));
  if (files?.estadual) formData.append("estadual", files.estadual);
  if (files?.federal) formData.append("federal", files.federal);
  const { data } = await api.put<AtendenteResponseDto>(
    `${ATENDENTES_ENDPOINT}/${id}`,
    formData
  );
  return data;
}

export async function apiDeleteAtendente(id: string): Promise<void> {
  await api.delete(`${ATENDENTES_ENDPOINT}/${id}`);
}
