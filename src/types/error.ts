export type ErrorCategory = 'BUSINESS' | 'RULE' | 'PROCESS' | 'SERVER' | 'NETWORK' | 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'UNKNOWN';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ErrorRecoverability = 'RECOVERABLE' | 'NON_RECOVERABLE' | 'REQUIRES_USER_ACTION';

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  category: ErrorCategory;
  timestamp: string;
  path: string;
  requestId: string;
  correlationId: string;
  details?: Record<string, any>;
}

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  recoverability?: ErrorRecoverability;
  context?: string;
  originalError?: unknown;
  correlationId?: string;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
  retryable?: boolean;
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ErrorHandlingOptions {
  showNotification?: boolean;
  logError?: boolean;
  retry?: boolean;
  context?: string;
  fallback?: any;
}

export interface ErrorState {
  error: AppError | null;
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string | null } | null;
  errorId: string;
  timestamp: string;
}
