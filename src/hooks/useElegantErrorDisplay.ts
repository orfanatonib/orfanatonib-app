import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  showError,
  showSuccess,
  showWarning,
  showInfo,
  showNetworkError,
  showServerError,
  showValidationError,
  showAuthError,
} from '@/store/slices/notification/notificationSlice';
import type { AppError, ErrorCategory, ErrorSeverity } from '@/types/error';

export type ErrorDisplayMode = 'snackbar' | 'inline' | 'fullscreen' | 'modal';

export interface ErrorDisplayConfig {
  mode: ErrorDisplayMode;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  showRetry?: boolean;
  onRetry?: () => void;
}

export interface UseElegantErrorDisplayResult {
  displayError: (error: AppError | string, config?: Partial<ErrorDisplayConfig>) => void;
  displaySuccess: (message: string, config?: Partial<ErrorDisplayConfig>) => void;
  displayWarning: (message: string, config?: Partial<ErrorDisplayConfig>) => void;
  displayInfo: (message: string, config?: Partial<ErrorDisplayConfig>) => void;
  clearCurrentError: () => void;
  currentError: AppError | null;
  displayMode: ErrorDisplayMode;
}

function determineDisplayMode(
  error: AppError | string,
  context: string,
  userPreferences?: { prefersScreenReader?: boolean; prefersMinimal?: boolean }
): ErrorDisplayConfig {
  const errorObj = typeof error === 'string' ? { message: error, category: 'UNKNOWN' as ErrorCategory } : error;
  const { category, severity, status } = errorObj;
  const apiCategory = errorObj.metadata?.apiCategory;

  let config: ErrorDisplayConfig = {
    mode: 'snackbar',
    position: 'bottom-center',
    persistent: false,
  };

  if (apiCategory === 'RULE' || category === 'VALIDATION') {
    config.mode = context.includes('form') ? 'inline' : 'snackbar';
    config.position = 'top-right';
  } else if (apiCategory === 'BUSINESS' || category === 'BUSINESS') {
    config.mode = 'snackbar';
    config.position = 'bottom-center';
    if (status === 404) {
      config.action = { label: 'Página inicial', onClick: () => window.location.href = '/' };
    }
  } else if (apiCategory === 'SERVER' || category === 'SERVER') {
    config.mode = severity === 'CRITICAL' ? 'fullscreen' : 'snackbar';
    config.position = 'top-center';
    config.persistent = severity === 'HIGH';
  } else if (apiCategory === 'PROCESS') {
    config.mode = 'snackbar';
    config.position = 'bottom-right';
  } else if (category === 'NETWORK') {
    config.mode = 'snackbar';
    config.position = 'top-center';
    config.persistent = true;
    config.action = { label: 'Tentar novamente', onClick: () => window.location.reload() };
  } else if (category === 'AUTHENTICATION') {
    config.mode = 'snackbar';
    config.position = 'top-center';
    config.persistent = true;
    config.action = { label: 'Fazer login', onClick: () => window.location.href = '/login' };
  } else if (category === 'AUTHORIZATION') {
    config.mode = 'modal';
    config.persistent = true;
  } else if (context.includes('page') || context.includes('screen')) {
    config.mode = severity === 'CRITICAL' ? 'fullscreen' : 'snackbar';
  }

  if (userPreferences?.prefersScreenReader) {
    config.persistent = true;
  }

  if (userPreferences?.prefersMinimal) {
    config.mode = config.mode === 'fullscreen' ? 'modal' : 'snackbar';
  }

  return config;
}

