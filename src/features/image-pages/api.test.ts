import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock('@/config/axiosConfig', () => ({ default: { get, post, patch, delete: del } }));

const api = await import('./api');

describe('api de galerias de imagens', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lista em GET /image-pages e devolve o corpo', async () => {
    get.mockResolvedValue({ data: [{ id: 'g1' }] });
    await expect(api.apiListImagePages()).resolves.toEqual([{ id: 'g1' }]);
    expect(get).toHaveBeenCalledWith('/image-pages');
  });

  it('cria em POST /image-pages com o FormData em multipart', async () => {
    const form = new FormData();
    post.mockResolvedValue({ data: { id: 'g1', route: { path: 'galeria_x' } } });
    await expect(api.apiCreateImagePage(form)).resolves.toEqual({ id: 'g1', route: { path: 'galeria_x' } });
    expect(post).toHaveBeenCalledWith('/image-pages', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('atualiza em PATCH /image-pages/:id com o FormData em multipart', async () => {
    const form = new FormData();
    patch.mockResolvedValue({ data: { id: 'g1' } });
    await expect(api.apiUpdateImagePage('g1', form)).resolves.toEqual({ id: 'g1' });
    expect(patch).toHaveBeenCalledWith('/image-pages/g1', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('exclui em DELETE /image-pages/:id', async () => {
    del.mockResolvedValue({});
    await expect(api.apiDeleteImagePage('g1')).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith('/image-pages/g1');
  });

  it('propaga o erro da API (nada é engolido)', async () => {
    get.mockRejectedValue(new Error('403'));
    await expect(api.apiListImagePages()).rejects.toThrow('403');
    post.mockRejectedValue(new Error('400'));
    await expect(api.apiCreateImagePage(new FormData())).rejects.toThrow('400');
  });
});
