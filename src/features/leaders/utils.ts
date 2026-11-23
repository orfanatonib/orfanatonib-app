import type { AdminFilterField, AdminListPage, AdminListParams } from "@/components/common/admin-shell";
import { splitSort } from "@/components/common/admin-shell";
import { apiListLeaders } from "./api";
import type { LeaderFilterOptions, LeaderProfile, LeaderShelterAssociation, ShelterSimpleResponse } from "./types";
import {
  LEADERS_FILTER_KEYS,
  LEADERS_LINK_OPTIONS,
  LEADERS_SORT_OPTIONS,
} from "./constants";

/** Opções dos selects de abrigo e de equipe (números únicos, em ordem crescente). */
export function buildLeaderFilterOptions(shelters: ShelterSimpleResponse[]): LeaderFilterOptions {
  const numbers = new Set<number>();
  for (const shelter of shelters) for (const team of shelter.teams ?? []) numbers.add(team.numberTeam);
  return {
    shelters: shelters.map((shelter) => ({ value: shelter.id, label: shelter.name })),
    teams: [...numbers].sort((a, b) => a - b).map((n) => ({ value: String(n), label: `Equipe ${n}` })),
  };
}

/** Campos da toolbar de líderes (busca à parte). */
export function buildLeaderFilterFields(options: LeaderFilterOptions): AdminFilterField[] {
  return [
    { kind: "select", key: LEADERS_FILTER_KEYS.SHELTER, label: "Abrigo", allLabel: "Todos", options: options.shelters },
    { kind: "select", key: LEADERS_FILTER_KEYS.LINK, label: "Vínculo", allLabel: "Todos", options: LEADERS_LINK_OPTIONS },
    { kind: "select", key: LEADERS_FILTER_KEYS.TEAM, label: "Equipe", allLabel: "Todas", options: options.teams },
    { kind: "date", key: LEADERS_FILTER_KEYS.CREATED_FROM, label: "Criado a partir de" },
    { kind: "date", key: LEADERS_FILTER_KEYS.CREATED_TO, label: "Criado até" },
    { kind: "select", key: LEADERS_FILTER_KEYS.SORT, label: "Ordenar por", allLabel: null, options: LEADERS_SORT_OPTIONS },
  ];
}

/** Filtros da tela → query do `GET /leader-profiles`; o servidor devolve `{ items, total }`. */
export async function fetchLeadersPage(
  params: AdminListParams,
  signal: AbortSignal,
): Promise<AdminListPage<LeaderProfile>> {
  const { sortBy, order } = splitSort(params.filters[LEADERS_FILTER_KEYS.SORT]);
  const link = params.filters[LEADERS_FILTER_KEYS.LINK];
  const data = await apiListLeaders(
    {
      page: params.page,
      limit: params.limit,
      leaderSearchString: params.search.trim() || undefined,
      shelterId: params.filters[LEADERS_FILTER_KEYS.SHELTER] || undefined,
      hasShelter: link ? link === "true" : undefined,
      teamName: params.filters[LEADERS_FILTER_KEYS.TEAM] || undefined,
      createdFrom: params.filters[LEADERS_FILTER_KEYS.CREATED_FROM] || undefined,
      createdTo: params.filters[LEADERS_FILTER_KEYS.CREATED_TO] || undefined,
      sort: sortBy as "name" | "updatedAt" | "createdAt" | undefined,
      order: order ? (order.toLowerCase() as "asc" | "desc") : undefined,
    },
    signal,
  );
  const total = Number(data?.total ?? 0);
  return {
    items: data?.items ?? [],
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

export const countTeams = (shelters: LeaderShelterAssociation[]): number =>
  shelters.reduce((sum, shelter) => sum + shelter.teams.length, 0);

export const collectMembers = (shelters: LeaderShelterAssociation[]) =>
  shelters.flatMap((shelter) => shelter.members ?? []);

export const memberLabel = (member: { user?: { name?: string; email?: string } }): string =>
  member.user?.name || member.user?.email || "Sem nome";
