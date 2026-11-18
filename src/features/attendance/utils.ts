import type { ScheduleDates, TeamScheduleDto, ValidationResult } from './types';
import { formatDayBR } from 'utils/dateUtils';

export const ATTENDANCE_RULES = {
  MAX_COMMENT_LENGTH: 500,
  REQUIRED_SCHEDULE_DATE: true,
} as const;

export const validateScheduleDates = (dates: ScheduleDates): ValidationResult => {
  const errors: string[] = [];

  if (ATTENDANCE_RULES.REQUIRED_SCHEDULE_DATE) {
    const hasValidDate = dates.visitDate || dates.meetingDate;
    if (!hasValidDate) {
      errors.push('O evento deve ter uma data de visita ou reunião válida');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateAttendanceComment = (comment?: string): ValidationResult => {
  const errors: string[] = [];

  if (comment && comment.length > ATTENDANCE_RULES.MAX_COMMENT_LENGTH) {
    errors.push(`Comentário deve ter no máximo ${ATTENDANCE_RULES.MAX_COMMENT_LENGTH} caracteres`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getScheduleType = (schedule: ScheduleDates | TeamScheduleDto): 'visit' | 'meeting' => {
  if ('category' in schedule && schedule.category) {
    return schedule.category;
  }
  return schedule.visitDate ? 'visit' : 'meeting';
};

export const formatScheduleLabel = (schedule: TeamScheduleDto): string => {
  const date = schedule.date || schedule.visitDate || schedule.meetingDate;
  const readableDate = formatDateBR(date);

  const category = schedule.category || (schedule.visitDate ? 'visit' : 'meeting');
  const kind = category === 'visit' ? 'Visita' : 'Reunião';

  const extra = [schedule.lessonContent, schedule.meetingRoom].filter(Boolean).join(' • ');
  return `${kind} #${schedule.visitNumber} • ${readableDate}${extra ? ` • ${extra}` : ''}`;
};

/**
 * Data de um encontro, no formato brasileiro. A regra mora em
 * `src/utils/dates` porque o mesmo dia puro é exibido fora da frequência.
 */
export const formatDateBR = (iso?: string): string => formatDayBR(iso);
