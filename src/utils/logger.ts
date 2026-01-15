import * as Sentry from '@sentry/react';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogContext {
  userId?: string;
  userRole?: string;
  feature?: string;
  action?: string;
  component?: string;
  apiEndpoint?: string;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  context?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error | unknown;
  stack?: string;
}

class Logger {
  private minLevel: LogLevel;
  private isDev: boolean;

  constructor() {
    this.minLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;
    this.isDev = import.meta.env.DEV;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, context } = entry;
    const levelStr = LogLevel[level];
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${levelStr}: ${message}${contextStr}`;
  }

  private getErrorDetails(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }
    if (typeof error === 'string') {
      return { message: error };
    }
    return { message: String(error) };
  }

  private sendToSentry(entry: LogEntry): void {
    if (!this.isDev && entry.level >= LogLevel.ERROR) {
      const { level, message, context, error } = entry;
      const errorDetails = this.getErrorDetails(error || message);

      Sentry.withScope((scope) => {
        scope.setLevel(level === LogLevel.CRITICAL ? 'fatal' :
          level === LogLevel.ERROR ? 'error' :
            level === LogLevel.WARN ? 'warning' : 'info');

        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            if (value !== undefined) {
              scope.setTag(key, String(value));
            }
          });

          if (context.metadata) {
            scope.setContext('metadata', context.metadata);
          }
        }

        if (error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(message, level === LogLevel.CRITICAL ? 'fatal' :
            level === LogLevel.ERROR ? 'error' :
              level === LogLevel.WARN ? 'warning' : 'info');
        }
      });
    }
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatMessage(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.error || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.error || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.error || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage, entry.error || '');
        break;
    }

    this.sendToSentry(entry);
  }

  debug(message: string, context?: LogContext, error?: unknown): void {
    this.log({ level: LogLevel.DEBUG, message, context, error });
  }

  info(message: string, context?: LogContext, error?: unknown): void {
    this.log({ level: LogLevel.INFO, message, context, error });
  }

  warn(message: string, context?: LogContext, error?: unknown): void {
    this.log({ level: LogLevel.WARN, message, context, error });
  }

  error(message: string, context?: LogContext, error?: unknown): void {
    this.log({ level: LogLevel.ERROR, message, context, error });
  }

  critical(message: string, context?: LogContext, error?: unknown): void {
    this.log({ level: LogLevel.CRITICAL, message, context, error });
  }

  logApiError(error: unknown, context: Omit<LogContext, 'timestamp'>): void {
    const errorDetails = this.getErrorDetails(error);
    this.error(`API Error: ${errorDetails.message}`, {
      ...context,
      timestamp: new Date().toISOString(),
    }, error);
  }

  logUserAction(action: string, context?: Omit<LogContext, 'action' | 'timestamp'>): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  logPerformance(metric: string, value: number, context?: Omit<LogContext, 'timestamp'>): void {
    this.info(`Performance: ${metric} = ${value}ms`, {
      ...context,
      timestamp: new Date().toISOString(),
      metadata: { metric, value },
    });
  }

  logSecurityEvent(event: string, context?: Omit<LogContext, 'timestamp'>): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      timestamp: new Date().toISOString(),
    });
  }
}

export const logger = new Logger();
