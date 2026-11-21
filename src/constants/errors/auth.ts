
export enum AuthErrorStatus {
    RESET_LINK_SENT = 'RESET_LINK_SENT',
}

export const AUTH_ERROR_MESSAGES = {
    FORGOT_PASSWORD_GENERIC: 'Erro ao processar solicitação.',
    TOKEN_INVALID: 'Token inválido ou expirado.',
    TOKEN_NOT_PROVIDED: 'Token não fornecido.',
    RESET_PASSWORD_GENERIC: 'Erro ao redefinir senha.',
    PASSWORDS_DO_NOT_MATCH: 'As senhas não coincidem.',
    PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 6 caracteres.',
} as const;

export const AUTH_SUCCESS_MESSAGES = {
    /** Mesma resposta para e-mail cadastrado ou não: a tela não revela quais contas existem. */
    RESET_LINK_SENT: 'Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.',
    RESET_INSTRUCTIONS_SENT: 'Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.',
    PASSWORD_CHANGED: 'Senha alterada com sucesso! Redirecionando para o login...',
} as const;

export const AUTH_VALIDATION = {
    MIN_PASSWORD_LENGTH: 6,
    COOLDOWN_SECONDS: 120,
    REDIRECT_DELAY_MS: 3000,
} as const;
