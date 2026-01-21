
export enum AuthErrorStatus {
    RESET_LINK_SENT = 'RESET_LINK_SENT',
    SES_NOT_VERIFIED = 'SES_NOT_VERIFIED',
    VERIFICATION_EMAIL_SENT = 'VERIFICATION_EMAIL_SENT',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
}

export const AUTH_ERROR_MESSAGES = {
    FORGOT_PASSWORD_GENERIC: 'Erro ao processar solicitação.',
    USER_NOT_FOUND: 'Email não encontrado na base de dados.',
    TOKEN_INVALID: 'Token inválido ou expirado.',
    TOKEN_NOT_PROVIDED: 'Token não fornecido.',
    RESET_PASSWORD_GENERIC: 'Erro ao redefinir senha.',
    PASSWORDS_DO_NOT_MATCH: 'As senhas não coincidem.',
    PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 6 caracteres.',
} as const;

export const AUTH_SUCCESS_MESSAGES = {
    RESET_LINK_SENT: 'Email de recuperação de senha enviado com sucesso.',
    RESET_INSTRUCTIONS_SENT: 'Instruções enviadas para o seu email.',
    SES_NOT_VERIFIED: 'Seu email ainda não foi verificado. Enviamos um email de verificação. Após confirmar seu email, solicite a recuperação de senha novamente.',
    PASSWORD_CHANGED: 'Senha alterada com sucesso! Redirecionando para o login...',
} as const;

export const AUTH_VALIDATION = {
    MIN_PASSWORD_LENGTH: 6,
    COOLDOWN_SECONDS: 120,
    REDIRECT_DELAY_MS: 3000,
} as const;
