import { describe, expect, it, vi } from 'vitest';
import { isMemberRole, isSamePending, pendingEventsLabel, resolvePendingCounts, totalPendingCount } from './utils';
import type { AttendancePendingsProps } from './types';

vi.mock('@/store/slices/auth/authSlice', () => ({
  UserRole: { ADMIN: 'admin', LEADER: 'leader', MEMBER: 'member' },
}));

describe('utils do alerta de notificações', () => {
  it('contagens sem dados valem 0', () => {
    expect(resolvePendingCounts(undefined)).toEqual({ member: 0, leader: 0, visitReport: 0 });
  });

  it('contagens vêm das pendências', () => {
    const counts = resolvePendingCounts({ memberPendingsCount: 2, leaderPendingsCount: 3, visitReportPendingsCount: 4 } as AttendancePendingsProps);
    expect(counts).toEqual({ member: 2, leader: 3, visitReport: 4 });
  });

  it('total: membro vê as próprias; líder/admin somam equipe + relatórios', () => {
    const counts = { member: 2, leader: 3, visitReport: 4 };
    expect(totalPendingCount(counts, true)).toBe(2);
    expect(totalPendingCount(counts, false)).toBe(7);
  });

  it('só autenticado com papel membro é membro', () => {
    expect(isMemberRole(true, 'member' as never)).toBe(true);
    expect(isMemberRole(false, 'member' as never)).toBe(false);
    expect(isMemberRole(true, 'leader' as never)).toBe(false);
  });

  it('plural do rótulo', () => {
    expect(pendingEventsLabel(1)).toBe('1 evento aguardando sua presença/falta');
    expect(pendingEventsLabel(3)).toBe('3 eventos aguardando sua presença/falta');
  });

  it('pendência igual exige agenda e categoria iguais', () => {
    const p = { scheduleId: 's1', category: 'visit' as never };
    expect(isSamePending(p, 's1', 'visit' as never)).toBe(true);
    expect(isSamePending(p, 's1', 'meeting' as never)).toBe(false);
    expect(isSamePending(p, 's2', 'visit' as never)).toBe(false);
  });
});
