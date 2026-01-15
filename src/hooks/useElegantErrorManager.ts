import { useCallback, useState, useRef } from 'react';
import { useElegantErrorDisplay } from './useElegantErrorDisplay';
import type { AppError, ErrorCategory } from '@/types/error';
import type { ErrorDisplayMode } from './useElegantErrorDisplay';

export interface ElegantErrorConfig {
  context?: string;
  defaultMode?: ErrorDisplayMode | 'auto';
  mode?: ErrorDisplayMode;
  enableSound?: boolean;
  enableVibration?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  userPreferences?: {
    prefersScreenReader?: boolean;
    prefersMinimal?: boolean;
  };
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface ElegantErrorManagerResult {
  showError: (error: AppError | string, config?: Partial<ElegantErrorConfig>) => void;
  showSuccess: (message: string, config?: Partial<ElegantErrorConfig>) => void;
  showWarning: (message: string, config?: Partial<ElegantErrorConfig>) => void;
  showInfo: (message: string, config?: Partial<ElegantErrorConfig>) => void;

  clearError: () => void;
  retryLastError: () => void;

  currentError: AppError | null;
  isRetrying: boolean;
  retryCount: number;

  updateConfig: (config: Partial<ElegantErrorConfig>) => void;
}

const playErrorSound = () => {
  if (typeof window !== 'undefined' && 'Audio' in window) {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H0uGYcBzeL1fLMfDAFJXHH8N2NQwsUXLTp66hVFApGn+H0uGYcBzeL1fLMfDAFJXHH8N2NQwsUXLTp66hVFApGn+H0uGYcBzeL1fLMfDAFJXHH8N2N');
      audio.volume = 0.3;
      audio.play().catch(() => { });
    } catch (e) {
    }
  }
};

