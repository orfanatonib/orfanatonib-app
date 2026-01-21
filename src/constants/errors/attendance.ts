/**
 * Attendance Error and Success Constants
 * 
 * Centralized error handling for attendance and pendings
 */

/**
 * Error messages for attendance operations
 */
export const ATTENDANCE_ERROR_MESSAGES = {
    REGISTER_GENERIC: 'Erro ao registrar presença.',
    FETCH_PENDINGS: 'Erro ao carregar pendências.',
} as const;

/**
 * Success messages for attendance operations
 */
export const ATTENDANCE_SUCCESS_MESSAGES = {
    PRESENCE_REGISTERED: 'Presença registrada com sucesso!',
    ABSENCE_REGISTERED: 'Falta registrada com sucesso!',
    NO_PENDINGS: 'Nenhuma pendência de presença para você.',
} as const;
