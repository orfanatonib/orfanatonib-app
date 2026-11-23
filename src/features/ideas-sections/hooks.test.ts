import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listIdeasPages = vi.fn();
const getIdeasSection = vi.fn();

vi.mock('./api', () => ({ listIdeasPages, getIdeasSection }));

const { useIdeasPages, useIdeasSectionToEdit } = await import('./hooks');

describe('useIdeasPages', () => {
  beforeEach(() => vi.resetAllMocks());

  it('carrega as páginas e devolve o erro da API', async () => {
    listIdeasPages.mockResolvedValueOnce([{ id: 'p1' }]);
    const { result } = renderHook(() => useIdeasPages());
    await act(() => result.current.fetchPages());
    expect(result.current.pages).toEqual([{ id: 'p1' }]);

    listIdeasPages.mockRejectedValueOnce(new Error('falhou'));
    await act(() => result.current.fetchPages());
    expect(result.current.error).toBe('falhou');
  });
});

describe('useIdeasSectionToEdit', () => {
  beforeEach(() => vi.resetAllMocks());

  it('sem id não chama a API', () => {
    const { result } = renderHook(() => useIdeasSectionToEdit(null));
    expect(getIdeasSection).not.toHaveBeenCalled();
    expect(result.current).toEqual({ section: null, loading: false, error: '' });
  });

  it('com id carrega e converte para o rascunho do editor', async () => {
    getIdeasSection.mockResolvedValue({ id: 's1', title: 'T', description: 'D', public: true, medias: [] });
    const { result } = renderHook(() => useIdeasSectionToEdit('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getIdeasSection).toHaveBeenCalledWith('s1');
    expect(result.current.section).toMatchObject({ id: 's1', title: 'T', medias: [] });
  });

  it('erro da API vira mensagem e nenhuma seção', async () => {
    getIdeasSection.mockRejectedValue(new Error('404'));
    const { result } = renderHook(() => useIdeasSectionToEdit('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('404');
    expect(result.current.section).toBeNull();
  });
});
