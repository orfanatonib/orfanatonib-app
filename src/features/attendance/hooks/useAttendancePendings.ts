import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAllPendings } from '../api';
import type { AllPendingsResponseDto, PendingForMemberDto, TeamPendingsDto } from '../types';
import type { RootState } from '@/store/slices';
import { UserRole } from '@/store/slices/auth/authSlice';
import { useDataFetcher } from '@/hooks/error-handling';

export interface UseAttendancePendingsResult {
  memberPendings: PendingForMemberDto[];
  leaderPendings: TeamPendingsDto[];
  leaderPendingsCount: number;
  memberPendingsCount: number;
  loading: boolean;
  error: any;
  refetch: (options?: any) => Promise<any>;
}

export function useAttendancePendings(): UseAttendancePendingsResult {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const isMember = isAuthenticated && user?.role === UserRole.MEMBER;
  const isLeaderOrAdmin = isAuthenticated && (user?.role === UserRole.LEADER || user?.role === UserRole.ADMIN);

  const fetchFunction = useCallback(async (): Promise<{
    memberPendings: PendingForMemberDto[];
    leaderPendings: TeamPendingsDto[];
  }> => {
    if (!isAuthenticated) {
      return { memberPendings: [], leaderPendings: [] };
    }

    const res: AllPendingsResponseDto = await getAllPendings();

    if (isMember) {
      return {
        memberPendings: res.memberPendings,
        leaderPendings: [],
      };
    } else if (isLeaderOrAdmin) {
      return {
        leaderPendings: res.leaderPendings,
        memberPendings: res.memberPendings,
      };
    }

    return { memberPendings: [], leaderPendings: [] };
  }, [isAuthenticated, isMember, isLeaderOrAdmin]);

  const { data, isLoading, error, refetch } = useDataFetcher(
    fetchFunction,
    {
      enabled: isAuthenticated,
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: true,
      context: 'attendance-pendings',
    }
  );

  const memberPendings = data?.memberPendings || [];
  const leaderPendings = data?.leaderPendings || [];
  const leaderPendingsCount = leaderPendings.reduce((acc, tp) => acc + tp.pendings.length, 0);
  const memberPendingsCount = memberPendings.length;

  return {
    memberPendings,
    leaderPendings,
    leaderPendingsCount,
    memberPendingsCount,
    loading: isLoading,
    error,
    refetch,
  };
}
