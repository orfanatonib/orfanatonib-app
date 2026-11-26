import api from "@/config/axiosConfig";
import { SHELTERED_ENDPOINT } from "./constants";
import { compactFilters, sortToQuery } from "./utils";
import type {
  CreateShelteredForm,
  EditShelteredForm,
  Paginated,
  ShelteredFilters,
  ShelteredListParams,
  ShelteredResponseDto,
  ShelteredSimpleParams,
  ShelteredSimpleResponseDto,
} from "./types";
import { AcceptedJesusFilter, ShelteredActiveFilter } from "./enums";

type ShelteredListQuery = ShelteredFilters & {
  page: number;
  limit: number;
  orderBy: string;
  order: string;
};

export async function apiFetchShelteredList({
  page,
  limit,
  filters,
  sort,
  signal,
}: ShelteredListParams): Promise<Paginated<ShelteredResponseDto>> {
  const params: ShelteredListQuery = {
    page,
    limit,
    ...sortToQuery(sort),
    ...compactFilters(filters),
  };

  const { data } = await api.get<Paginated<ShelteredResponseDto>>(SHELTERED_ENDPOINT, {
    params,
    signal,
  });
  return data;
}

type ShelteredSimpleQuery = {
  page?: number;
  limit?: number;
  searchString?: string;
  acceptedJesus?: AcceptedJesusFilter;
  active?: ShelteredActiveFilter;
};

export async function apiFetchShelteredSimple(
  args: ShelteredSimpleParams = {},
): Promise<Paginated<ShelteredSimpleResponseDto>> {
  const params: ShelteredSimpleQuery = {};

  if (args.page !== undefined) params.page = args.page;
  if (args.limit !== undefined) params.limit = args.limit;
  if (args.searchString?.trim()) params.searchString = args.searchString.trim();
  if (args.acceptedJesus && args.acceptedJesus !== AcceptedJesusFilter.ALL) {
    params.acceptedJesus = args.acceptedJesus;
  }
  if (args.active && args.active !== ShelteredActiveFilter.ALL) {
    params.active = args.active;
  }

  const { data } = await api.get<Paginated<ShelteredSimpleResponseDto>>(
    `${SHELTERED_ENDPOINT}/simple`,
    { params },
  );
  return data;
}

export async function apiFetchSheltered(id: string): Promise<ShelteredResponseDto> {
  const { data } = await api.get<ShelteredResponseDto>(`${SHELTERED_ENDPOINT}/${id}`);
  return data;
}

export async function apiCreateSheltered(
  payload: CreateShelteredForm,
): Promise<ShelteredResponseDto> {
  const { data } = await api.post<ShelteredResponseDto>(SHELTERED_ENDPOINT, payload);
  return data;
}

export async function apiUpdateSheltered(
  id: string,
  payload: Omit<EditShelteredForm, "id">,
): Promise<ShelteredResponseDto> {
  const { data } = await api.put<ShelteredResponseDto>(
    `${SHELTERED_ENDPOINT}/${id}`,
    payload,
  );
  return data;
}

export async function apiUpdateShelteredStatus(
  id: string,
  active: boolean,
): Promise<ShelteredResponseDto> {
  const { data } = await api.patch<ShelteredResponseDto>(
    `${SHELTERED_ENDPOINT}/${id}/status`,
    { active },
  );
  return data;
}

export async function apiDeleteSheltered(id: string): Promise<void> {
  await api.delete(`${SHELTERED_ENDPOINT}/${id}`);
}
