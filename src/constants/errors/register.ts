/**
 * Registration Error Constants
 * 
 * Centralized error handling for user registration flows
 */

/**
 * Error messages for registration
 */
export const REGISTER_ERROR_MESSAGES = {
    GENERIC: 'Erro ao cadastrar. Tente novamente.',
    UNEXPECTED: 'Erro inesperado. Tente novamente mais tarde.',
    GOOGLE_SESSION_EXPIRED: 'Sua sessão do Google expirou. Volte ao login e entre com o Google novamente.',
} as const;

/**
 * Success messages for registration
 */
export const REGISTER_SUCCESS_MESSAGES = {
    TITLE: 'Cadastro concluído com sucesso!',
    SUBTITLE: 'Aguarde a aprovação do seu cadastro.',
    NOTIFICATION: 'Você será notificado pelo WhatsApp.',
    EMAIL_VERIFICATION_SENT: '📧 Um email de verificação foi enviado para o seu endereço.',
} as const;

/**
 * Validation messages for registration
 */
export const REGISTER_VALIDATION_MESSAGES = {
    NAME_REQUIRED: 'Nome é obrigatório',
    NAME_MIN_LENGTH: 'Nome deve ter pelo menos 2 caracteres',
    EMAIL_REQUIRED: 'Email é obrigatório',
    EMAIL_INVALID: 'Email inválido',
    CONFIRM_EMAIL_REQUIRED: 'Confirme o email',
    EMAILS_NOT_MATCH: 'Os emails não coincidem',
    PASSWORD_REQUIRED: 'Senha obrigatória',
    PASSWORD_MIN_LENGTH: 'Senha deve ter pelo menos 6 caracteres',
    CONFIRM_PASSWORD_REQUIRED: 'Confirme a senha',
    PASSWORDS_NOT_MATCH: 'As senhas não coincidem',
    PHONE_REQUIRED: 'Telefone é obrigatório',
    PHONE_INVALID: 'Telefone inválido (DDD + número)',
    ROLE_REQUIRED: 'Selecione seu perfil',
    ROLE_HELPER: 'Informe se você é Membro ou Líder',
} as const;

/**
 * Validation configuration
 */
export const REGISTER_VALIDATION = {
    MIN_NAME_LENGTH: 2,
    MIN_PASSWORD_LENGTH: 6,
    CACHE_DURATION_MS: 30 * 60 * 1000, // 30 minutes
} as const;
