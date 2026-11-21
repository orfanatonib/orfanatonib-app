import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRole } from '@/store/slices/auth/authSlice';
import type { UserFilters } from './types';

const MEMBER = 'member' as UserRole;
const LEADER = 'leader' as UserRole;

const { apiListUsers, apiCreateUser, apiUpdateUser, apiDeleteUser } = vi.hoisted(() => ({
  apiListUsers: vi.fn(),
  apiCreateUser: vi.fn(),
  apiUpdateUser: vi.fn(),
  apiDeleteUser: vi.fn(),
}));

vi.mock('./api', () => ({ apiListUsers, apiCreateUser, apiUpdateUser, apiDeleteUser }));

const { useUserMutations, useUsers } = await import('./hooks');

const filters: UserFilters = { q: '', role: 'all', activeFilter: 'all', completedFilter: 'all' };

describe('useUsers', () => {
  beforeEach(() => vi.resetAllMocks());

  it('carrega a página (índice 0-based vira page 1) e o total', async () => {
    apiListUsers.mockResolvedValue({ items: [{ id: 'u1' }], meta: { total: 7 } });
    const { result } = renderHook(() => useUsers(0, 10, { id: 'name', desc: false }, filters));
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(result.current.total).toBe(7);
    expect(apiListUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10, sort: 'name', order: 'ASC' }));
  });

  it('sem ordenação usa updatedAt e ordem ASC (desc indefinido)', async () => {
    apiListUsers.mockResolvedValue({ items: [], meta: {} });
    renderHook(() => useUsers(2, 5, null, filters));
    await waitFor(() => expect(apiListUsers).toHaveBeenCalled());
    expect(apiListUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 3, sort: 'updatedAt', order: 'ASC' }));
  });

  it('resposta malformada vira lista vazia, não quebra', async () => {
    apiListUsers.mockResolvedValue({});
    const { result } = renderHook(() => useUsers(0, 10, null, filters));
    await waitFor(() => expect(apiListUsers).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('falha da API aparece como erro (não como lista vazia silenciosa)', async () => {
    apiListUsers.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useUsers(0, 10, null, filters));
    await waitFor(() => expect(result.current.error).not.toBe(''));
  });
});

describe('useUserMutations', () => {
  beforeEach(() => vi.resetAllMocks());

  it('criar: tira confirmPassword, deixa só dígitos no telefone e recarrega a página', async () => {
    apiCreateUser.mockResolvedValue({});
    const refresh = vi.fn();
    const { result } = renderHook(() => useUserMutations(refresh));
    await act(() =>
      result.current.createUser({ name: 'A', email: 'a@x', password: 'p', confirmPassword: 'p', phone: '(11) 99999-9999', role: MEMBER }),
    );
    expect(apiCreateUser).toHaveBeenCalledWith({ name: 'A', email: 'a@x', password: 'p', phone: '11999999999', role: MEMBER });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.dialogLoading).toBe(false);
  });

  it('criar com falha: guarda a mensagem, relança e não recarrega', async () => {
    apiCreateUser.mockRejectedValue(new Error('x'));
    const refresh = vi.fn();
    const { result } = renderHook(() => useUserMutations(refresh));
    await act(async () => {
      await expect(
        result.current.createUser({ name: 'A', email: 'a@x', password: 'p', phone: '1', role: MEMBER }),
      ).rejects.toThrow('x');
    });
    expect(result.current.dialogError).not.toBe('');
    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.dialogLoading).toBe(false);
  });

  it('atualizar: tira confirmPassword e normaliza o telefone', async () => {
    apiUpdateUser.mockResolvedValue({});
    const { result } = renderHook(() => useUserMutations(vi.fn()));
    await act(() =>
      result.current.updateUser('7', {
        name: 'B', role: LEADER, phone: '(11) 8888-7777', active: true, completed: true, commonUser: false, confirmPassword: 'x',
      }),
    );
    const [id, payload] = apiUpdateUser.mock.calls[0];
    expect(id).toBe('7');
    expect(payload.phone).toBe('1188887777');
    expect(payload).not.toHaveProperty('confirmPassword');
  });

  it('excluir: chama a API e recarrega; falha relança com mensagem', async () => {
    apiDeleteUser.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('403'));
    const refresh = vi.fn();
    const { result } = renderHook(() => useUserMutations(refresh));
    await act(() => result.current.deleteUser('1'));
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () => {
      await expect(result.current.deleteUser('2')).rejects.toThrow('403');
    });
    expect(result.current.dialogError).not.toBe('');
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
