// Funções auxiliares para validação e formatação do módulo de presença

import type { ScheduleDates, TeamScheduleDto, ValidationResult } from './types';

// Constantes de validação
export const ATTENDANCE_RULES = {
  MAX_COMMENT_LENGTH: 500,
  REQUIRED_SCHEDULE_DATE: true,
} as const;

// Funções auxiliares de validação
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
  const readableDate = date ? new Date(date).toLocaleDateString('pt-BR') : 'Data a definir';

  const category = schedule.category || (schedule.visitDate ? 'visit' : 'meeting');
  const kind = category === 'visit' ? 'Visita' : 'Reunião';

  const extra = [schedule.lessonContent, schedule.meetingRoom].filter(Boolean).join(' • ');
  return `${kind} #${schedule.visitNumber} • ${readableDate}${extra ? ` • ${extra}` : ''}`;
};

// Função auxiliar para formatação de datas
export const formatDateBR = (iso?: string) => {
  if (!iso) return 'Data a definir';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};
