import { describe, expect, it } from 'vitest';

import { FeatureFlagKeys, FeatureFlagTargetRole as UserRole } from '@/features/feature-flags/types';

import { PUBLIC_NAV_ITEMS, visiblePublicNavItems } from './publicNav';
import {
  getRoleLabel,
  isShellPathActive,
  SHELL_NAV_FLAGS,
  SHELL_USER_MENU_ENTRIES,
  ShellUserMenuEntryId,
  visibleShellUserMenuEntries,
} from './shellNav';

const allOn = () => true;
const allOff = () => false;
const ids = (role: string | undefined, isEnabled: (f: FeatureFlagKeys) => boolean, isAuthenticated = true) =>
  visibleShellUserMenuEntries({ isAuthenticated, role, isEnabled }).map((e) => e.id);

describe('shellNav — menu do usuário por papel × flag', () => {
  it('visitante não vê nenhuma entrada, mesmo com tudo ligado', () => {
    expect(ids(undefined, allOn, false)).toEqual([]);
    expect(ids(UserRole.ADMIN, allOn, false)).toEqual([]);
  });

  it('membro: área do membro, acolhidos e perfil; sem administração', () => {
    expect(ids(UserRole.MEMBER, allOn)).toEqual([
      ShellUserMenuEntryId.MEMBER_AREA,
      ShellUserMenuEntryId.SHELTERED_AREA,
      ShellUserMenuEntryId.PROFILE,
    ]);
  });

  it('líder vê tudo; admin não vê a área dos acolhidos', () => {
    expect(ids(UserRole.LEADER, allOn)).toHaveLength(SHELL_USER_MENU_ENTRIES.length);
    expect(ids(UserRole.ADMIN, allOn)).toEqual([
      ShellUserMenuEntryId.MEMBER_AREA,
      ShellUserMenuEntryId.ADMIN_AREA,
      ShellUserMenuEntryId.PROFILE,
    ]);
  });

  it('flag desligada esconde a entrada, mas o perfil (sem flag) permanece', () => {
    expect(ids(UserRole.LEADER, allOff)).toEqual([ShellUserMenuEntryId.ADMIN_AREA, ShellUserMenuEntryId.PROFILE]);
    const onlyShelteredOff = (f: FeatureFlagKeys) => f !== FeatureFlagKeys.SHELTERED_AREA;
    expect(ids(UserRole.MEMBER, onlyShelteredOff)).not.toContain(ShellUserMenuEntryId.SHELTERED_AREA);
  });

  it('flag ligada nunca amplia o papel: membro não ganha administração', () => {
    expect(ids(UserRole.MEMBER, allOn)).not.toContain(ShellUserMenuEntryId.ADMIN_AREA);
  });

  it('sem papel nada aparece; papel desconhecido só vê entradas sem restrição de papel', () => {
    expect(ids(undefined, allOn)).toEqual([]);
    expect(ids('visitor', allOn)).toEqual([ShellUserMenuEntryId.MEMBER_AREA, ShellUserMenuEntryId.PROFILE]);
  });

  it('toda entrada tem caminho absoluto e id único', () => {
    const entryIds = SHELL_USER_MENU_ENTRIES.map((e) => e.id);
    expect(new Set(entryIds).size).toBe(entryIds.length);
    for (const entry of SHELL_USER_MENU_ENTRIES) expect(entry.path.startsWith('/')).toBe(true);
  });
});

describe('shellNav — menu público e flags lidas', () => {
  it('SHELL_NAV_FLAGS reúne as flags do menu público e do menu do usuário, sem repetir', () => {
    expect(new Set(SHELL_NAV_FLAGS).size).toBe(SHELL_NAV_FLAGS.length);
    for (const item of PUBLIC_NAV_ITEMS) if (item.flag) expect(SHELL_NAV_FLAGS).toContain(item.flag);
    expect(SHELL_NAV_FLAGS).toContain(FeatureFlagKeys.MEMBER_AREA);
    expect(SHELL_NAV_FLAGS).toContain(FeatureFlagKeys.SHELTERED_AREA);
  });

  it('com tudo desligado só o Início (sem flag) fica; nenhum item público sem rota', () => {
    expect(visiblePublicNavItems(allOff).map((i) => i.to)).toEqual(['/']);
    for (const item of PUBLIC_NAV_ITEMS) expect(item.to.startsWith('/')).toBe(true);
  });
});

describe('shellNav — rótulo do papel e item ativo', () => {
  it('rotula os três papéis e devolve vazio para o resto', () => {
    expect(getRoleLabel(UserRole.ADMIN)).toBe('Administrador');
    expect(getRoleLabel(UserRole.LEADER)).toBe('Líder');
    expect(getRoleLabel(UserRole.MEMBER)).toBe('Membro');
    expect(getRoleLabel(undefined)).toBe('');
  });

  it('ativo no próprio caminho e abaixo dele, não em prefixo parcial', () => {
    expect(isShellPathActive('/eventos', '/eventos')).toBe(true);
    expect(isShellPathActive('/eventos/12', '/eventos')).toBe(true);
    expect(isShellPathActive('/eventos-antigos', '/eventos')).toBe(false);
    expect(isShellPathActive('/anything', '/')).toBe(false);
  });
});
