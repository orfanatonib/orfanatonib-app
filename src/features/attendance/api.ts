import api from '@/config/axiosConfig';
import {
  RegisterAttendanceDto,
  RegisterTeamAttendanceDto,
  AttendanceResponseDto,
  PendingForLeaderDto,
  PendingForMemberDto,
  LeaderTeamDto,
  TeamMembersResponse,
  TeamScheduleDto,
  SheltersTeamsMembersResponse,
  TeamAttendanceOverviewDto,
  PaginatedResponseDto,
  AttendanceStatsDto,
  AttendanceFiltersDto,
  HierarchicalSheetsResponse,
} from './types';

// Registrar presença individual
export async function registerAttendance(data: RegisterAttendanceDto): Promise<AttendanceResponseDto> {
  const res = await api.post<AttendanceResponseDto>('/attendance/register', data);
  return res.data;
}

// Registrar presença/falta em lote (pagela)
export async function registerTeamAttendance(data: RegisterTeamAttendanceDto): Promise<AttendanceResponseDto[]> {
  const res = await api.post<AttendanceResponseDto[]>('/attendance/register/team', data);
  return res.data;
}

// Consultar pendências do líder
export async function getPendingForLeader(teamId: string): Promise<PendingForLeaderDto[]> {
  const res = await api.get<PendingForLeaderDto[]>(`/attendance/pending/leader?teamId=${teamId}`);
  return res.data;
}

// Consultar pendências do membro
export async function getPendingForMember(): Promise<PendingForMemberDto[]> {
  const res = await api.get<PendingForMemberDto[]>('/attendance/pending/member');
  return res.data;
}

// Listar membros do time
export async function getTeamMembers(teamId: string): Promise<TeamMembersResponse> {
  const res = await api.get<TeamMembersResponse>(`/attendance/team/${teamId}/members`);
  return res.data;
}

// Listar eventos do time (com paginação e filtros)
export async function getTeamSchedules(
  teamId: string,
  filters?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: 'createdAt' | 'visitDate' | 'meetingDate';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<PaginatedResponseDto<TeamScheduleDto>> {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  const queryString = params.toString();
  const url = `/attendance/team/${teamId}/schedules${queryString ? `?${queryString}` : ''}`;
  const res = await api.get<PaginatedResponseDto<TeamScheduleDto>>(url);
  return res.data;
}

// Listar times (auxiliar)
export async function listTeams(): Promise<LeaderTeamDto[]> {
  const res = await api.get<LeaderTeamDto[]>('/attendance/leader/teams');
  return res.data;
}

// NOVOS ENDPOINTS PARA HIERARQUIA COMPLETA

// Listar hierarquia completa: abrigos → equipes → membros
export async function getSheltersTeamsMembers(): Promise<SheltersTeamsMembersResponse> {
  const res = await api.get<SheltersTeamsMembersResponse>('/attendance/leader/shelters-teams-members');
  return res.data;
}

// Listar times + membros agrupados por abrigo (alternativo)
export async function getLeaderTeamsMembers(): Promise<SheltersTeamsMembersResponse> {
  const res = await api.get<SheltersTeamsMembersResponse>('/attendance/leader/teams/members');
  return res.data;
}

// Visão geral de presença por equipe (futuro)
export async function getTeamAttendanceOverview(teamId: string): Promise<TeamAttendanceOverviewDto> {
  const res = await api.get<TeamAttendanceOverviewDto>(`/attendance/team/${teamId}/overview`);
  return res.data;
}

// Listar eventos globais (auxiliar)
export async function listShelterSchedules(): Promise<TeamScheduleDto[]> {
  const res = await api.get<TeamScheduleDto[]>('/shelter-schedules');
  return res.data;
}

// Listar pagelas hierarquicamente
export async function getHierarchicalSheets(
  filters?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<HierarchicalSheetsResponse> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  
  const queryString = params.toString();
  const url = `/attendance/sheets/hierarchical${queryString ? `?${queryString}` : ''}`;
  const res = await api.get<HierarchicalSheetsResponse>(url);
  return res.data;
}

// Listar registros de presença com filtros
export async function getAttendanceRecords(
  filters?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: 'present' | 'absent';
    teamId?: string;
    memberId?: string;
    scheduleId?: string;
    sortBy?: 'createdAt' | 'visitDate' | 'meetingDate';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.teamId) params.append('teamId', filters.teamId);
  if (filters?.memberId) params.append('memberId', filters.memberId);
  if (filters?.scheduleId) params.append('scheduleId', filters.scheduleId);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  const queryString = params.toString();
  const url = `/attendance/records${queryString ? `?${queryString}` : ''}`;
  const res = await api.get<PaginatedResponseDto<AttendanceResponseDto>>(url);
  return res.data;
}
