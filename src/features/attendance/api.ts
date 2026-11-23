import { ATTENDANCE_RECORDS_PAGE_SIZE } from "./constants";
import api from "@/config/axiosConfig";
import { fetchAdminPage } from "@/components/common/admin-shell/listQuery";
import type { AdminListPage, AdminListParams } from "@/components/common/admin-shell/types";

import type {
  AllPendingsResponseDto,
  AttendanceFiltersQuery,
  AttendanceResponseDto,
  HierarchicalSheetsResponse,
  LeaderTeamDto,
  PaginatedResponseDto,
  PeriodQuery,
  RegisterAttendanceDto,
  RegisterTeamAttendanceDto,
  SheltersTeamsMembersResponse,
  TeamMembersResponse,
  TeamScheduleDto,
} from "./types";

/**
 * Chamadas HTTP do módulo de frequência.
 *
 * Os parâmetros vão pelo `params` do axios, não por `URLSearchParams` montado
 * à mão: três funções repetiam esse bloco, e cada uma esquecia um campo
 * diferente — `getTeamSchedules` ignorava `page` e `limit`, por exemplo.
 */

export async function registerAttendance(
  data: RegisterAttendanceDto,
): Promise<AttendanceResponseDto> {
  const response = await api.post<AttendanceResponseDto>(
    "/attendance/register",
    data,
  );
  return response.data;
}

export async function registerTeamAttendance(
  data: RegisterTeamAttendanceDto,
): Promise<AttendanceResponseDto[]> {
  const response = await api.post<AttendanceResponseDto[]>(
    "/attendance/register/team",
    data,
  );
  return response.data;
}

export async function getAllPendings(): Promise<AllPendingsResponseDto> {
  const response = await api.get<AllPendingsResponseDto>(
    "/attendance/pending/all",
  );
  return response.data;
}

export async function getTeamMembers(
  teamId: string,
): Promise<TeamMembersResponse> {
  const response = await api.get<TeamMembersResponse>(
    `/attendance/team/${teamId}/members`,
  );
  return response.data;
}

export async function getTeamSchedules(
  teamId: string,
  query: PeriodQuery = {},
): Promise<TeamScheduleDto[]> {
  const response = await api.get<TeamScheduleDto[]>(
    `/attendance/team/${teamId}/schedules`,
    { params: query },
  );
  return response.data;
}

/**
 * Hierarquia abrigo → equipe → membros.
 *
 * O agrupamento acontecia aqui, no cliente, a partir da lista plana de
 * `/leader/teams` — enquanto o endpoint que já devolve a árvore pronta ficava
 * sem uso.
 */
export async function getSheltersTeamsMembers(): Promise<SheltersTeamsMembersResponse> {
  const response = await api.get<SheltersTeamsMembersResponse>(
    "/attendance/leader/teams/members",
  );
  return response.data;
}

/**
 * Abrigos (com equipes e membros) da tela "Lançar presença": busca, abrigo, ordenação e página no
 * servidor (`GET /attendance/leader/teams/members?page=`). O total conta abrigos.
 */
export function getSheltersTeamsMembersPage(
  params: AdminListParams,
  signal: AbortSignal,
): Promise<AdminListPage<SheltersTeamsMembersResponse[number]>> {
  return fetchAdminPage("/attendance/leader/teams/members", params, signal);
}

/** Equipes que o ator lidera (lista plana): origem das opções do filtro de abrigo. */
export async function getLeaderTeams(): Promise<LeaderTeamDto[]> {
  const response = await api.get<LeaderTeamDto[]>("/attendance/leader/teams");
  return response.data;
}

export async function getHierarchicalSheets(
  query: PeriodQuery = {},
): Promise<HierarchicalSheetsResponse> {
  const response = await api.get<HierarchicalSheetsResponse>(
    "/attendance/sheets/hierarchical",
    { params: query },
  );
  return response.data;
}

export async function getAttendanceRecords(
  query: AttendanceFiltersQuery = {},
): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
  const response = await api.get<PaginatedResponseDto<AttendanceResponseDto>>(
    "/attendance/records",
    { params: query },
  );
  return response.data;
}

/** Load the whole selected occurrence; never treat a missing page as an unmarked member. */
export async function getOccurrenceAttendance(
  query: import("./workspace.types").AttendanceOccurrenceQuery,
): Promise<AttendanceResponseDto[]> {
  const records: AttendanceResponseDto[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    const response = await getAttendanceRecords({
      ...query,
      page,
      limit: ATTENDANCE_RECORDS_PAGE_SIZE,
    });
    records.push(...response.data);
    hasNext = response.meta.hasNext;
    page += 1;
  }
  return records;
}
