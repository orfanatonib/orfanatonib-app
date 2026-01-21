/**
 * Profile Error Constants
 * 
 * Centralized error handling for profile management
 */

/**
 * Error messages for profile operations
 */
export const PROFILE_ERROR_MESSAGES = {
    UPDATE_GENERIC: 'Erro ao atualizar perfil.',
    FETCH_GENERIC: 'Erro ao carregar perfil.',
} as const;

/**
 * Success messages for profile operations
 */
export const PROFILE_SUCCESS_MESSAGES = {
    UPDATE_SUCCESS: 'Perfil atualizado com sucesso!',
    IMAGE_UPLOAD_SUCCESS: 'Foto de perfil atualizada com sucesso!',
    PASSWORD_CHANGED: 'Senha alterada com sucesso!',
} as const;