function getUserFriendlyMessage(error: AppError | string, category?: ErrorCategory): string {
  if (typeof error === 'string') return error;

  const { message, category: errCategory, severity } = error;

  switch (errCategory) {
    case 'NETWORK':
      return 'Parece que você está sem conexão com a internet. Verifique sua conexão e tente novamente.';
    case 'AUTHENTICATION':
      return 'Sua sessão expirou. Faça login novamente para continuar.';
    case 'AUTHORIZATION':
      return 'Você não tem permissão para realizar esta ação.';
    case 'VALIDATION':
      return message || 'Por favor, verifique os dados inseridos.';
    case 'SERVER':
      return severity === 'CRITICAL'
        ? 'Estamos enfrentando problemas técnicos. Nossa equipe foi notificada.'
        : 'Erro temporário do servidor. Tente novamente em alguns instantes.';
    case 'BUSINESS':
      return message || 'Não foi possível completar a operação.';
    default:
      return message || 'Ocorreu um erro inesperado. Tente novamente.';
  }
}

function getNotificationFunction(type: 'error' | 'success' | 'warning' | 'info') {
  switch (type) {
    case 'error':
      return showError;
    case 'success':
      return showSuccess;
    case 'warning':
      return showWarning;
    case 'info':
      return showInfo;
    default:
      return showInfo;
  }
}

export function useElegantErrorDisplay(
  context = 'unknown',
  userPreferences?: { prefersScreenReader?: boolean; prefersMinimal?: boolean }
): UseElegantErrorDisplayResult {
  const dispatch = useDispatch();
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [displayMode, setDisplayMode] = useState<ErrorDisplayMode>('snackbar');

  const displayError = useCallback((error: AppError | string, config?: Partial<ErrorDisplayConfig>) => {
    const errorObj = typeof error === 'string'
      ? { message: error, category: 'UNKNOWN' as ErrorCategory }
      : error;

    const smartConfig = determineDisplayMode(errorObj, context, userPreferences);
    const finalConfig = { ...smartConfig, ...config };

    setDisplayMode(finalConfig.mode);
    setCurrentError(errorObj);

    const userMessage = getUserFriendlyMessage(errorObj, errorObj.category);

    switch (finalConfig.mode) {
      case 'snackbar':
        dispatch(showError(userMessage, {
          position: finalConfig.position,
          persistent: finalConfig.persistent,
          action: finalConfig.action,
          title: errorObj.category === 'VALIDATION' ? 'Dados inválidos' : undefined,
        }));
        break;

      case 'inline':
        dispatch(showValidationError(userMessage));
        break;

      case 'modal':
        dispatch(showError(userMessage, {
          position: 'top-center',
          persistent: true,
          action: finalConfig.action,
          title: 'Atenção necessária',
        }));
        break;

      case 'fullscreen':
        dispatch(showServerError(userMessage));
        break;

      default:
        dispatch(showError(userMessage, finalConfig));
    }
  }, [context, userPreferences, dispatch]);

  const displaySuccess = useCallback((message: string, config?: Partial<ErrorDisplayConfig>) => {
    const finalConfig = { mode: 'snackbar', position: 'bottom-center', ...config } as ErrorDisplayConfig;
    dispatch(showSuccess(message, {
      position: finalConfig.position,
      persistent: finalConfig.persistent,
      action: finalConfig.action,
    }));
  }, [dispatch]);

  const displayWarning = useCallback((message: string, config?: Partial<ErrorDisplayConfig>) => {
    const finalConfig = { mode: 'snackbar', position: 'top-right', ...config } as ErrorDisplayConfig;
    dispatch(showWarning(message, {
      position: finalConfig.position,
      persistent: finalConfig.persistent,
      action: finalConfig.action,
    }));
  }, [dispatch]);

  const displayInfo = useCallback((message: string, config?: Partial<ErrorDisplayConfig>) => {
    const finalConfig = { mode: 'snackbar', position: 'bottom-left', ...config } as ErrorDisplayConfig;
    dispatch(showInfo(message, {
      position: finalConfig.position,
      persistent: finalConfig.persistent,
      action: finalConfig.action,
    }));
  }, [dispatch]);

  const clearCurrentError = useCallback(() => {
    setCurrentError(null);
    setDisplayMode('snackbar');
  }, []);

  return {
    displayError,
    displaySuccess,
    displayWarning,
    displayInfo,
    clearCurrentError,
    currentError,
    displayMode,
  };
}
