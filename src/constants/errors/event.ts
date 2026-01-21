/**
 * Event Error Constants
 * 
 * Centralized error handling for event management
 */

/**
 * Error messages for event operations
 */
export const EVENT_ERROR_MESSAGES = {
    CREATE_GENERIC: 'Erro ao criar evento.',
    UPDATE_GENERIC: 'Erro ao atualizar evento.',
    DELETE_GENERIC: 'Erro ao deletar evento.',
    FETCH_GENERIC: 'Erro ao carregar evento.',
} as const;

/**
 * Success messages for event operations
 */
export const EVENT_SUCCESS_MESSAGES = {
    CREATE_SUCCESS: 'Evento criado com sucesso!',
    UPDATE_SUCCESS: 'Evento atualizado com sucesso!',
    DELETE_SUCCESS: 'Evento deletado com sucesso!',
} as const;
