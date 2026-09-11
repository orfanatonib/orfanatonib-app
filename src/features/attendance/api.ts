import api from '@/config/axiosConfig';

import type {
  AllPendingsResponseDto,
  AttendanceFiltersQuery,
  AttendanceResponseDto,
  HierarchicalSheetsResponse,
  PaginatedResponseDto,
  PeriodQuery,
  RegisterAttendanceDto,
  RegisterTeamAttendanceDto,
  SheltersTeamsMembersResponse,
  TeamMembersResponse,
  TeamScheduleDto,
} from './types';

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
    '/attendance/register',
    data,
  );
  return response.data;
}

export async function registerTeamAttendance(
  data: RegisterTeamAttendanceDto,
): Promise<AttendanceResponseDto[]> {
  const response = await api.post<AttendanceResponseDto[]>(
    '/attendance/register/team',
    data,
  );
  return response.data;
}

export async function getAllPendings(): Promise<AllPendingsResponseDto> {
  const response = await api.get<AllPendingsResponseDto>(
    '/attendance/pending/all',
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
    '/attendance/leader/teams/members',
  );
  return response.data;
}

export async function getHierarchicalSheets(
  query: PeriodQuery = {},
): Promise<HierarchicalSheetsResponse> {
  const response = await api.get<HierarchicalSheetsResponse>(
    '/attendance/sheets/hierarchical',
    { params: query },
  );
  return response.data;
}

export async function getAttendanceRecords(
  query: AttendanceFiltersQuery = {},
): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
  const response = await api.get<PaginatedResponseDto<AttendanceResponseDto>>(
    '/attendance/records',
    { params: query },
  );
  return response.data;
}
