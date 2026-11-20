import type { ReactNode } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';

export enum MemberNavGroup {
  Area = 'area',
  More = 'more',
}

export enum MemberNavItemId {
  Overview = 'overview',
  Materials = 'materials',
  Documents = 'documents',
  Ideas = 'ideas',
  Videos = 'videos',
  ShareIdea = 'share-idea',
  Photos = 'photos',
  Manual = 'manual',
  Rate = 'rate',
  Integrations = 'integrations',
}

/** Condição de acesso que o item exige para aparecer no menu (a API continua sendo a autoridade). */
export enum MemberNavRequirement {
  AdminOrLeader = 'admin-or-leader',
}

export interface MemberNavItemDefinition {
  id: MemberNavItemId;
  label: string;
  to: string;
  icon: SvgIconComponent;
  accentColor: string;
  /** Descrição curta exibida no cabeçalho de página que a casca desenha. */
  description: string;
  group: MemberNavGroup;
  exact?: boolean;
  /** A Home monta o próprio topo (avisos e banners), então não recebe o cabeçalho padrão. */
  hidePageHeader?: boolean;
  requires?: MemberNavRequirement;
  /** Flag que precisa estar ligada para o item aparecer (a rota e a API têm a própria proteção). */
  featureKey?: string;
}

export interface MemberNavAccess {
  isAdminOrLeader: boolean;
  /** Sem o predicado, nenhuma flag é aplicada (compatível com quem só filtra por perfil). */
  isFeatureEnabled?: (key: string) => boolean;
}

export interface MemberAreaSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (to: string) => void;
}

export interface MemberPageHeaderProps {
  item: MemberNavItemDefinition;
}

export interface MemberAreaShellProps {
  children: ReactNode;
}

/** Recorte mínimo de uma rota dinâmica usado para descobrir o item ativo do menu. */
export interface MemberDynamicRouteRef {
  path: string;
  entityType: string;
}
