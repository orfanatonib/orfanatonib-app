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

export async function registerAttendance(data: RegisterAttendanceDto): Promise<AttendanceResponseDto> {
  const res = await api.post<AttendanceResponseDto>('/attendance/register', data);
  return res.data;
}

export async function registerTeamAttendance(data: RegisterTeamAttendanceDto): Promise<AttendanceResponseDto[]> {
  console.log('💾 Registrando frequência:', {
    teamId: data.teamId,
    scheduleId: data.scheduleId,
    attendanceCount: data.attendances.length
  });
  const res = await api.post<AttendanceResponseDto[]>('/attendance/register/team', data);
  console.log('✅ Resposta do backend:', res.data.length, 'registros criados');
  return res.data;
}

export async function getPendingForLeader(teamId: string): Promise<PendingForLeaderDto[]> {
  const res = await api.get<PendingForLeaderDto[]>(`/attendance/pending/leader?teamId=${teamId}`);
  return res.data;
}

export async function getPendingForMember(): Promise<PendingForMemberDto[]> {
  const res = await api.get<PendingForMemberDto[]>('/attendance/pending/member');
  return res.data;
}

export async function getTeamMembers(teamId: string): Promise<TeamMembersResponse> {
  const res = await api.get<TeamMembersResponse>(`/attendance/team/${teamId}/members`);
  return res.data;
}

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
): Promise<TeamScheduleDto[]> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryString = params.toString();
  const url = `/attendance/team/${teamId}/schedules${queryString ? `?${queryString}` : ''}`;
  const res = await api.get<TeamScheduleDto[]>(url);
  return res.data;
}

export async function listTeams(): Promise<LeaderTeamDto[]> {
  const res = await api.get<LeaderTeamDto[]>('/attendance/leader/teams');
  return res.data;
}

export async function getSheltersTeamsMembers(): Promise<SheltersTeamsMembersResponse> {
  const res = await api.get<SheltersTeamsMembersResponse>('/attendance/leader/shelters-teams-members');
  return res.data;
}

export async function getLeaderTeamsMembers(): Promise<SheltersTeamsMembersResponse> {
  const res = await api.get<SheltersTeamsMembersResponse>('/attendance/leader/teams/members');
  return res.data;
}

export async function getTeamAttendanceOverview(teamId: string): Promise<TeamAttendanceOverviewDto> {
  const res = await api.get<TeamAttendanceOverviewDto>(`/attendance/team/${teamId}/overview`);
  return res.data;
}

export async function listShelterSchedules(): Promise<TeamScheduleDto[]> {
  const res = await api.get<TeamScheduleDto[]>('/shelter-schedules');
  return res.data;
}

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

export async function getAttendanceRecords(
  filters?: {
    page?: number;
    limit?: number;
    scheduleId?: string;
    teamId?: string;
    memberId?: string;
    memberName?: string;
    type?: 'present' | 'absent';
    category?: 'visit' | 'meeting';
    startDate?: string;
    endDate?: string;
    sortBy?: 'createdAt' | 'visitDate' | 'meetingDate';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<PaginatedResponseDto<AttendanceResponseDto>> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  if (filters?.scheduleId) params.append('scheduleId', filters.scheduleId);
  if (filters?.teamId) params.append('teamId', filters.teamId);
  if (filters?.memberId) params.append('memberId', filters.memberId);
  if (filters?.memberName) params.append('memberName', filters.memberName);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryString = params.toString();
  const url = `/attendance/records${queryString ? `?${queryString}` : ''}`;
  console.log('🌐 API URL:', url);
  const res = await api.get<PaginatedResponseDto<AttendanceResponseDto>>(url);
  return res.data;
}
