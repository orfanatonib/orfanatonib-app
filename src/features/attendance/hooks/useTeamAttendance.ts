import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

import { registerTeamAttendance, getAttendanceRecords } from '../api';
import { AttendanceType } from '../types';
import type {
  TeamWithMembersDto,
  TeamScheduleDto,
  RegisterTeamAttendanceDto,
  AttendanceFormState,
  TeamMemberDto,
  AttendanceResponseDto,
} from '../types';

interface MemberAttendanceRow {
  member: TeamMemberDto;
  type: AttendanceType;
  comment: string;
}

type EventTypeFilter = 'visit' | 'meeting';

interface UseTeamAttendanceProps {
  team: TeamWithMembersDto;
  schedules: TeamScheduleDto[];
  onAttendanceRegistered: () => void;
}

export function useTeamAttendance({
  team,
  schedules,
  onAttendanceRegistered,
}: UseTeamAttendanceProps) {
  const safeSchedules = Array.isArray(schedules) ? schedules : [];

  const [scheduleId, setScheduleId] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('visit');

  const filteredSchedules = useMemo(() => {
    return safeSchedules.filter(s => {
      const type = s.category || (s.visitDate ? 'visit' : 'meeting');
      return type === eventTypeFilter;
    });
  }, [safeSchedules, eventTypeFilter]);

  const lastLoadedKey = useRef<string | null>(null);

  useEffect(() => {
    lastLoadedKey.current = null;

    if (filteredSchedules.length > 0) {
      const firstSchedule = filteredSchedules[0];
      setScheduleId(firstSchedule.id);
    } else {
      setScheduleId('');
    }
  }, [eventTypeFilter]);

  useEffect(() => {
    if (filteredSchedules.length > 0 && !scheduleId) {
      setScheduleId(filteredSchedules[0].id);
    } else if (filteredSchedules.length === 0 && scheduleId) {
      setScheduleId('');
    }
  }, [filteredSchedules, scheduleId]);

  const membersOnly = useMemo(() => {
    return team.members.filter(member => member.role === 'member' || !member.role);
  }, [team.members]);

  const [memberAttendances, setMemberAttendances] = useState<Record<string, MemberAttendanceRow>>(() => {
    const initial: Record<string, MemberAttendanceRow> = {};
    const members = team.members.filter(member => member.role === 'member' || !member.role);
    members.forEach(member => {
      initial[member.id] = {
        member,
        type: AttendanceType.PRESENT,
        comment: '',
      };
    });
    return initial;
  });

  useEffect(() => {
    setMemberAttendances(prev => {
      const updated = { ...prev };
      let changed = false;

      membersOnly.forEach(member => {
        if (!updated[member.id]) {
          updated[member.id] = {
            member,
            type: AttendanceType.PRESENT,
            comment: '',
          };
          changed = true;
        }
      });

      Object.keys(updated).forEach(memberId => {
        if (!membersOnly.find(m => m.id === memberId)) {
          delete updated[memberId];
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [membersOnly]);

  const [formState, setFormState] = useState<AttendanceFormState>({
    loading: false,
    error: null,
    feedback: null,
  });

  const [existingRecords, setExistingRecords] = useState<AttendanceResponseDto[]>([]);
  const [loadingExistingRecords, setLoadingExistingRecords] = useState(false);
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

  useEffect(() => {
    const loadExistingRecords = async () => {
      if (!scheduleId) {
        lastLoadedKey.current = null;
        setExistingRecords([]);
        setHasExistingAttendance(false);
        const resetAttendances: Record<string, MemberAttendanceRow> = {};
        membersOnly.forEach(member => {
          resetAttendances[member.id] = {
            member,
            type: AttendanceType.PRESENT,
            comment: '',
          };
        });
        setMemberAttendances(resetAttendances);
        return;
      }

      const category = eventTypeFilter;
      const uniqueKey = `${scheduleId}-${category}`;

      if (lastLoadedKey.current === uniqueKey) {
        return;
      }

      try {
        setLoadingExistingRecords(true);
        lastLoadedKey.current = uniqueKey;

        const response = await getAttendanceRecords({
          scheduleId,
          category: category as 'visit' | 'meeting',
          limit: 100,
        });

        const records = response.data || [];
        setExistingRecords(records);
        setHasExistingAttendance(records.length > 0);

        const updated: Record<string, MemberAttendanceRow> = {};
        membersOnly.forEach(member => {
          const existingRecord = records.find(r => r.memberId === member.id);
          if (existingRecord) {
            updated[member.id] = {
              member,
              type: existingRecord.type,
              comment: existingRecord.comment || '',
            };
          } else {
            updated[member.id] = {
              member,
              type: AttendanceType.PRESENT,
              comment: '',
            };
          }
        });
        setMemberAttendances(updated);
      } catch {
        lastLoadedKey.current = null;
        setExistingRecords([]);
        setHasExistingAttendance(false);
        const resetAttendances: Record<string, MemberAttendanceRow> = {};
        membersOnly.forEach(member => {
          resetAttendances[member.id] = {
            member,
            type: AttendanceType.PRESENT,
            comment: '',
          };
        });
        setMemberAttendances(resetAttendances);
      } finally {
        setLoadingExistingRecords(false);
      }
    };

    loadExistingRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, eventTypeFilter]);

  const handleMemberTypeChange = useCallback((memberId: string, type: AttendanceType) => {
    setMemberAttendances(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        type,
      },
    }));
  }, []);

  const handleMemberCommentChange = useCallback((memberId: string, comment: string) => {
    setMemberAttendances(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        comment,
      },
    }));
  }, []);

  const bulkSetType = useCallback((type: AttendanceType) => {
    setMemberAttendances(prev => {
      const updated: Record<string, MemberAttendanceRow> = {};
      Object.keys(prev).forEach(memberId => {
        updated[memberId] = {
          ...prev[memberId],
          type,
          comment: type === AttendanceType.PRESENT ? '' : prev[memberId].comment,
        };
      });
      return updated;
    });
  }, []);

  const clearAllComments = useCallback(() => {
    setMemberAttendances(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(memberId => {
        updated[memberId] = {
          ...updated[memberId],
          comment: '',
        };
      });
      return updated;
    });
  }, []);

  const clearError = useCallback(() => {
    setFormState(prev => ({ ...prev, error: null }));
  }, []);

  const clearFeedback = useCallback(() => {
    setFormState(prev => ({ ...prev, feedback: null }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!scheduleId) {
      setFormState(prev => ({
        ...prev,
        error: 'Selecione um evento para registrar a presença.',
      }));
      return;
    }

    if (safeSchedules.length === 0) {
      setFormState(prev => ({
        ...prev,
        error: 'Nenhum evento disponível para esta equipe. Tente novamente mais tarde.',
      }));
      return;
    }

    const selectedSchedule = safeSchedules.find(s => s.id === scheduleId);
    if (!selectedSchedule) {
      setFormState(prev => ({
        ...prev,
        error: 'Evento selecionado não encontrado. Por favor, selecione outro evento.',
      }));
      if (safeSchedules.length > 0) {
        setScheduleId(safeSchedules[0].id);
      }
      return;
    }

    if (membersOnly.length === 0) {
      setFormState(prev => ({
        ...prev,
        error: 'Nenhum membro na equipe para registrar presença.',
      }));
      return;
    }

    setFormState(prev => ({
      ...prev,
      loading: true,
      error: null,
      feedback: null,
    }));

    try {
      const attendances = Object.values(memberAttendances).map(row => ({
        memberId: row.member.id,
        type: row.type,
        comment: row.comment.trim() || undefined,
      }));

      const dto: RegisterTeamAttendanceDto = {
        teamId: team.teamId,
        scheduleId,
        category: eventTypeFilter,
        attendances,
      };

      await registerTeamAttendance(dto);

      const response = await getAttendanceRecords({
        scheduleId,
        category: eventTypeFilter,
        limit: 100,
      });
      setExistingRecords(response.data || []);
      setHasExistingAttendance(response.data && response.data.length > 0);

      setFormState(prev => ({
        ...prev,
        loading: false,
        feedback: {
          status: 'success',
          message: hasExistingAttendance
            ? `Frequência atualizada com sucesso para ${attendances.length} membro${attendances.length > 1 ? 's' : ''}!`
            : `Frequência registrada com sucesso para ${attendances.length} membro${attendances.length > 1 ? 's' : ''}!`,
        },
      }));

      onAttendanceRegistered();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erro ao registrar frequência. Tente novamente.';
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [scheduleId, safeSchedules, memberAttendances, team.teamId, membersOnly.length, hasExistingAttendance, eventTypeFilter, onAttendanceRegistered]);

  const presentCount = useMemo(() => {
    return Object.values(memberAttendances).filter(m => m.type === AttendanceType.PRESENT).length;
  }, [memberAttendances]);

  const absentCount = useMemo(() => {
    return Object.values(memberAttendances).filter(m => m.type === AttendanceType.ABSENT).length;
  }, [memberAttendances]);

  const existingRecordsScheduleId = existingRecords.length > 0 ? existingRecords[0]?.scheduleId : undefined;

  return {
    scheduleId,
    setScheduleId,
    eventTypeFilter,
    setEventTypeFilter,
    filteredSchedules,
    membersOnly,
    memberAttendances,
    formState,
    existingRecords,
    existingRecordsScheduleId,
    loadingExistingRecords,
    hasExistingAttendance,
    presentCount,
    absentCount,
    handleMemberTypeChange,
    handleMemberCommentChange,
    bulkSetType,
    clearAllComments,
    clearError,
    clearFeedback,
    handleSubmit,
    safeSchedules,
  };
}
