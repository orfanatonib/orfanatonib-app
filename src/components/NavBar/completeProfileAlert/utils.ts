import { EventCategory } from '@/features/attendance/types';
import type { PendingForLeaderDto, PendingForMemberDto } from '@/features/attendance/types';
import { UserRole } from '@/store/slices/auth/authSlice';
import { ALERT_TEXTS } from './constants';
import type { AttendancePendingsProps, PendingCounts } from './types';

export function formatScheduleLabel(pending: PendingForMemberDto | PendingForLeaderDto): string {
  const readableDate = pending.date ? new Date(pending.date).toLocaleDateString('pt-BR') : ALERT_TEXTS.noDate;
  const kind = pending.category === EventCategory.VISIT ? ALERT_TEXTS.visit : ALERT_TEXTS.meeting;
  return `${kind} #${pending.visitNumber} • ${readableDate}`;
}

export function resolvePendingCounts(pendings?: AttendancePendingsProps): PendingCounts {
  return {
    member: pendings?.memberPendingsCount || 0,
    leader: pendings?.leaderPendingsCount || 0,
    visitReport: pendings?.visitReportPendingsCount || 0,
  };
}

/** Membro vê só as próprias pendências; líder/admin somam presença da equipe e relatórios. */
export function totalPendingCount(counts: PendingCounts, isMember: boolean): number {
  return isMember ? counts.member : counts.leader + counts.visitReport;
}

export function isMemberRole(isAuthenticated: boolean, role?: UserRole): boolean {
  return isAuthenticated && role === UserRole.MEMBER;
}

export function pendingEventsLabel(count: number): string {
  return `${count} evento${count !== 1 ? 's' : ''} aguardando sua presença/falta`;
}

export function isSamePending(
  pending: Pick<PendingForMemberDto, 'scheduleId' | 'category'>,
  scheduleId: string,
  category: EventCategory | null,
): boolean {
  return pending.scheduleId === scheduleId && pending.category === category;
}
