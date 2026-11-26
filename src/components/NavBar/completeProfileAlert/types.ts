import type {
  PendingForMemberDto,
  TeamPendingsDto,
  TeamVisitReportPendingsDto,
} from '@/features/attendance/types';

export interface ProfileAlert {
  id: string;
  message: string;
  to?: string;
}

export interface AttendancePendingsProps {
  memberPendings: PendingForMemberDto[];
  leaderPendings: TeamPendingsDto[];
  visitReportPendings: TeamVisitReportPendingsDto[];
  leaderPendingsCount: number;
  memberPendingsCount: number;
  visitReportPendingsCount: number;
  loading: boolean;
  refetch: () => Promise<unknown>;
}

export interface CompleteProfileAlertProps {
  alerts: ProfileAlert[];
  attendancePendings?: AttendancePendingsProps;
  onAlertClick?: () => void;
}

export interface PendingCounts {
  member: number;
  leader: number;
  visitReport: number;
}
