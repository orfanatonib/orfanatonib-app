import type { ReactNode } from 'react';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listMyImageSections = vi.fn();
const getImageSectionsPendingCount = vi.fn();

vi.mock('./api', () => ({ listMyImageSections, getImageSectionsPendingCount }));

const { useMyImageSections, usePendingImageSectionsCount, useRefreshImageSectionsPending } =
  await import('./hooks');

const wrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return { client, Wrapper };
};

describe('useMyImageSections', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('carrega as publicações do autor', async () => {
    listMyImageSections.mockResolvedValue([{ id: 'm1' }]);
    const { result } = renderHook(() => useMyImageSections());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 'm1' }]);
    expect(result.current.failed).toBe(false);
  });

  it('falha marca failed e mantém a lista vazia', async () => {
    listMyImageSections.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useMyImageSections());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.failed).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('reload busca de novo depois de um envio', async () => {
    listMyImageSections.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'novo' }]);
    const { result } = renderHook(() => useMyImageSections());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.items).toEqual([{ id: 'novo' }]);
  });
});

describe('usePendingImageSectionsCount', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lê a contagem quando habilitado', async () => {
    getImageSectionsPendingCount.mockResolvedValue({ pending: 4 });
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => usePendingImageSectionsCount('u1', true), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ pending: 4 }));
  });

  it('desabilitado (sem sessão) não chama a API', async () => {
    const { Wrapper } = wrapper();
    renderHook(() => usePendingImageSectionsCount(null, false), { wrapper: Wrapper });
    await Promise.resolve();
    expect(getImageSectionsPendingCount).not.toHaveBeenCalled();
  });

  it('refresh invalida a contagem e a chamada seguinte busca de novo', async () => {
    getImageSectionsPendingCount.mockResolvedValueOnce({ pending: 2 }).mockResolvedValueOnce({ pending: 1 });
    const { Wrapper } = wrapper();
    const { result } = renderHook(
      () => ({
        count: usePendingImageSectionsCount('u1', true),
        refresh: useRefreshImageSectionsPending(),
      }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.count.data).toEqual({ pending: 2 }));
    await act(async () => {
      await result.current.refresh();
    });
    await waitFor(() => expect(result.current.count.data).toEqual({ pending: 1 }));
  });
});
