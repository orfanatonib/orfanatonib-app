import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CircuitBreaker } from './CircuitBreaker';

vi.mock('./logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const config = {
  name: 'test',
  failureThreshold: 2,
  recoveryTimeout: 1000,
  monitoringPeriod: 5000,
  successThreshold: 2,
};

const ok = () => Promise.resolve('ok');
const fail = () => Promise.reject(new Error('boom'));

describe('CircuitBreaker', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('começa CLOSED e repassa o resultado', async () => {
    const cb = new CircuitBreaker(config);
    await expect(cb.execute(ok)).resolves.toBe('ok');
    expect(cb.getStats()).toMatchObject({ state: 'CLOSED', totalSuccesses: 1, totalRequests: 1 });
  });

  it('abre ao atingir o limite de falhas e rejeita sem chamar a operação', async () => {
    const cb = new CircuitBreaker(config);
    await expect(cb.execute(fail)).rejects.toThrow('boom');
    await expect(cb.execute(fail)).rejects.toThrow('boom');
    expect(cb.getStats().state).toBe('OPEN');

    const op = vi.fn(ok);
    await expect(cb.execute(op)).rejects.toThrow('is OPEN');
    expect(op).not.toHaveBeenCalled();
  });

  it('vai a HALF_OPEN após o recoveryTimeout e fecha após successThreshold sucessos', async () => {
    const cb = new CircuitBreaker(config);
    await cb.execute(fail).catch(() => undefined);
    await cb.execute(fail).catch(() => undefined);
    vi.advanceTimersByTime(1000);

    await cb.execute(ok);
    expect(cb.getStats().state).toBe('HALF_OPEN');
    await cb.execute(ok);
    expect(cb.getStats()).toMatchObject({ state: 'CLOSED', failures: 0 });
  });

  it('volta a OPEN se falhar em HALF_OPEN', async () => {
    const cb = new CircuitBreaker(config);
    await cb.execute(fail).catch(() => undefined);
    await cb.execute(fail).catch(() => undefined);
    vi.advanceTimersByTime(1000);
    await cb.execute(fail).catch(() => undefined);
    expect(cb.getStats().state).toBe('OPEN');
  });

  it('forceOpen / forceHalfOpen / forceClose', () => {
    const cb = new CircuitBreaker(config);
    cb.forceOpen();
    expect(cb.getStats().state).toBe('OPEN');
    cb.forceHalfOpen();
    expect(cb.getStats().state).toBe('HALF_OPEN');
    cb.forceClose();
    expect(cb.getStats().state).toBe('CLOSED');
  });
});
