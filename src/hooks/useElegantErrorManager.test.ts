import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { AppError } from '@/types/error';

const display = vi.hoisted(() => ({
  displayError: vi.fn(),
  displaySuccess: vi.fn(),
  displayWarning: vi.fn(),
  displayInfo: vi.fn(),
  clearCurrentError: vi.fn(),
  currentError: null,
  displayMode: 'snackbar',
}));
const logger = vi.hoisted(() => ({ debug: vi.fn() }));

vi.mock('./useElegantErrorDisplay', () => ({ useElegantErrorDisplay: () => display }));
vi.mock('@/utils/logger', () => ({ logger }));

const { useElegantErrorManager } = await import('./useElegantErrorManager');

function appError(partial: Partial<AppError>): AppError {
  return {
    message: 'erro',
    category: 'UNKNOWN',
    severity: 'MEDIUM',
    recoverability: 'NON_RECOVERABLE',
    retryable: false,
    correlationId: 'c',
    timestamp: '2026-01-01T00:00:00.000Z',
    ...partial,
  } as AppError;
}

function lastConfig(): { position?: string; persistent?: boolean; action?: { label: string; onClick: () => void } } {
  const calls = display.displayError.mock.calls;
  return calls[calls.length - 1][1];
}

describe('useElegantErrorManager', () => {
  beforeEach(() => {
    Object.values(display).forEach((v) => {
      if (typeof v === 'function' && 'mockClear' in v) v.mockClear();
    });
    logger.debug.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('rede: topo central, persistente, ação de recarregar', () => {
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => result.current.showError(appError({ category: 'NETWORK' })));
    expect(lastConfig()).toMatchObject({ position: 'top-center', persistent: true, action: { label: 'Tentar novamente' } });
  });

  it('401/403: persistente com ação de login', () => {
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => result.current.showError(appError({ status: 403, category: 'AUTHORIZATION' })));
    expect(lastConfig()).toMatchObject({ persistent: true, action: { label: 'Fazer login' } });
  });

  it('validação 400: topo direito, não persistente, ação "Corrigir" que foca o primeiro campo inválido', () => {
    const input = document.createElement('input');
    input.id = 'email';
    document.body.appendChild(input);
    const { result } = renderHook(() => useElegantErrorManager());
    act(() =>
      result.current.showError(
        appError({ status: 400, category: 'VALIDATION', metadata: { details: { fields: { email: ['inválido'] } } } }),
      ),
    );
    const config = lastConfig();
    expect(config).toMatchObject({ position: 'top-right', persistent: false, action: { label: 'Corrigir' } });
    config.action?.onClick();
    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('500: topo central com ação de tentar novamente', () => {
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => result.current.showError(appError({ status: 500, category: 'SERVER' })));
    expect(lastConfig()).toMatchObject({ position: 'top-center', action: { label: 'Tentar novamente' } });
  });

  it('string vira erro desconhecido, embaixo ao centro, sem ação', () => {
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => result.current.showError('algo deu errado'));
    expect(display.displayError.mock.calls[0][0]).toBe('algo deu errado');
    expect(lastConfig()).toMatchObject({ position: 'bottom-center', persistent: false });
    expect(lastConfig().action).toBeUndefined();
  });

  it('posição explícita vence a inferida', () => {
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => result.current.showError(appError({ category: 'NETWORK' }), { position: 'bottom-left' }));
    expect(lastConfig().position).toBe('bottom-left');
  });

  it('success/warning/info usam as posições padrão', () => {
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => {
      result.current.showSuccess('ok');
      result.current.showWarning('atenção');
      result.current.showInfo('info');
    });
    expect(display.displaySuccess.mock.calls[0][1]).toMatchObject({ position: 'bottom-center' });
    expect(display.displayWarning.mock.calls[0][1]).toMatchObject({ position: 'top-right' });
    expect(display.displayInfo.mock.calls[0][1]).toMatchObject({ position: 'bottom-left' });
  });

  it('vibração só quando habilitada: crítico vibra [200,100,200]', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, vibrate });
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => result.current.showError(appError({ severity: 'CRITICAL' })));
    expect(vibrate).not.toHaveBeenCalled();
    act(() => result.current.showError(appError({ severity: 'CRITICAL' }), { enableVibration: true }));
    expect(vibrate).toHaveBeenCalledWith([200, 100, 200]);
  });

  it('som bloqueado pelo navegador não vira erro: é registrado em debug (sem catch vazio)', async () => {
    const play = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    class FakeAudio {
      volume = 0;
      play = play;
    }
    vi.stubGlobal('Audio', FakeAudio);
    const { result } = renderHook(() => useElegantErrorManager());
    await act(async () => {
      result.current.showError(appError({ severity: 'HIGH' }), { enableSound: true });
    });
    expect(play).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      'Som de alerta bloqueado pelo navegador',
      expect.objectContaining({ feature: 'elegant-error-manager' }),
      expect.any(Error),
    );
  });

  it('som indisponível (Audio lança) também é registrado em debug', () => {
    class BrokenAudio {
      constructor() {
        throw new Error('sem audio');
      }
    }
    vi.stubGlobal('Audio', BrokenAudio);
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => result.current.showError(appError({ severity: 'HIGH' }), { enableSound: true }));
    expect(logger.debug).toHaveBeenCalledWith('Som de alerta indisponível', expect.anything(), expect.any(Error));
  });

  it('retryLastError reexibe o último erro após o atraso e respeita o máximo', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useElegantErrorManager({ maxRetries: 1, retryDelay: 500 }));
    act(() => result.current.showError(appError({ status: 500 })));
    display.displayError.mockClear();

    await act(async () => {
      const pending = result.current.retryLastError();
      await vi.advanceTimersByTimeAsync(500);
      await pending;
    });
    expect(display.displayInfo).toHaveBeenCalledWith('Tentativa 1 de 1...', expect.anything());
    expect(display.displayError).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(1);
    expect(result.current.isRetrying).toBe(false);

    await act(async () => {
      await result.current.retryLastError();
    });
    expect(display.displayError).toHaveBeenCalledTimes(1);
  });

  it('clearError limpa a exibição e zera as tentativas', async () => {
    const { result } = renderHook(() => useElegantErrorManager());
    act(() => result.current.showError('x'));
    act(() => result.current.clearError());
    expect(display.clearCurrentError).toHaveBeenCalled();
    expect(result.current.retryCount).toBe(0);
    await act(async () => {
      await result.current.retryLastError();
    });
    expect(display.displayError).toHaveBeenCalledTimes(1);
  });
});
