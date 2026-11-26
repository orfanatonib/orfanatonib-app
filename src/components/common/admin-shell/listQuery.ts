import api from '@/config/axiosConfig';
import { ADMIN_SORT_FILTER_KEY } from './constants';
import type { AdminListPage, AdminListParams } from './types';

/** Envelope paginado que a API devolve quando recebe `page`. */
export interface ApiPaginated<TItem> {
  data: TItem[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number };
}

/** Separa `createdAt:DESC` em `sortBy`/`order`; valor vazio ou malformado não manda nada. */
export function splitSort(value: string | undefined): { sortBy?: string; order?: 'ASC' | 'DESC' } {
  if (!value) return {};
  const [sortBy, order] = value.split(':');
  if (!sortBy || (order !== 'ASC' && order !== 'DESC')) return {};
  return { sortBy, order };
}

/**
 * Query string da listagem: `page`/`limit`, busca e filtros preenchidos.
 * A ordenação (`sort`) vira `sortBy` + `order`; vazios nunca vão na URL.
 */
export function buildListQuery(params: AdminListParams): Record<string, string | number> {
  const query: Record<string, string | number> = { page: params.page, limit: params.limit };
  const search = params.search.trim();
  if (search) query.search = search;

  for (const [key, value] of Object.entries(params.filters)) {
    if (!value) continue;
    if (key === ADMIN_SORT_FILTER_KEY) {
      const { sortBy, order } = splitSort(value);
      if (sortBy && order) {
        query.sortBy = sortBy;
        query.order = order;
      }
      continue;
    }
    query[key] = value;
  }
  return query;
}

/** GET paginado no servidor; o corpo `{ data, meta }` vira `{ items, total, totalPages }`. */
export async function fetchAdminPage<TItem>(
  url: string,
  params: AdminListParams,
  signal: AbortSignal,
): Promise<AdminListPage<TItem>> {
  const { data } = await api.get<ApiPaginated<TItem>>(url, {
    params: buildListQuery(params),
    signal,
  });
  return {
    items: data.data,
    total: data.meta.totalItems,
    totalPages: data.meta.totalPages,
  };
}
