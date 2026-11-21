import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({
  critical: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));
vi.mock('./logger', () => ({ logger }));

type Module = typeof import('./globalErrorHandler');

async function load(): Promise<Module> {
  vi.resetModules();
  return import('./globalErrorHandler');
}

function rejection(reason: unknown): Event {
  const event = new Event('unhandledrejection', { cancelable: true });
  Object.assign(event, { reason, promise: Promise.resolve() });
  return event;
}

describe('globalErrorHandler', () => {
  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;

  const added: Array<[string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]> = [];
  const realAdd = window.addEventListener.bind(window);

  beforeEach(() => {
    Object.values(logger).forEach((fn) => fn.mockClear());
    // Cada teste recarrega o módulo: sem isto os ouvintes do teste anterior continuariam na window.
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      added.push([type, listener as EventListenerOrEventListenerObject, options]);
      realAdd(type, listener as EventListenerOrEventListenerObject, options);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [type, listener, options] of added.splice(0)) window.removeEventListener(type, listener, options);
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
  });

  it('initialize é idempotente: a segunda chamada só avisa', async () => {
    const { globalErrorHandler } = await load();
    globalErrorHandler.initialize();
    globalErrorHandler.initialize();
    expect(logger.warn).toHaveBeenCalledWith(
      'Global error handler already initialized',
      expect.objectContaining({ action: 'duplicate-initialization' }),
    );
  });

  it('promise rejeitada vira log crítico e é consumida (preventDefault)', async () => {
    const { initGlobalErrorHandling } = await load();
    initGlobalErrorHandling();
    const event = rejection(new Error('boom'));
    window.dispatchEvent(event);
    expect(logger.critical).toHaveBeenCalledWith(
      'Unhandled promise rejection caught globally',
      expect.objectContaining({ action: 'unhandled-rejection', correlationId: expect.any(String) }),
      expect.any(Error),
    );
    expect(event.defaultPrevented).toBe(true);
  });

  it('limita a 10 relatos por chave dentro da janela e continua consumindo o evento', async () => {
    const { initGlobalErrorHandling } = await load();
    initGlobalErrorHandling();
    for (let i = 0; i < 12; i++) window.dispatchEvent(rejection('mesma-falha'));
    expect(logger.critical).toHaveBeenCalledTimes(10);
    const extra = rejection('mesma-falha');
    window.dispatchEvent(extra);
    expect(extra.defaultPrevented).toBe(true);
    expect(logger.critical).toHaveBeenCalledTimes(10);
  });

  it('a janela de relato reinicia depois de reportInterval', async () => {
    vi.useFakeTimers();
    try {
      const { globalErrorHandler } = await load();
      for (let i = 0; i < 10; i++) globalErrorHandler.reportCustomError('x');
      globalErrorHandler.reportCustomError('x');
      expect(logger.error).toHaveBeenCalledTimes(10);
      vi.advanceTimersByTime(60001);
      globalErrorHandler.reportCustomError('x');
      expect(logger.error).toHaveBeenCalledTimes(11);
    } finally {
      vi.useRealTimers();
    }
  });

  it('erro de script (ErrorEvent) vira log crítico com arquivo e linha', async () => {
    const { initGlobalErrorHandling } = await load();
    initGlobalErrorHandling();
    window.dispatchEvent(new ErrorEvent('error', { message: 'falhou', filename: 'app.js', lineno: 7, error: new Error('falhou') }));
    expect(logger.critical).toHaveBeenCalledWith(
      'Uncaught exception caught globally',
      expect.objectContaining({ metadata: expect.objectContaining({ filename: 'app.js', lineno: 7 }) }),
      expect.any(Error),
    );
  });

  it('falha de fetch é registrada e relançada ao chamador', async () => {
    const failure = new TypeError('Failed to fetch');
    window.fetch = vi.fn().mockRejectedValue(failure);
    const { initGlobalErrorHandling } = await load();
    initGlobalErrorHandling();
    await expect(window.fetch('https://api.test/x', { method: 'POST' })).rejects.toBe(failure);
    expect(logger.error).toHaveBeenCalledWith(
      'Network fetch error caught globally',
      expect.objectContaining({ metadata: expect.objectContaining({ url: 'https://api.test/x', method: 'POST' }) }),
      failure,
    );
  });

  it('fetch bem-sucedido não registra nada', async () => {
    const ok = new Response('ok');
    window.fetch = vi.fn().mockResolvedValue(ok);
    const { initGlobalErrorHandling } = await load();
    initGlobalErrorHandling();
    await expect(window.fetch('https://api.test/ok')).resolves.toBe(ok);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('reportCustomError, getErrorStats e resetErrorStats', async () => {
    const { globalErrorHandler } = await load();
    globalErrorHandler.reportCustomError(new Error('x'), { screen: 'home' });
    expect(logger.error).toHaveBeenCalledWith(
      'Custom error reported',
      expect.objectContaining({ metadata: expect.objectContaining({ screen: 'home' }) }),
      expect.any(Error),
    );
    expect(Object.values(globalErrorHandler.getErrorStats())[0].count).toBe(1);
    globalErrorHandler.resetErrorStats();
    expect(globalErrorHandler.getErrorStats()).toEqual({});
  });
});
