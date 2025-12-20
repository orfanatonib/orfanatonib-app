import api from "@/config/axiosConfig";
import type { PageDto, Pagela, CreatePagelaPayload, UpdatePagelaPayload } from "./types";

export async function apiListPagelasPaginated(
  params: {
    shelteredId: string;
    year?: number;
    visit?: number;
    present?: "true" | "false";
    searchString?: string;
    page?: number;
    limit?: number;
  },
  options?: { signal?: AbortSignal }
) {
  const { data } = await api.get<PageDto<Pagela>>("/pagelas/paginated", {
    params,
    signal: options?.signal,
  });
  return data;
}

export async function apiCreatePagela(payload: CreatePagelaPayload) {
  const { data } = await api.post<Pagela>("/pagelas", payload);
  return data;
}

export async function apiUpdatePagela(id: string, payload: UpdatePagelaPayload) {
  const { data } = await api.patch<Pagela>(`/pagelas/${id}`, payload);
  return data;
}

export async function apiDeletePagela(id: string) {
  await api.delete(`/pagelas/${id}`);
}