const vibrate = (pattern: number | number[] = [100, 50, 100]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const detectErrorType = (error: AppError | string): {
  category: ErrorCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isNetwork: boolean;
  isAuth: boolean;
  isValidation: boolean;
  isBusiness: boolean;
  isServer: boolean;
  isProcess: boolean;
  apiCategory?: string;
  httpStatus?: number;
} => {
  const errorObj = typeof error === 'string'
    ? { message: error, category: 'UNKNOWN' as ErrorCategory }
    : error;

  const message = errorObj.message.toLowerCase();
  const category = errorObj.category;
  const apiCategory = errorObj.metadata?.apiCategory;
  const httpStatus = errorObj.status;

  return {
    category: category || 'UNKNOWN',
    severity: errorObj.severity || 'MEDIUM',
    isNetwork: category === 'NETWORK' || message.includes('network') || message.includes('conexão'),
    isAuth: category === 'AUTHENTICATION' || category === 'AUTHORIZATION' ||
      apiCategory === 'AUTHENTICATION' || apiCategory === 'AUTHORIZATION' ||
      message.includes('login') || message.includes('sessão') || httpStatus === 401 || httpStatus === 403,
    isValidation: category === 'VALIDATION' || apiCategory === 'RULE' ||
      message.includes('inválido') || message.includes('obrigatório') ||
      httpStatus === 400 || httpStatus === 422,
    isBusiness: apiCategory === 'BUSINESS' || httpStatus === 404 || httpStatus === 409 || httpStatus === 422,
    isServer: apiCategory === 'SERVER' || httpStatus === 500 || httpStatus === 502 || httpStatus === 503 || httpStatus === 504,
    isProcess: apiCategory === 'PROCESS',
    apiCategory,
    httpStatus,
  };
};

export function useElegantErrorManager(
  defaultConfig: ElegantErrorConfig = {}
): ElegantErrorManagerResult {
  const [config, setConfig] = useState<ElegantErrorConfig>({
    context: 'unknown',
    defaultMode: 'auto',
    enableSound: false,
    enableVibration: false,
    maxRetries: 3,
    retryDelay: 1000,
    ...defaultConfig,
  });

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastErrorRef = useRef<{ error: AppError | string; config?: Partial<ElegantErrorConfig> } | null>(null);

  const {
    displayError,
    displaySuccess,
    displayWarning,
    displayInfo,
    clearCurrentError,
    currentError,
  } = useElegantErrorDisplay(config.context, config.userPreferences);

  const updateConfig = useCallback((newConfig: Partial<ElegantErrorConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const showError = useCallback((
    error: AppError | string,
    displayConfig?: Partial<ElegantErrorConfig>
  ) => {
    const finalConfig = { ...config, ...displayConfig };
    lastErrorRef.current = { error, config: displayConfig };

    const errorAnalysis = detectErrorType(error);

    if (finalConfig.enableSound) {
      if (errorAnalysis.isServer) {
        playErrorSound();
        setTimeout(() => playErrorSound(), 200);
      } else if (errorAnalysis.severity !== 'LOW') {
        playErrorSound();
      }
    }

    if (finalConfig.enableVibration) {
      if (errorAnalysis.isServer || errorAnalysis.severity === 'CRITICAL') {
        vibrate([200, 100, 200]);
      } else if (errorAnalysis.severity !== 'LOW') {
        vibrate(errorAnalysis.isValidation ? [50, 50, 50] : [100, 50, 100]);
      }
    }

    const enhancedConfig = {
      ...finalConfig,
      position: finalConfig.position || (errorAnalysis.isNetwork || errorAnalysis.isServer ? 'top-center' as const :
        errorAnalysis.isAuth ? 'top-center' as const :
          errorAnalysis.isValidation ? 'top-right' as const :
            errorAnalysis.isBusiness ? 'bottom-center' as const :
              'bottom-center' as const),
      persistent: errorAnalysis.severity === 'CRITICAL' || errorAnalysis.isAuth || errorAnalysis.isNetwork,
      action: errorAnalysis.isNetwork ? {
        label: 'Tentar novamente',
        onClick: () => window.location.reload(),
      } : errorAnalysis.isAuth ? {
        label: 'Fazer login',
        onClick: () => window.location.href = '/login',
      } : errorAnalysis.isServer && errorAnalysis.httpStatus && errorAnalysis.httpStatus >= 500 ? {
        label: 'Tentar novamente',
        onClick: () => window.location.reload(),
      } : errorAnalysis.isValidation ? {
        label: 'Corrigir',
        onClick: () => {
          const errorObj = typeof error === 'string' ? null : error;
          const errorFields = errorObj?.metadata?.details?.fields;
          if (errorFields && typeof errorFields === 'object') {
            const firstField = Object.keys(errorFields)[0];
            const element = document.getElementById(firstField) || document.querySelector(`[name="${firstField}"]`);
            element?.focus();
          }
        },
      } : undefined,
    };

    displayError(error, enhancedConfig);
  }, [config, displayError]);

  const showSuccess = useCallback((
    message: string,
    displayConfig?: Partial<ElegantErrorConfig>
  ) => {
    const finalConfig = { ...config, ...displayConfig };

    if (finalConfig.enableSound) {
      playErrorSound();
    }

    if (finalConfig.enableVibration) {
      vibrate([50, 50, 50]);
    }

    displaySuccess(message, {
      ...finalConfig,
      position: finalConfig.position || 'bottom-center',
    });
  }, [config, displaySuccess]);

  const showWarning = useCallback((
    message: string,
    displayConfig?: Partial<ElegantErrorConfig>
  ) => {
    const finalConfig = { ...config, ...displayConfig };
    displayWarning(message, {
      ...finalConfig,
      position: finalConfig.position || 'top-right',
    });
  }, [config, displayWarning]);

  const showInfo = useCallback((
    message: string,
    displayConfig?: Partial<ElegantErrorConfig>
  ) => {
    const finalConfig = { ...config, ...displayConfig };
    displayInfo(message, {
      ...finalConfig,
      position: finalConfig.position || 'bottom-left',
    });
  }, [config, displayInfo]);

  const clearError = useCallback(() => {
    clearCurrentError();
    lastErrorRef.current = null;
    setRetryCount(0);
    setIsRetrying(false);
  }, [clearCurrentError]);

  const retryLastError = useCallback(async () => {
    if (!lastErrorRef.current || retryCount >= (config.maxRetries || 3)) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      showInfo(`Tentativa ${retryCount + 1} de ${config.maxRetries}...`, {
        position: 'bottom-center',
      });
      await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));

      showError(lastErrorRef.current.error, lastErrorRef.current.config);
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, config.maxRetries, config.retryDelay, showError, showInfo]);

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearError,
    retryLastError,
    currentError,
    isRetrying,
    retryCount,
    updateConfig,
  };
}
