import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const patch = vi.fn();

vi.mock('@/config/axiosConfig', () => ({ default: { get, post, put, patch } }));

const api = await import('./api');

describe('api de perfil', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lê o perfil próprio em GET /profile', async () => {
    get.mockResolvedValue({ data: { id: 'u1' } });
    await expect(api.apiGetProfile()).resolves.toEqual({ id: 'u1' });
    expect(get).toHaveBeenCalledWith('/profile');
  });

  it('atualiza dados básicos em PATCH /profile', async () => {
    patch.mockResolvedValue({ data: { id: 'u1', name: 'Ana' } });
    await api.apiUpdateProfile({ name: 'Ana' });
    expect(patch).toHaveBeenCalledWith('/profile', { name: 'Ana' });
  });

  it('troca a senha em PATCH /profile/password e devolve a mensagem', async () => {
    patch.mockResolvedValue({ data: { message: 'ok' } });
    await expect(api.apiChangePassword({ currentPassword: 'a', newPassword: 'b' })).resolves.toEqual({ message: 'ok' });
    expect(patch).toHaveBeenCalledWith('/profile/password', { currentPassword: 'a', newPassword: 'b' });
  });

  it('envia a foto como multipart e reporta o progresso em porcentagem', async () => {
    const form = new FormData();
    patch.mockResolvedValue({ data: { id: 'u1' } });
    const onProgress = vi.fn();
    await api.apiUpdateProfileImage(form, onProgress);
    const [path, body, config] = patch.mock.calls[0];
    expect(path).toBe('/profile/image');
    expect(body).toBe(form);
    expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
    config.onUploadProgress({ loaded: 50, total: 200 });
    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it('foto por link vai como JSON e sem callback de progresso', async () => {
    patch.mockResolvedValue({ data: { id: 'u1' } });
    await api.apiUpdateProfileImage({ uploadType: 'LINK', url: 'https://x.test/a.png' });
    const config = patch.mock.calls[0][2];
    expect(config.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(config.onUploadProgress).toBeUndefined();
  });

  it('perfil completo: GET/POST /profiles e PUT /profiles/me', async () => {
    get.mockResolvedValue({ data: { id: 'p' } });
    post.mockResolvedValue({ data: { id: 'p' } });
    put.mockResolvedValue({ data: { id: 'p' } });
    await api.apiGetCompleteProfile();
    await api.apiCreateCompleteProfile({ personalData: { gender: 'F' } });
    await api.apiUpdateCompleteProfile({ preferences: { favoriteColor: 'azul' } });
    expect(get).toHaveBeenCalledWith('/profiles/me');
    expect(post).toHaveBeenCalledWith('/profiles', { personalData: { gender: 'F' } });
    expect(put).toHaveBeenCalledWith('/profiles/me', { preferences: { favoriteColor: 'azul' } });
  });

  it('listagem descarta parâmetros vazios, nulos e indefinidos e mantém 0', async () => {
    get.mockResolvedValue({ data: { items: [], meta: {} } });
    await api.apiGetAllProfiles({ page: 1, limit: 12, q: '', role: undefined, sortBy: 'name', order: 'ASC' });
    expect(get).toHaveBeenCalledWith('/profiles', { params: { page: 1, limit: 12, sortBy: 'name', order: 'ASC' } });
  });

  it('listagem sem parâmetros envia objeto vazio', async () => {
    get.mockResolvedValue({ data: { items: [], meta: {} } });
    await api.apiGetAllProfiles();
    expect(get).toHaveBeenCalledWith('/profiles', { params: {} });
  });

  it('busca perfil de outro usuário em GET /profiles/:id', async () => {
    get.mockResolvedValue({ data: { id: 'x' } });
    await api.apiGetProfileById('x');
    expect(get).toHaveBeenCalledWith('/profiles/x');
  });

  it('propaga o erro da API sem engolir', async () => {
    get.mockRejectedValue(new Error('403'));
    await expect(api.apiGetProfile()).rejects.toThrow('403');
  });
});
