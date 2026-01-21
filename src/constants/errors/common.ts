/**
 * Common/General Error Constants
 * 
 * Centralized error handling for common operations across the app
 */

/**
 * Generic error messages
 */
export const COMMON_ERROR_MESSAGES = {
    GENERIC: 'Erro inesperado. Tente novamente.',
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
    SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
    UNAUTHORIZED: 'Você não tem permissão para esta ação.',
    NOT_FOUND: 'Recurso não encontrado.',
    VALIDATION_ERROR: 'Erro de validação. Verifique os dados informados.',
} as const;

/**
 * API error messages
 */
export const API_ERROR_MESSAGES = {
    FETCH_USER: 'Erro ao buscar usuário',
    FETCH_ROUTES: 'Erro ao buscar rotas.',
    FETCH_FEATURE_FLAGS: 'Failed to load feature flags',
    FETCH_SHELTER: 'Erro ao carregar o abrigo. Tente novamente mais tarde.',
    REGISTER_ATTENDANCE: 'Erro ao registrar presença.',
} as const;

/**
 * HTTP Status Code Messages
 */
export const HTTP_STATUS_MESSAGES = {
    400: 'Requisição inválida.',
    401: 'Não autorizado.',
    403: 'Acesso negado.',
    404: 'Não encontrado.',
    500: 'Erro interno do servidor.',
    502: 'Erro no gateway.',
    503: 'Serviço indisponível.',
} as const;
