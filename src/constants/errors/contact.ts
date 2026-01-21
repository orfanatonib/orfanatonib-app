/**
 * Contact Error Constants
 * 
 * Centralized error handling for contact form submissions
 */

/**
 * Error messages for contact form
 */
export const CONTACT_ERROR_MESSAGES = {
    SUBMIT_GENERIC: 'Erro ao enviar a mensagem. Tente novamente mais tarde.',
    SERVER_ERROR: 'Error saving contact',
} as const;

/**
 * Success messages for contact form
 */
export const CONTACT_SUCCESS_MESSAGES = {
    SUBMIT_SUCCESS: 'Mensagem enviada com sucesso!',
} as const;
