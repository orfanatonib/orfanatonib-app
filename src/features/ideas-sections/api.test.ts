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
  listIdeasSections,
  updateIdeasSection,
} = await import('./api');

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

describe('api de ideias compartilhadas', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lista a fila e devolve só o corpo', async () => {
    get.mockResolvedValue({ data: [{ id: 's1' }] });
    await expect(listIdeasSections()).resolves.toEqual([{ id: 's1' }]);
    expect(get).toHaveBeenCalledWith('/ideas-sections');
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
    await expect(listIdeasSections()).rejects.toThrow('403');
  });
});
