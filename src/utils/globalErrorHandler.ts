import { logger } from './logger';

interface GlobalErrorConfig {
  enableUnhandledRejection: boolean;
  enableUncaughtException: boolean;
  enableResourceError: boolean;
  enableNetworkError: boolean;
  maxErrorReports: number;
  reportInterval: number; // ms
}

const defaultConfig: GlobalErrorConfig = {
  enableUnhandledRejection: true,
  enableUncaughtException: true,
  enableResourceError: true,
  enableNetworkError: true,
  maxErrorReports: 10,
  reportInterval: 60000,
};

class GlobalErrorHandler {
  private config: GlobalErrorConfig;
  private errorReports: Map<string, { count: number; lastReport: number }> = new Map();
  private isInitialized = false;

  constructor(config: Partial<GlobalErrorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  initialize(): void {
    if (this.isInitialized) {
      logger.warn('Global error handler already initialized', {
        feature: 'global-error-handler',
        action: 'duplicate-initialization',
      });
      return;
    }

    this.setupUnhandledRejection();
    this.setupUncaughtException();
    this.setupResourceError();
    this.setupNetworkError();
    this.setupPerformanceObserver();

    this.isInitialized = true;

    logger.info('Global error handler initialized', {
      feature: 'global-error-handler',
      action: 'initialize',
      metadata: {
        config: this.config,
      },
    });
  }

  private shouldReportError(errorKey: string): boolean {
    const now = Date.now();
    const report = this.errorReports.get(errorKey);

    if (!report) {
      this.errorReports.set(errorKey, { count: 1, lastReport: now });
      return true;
    }

    if (now - report.lastReport > this.config.reportInterval) {
      this.errorReports.set(errorKey, { count: 1, lastReport: now });
      return true;
    }

    if (report.count < this.config.maxErrorReports) {
      report.count++;
      return true;
    }

    return false;
  }

  private setupUnhandledRejection(): void {
    if (!this.config.enableUnhandledRejection) return;

    window.addEventListener('unhandledrejection', (event) => {
      const errorKey = `unhandled-rejection-${event.reason?.toString() || 'unknown'}`;

      if (!this.shouldReportError(errorKey)) {
        event.preventDefault();
        return;
      }

      logger.critical('Unhandled promise rejection caught globally', {
        feature: 'global-error-handler',
        action: 'unhandled-rejection',
        correlationId: crypto.randomUUID(),
        metadata: {
          reason: event.reason,
          promise: event.promise,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      }, event.reason);

      event.preventDefault();
    });
  }

  private setupUncaughtException(): void {
    if (!this.config.enableUncaughtException) return;

    window.addEventListener('error', (event) => {
      const errorKey = `uncaught-exception-${event.message}-${event.filename}:${event.lineno}`;

      if (!this.shouldReportError(errorKey)) {
        return;
      }

      logger.critical('Uncaught exception caught globally', {
        feature: 'global-error-handler',
        action: 'uncaught-exception',
        correlationId: crypto.randomUUID(),
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      }, event.error);
    });
  }

  private setupResourceError(): void {
    if (!this.config.enableResourceError) return;

    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;

      if (!target || !(target instanceof HTMLImageElement ||
        target instanceof HTMLScriptElement ||
        target instanceof HTMLLinkElement)) {
        return;
      }

      const resourceUrl = target instanceof HTMLLinkElement ? target.href : target.src;
      const errorKey = `resource-error-${target.tagName}-${resourceUrl}`;

      if (!this.shouldReportError(errorKey)) {
        return;
      }

      logger.error('Resource loading error caught globally', {
        feature: 'global-error-handler',
        action: 'resource-error',
        correlationId: crypto.randomUUID(),
        metadata: {
          tagName: target.tagName,
          src: resourceUrl,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      });
    }, true);
  }

  private setupNetworkError(): void {
    if (!this.config.enableNetworkError) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error) {
        const url = args[0] as string;
        const errorKey = `fetch-error-${url}`;

        if (this.shouldReportError(errorKey)) {
          logger.error('Network fetch error caught globally', {
            feature: 'global-error-handler',
            action: 'network-fetch-error',
            correlationId: crypto.randomUUID(),
            metadata: {
              url,
              method: args[1]?.method || 'GET',
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              currentUrl: window.location.href,
            },
          }, error);
        }

        throw error;
      }
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
      const xhrUrl = url.toString();
      this.addEventListener('error', () => {
        const errorKey = `xhr-error-${xhrUrl}`;

        if (globalErrorHandler.shouldReportError(errorKey)) {
          logger.error('XMLHttpRequest error caught globally', {
            feature: 'global-error-handler',
            action: 'xhr-error',
            correlationId: crypto.randomUUID(),
            metadata: {
              method,
              url: xhrUrl,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              currentUrl: window.location.href,
            },
          });
        }
      });

      return (originalOpen as any).apply(this, [method, url, ...args]);
    };
  }

  private setupPerformanceObserver(): void {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('error')) {
            logger.warn('Performance error detected', {
              feature: 'global-error-handler',
              action: 'performance-error',
              metadata: {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                timestamp: new Date().toISOString(),
              },
            });
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      logger.warn('Failed to setup performance observer', {
        feature: 'global-error-handler',
        action: 'performance-observer-setup-failed',
      }, error);
    }
  }

  reportCustomError(error: unknown, context: Record<string, any> = {}): void {
    const errorKey = `custom-error-${error?.toString() || 'unknown'}`;

    if (!this.shouldReportError(errorKey)) {
      return;
    }

    logger.error('Custom error reported', {
      feature: 'global-error-handler',
      action: 'custom-error',
      correlationId: crypto.randomUUID(),
      metadata: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    }, error);
  }

  getErrorStats(): Record<string, { count: number; lastReport: number }> {
    return Object.fromEntries(this.errorReports);
  }

  resetErrorStats(): void {
    this.errorReports.clear();
    logger.info('Error statistics reset', {
      feature: 'global-error-handler',
      action: 'reset-stats',
    });
  }
}

export const globalErrorHandler = new GlobalErrorHandler();

export function initGlobalErrorHandling(config?: Partial<GlobalErrorConfig>): void {
  globalErrorHandler.initialize();

  if (config) {
    // Note: In a real implementation, you'd want to allow reconfiguration
    // For now, this just initializes with defaults
  }
}
