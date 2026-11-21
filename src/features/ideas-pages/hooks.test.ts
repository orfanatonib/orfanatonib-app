import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiListIdeasPages = vi.fn();
const apiDeleteIdeasPage = vi.fn();

vi.mock('./api', () => ({ apiListIdeasPages, apiDeleteIdeasPage }));

const { useIdeasMutations, useIdeasPages, useIdeasSearch } = await import('./hooks');

describe('useIdeasPages', () => {
  beforeEach(() => vi.resetAllMocks());

  it('carrega as páginas e termina o loading', async () => {
    apiListIdeasPages.mockResolvedValue([{ id: 'p1', title: 'A' }]);
    const { result } = renderHook(() => useIdeasPages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('falha da API vira mensagem de erro (nunca lista vazia silenciosa)', async () => {
    apiListIdeasPages.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useIdeasPages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toContain('boom');
    expect(result.current.pages).toEqual([]);
  });
});

describe('useIdeasSearch', () => {
  const pages = [
    { id: '1', title: 'Gincana', description: '', sections: [] },
    { id: '2', title: 'Teatro', description: '', sections: [] },
  ];

  it('filtra por título sem diferenciar maiúsculas e ignora espaços', () => {
    const { result } = renderHook(() => useIdeasSearch(pages));
    expect(result.current.filtered).toHaveLength(2);
    act(() => result.current.setSearchTerm('  gIN '));
    expect(result.current.filtered.map((p) => p.id)).toEqual(['1']);
    act(() => result.current.setSearchTerm('xyz'));
    expect(result.current.filtered).toEqual([]);
  });
});

describe('useIdeasMutations', () => {
  beforeEach(() => vi.resetAllMocks());

  it('exclui, recarrega a lista e devolve true', async () => {
    apiDeleteIdeasPage.mockResolvedValue(undefined);
    const refetch = vi.fn();
    const { result } = renderHook(() => useIdeasMutations(refetch));
    let ok = false;
    await act(async () => {
      ok = await result.current.deletePage('p1');
    });
    expect(ok).toBe(true);
    expect(apiDeleteIdeasPage).toHaveBeenCalledWith('p1');
    expect(refetch).toHaveBeenCalled();
  });

  it('falha expõe a mensagem, devolve false e não recarrega', async () => {
    apiDeleteIdeasPage.mockRejectedValue(new Error('403 proibido'));
    const refetch = vi.fn();
    const { result } = renderHook(() => useIdeasMutations(refetch));
    let ok = true;
    await act(async () => {
      ok = await result.current.deletePage('p1');
    });
    expect(ok).toBe(false);
    expect(result.current.mutError).toBe('403 proibido');
    expect(refetch).not.toHaveBeenCalled();
  });
});
