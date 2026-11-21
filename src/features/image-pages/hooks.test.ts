import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiListImagePages = vi.fn();
const apiDeleteImagePage = vi.fn();

vi.mock('./api', () => ({ apiListImagePages, apiDeleteImagePage }));

const { useImagePages } = await import('./hooks');

const pages = [
  { id: '1', title: 'Gincana', description: 'a', public: true, sections: [] },
  { id: '2', title: 'Teatro', description: 'b', public: false, sections: [] },
];

describe('useImagePages', () => {
  beforeEach(() => vi.resetAllMocks());

  it('carrega as galerias e termina o loading', async () => {
    apiListImagePages.mockResolvedValue(pages);
    const { result } = renderHook(() => useImagePages());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toHaveLength(2);
    expect(result.current.error).toBe('');
  });

  it('falha da API vira mensagem de erro e lista vazia', async () => {
    apiListImagePages.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useImagePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Erro ao buscar páginas de imagens');
    expect(result.current.pages).toEqual([]);
  });

  it('filtra por título sem diferenciar maiúsculas e ignora espaços', async () => {
    apiListImagePages.mockResolvedValue(pages);
    const { result } = renderHook(() => useImagePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSearch('  gIN '));
    await waitFor(() => expect(result.current.filtered.map((p) => p.id)).toEqual(['1']));
    act(() => result.current.setSearch('xyz'));
    await waitFor(() => expect(result.current.filtered).toEqual([]));
    act(() => result.current.setSearch(''));
    await waitFor(() => expect(result.current.filtered).toHaveLength(2));
  });

  it('remove chama a API e recarrega a lista', async () => {
    apiListImagePages.mockResolvedValueOnce(pages).mockResolvedValueOnce([pages[1]]);
    apiDeleteImagePage.mockResolvedValue(undefined);
    const { result } = renderHook(() => useImagePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.removePage('1');
    });
    expect(apiDeleteImagePage).toHaveBeenCalledWith('1');
    expect(apiListImagePages).toHaveBeenCalledTimes(2);
    expect(result.current.pages.map((p) => p.id)).toEqual(['2']);
  });

  it('falha ao remover propaga o erro e não recarrega', async () => {
    apiListImagePages.mockResolvedValue(pages);
    apiDeleteImagePage.mockRejectedValue(new Error('403'));
    const { result } = renderHook(() => useImagePages());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.removePage('1')).rejects.toThrow('403');
    expect(apiListImagePages).toHaveBeenCalledTimes(1);
  });
});
