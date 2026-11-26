import { useMemo, useState } from 'react';
import { registerAttendance } from '@/features/attendance/api';
import { AttendanceType } from '@/features/attendance/types';
import type { EventCategory, PendingForMemberDto, RegisterAttendanceDto } from '@/features/attendance/types';
import { ATTENDANCE_ERROR_MESSAGES, ATTENDANCE_SUCCESS_MESSAGES } from '@/constants/errors';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { FEEDBACK_CLOSE_DELAY_MS } from './constants';
import type { AttendancePendingsProps } from './types';
import { isSamePending } from './utils';

/** Estado e envio do registro de presença/falta pelo membro (diálogo de pendências). */
export function useAttendancePendingForm(memberPendings: PendingForMemberDto[], attendancePendings?: AttendancePendingsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [type, setTypeState] = useState<AttendanceType>(AttendanceType.PRESENT);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPending = useMemo(
    () => memberPendings.find((p) => isSamePending(p, selectedId, selectedCategory)),
    [memberPendings, selectedId, selectedCategory],
  );

  const reset = () => {
    setSelectedId('');
    setSelectedCategory(null);
    setTypeState(AttendanceType.PRESENT);
    setComment('');
  };

  const open = () => {
    setDialogOpen(true);
    setFeedback(null);
    setError(null);
    if (memberPendings.length > 0 && !selectedId) {
      setSelectedId(memberPendings[0].scheduleId);
      setSelectedCategory(memberPendings[0].category);
    }
  };

  const close = () => setDialogOpen(false);

  /** Fecha e limpa a seleção (fechar o diálogo de desktop descarta o rascunho). */
  const closeAndReset = () => {
    setDialogOpen(false);
    reset();
  };

  const select = (pending: PendingForMemberDto) => {
    setSelectedId(pending.scheduleId);
    setSelectedCategory(pending.category);
  };

  const setType = (value: AttendanceType) => {
    setTypeState(value);
    if (value === AttendanceType.PRESENT) setComment('');
  };

  const submit = async () => {
    if (!selectedId) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const dto: RegisterAttendanceDto = {
        scheduleId: selectedId,
        type,
        category: selectedCategory ?? undefined,
        comment: comment.trim() || undefined,
      };
      await registerAttendance(dto);
      setFeedback(
        type === AttendanceType.ABSENT
          ? ATTENDANCE_SUCCESS_MESSAGES.ABSENCE_REGISTERED
          : ATTENDANCE_SUCCESS_MESSAGES.PRESENCE_REGISTERED,
      );
      setComment('');
      if (attendancePendings?.refetch) await attendancePendings.refetch();
      setTimeout(() => {
        setDialogOpen(false);
        reset();
        setFeedback(null);
      }, FEEDBACK_CLOSE_DELAY_MS);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, ATTENDANCE_ERROR_MESSAGES.REGISTER_GENERIC));
    } finally {
      setSaving(false);
    }
  };

  return {
    dialogOpen,
    selectedId,
    selectedCategory,
    selectedPending,
    type,
    comment,
    saving,
    feedback,
    error,
    setComment,
    setType,
    select,
    open,
    close,
    closeAndReset,
    submit,
  };
}

export type AttendancePendingForm = ReturnType<typeof useAttendancePendingForm>;
