import { FeatureFlagKeys } from '@/features/feature-flags/types';

export interface PublicNavItem {
  readonly to: string;
  readonly label: string;
  /** Sem flag = sempre visível (a Home). */
  readonly flag?: FeatureFlagKeys;
}

/** Menu público (visitante e logado), na ordem de exibição. Cada recurso some quando a flag está desligada. */
export const PUBLIC_NAV_ITEMS: readonly PublicNavItem[] = [
  { to: '/', label: 'Início' },
  { to: '/feed-abrigos', label: 'Feed', flag: FeatureFlagKeys.SHELTER_FEED },
  { to: '/sobre', label: 'Sobre', flag: FeatureFlagKeys.ABOUT_PAGE },
  { to: '/eventos', label: 'Eventos', flag: FeatureFlagKeys.EVENTS_SECTION },
  { to: '/contato', label: 'Contato', flag: FeatureFlagKeys.CONTACT_FORM },
];

/** Itens que devem aparecer, dado o predicado "esta flag está ligada para o usuário atual". */
export function visiblePublicNavItems(
  isEnabled: (flag: FeatureFlagKeys) => boolean,
): readonly PublicNavItem[] {
  return PUBLIC_NAV_ITEMS.filter((item) => !item.flag || isEnabled(item.flag));
}
