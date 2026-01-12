// Tipos e DTOs para o módulo de Presença (Attendance)

// Enum para tipos de presença
export enum AttendanceType {
  PRESENT = 'present',
  ABSENT = 'absent',
}

// Tipos base para validação de datas
export interface ScheduleDates {
  visitDate?: string;
  meetingDate?: string;
}

// DTOs para registro de presença
export interface RegisterAttendanceDto {
  scheduleId: string;
  type: AttendanceType;
  comment?: string;
}

export interface RegisterTeamAttendanceDto {
  teamId: string;
  scheduleId: string;
  category: 'visit' | 'meeting';
  attendances: Array<{
    memberId: string;
    type: AttendanceType;
    comment?: string;
  }>;
}

// DTOs de resposta da API
export interface AttendanceResponseDto {
  id: string;
  type: AttendanceType;
  comment?: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  scheduleId: string;
  visitNumber: number;
  visitDate?: string;
  meetingDate?: string;
  lessonContent?: string;
  observation?: string;
  meetingRoom?: string;
  teamName?: string;
  shelterName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceResponseArray extends Array<AttendanceResponseDto> { }

// DTOs para pendências
export interface PendingMemberDto {
  memberId: string;
  memberName: string;
  memberEmail: string;
  role: 'member'; // sempre 'member' (líderes não têm pendências)
}

export interface PendingForLeaderDto {
  scheduleId: string;
  visitNumber: number;
  visitDate?: string;
  meetingDate?: string;
  lessonContent: string;
  observation?: string;
  meetingRoom?: string;
  teamName: string;
  shelterName: string;
  totalMembers: number;
  pendingMembers: PendingMemberDto[];
}

export interface PendingForMemberDto {
  scheduleId: string;
  visitNumber: number;
  visitDate?: string;
  meetingDate?: string;
  lessonContent: string;
  observation?: string;
  meetingRoom?: string;
  teamId: string;
  teamNumber: number;
  teamName: string;
  shelterName: string;
}

// DTOs auxiliares para UI
export interface LeaderTeamDto {
  teamId: string;
  teamNumber: number;
  shelterId?: string;
  shelterName?: string;
  description?: string;
}

export interface TeamMemberDto {
  id: string;
  name: string;
  email?: string;
  role?: 'leader' | 'member';
}

export interface TeamMembersResponse {
  teamId: string;
  teamNumber: number;
  shelterName?: string;
  members: TeamMemberDto[];
}

// Novos tipos para hierarquia completa (drill-down)
export interface TeamWithMembersDto {
  teamId: string;
  teamNumber: number;
  description?: string;
  members: TeamMemberDto[];
}

export interface ShelterWithTeamsDto {
  shelterId: string;
  shelterName: string;
  teams: TeamWithMembersDto[];
}

export type SheltersTeamsMembersResponse = ShelterWithTeamsDto[];

// Tipos auxiliares para UI de drill-down
export interface DrillDownState {
  selectedShelter: ShelterWithTeamsDto | null;
  selectedTeam: TeamWithMembersDto | null;
  viewMode: 'shelters' | 'team-members' | 'team-attendance';
}

// Modo de operação: listar ou lançar frequências
export type AttendanceMode = 'list' | 'register' | null;

// Tipos para estatísticas de presença
export interface AttendanceStatsDto {
  totalEvents: number;
  totalAttendanceRecords: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number; // em %
  pendingCount: number;
}

export interface TeamAttendanceOverviewDto {
  teamId: string;
  teamNumber: number;
  shelterName: string;
  recentEvents: Array<{
    scheduleId: string;
    eventType: 'visit' | 'meeting';
    eventDate: string;
    attendanceStats: AttendanceStatsDto;
  }>;
}

export interface TeamScheduleDto extends ScheduleDates {
  id: string;
  category: 'visit' | 'meeting';
  date: string;
  visitNumber: number;
  lessonContent: string;
  observation?: string;
  location?: string;
  meetingRoom?: string;
  teamId: string;
  teamNumber: number;
  teamName?: string;
  shelterName: string;
  attendanceCount?: number;
  totalMembers?: number;
}

// DTOs para Listagem Hierárquica de Frequências
export interface AttendanceRecordDto {
  id: string;
  type: AttendanceType;
  comment?: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleWithAttendanceDto {
  scheduleId: string;
  category: 'visit' | 'meeting';
  date: string;
  visitNumber: number;
  visitDate?: string;
  meetingDate?: string;
  lessonContent: string;
  observation?: string;
  location?: string;
  meetingRoom?: string;
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  pendingCount: number;
  attendanceRecords: AttendanceRecordDto[];
}

export interface TeamWithSchedulesDto {
  teamId: string;
  teamNumber: number;
  teamName: string;
  description?: string;
  totalSchedules: number;
  schedules: ScheduleWithAttendanceDto[];
}

export interface ShelterWithTeamsSheetsDto {
  shelterId: string;
  shelterName: string;
  totalTeams: number;
  teams: TeamWithSchedulesDto[];
}

export type HierarchicalSheetsResponse = ShelterWithTeamsSheetsDto[];

// DTOs para paginação
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;
}

// Filtros para schedules
export interface AttendanceFiltersDto {
  page?: number;
  limit?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  type?: AttendanceType;
  teamId?: string;
  memberId?: string;
  sortOrder?: 'asc' | 'desc';
  sortBy?: 'createdAt' | 'visitDate' | 'meetingDate';
}

// Tipos utilitários para validação
export type ScheduleType = 'visit' | 'meeting';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Constantes para validação
export const ATTENDANCE_RULES = {
  MAX_COMMENT_LENGTH: 500,
  REQUIRED_SCHEDULE_DATE: true,
} as const;

// Funções auxiliares de validação (movidas para utils.ts para evitar conflitos de importação)

// Tipos para estados dos componentes
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface AttendanceFormState extends LoadingState {
  feedback: { status: 'success' | 'error'; message: string } | null;
}
