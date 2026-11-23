import { describe, expect, it, vi } from 'vitest';
import { initials, roleAvatarColor, roleChipColor, roleLabel, yesNo } from './utils';

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
});
