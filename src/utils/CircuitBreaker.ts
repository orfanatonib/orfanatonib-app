import { logger } from './logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  successThreshold: number;
  name: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private halfOpenSuccessCount = 0;
  private monitoringStartTime = Date.now();

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.halfOpenSuccessCount = 0;
        logger.info(`Circuit breaker ${this.config.name} transitioning to HALF_OPEN`, {
          feature: 'circuit-breaker',
          action: 'state-change',
          metadata: {
            fromState: 'OPEN',
            toState: 'HALF_OPEN',
            failures: this.failures,
            totalRequests: this.totalRequests,
          },
        });
      } else {
        throw new Error(`Circuit breaker ${this.config.name} is OPEN - service unavailable`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();

      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();
    this.successes++;

    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccessCount++;

      if (this.halfOpenSuccessCount >= this.config.successThreshold) {
        this.reset();
        logger.info(`Circuit breaker ${this.config.name} reset to CLOSED after ${this.halfOpenSuccessCount} successes`, {
          feature: 'circuit-breaker',
          action: 'reset',
          metadata: {
            successCount: this.halfOpenSuccessCount,
            totalRequests: this.totalRequests,
          },
        });
      }
    } else if (this.state === 'CLOSED') {
      this.resetMonitoringPeriodIfNeeded();
    }
  }

  private onFailure(error: unknown): void {
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.failures++;

    logger.warn(`Circuit breaker ${this.config.name} failure recorded`, {
      feature: 'circuit-breaker',
      action: 'failure',
      metadata: {
        failures: this.failures,
        failureThreshold: this.config.failureThreshold,
        state: this.state,
        totalRequests: this.totalRequests,
      },
    }, error);

    if (this.state === 'CLOSED' && this.failures >= this.config.failureThreshold) {
      this.trip();
    } else if (this.state === 'HALF_OPEN') {
      this.trip();
    }
  }

  private trip(): void {
    this.state = 'OPEN';
    logger.error(`Circuit breaker ${this.config.name} tripped to OPEN state`, {
      feature: 'circuit-breaker',
      action: 'trip',
      metadata: {
        failures: this.failures,
        failureThreshold: this.config.failureThreshold,
        totalRequests: this.totalRequests,
      },
    });
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.halfOpenSuccessCount = 0;
    this.monitoringStartTime = Date.now();
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;

    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  private resetMonitoringPeriodIfNeeded(): void {
    const timeSinceMonitoringStart = Date.now() - this.monitoringStartTime;
    if (timeSinceMonitoringStart >= this.config.monitoringPeriod) {
      this.failures = 0;
      this.successes = 0;
      this.monitoringStartTime = Date.now();
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  forceOpen(): void {
    this.state = 'OPEN';
    logger.warn(`Circuit breaker ${this.config.name} manually forced to OPEN`, {
      feature: 'circuit-breaker',
      action: 'manual-force-open',
    });
  }

  forceClose(): void {
    this.reset();
    logger.warn(`Circuit breaker ${this.config.name} manually forced to CLOSED`, {
      feature: 'circuit-breaker',
      action: 'manual-force-close',
    });
  }

  forceHalfOpen(): void {
    this.state = 'HALF_OPEN';
    this.halfOpenSuccessCount = 0;
    logger.warn(`Circuit breaker ${this.config.name} manually forced to HALF_OPEN`, {
      feature: 'circuit-breaker',
      action: 'manual-force-half-open',
    });
  }
}
