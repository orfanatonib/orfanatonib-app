/**
 * Login Error Constants
 * 
 * Centralized error handling for login and authentication flows
 */

/**
 * Error messages for login
 */
export const LOGIN_ERROR_MESSAGES = {
    // Credentials errors
    INVALID_CREDENTIALS: 'Email ou senha inválidos.',
    USER_INACTIVE: 'Usuário inativo ou sem permissão.',
    USER_NOT_VALIDATED: 'Usuário não validado, entre em contato com (61) 8254-9780 ou (92) 98155-3139',

    // Validation errors
    INVALID_FORM: 'Por favor, insira um email válido e uma senha com pelo menos 6 caracteres.',
    EMAIL_REQUIRED: 'Email é obrigatório',
    PASSWORD_REQUIRED: 'Senha é obrigatória',

    // Google login errors
    GOOGLE_LOGIN_ERROR: 'Erro ao fazer login com Google. Tente novamente.',

    // Generic errors
    UNEXPECTED_ERROR: 'Erro inesperado. Tente novamente mais tarde.',
} as const;

/**
 * Success messages for login
 */
export const LOGIN_SUCCESS_MESSAGES = {
    EMAIL_VERIFICATION_SENT: 'Seu email ainda não foi verificado. Verifique sua caixa de entrada.',
} as const;

/**
 * Validation configuration
 */
export const LOGIN_VALIDATION = {
    MIN_PASSWORD_LENGTH: 6,
} as const;
