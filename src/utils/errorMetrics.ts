import { logger } from './logger';
import type { AppError, ErrorCategory, ErrorSeverity } from '@/types/error';

interface ErrorMetric {
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  correlationId?: string;
}

interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByContext: Record<string, number>;
  errorsOverTime: Array<{ timestamp: number; count: number }>;
  recentErrors: ErrorMetric[];
  topErrorContexts: Array<{ context: string; count: number }>;
  errorRate: number;
  recoveryRate: number;
}

interface ErrorMetricsConfig {
  maxStoredErrors: number;
  aggregationWindow: number;
  reportingInterval: number;
  enableRealTimeMetrics: boolean;
}

class ErrorMetricsCollector {
  private metrics: ErrorMetric[] = [];
  private config: ErrorMetricsConfig;
  private reportingTimer?: ReturnType<typeof setInterval>;
  private lastReportTime = Date.now();

  constructor(config: Partial<ErrorMetricsConfig> = {}) {
    this.config = {
      maxStoredErrors: 1000,
      aggregationWindow: 3600000,
      reportingInterval: 300000,
      enableRealTimeMetrics: true,
      ...config,
    };

    if (this.config.enableRealTimeMetrics) {
      this.startReporting();
    }
  }

  recordError(error: AppError): void {
    const metric: ErrorMetric = {
      timestamp: Date.now(),
      category: error.category || 'UNKNOWN',
      severity: error.severity || 'MEDIUM',
      context: error.context,
      userId: error.userId,
      sessionId: error.sessionId,
      correlationId: error.correlationId,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.config.maxStoredErrors) {
      this.metrics = this.metrics.slice(-this.config.maxStoredErrors);
    }
    logger.debug('Error metric recorded', {
      feature: 'error-metrics',
      action: 'record-metric',
      correlationId: error.correlationId,
      metadata: {
        category: metric.category,
        severity: metric.severity,
        context: metric.context,
      },
    });
  }

  getStats(timeWindow?: number): ErrorStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : now - this.config.aggregationWindow;

    const relevantMetrics = this.metrics.filter(m => m.timestamp >= windowStart);
    const totalErrors = relevantMetrics.length;

    const errorsByCategory: Record<ErrorCategory, number> = {
      BUSINESS: 0,
      RULE: 0,
      PROCESS: 0,
      SERVER: 0,
      NETWORK: 0,
      VALIDATION: 0,
      AUTHENTICATION: 0,
      AUTHORIZATION: 0,
      UNKNOWN: 0,
    };

    const errorsBySeverity: Record<ErrorSeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    const errorsByContext: Record<string, number> = {};

    const errorsOverTime: Array<{ timestamp: number; count: number }> = [];
    const hourMap = new Map<number, number>();

    relevantMetrics.forEach(metric => {
      errorsByCategory[metric.category]++;
      errorsBySeverity[metric.severity]++;

      const context = metric.context || 'unknown';
      errorsByContext[context] = (errorsByContext[context] || 0) + 1;

      const hour = Math.floor(metric.timestamp / (1000 * 60 * 60)) * (1000 * 60 * 60);
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    hourMap.forEach((count, timestamp) => {
      errorsOverTime.push({ timestamp, count });
    });
    errorsOverTime.sort((a, b) => a.timestamp - b.timestamp);

    const topErrorContexts = Object.entries(errorsByContext)
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentErrors = relevantMetrics
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    const windowMinutes = (now - windowStart) / (1000 * 60);
    const errorRate = windowMinutes > 0 ? totalErrors / windowMinutes : 0;

    const recoverableErrors = relevantMetrics.filter(m =>
      m.category === 'NETWORK' || m.category === 'SERVER'
    ).length;
    const recoveryRate = recoverableErrors > 0 ? 0.7 : 0; // Placeholder

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      errorsByContext,
      errorsOverTime,
      recentErrors,
      topErrorContexts,
      errorRate,
      recoveryRate,
    };
  }

  private startReporting(): void {
    this.reportingTimer = setInterval(() => {
      const stats = this.getStats(this.config.reportingInterval);

      if (stats.totalErrors > 0) {
        logger.info('Error metrics report', {
          feature: 'error-metrics',
          action: 'periodic-report',
          metadata: {
            totalErrors: stats.totalErrors,
            errorRate: stats.errorRate.toFixed(2),
            topCategories: Object.entries(stats.errorsByCategory)
              .filter(([, count]) => count > 0)
              .map(([cat, count]) => `${cat}:${count}`),
            reportingPeriod: `${this.config.reportingInterval / 1000}s`,
          },
        });
      }
    }, this.config.reportingInterval);
  }

  stopReporting(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = undefined;
    }
  }

  clearMetrics(): void {
    this.metrics = [];
    logger.info('Error metrics cleared', {
      feature: 'error-metrics',
      action: 'clear-metrics',
    });
  }

  exportMetrics(): ErrorMetric[] {
    return [...this.metrics];
  }

  importMetrics(metrics: ErrorMetric[]): void {
    this.metrics = [...this.metrics, ...metrics].slice(-this.config.maxStoredErrors);
    logger.info(`Error metrics imported: ${metrics.length} entries`, {
      feature: 'error-metrics',
      action: 'import-metrics',
    });
  }
}

export const errorMetrics = new ErrorMetricsCollector();

export function recordErrorMetric(error: AppError): void {
  errorMetrics.recordError(error);
}

export function getErrorStats(timeWindow?: number): ErrorStats {
  return errorMetrics.getStats(timeWindow);
}

export function exportErrorMetrics(): ErrorMetric[] {
  return errorMetrics.exportMetrics();
}

export function getErrorHealthStatus(): {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  metrics: Partial<ErrorStats>;
} {
  const stats = getErrorStats(300000);
  const recentStats = getErrorStats(60000); // Last minute

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  let message = 'Error rates are within acceptable limits';

  if (recentStats.totalErrors > 10) {
    status = 'critical';
    message = `Critical: ${recentStats.totalErrors} errors in the last minute`;
  }
  else if (recentStats.totalErrors > 5 || stats.errorRate > 2) {
    status = 'warning';
    message = `Warning: High error rate (${stats.errorRate.toFixed(2)} errors/min)`;
  }

  return {
    status,
    message,
    metrics: {
      totalErrors: stats.totalErrors,
      errorRate: stats.errorRate,
      errorsBySeverity: stats.errorsBySeverity,
    },
  };
}
