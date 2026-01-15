import { CircuitBreaker, CircuitBreakerConfig, CircuitBreakerStats } from './CircuitBreaker';
import { logger } from './logger';

export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();
  private defaultConfig: Partial<CircuitBreakerConfig> = {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 300000,
    successThreshold: 3,
  };

  createBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (this.breakers.has(name)) {
      logger.warn(`Circuit breaker ${name} already exists, returning existing instance`, {
        feature: 'circuit-breaker-manager',
        action: 'create-duplicate',
      });
      return this.breakers.get(name)!;
    }

    const fullConfig: CircuitBreakerConfig = {
      ...this.defaultConfig,
      ...config,
      name,
    } as CircuitBreakerConfig;

    const breaker = new CircuitBreaker(fullConfig);
    this.breakers.set(name, breaker);

    logger.info(`Created circuit breaker: ${name}`, {
      feature: 'circuit-breaker-manager',
      action: 'create',
      metadata: {
        config: fullConfig,
      },
    });

    return breaker;
  }

  getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  removeBreaker(name: string): boolean {
    const removed = this.breakers.delete(name);
    if (removed) {
      logger.info(`Removed circuit breaker: ${name}`, {
        feature: 'circuit-breaker-manager',
        action: 'remove',
      });
    }
    return removed;
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  getBreakerNames(): string[] {
    return Array.from(this.breakers.keys());
  }

  clearAll(): void {
    const count = this.breakers.size;
    this.breakers.clear();
    logger.info(`Cleared all circuit breakers (${count} removed)`, {
      feature: 'circuit-breaker-manager',
      action: 'clear-all',
    });
  }

  getHealthSummary(): {
    totalBreakers: number;
    openBreakers: string[];
    halfOpenBreakers: string[];
    closedBreakers: string[];
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const stats = this.getAllStats();
    const openBreakers: string[] = [];
    const halfOpenBreakers: string[] = [];
    const closedBreakers: string[] = [];

    for (const [name, stat] of Object.entries(stats)) {
      switch (stat.state) {
        case 'OPEN':
          openBreakers.push(name);
          break;
        case 'HALF_OPEN':
          halfOpenBreakers.push(name);
          break;
        case 'CLOSED':
          closedBreakers.push(name);
          break;
      }
    }

    let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (openBreakers.length > 0) {
      overallHealth = openBreakers.length === Object.keys(stats).length ? 'unhealthy' : 'degraded';
    }

    return {
      totalBreakers: Object.keys(stats).length,
      openBreakers,
      halfOpenBreakers,
      closedBreakers,
      overallHealth,
    };
  }
}

export const circuitBreakerManager = new CircuitBreakerManager();

export function createApiCircuitBreaker(endpoint: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  return circuitBreakerManager.createBreaker(`api-${endpoint}`, {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    monitoringPeriod: 120000,
    successThreshold: 2,
    ...config,
  });
}

export function getApiCircuitBreaker(endpoint: string): CircuitBreaker | undefined {
  return circuitBreakerManager.getBreaker(`api-${endpoint}`);
}
