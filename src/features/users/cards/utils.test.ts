import { describe, expect, it, vi } from 'vitest';
import { initials, resolveCardSort, roleAvatarColor, roleChipColor, roleLabel, toggleInSet, yesNo } from './utils';

vi.mock('@/store/slices/auth/authSlice', () => ({
  UserRole: { ADMIN: 'admin', LEADER: 'leader', MEMBER: 'member' },
}));

describe('utils dos cartões de usuário', () => {
  it('iniciais: até duas palavras, maiúsculas; vazio vira U', () => {
    expect(initials('ana maria souza')).toBe('AM');
    expect(initials('  joão ')).toBe('J');
    expect(initials('')).toBe('U');
    expect(initials(undefined)).toBe('U');
  });

  it('cor do papel e do avatar', () => {
    expect(roleChipColor('leader')).toBe('primary');
    expect(roleChipColor('member')).toBe('success');
    expect(roleChipColor('admin')).toBe('default');
    expect(roleAvatarColor('leader')).toBe('primary.main');
    expect(roleAvatarColor('member')).toBe('success.main');
    expect(roleAvatarColor(undefined)).toBe('grey.500');
  });

  it('rótulo do papel, com padrão para desconhecido', () => {
    expect(roleLabel('admin')).toBe('Administrador');
    expect(roleLabel('leader')).toBe('Líder');
    expect(roleLabel('member')).toBe('Membro');
    expect(roleLabel('x')).toBe('Usuário');
  });

  it('sim/não', () => {
    expect(yesNo(true)).toBe('Sim');
    expect(yesNo(false)).toBe('Não');
  });

  it('ordenação: padrão updatedAt desc; respeita a atual', () => {
    expect(resolveCardSort(undefined)).toEqual({ field: 'updatedAt', desc: true });
    expect(resolveCardSort([])).toEqual({ field: 'updatedAt', desc: true });
    expect(resolveCardSort([{ id: 'name', desc: false }])).toEqual({ field: 'name', desc: false });
    expect(resolveCardSort([{ id: 'role', desc: true }])).toEqual({ field: 'role', desc: true });
  });

  it('toggleInSet não altera o original', () => {
    const base = new Set(['a']);
    const added = toggleInSet(base, 'b');
    expect([...added].sort()).toEqual(['a', 'b']);
    expect([...base]).toEqual(['a']);
    expect([...toggleInSet(added, 'a')]).toEqual(['b']);
  });
});
