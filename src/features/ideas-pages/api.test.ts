import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock('@/config/axiosConfig', () => ({ default: { get, post, patch, delete: del } }));

const { apiDeleteIdeasPage, apiGetIdeasPage, apiListIdeasPages, apiSaveIdeasPage } = await import('./api');

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

describe('api de páginas de ideias', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lista e busca por id devolvendo só o corpo', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 'p1' }] });
    await expect(apiListIdeasPages()).resolves.toEqual([{ id: 'p1' }]);
    expect(get).toHaveBeenLastCalledWith('/ideas-pages');

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
    await expect(apiListIdeasPages()).rejects.toThrow('403');
  });
});
