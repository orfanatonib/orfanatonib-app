import type {
  AttendanceType,
  EventCategory,
  TeamMemberDto,
  TeamScheduleDto,
  TeamWithMembersDto,
  ShelterWithTeamsDto,
  SheltersTeamsMembersResponse,
} from "./types";
export enum AttendanceView {
  Register = "register",
  History = "list",
}
export interface AttendanceRow {
  member: TeamMemberDto;
  type: AttendanceType | null;
  comment: string;
}
export interface UseTeamAttendanceProps {
  team: TeamWithMembersDto;
  schedules: TeamScheduleDto[];
  onAttendanceRegistered: () => void;
}
export interface TeamAttendanceProps extends UseTeamAttendanceProps {
  shelter: ShelterWithTeamsDto;
  loadingSchedules?: boolean;
  onBack: () => void;
  onBusyChange?: (busy: boolean) => void;
}
export interface AttendanceMemberRowProps {
  row: AttendanceRow;
  disabled: boolean;
  onTypeChange: (type: AttendanceType) => void;
  onCommentChange: (comment: string) => void;
}
export interface AttendanceTeamSelectionProps {
  data: SheltersTeamsMembersResponse;
  onTeamSelect: (
    shelter: ShelterWithTeamsDto,
    team: TeamWithMembersDto,
  ) => void;
  onBack?: () => void;
}
export interface AttendanceSelection {
  shelter: ShelterWithTeamsDto;
  team: TeamWithMembersDto;
  schedules: TeamScheduleDto[];
}
export interface AttendanceOccurrenceQuery {
  scheduleId: string;
  teamId: string;
  category: EventCategory;
}

export interface AttendanceResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
export interface AttendanceLayoutContext {
  setBusy: (busy: boolean) => void;
}
