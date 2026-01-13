export enum AttendanceType {
  PRESENT = 'present',
  ABSENT = 'absent',
}

export enum EventCategory {
  VISIT = 'visit',
  MEETING = 'meeting',
}

export interface ScheduleDates {
  visitDate?: string;
  meetingDate?: string;
}

export interface RegisterAttendanceDto {
  scheduleId: string;
  type: AttendanceType;
  comment?: string;
}

export interface RegisterTeamAttendanceDto {
  teamId: string;
  scheduleId: string;
  category: EventCategory;
  attendances: Array<{
    memberId: string;
    type: AttendanceType;
    comment?: string;
  }>;
}

export interface AttendanceRecordDto {
  id: string;
  type: AttendanceType;
  category?: EventCategory;
  comment?: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  scheduleId?: string;
  visitNumber?: number;
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

export interface AttendanceResponseDto {
  id: string;
  type: AttendanceType;
  category?: EventCategory;
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

export interface PendingMemberDto {
  memberId: string;
  memberName: string;
  memberEmail: string;
  role: 'member';
}

export interface PendingForLeaderDto {
  scheduleId: string;
  category: EventCategory;
  date: string;
  location: string;
  visitNumber: number;
  lessonContent: string;
  teamName: string;
  shelterName: string;
  totalMembers: number;
  pendingMembers: PendingMemberDto[];
}

export interface TeamPendingsDto {
  teamId: string;
  teamName: string;
  shelterName: string;
  pendings: PendingForLeaderDto[];
}

export interface PendingForMemberDto {
  scheduleId: string;
  category: EventCategory;
  date: string;
  location: string;
  visitNumber: number;
  lessonContent: string;
  teamId: string;
  teamNumber: number;
  teamName: string;
  shelterName: string;
}

export interface AllPendingsResponseDto {
  leaderPendings: TeamPendingsDto[];
  memberPendings: PendingForMemberDto[];
}

export interface LeaderTeamDto {
  teamId: string;
  teamNumber: number;
  shelterId: string;
  shelterName: string;
  description?: string;
  memberCount?: number;
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

export interface TeamWithMembersDto {
  teamId: string;
  teamNumber: number;
  description?: string;
  members: TeamMemberDto[];
  memberCount?: number;
}

export interface ShelterWithTeamsDto {
  shelterId: string;
  shelterName: string;
  teams: TeamWithMembersDto[];
}

export type SheltersTeamsMembersResponse = ShelterWithTeamsDto[];

export interface DrillDownState {
  selectedShelter: ShelterWithTeamsDto | null;
  selectedTeam: TeamWithMembersDto | null;
  viewMode: 'shelters' | 'team-members' | 'team-attendance';
}

export type AttendanceMode = 'list' | 'register' | null;

export interface AttendanceStatsDto {
  totalEvents: number;
  totalAttendanceRecords: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
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
  category: EventCategory;
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



export interface ScheduleWithAttendanceDto {
  scheduleId: string;
  category: EventCategory;
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

export interface AttendanceFiltersDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: AttendanceType;
  teamId?: string;
  memberId?: string;
  sortOrder?: 'asc' | 'desc';
  sortBy?: 'createdAt' | 'visitDate' | 'meetingDate';
}

export type ScheduleType = 'visit' | 'meeting';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const ATTENDANCE_RULES = {
  MAX_COMMENT_LENGTH: 500,
  REQUIRED_SCHEDULE_DATE: true,
} as const;

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface AttendanceFormState extends LoadingState {
  feedback: { status: 'success' | 'error'; message: string } | null;
}
