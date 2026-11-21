import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRole } from '@/store/slices/auth/authSlice';

const MEMBER = 'member' as UserRole;
const LEADER = 'leader' as UserRole;

const { get, post, put, del } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() }));

vi.mock('@/config/axiosConfig', () => ({ default: { get, post, put, delete: del } }));

const api = await import('./api');

describe('api de usuários', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lista com padrões (updatedAt DESC) e remove filtros "all" e vazios', async () => {
    get.mockResolvedValue({ data: { items: [], meta: { total: 0 } } });
    await api.apiListUsers({ page: 1, limit: 10, q: '', role: 'all', active: 'all', completed: 'all' });
    expect(get).toHaveBeenCalledWith('/users', {
      params: { page: 1, limit: 10, q: undefined, role: undefined, active: undefined, completed: undefined, sort: 'updatedAt', order: 'DESC' },
    });
  });

  it('lista repassa filtros reais e a ordenação pedida', async () => {
    get.mockResolvedValue({ data: { items: [] } });
    await api.apiListUsers({ page: 2, limit: 5, q: 'ana', role: 'leader', active: 'active', completed: 'incomplete', sort: 'name', order: 'ASC' });
    expect(get).toHaveBeenCalledWith('/users', {
      params: { page: 2, limit: 5, q: 'ana', role: 'leader', active: 'active', completed: 'incomplete', sort: 'name', order: 'ASC' },
    });
  });

  it('listas simples usam /users/simple e /users/simple-for-select', async () => {
    get.mockResolvedValue({ data: [{ id: '1', name: 'A', email: 'a@x' }] });
    await expect(api.apiListUsersSimple()).resolves.toHaveLength(1);
    await api.apiListUsersSimpleForSelect();
    expect(get).toHaveBeenNthCalledWith(1, '/users/simple');
    expect(get).toHaveBeenNthCalledWith(2, '/users/simple-for-select');
  });

  it('perfil do usuário em GET /users/:id/profile', async () => {
    get.mockResolvedValue({ data: { id: '9' } });
    await api.apiGetUserProfile('9');
    expect(get).toHaveBeenCalledWith('/users/9/profile');
  });

  it('cria enviando só os campos do contrato (sem confirmPassword)', async () => {
    post.mockResolvedValue({ data: { id: 'n' } });
    const payload = { name: 'Ana', email: 'a@x.test', password: 'Aa1!aaaa', phone: '11999999999', role: MEMBER, confirmPassword: 'x' };
    await api.apiCreateUser(payload);
    expect(post).toHaveBeenCalledWith('/users', { name: 'Ana', email: 'a@x.test', password: 'Aa1!aaaa', phone: '11999999999', role: MEMBER });
  });

  it('atualiza em PUT /users/:id só com campos do contrato', async () => {
    put.mockResolvedValue({ data: { id: '1' } });
    await api.apiUpdateUser('1', {
      name: 'B', role: LEADER, phone: '1', active: true, completed: false, commonUser: false, memberTeamId: 'ignorado',
    });
    expect(put).toHaveBeenCalledWith('/users/1', {
      name: 'B', role: LEADER, phone: '1', active: true, completed: false, commonUser: false, password: undefined,
    });
  });

  it('exclui em DELETE /users/:id', async () => {
    del.mockResolvedValue({});
    await expect(api.apiDeleteUser('1')).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith('/users/1');
  });

  it('propaga erro da API', async () => {
    post.mockRejectedValue(new Error('409'));
    await expect(api.apiCreateUser({ name: 'x', email: 'x', password: 'x', role: MEMBER })).rejects.toThrow('409');
  });
});
