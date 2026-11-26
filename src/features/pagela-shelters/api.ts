import api from '@/config/axiosConfig';
import { ADMIN_SORT_FILTER_KEY } from '@/components/common/admin-shell/constants';
import { splitSort } from '@/components/common/admin-shell/listQuery';
import type { AdminListFetcher, AdminListParams } from '@/components/common/admin-shell/types';
import type {
  SheltersResponse,
  ShelteredResponse,
  PagelasResponse,
  SheltersFilters,
  ShelteredFilters,
  PagelasFilters,
  ShelterDto,
  ShelteredDto,
  PagelaDto,
} from './types';

export class PagelaSheltersApi {
  static async getShelters(filters: SheltersFilters = {}): Promise<SheltersResponse> {
    const params: Record<string, string | number> = {
      page: filters.page || 1,
      limit: filters.limit || 6, 
      sort: filters.sort || 'name',
      order: filters.order || 'ASC',
    };

    if (filters.searchString && filters.searchString.trim()) {
      params.searchString = filters.searchString;
    }

    const response = await api.get<SheltersResponse>('/shelters', { params });
    return response.data;
  }

  static async getSheltered(filters: ShelteredFilters = {}): Promise<ShelteredResponse> {
    const params: Record<string, string | number> = {
      page: filters.page || 1,
      limit: filters.limit || 6, 
      orderBy: filters.orderBy || 'name',
      order: filters.order || 'ASC',
    };

    if (filters.searchString && filters.searchString.trim()) {
      params.searchString = filters.searchString;
    }
    if (filters.shelterId && filters.shelterId.trim()) {
      params.shelterId = filters.shelterId;
    }

    const response = await api.get<ShelteredResponse>('/sheltered', { params });
    return response.data;
  }

  static async getPagelas(filters: PagelasFilters = {}): Promise<PagelasResponse> {
    const params: Record<string, string | number> = {
      page: filters.page || 1,
      limit: filters.limit || 6, 
    };

    if (filters.searchString && filters.searchString.trim()) {
      params.searchString = filters.searchString;
    }
    if (filters.shelteredId && filters.shelteredId.trim()) {
      params.shelteredId = filters.shelteredId;
    }

    const response = await api.get<PagelasResponse>('/pagelas/paginated', { params });
    return response.data;
  }
}

/**
 * Fetchers da tela de Pagelas: cada nível mapeia os parâmetros da casca (`AdminListParams`) para o
 * contrato que o endpoint JÁ tem (nomes `searchString`, `sort`/`orderBy`, envelopes diferentes), sem mudá-lo.
 */
const textFilters = (params: AdminListParams, keys: readonly string[]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = params.filters[key]?.trim();
    if (value) out[key] = value;
  }
  return out;
};

const searchParam = (params: AdminListParams): Record<string, string> => {
  const search = params.search.trim();
  return search ? { searchString: search } : {};
};

const pageOf = <TItem>(items: TItem[], total: number, limit: number) => ({
  items,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export const fetchSheltersLevel: AdminListFetcher<ShelterDto> = async (params, signal) => {
  const { sortBy, order } = splitSort(params.filters[ADMIN_SORT_FILTER_KEY]);
  const { data } = await api.get<SheltersResponse>('/shelters', {
    params: {
      page: params.page,
      limit: params.limit,
      ...(sortBy ? { sort: sortBy, order } : {}),
      ...searchParam(params),
      ...textFilters(params, ['city', 'state', 'createdFrom', 'createdTo']),
    },
    signal,
  });
  return pageOf(data.items, data.total, params.limit);
};

export const fetchShelteredLevel =
  (shelterId: string): AdminListFetcher<ShelteredDto> =>
  async (params, signal) => {
    const { sortBy, order } = splitSort(params.filters[ADMIN_SORT_FILTER_KEY]);
    const { data } = await api.get<ShelteredResponse>('/sheltered', {
      params: {
        page: params.page,
        limit: params.limit,
        shelterId,
        ...(sortBy ? { orderBy: sortBy, order } : {}),
        ...searchParam(params),
        ...textFilters(params, ['gender', 'joinedFrom', 'joinedTo']),
      },
      signal,
    });
    return { items: data.data, total: data.meta.totalItems, totalPages: data.meta.totalPages };
  };

export const fetchPagelasLevel =
  (shelteredId: string): AdminListFetcher<PagelaDto> =>
  async (params, signal) => {
    const { sortBy, order } = splitSort(params.filters[ADMIN_SORT_FILTER_KEY]);
    const { data } = await api.get<PagelasResponse>('/pagelas/paginated', {
      params: {
        page: params.page,
        limit: params.limit,
        shelteredId,
        ...(sortBy ? { sortBy, order } : {}),
        ...searchParam(params),
        ...textFilters(params, ['year', 'present', 'referenceFrom', 'referenceTo']),
      },
      signal,
    });
    return pageOf(data.items, data.total, params.limit);
  };
