import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRole } from '@/store/slices/auth/authSlice';

const MEMBER = 'member' as UserRole;
const LEADER = 'leader' as UserRole;

const { apiCreateUser, apiUpdateUser, apiDeleteUser } = vi.hoisted(() => ({
  apiCreateUser: vi.fn(),
  apiUpdateUser: vi.fn(),
  apiDeleteUser: vi.fn(),
}));

vi.mock('./api', () => ({ apiCreateUser, apiUpdateUser, apiDeleteUser }));

const { useUserMutations } = await import('./hooks');

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
