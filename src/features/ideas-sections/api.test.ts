import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

vi.mock('@/config/axiosConfig', () => ({ default: { get, post, patch, delete: del } }));

const {
  attachIdeasSectionToPage,
  createIdeasSection,
  deleteIdeasSection,
  getIdeasSection,
  listIdeasPages,
  fetchIdeasSectionsPage,
  updateIdeasSection,
} = await import('./api');

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

describe('api de ideias compartilhadas', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lista a fila com página, filtros e ordenação no servidor', async () => {
    get.mockResolvedValue({
      data: { data: [{ id: 's1' }], meta: { page: 2, limit: 12, totalItems: 13, totalPages: 2 } },
    });
    const controller = new AbortController();
    await expect(
      fetchIdeasSectionsPage(
        { page: 2, limit: 12, search: 'ideia', filters: { mediaType: 'video', createdTo: '2026-01-31', sort: 'title:DESC' } },
        controller.signal,
      ),
    ).resolves.toEqual({ items: [{ id: 's1' }], total: 13, totalPages: 2 });
    expect(get).toHaveBeenCalledWith('/ideas-sections', {
      params: { page: 2, limit: 12, search: 'ideia', mediaType: 'video', createdTo: '2026-01-31', sortBy: 'title', order: 'DESC' },
      signal: controller.signal,
    });
  });

  it('busca uma ideia pelo id', async () => {
    get.mockResolvedValue({ data: { id: 's1' } });
    await expect(getIdeasSection('s1')).resolves.toEqual({ id: 's1' });
    expect(get).toHaveBeenCalledWith('/ideas-sections/s1');
  });

  it('lista as páginas de ideias', async () => {
    get.mockResolvedValue({ data: [{ id: 'p1' }] });
    await expect(listIdeasPages()).resolves.toEqual([{ id: 'p1' }]);
    expect(get).toHaveBeenCalledWith('/ideas-pages');
  });

  it('cria, edita e vincula em multipart nas rotas certas', async () => {
    const form = new FormData();
    post.mockResolvedValue({ data: { id: 's1' } });
    patch.mockResolvedValue({ data: { id: 's1' } });

    await createIdeasSection(form);
    await updateIdeasSection('s1', form);
    await attachIdeasSectionToPage('s1', 'p1', form);

    expect(post).toHaveBeenCalledWith('/ideas-sections', form, MULTIPART);
    expect(patch).toHaveBeenNthCalledWith(1, '/ideas-sections/s1', form, MULTIPART);
    expect(patch).toHaveBeenNthCalledWith(2, '/ideas-sections/s1/attach/p1', form, MULTIPART);
  });

  it('remove pelo id e não devolve corpo', async () => {
    del.mockResolvedValue({ data: { message: 'ok' } });
    await expect(deleteIdeasSection('s1')).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith('/ideas-sections/s1');
  });

  it('propaga o erro da API sem engolir', async () => {
    get.mockRejectedValue(new Error('403'));
    await expect(
      fetchIdeasSectionsPage({ page: 1, limit: 12, search: '', filters: {} }, new AbortController().signal),
    ).rejects.toThrow('403');
  });
});
