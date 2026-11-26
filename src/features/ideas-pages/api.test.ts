import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock('@/config/axiosConfig', () => ({ default: { get, post, patch, delete: del } }));

const { apiDeleteIdeasPage, apiGetIdeasPage, apiSaveIdeasPage, fetchIdeasPagesPage } = await import('./api');

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

describe('api de páginas de ideias', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lista no servidor: página, busca, datas e ordenação vão na query e o envelope vira {items,total,totalPages}', async () => {
    const signal = new AbortController().signal;
    get.mockResolvedValueOnce({
      data: { data: [{ id: 'p1' }], meta: { page: 2, limit: 12, totalItems: 13, totalPages: 2 } },
    });
    await expect(
      fetchIdeasPagesPage(
        {
          page: 2,
          limit: 12,
          search: ' gincana ',
          filters: { sort: 'title:ASC', createdFrom: '2026-01-01', createdTo: '' },
        },
        signal,
      ),
    ).resolves.toEqual({ items: [{ id: 'p1' }], total: 13, totalPages: 2 });
    expect(get).toHaveBeenLastCalledWith('/ideas-pages', {
      params: { page: 2, limit: 12, search: 'gincana', sortBy: 'title', order: 'ASC', createdFrom: '2026-01-01' },
      signal,
    });
  });

  it('busca por id devolvendo só o corpo', async () => {
    get.mockResolvedValueOnce({ data: { id: 'p1' } });
    await expect(apiGetIdeasPage('p1')).resolves.toEqual({ id: 'p1' });
    expect(get).toHaveBeenLastCalledWith('/ideas-pages/p1');
  });

  it('exclui pela rota do id', async () => {
    del.mockResolvedValue({});
    await apiDeleteIdeasPage('p1');
    expect(del).toHaveBeenCalledWith('/ideas-pages/p1');
  });

  it('sem id cria (POST); com id atualiza (PATCH), sempre em multipart', async () => {
    const form = new FormData();
    post.mockResolvedValue({ data: { id: 'novo' } });
    patch.mockResolvedValue({ data: { id: 'p1' } });

    await expect(apiSaveIdeasPage(form)).resolves.toEqual({ id: 'novo' });
    expect(post).toHaveBeenCalledWith('/ideas-pages', form, MULTIPART);
    expect(patch).not.toHaveBeenCalled();

    await expect(apiSaveIdeasPage(form, 'p1')).resolves.toEqual({ id: 'p1' });
    expect(patch).toHaveBeenCalledWith('/ideas-pages/p1', form, MULTIPART);
  });

  it('propaga o erro da API sem engolir', async () => {
    get.mockRejectedValue(new Error('403'));
    await expect(
      fetchIdeasPagesPage({ page: 1, limit: 12, search: '', filters: {} }, new AbortController().signal),
    ).rejects.toThrow('403');
  });
});
