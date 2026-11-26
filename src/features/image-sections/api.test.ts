import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock('@/config/axiosConfig', () => ({ default: { get, post, patch, delete: del } }));

const api = await import('./api');

const MULTIPART = { 'Content-Type': 'multipart/form-data' };

describe('api de publicações de fotos dos abrigos', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lista a fila em GET /image-sections com página, filtros e ordenação no servidor', async () => {
    get.mockResolvedValue({
      data: { data: [{ id: 's1' }], meta: { page: 1, limit: 12, totalItems: 1, totalPages: 1 } },
    });
    const controller = new AbortController();
    await expect(
      api.fetchImageSectionsPage(
        {
          page: 1,
          limit: 12,
          search: ' gincana ',
          filters: { reviewStatus: 'pending', createdFrom: '', sort: 'caption:ASC' },
        },
        controller.signal,
      ),
    ).resolves.toEqual({ items: [{ id: 's1' }], total: 1, totalPages: 1 });
    expect(get).toHaveBeenCalledWith('/image-sections', {
      params: { page: 1, limit: 12, search: 'gincana', reviewStatus: 'pending', sortBy: 'caption', order: 'ASC' },
      signal: controller.signal,
    });
  });

  it('envia em POST /image-sections com multipart e timeout longo (vídeo)', async () => {
    const form = new FormData();
    post.mockResolvedValue({ data: {} });
    await expect(api.submitImageSection(form)).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith('/image-sections', form, {
      headers: MULTIPART,
      timeout: 5 * 60 * 1000,
    });
  });

  it('aprova/edita em PATCH /image-sections/:id com multipart', async () => {
    const form = new FormData();
    patch.mockResolvedValue({ data: {} });
    await expect(api.updateImageSection('s1', form)).resolves.toBeUndefined();
    expect(patch).toHaveBeenCalledWith('/image-sections/s1', form, {
      headers: MULTIPART,
      timeout: 5 * 60 * 1000,
    });
  });

  it('reprova em PATCH /image-sections/:id/reject com o motivo', async () => {
    patch.mockResolvedValue({ data: {} });
    await expect(api.rejectImageSection('s1', 'foto escura')).resolves.toBeUndefined();
    expect(patch).toHaveBeenCalledWith('/image-sections/s1/reject', { reason: 'foto escura' });
  });

  it('exclui em DELETE /image-sections/:id', async () => {
    del.mockResolvedValue({});
    await expect(api.deleteImageSection('s1')).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith('/image-sections/s1');
  });

  it('lista as próprias publicações em GET /image-sections/mine', async () => {
    get.mockResolvedValue({ data: [{ id: 'm1', reviewStatus: 'pending' }] });
    await expect(api.listMyImageSections()).resolves.toEqual([{ id: 'm1', reviewStatus: 'pending' }]);
    expect(get).toHaveBeenCalledWith('/image-sections/mine');
  });

  it('lê os pendentes em GET /image-sections/pending-count sem toast global', async () => {
    get.mockResolvedValue({ data: { pending: 3 } });
    const controller = new AbortController();
    await expect(api.getImageSectionsPendingCount(controller.signal)).resolves.toEqual({ pending: 3 });
    expect(get).toHaveBeenCalledWith('/image-sections/pending-count', {
      signal: controller.signal,
      skipGlobalError: true,
    });
  });

  it('propaga o erro da API (nada é engolido)', async () => {
    get.mockRejectedValue(new Error('403'));
    await expect(
      api.fetchImageSectionsPage({ page: 1, limit: 12, search: '', filters: {} }, new AbortController().signal),
    ).rejects.toThrow('403');
    post.mockRejectedValue(new Error('400'));
    await expect(api.submitImageSection(new FormData())).rejects.toThrow('400');
    del.mockRejectedValue(new Error('404'));
    await expect(api.deleteImageSection('x')).rejects.toThrow('404');
  });
});
