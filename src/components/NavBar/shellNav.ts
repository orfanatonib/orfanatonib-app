import { FeatureFlagKeys, FeatureFlagTargetRole as UserRole } from '@/features/feature-flags/types';

import { PUBLIC_NAV_ITEMS, type PublicNavItem } from './publicNav';

/**
 * Lógica pura do menu da casca do app (Navbar desktop, drawer mobile e NavLinks): quem vê o quê, por papel e flag.
 * Nenhum componente repete essas regras. A flag nunca amplia o acesso além do papel: o guard continua na API/rota.
 */

export enum ShellUserMenuEntryId {
  MEMBER_AREA = 'member-area',
  SHELTERED_AREA = 'sheltered-area',
  ADMIN_AREA = 'admin-area',
  PROFILE = 'profile',
}

export interface ShellUserMenuEntry {
  readonly id: ShellUserMenuEntryId;
  readonly label: string;
  readonly path: string;
  /** Sem papéis = qualquer usuário logado. */
  readonly roles?: readonly UserRole[];
  /** Sem flag = sempre que o papel permitir. */
  readonly flag?: FeatureFlagKeys;
}

/** Itens do menu do usuário logado, na ordem de exibição. O "Meu Perfil" fica depois do divisor, no componente. */
export const SHELL_USER_MENU_ENTRIES: readonly ShellUserMenuEntry[] = [
  { id: ShellUserMenuEntryId.MEMBER_AREA, label: 'Área do Membro', path: '/area-do-membro', flag: FeatureFlagKeys.MEMBER_AREA },
  {
    id: ShellUserMenuEntryId.SHELTERED_AREA,
    label: 'Área dos Acolhidos',
    path: '/area-dos-acolhidos',
    roles: [UserRole.MEMBER, UserRole.LEADER],
    flag: FeatureFlagKeys.SHELTERED_AREA,
  },
  { id: ShellUserMenuEntryId.ADMIN_AREA, label: 'Administração', path: '/adm', roles: [UserRole.ADMIN, UserRole.LEADER] },
  { id: ShellUserMenuEntryId.PROFILE, label: 'Meu Perfil', path: '/perfil' },
];

export const SHELL_PROFILE_PATH = '/perfil';
export const SHELL_LOGIN_PATH = '/login';

export interface ShellVisibility {
  readonly isAuthenticated: boolean;
  readonly role: string | null | undefined;
  readonly isEnabled: (flag: FeatureFlagKeys) => boolean;
}

export function isShellEntryVisible(entry: ShellUserMenuEntry, visibility: ShellVisibility): boolean {
  if (!visibility.isAuthenticated || !visibility.role) return false;
  if (entry.roles && !entry.roles.some((role) => role === visibility.role)) return false;
  return !entry.flag || visibility.isEnabled(entry.flag);
}

/** Entradas do menu do usuário que aparecem para este papel e estado das flags (visitante: nenhuma). */
export function visibleShellUserMenuEntries(visibility: ShellVisibility): readonly ShellUserMenuEntry[] {
  return SHELL_USER_MENU_ENTRIES.filter((entry) => isShellEntryVisible(entry, visibility));
}

/** Flags lidas pelo menu da casca (usadas pelo hook para montar o predicado). */
export const SHELL_NAV_FLAGS: readonly FeatureFlagKeys[] = [
  ...new Set<FeatureFlagKeys>([
    ...PUBLIC_NAV_ITEMS.flatMap((item: PublicNavItem) => (item.flag ? [item.flag] : [])),
    ...SHELL_USER_MENU_ENTRIES.flatMap((entry) => (entry.flag ? [entry.flag] : [])),
  ]),
];

export function getRoleLabel(role: string | null | undefined): string {
  if (role === UserRole.ADMIN) return 'Administrador';
  if (role === UserRole.LEADER) return 'Líder';
  if (role === UserRole.MEMBER) return 'Membro';
  return '';
}

/** Item ativo quando o caminho é o do link ou está abaixo dele. */
export function isShellPathActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}
