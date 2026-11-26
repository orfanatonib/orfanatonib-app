import type {
  AdminListPage,
  AdminListParams,
} from "@/components/common/admin-shell";
import { splitSort } from "@/components/common/admin-shell";
import { apiListUsers } from "./api";
import type { ActiveFilter, CompletedFilter, UserRow } from "./types";
import { USERS_FILTER_KEYS } from "./constants";

/** Páginas do servidor: `meta.total` vira `total` e `totalPages` nunca é menor que 1. */
export function toUsersPage(
  page: Awaited<ReturnType<typeof apiListUsers>>,
  limit: number,
): AdminListPage<UserRow> {
  const items = Array.isArray(page?.items) ? page.items : [];
  const total = Number(page?.meta?.total ?? 0);
  return { items, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Filtros da tela → query do `GET /users` (nomes do contrato do servidor). */
export async function fetchUsersPage(
  params: AdminListParams,
  signal: AbortSignal,
): Promise<AdminListPage<UserRow>> {
  const { sortBy, order } = splitSort(params.filters[USERS_FILTER_KEYS.SORT]);
  const page = await apiListUsers(
    {
      page: params.page,
      limit: params.limit,
      q: params.search.trim() || undefined,
      role: params.filters[USERS_FILTER_KEYS.ROLE] || undefined,
      active: (params.filters[USERS_FILTER_KEYS.ACTIVE] || undefined) as ActiveFilter | undefined,
      completed: (params.filters[USERS_FILTER_KEYS.COMPLETED] || undefined) as CompletedFilter | undefined,
      createdFrom: params.filters[USERS_FILTER_KEYS.CREATED_FROM] || undefined,
      createdTo: params.filters[USERS_FILTER_KEYS.CREATED_TO] || undefined,
      sort: sortBy,
      order,
    },
    signal,
  );
  return toUsersPage(page, params.limit);
}
