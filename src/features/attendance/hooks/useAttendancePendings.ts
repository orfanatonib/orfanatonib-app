import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAllPendings } from '../api';
import type { AllPendingsResponseDto, PendingForMemberDto, TeamPendingsDto } from '../types';
import type { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';

export interface UseAttendancePendingsResult {
  memberPendings: PendingForMemberDto[];
  leaderPendings: TeamPendingsDto[];
  leaderPendingsCount: number;
  memberPendingsCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAttendancePendings(): UseAttendancePendingsResult {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const [memberPendings, setMemberPendings] = useState<PendingForMemberDto[]>([]);
  const [leaderPendings, setLeaderPendings] = useState<TeamPendingsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMember = isAuthenticated && user?.role === UserRole.MEMBER;
  const isLeaderOrAdmin = isAuthenticated && (user?.role === UserRole.LEADER || user?.role === UserRole.ADMIN);

  const fetchPendings = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const res: AllPendingsResponseDto = await getAllPendings();

      if (isMember) {
        setMemberPendings(res.memberPendings);
        setLeaderPendings([]);
      } else if (isLeaderOrAdmin) {
        setLeaderPendings(res.leaderPendings);
        setMemberPendings(res.memberPendings);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao buscar pendências.';
      setError(message);
      setMemberPendings([]);
      setLeaderPendings([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isMember, isLeaderOrAdmin]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendings();
    } else {
      setMemberPendings([]);
      setLeaderPendings([]);
    }
  }, [isAuthenticated, fetchPendings]);

  const leaderPendingsCount = leaderPendings.reduce((acc, tp) => acc + tp.pendings.length, 0);
  const memberPendingsCount = memberPendings.length;

  return {
    memberPendings,
    leaderPendings,
    leaderPendingsCount,
    memberPendingsCount,
    loading,
    error,
    refetch: fetchPendings,
  };
}
