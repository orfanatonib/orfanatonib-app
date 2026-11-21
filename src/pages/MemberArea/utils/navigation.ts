import {
  ENTITY_TYPE_NAV_ITEM,
  MEMBER_HOME_LEADER_QUICK_ACTIONS,
  MEMBER_HOME_QUICK_ACTIONS,
  MEMBER_AREA_DYNAMIC_ENTITY_TYPES,
  MEMBER_CONTENT_PAGE_BASE_PATH,
} from '../constants/navigation';
import {
  MemberNavRequirement,
  type MemberDynamicRouteRef,
  type MemberNavAccess,
  type MemberNavItemDefinition,
  type MemberNavItemId,
} from '../types/navigation';

const stripSlashes = (path: string): string => path.replace(/^\/+|\/+$/g, '');

export function isMemberAreaEntityType(entityType: string): boolean {
  return MEMBER_AREA_DYNAMIC_ENTITY_TYPES.includes(entityType);
}

/** Atalhos da Home: os de todos e, para admin/líder, os de integração. */
export function getMemberHomeQuickActionKeys(isAdminOrLeader: boolean): string[] {
  return [...MEMBER_HOME_QUICK_ACTIONS, ...(isAdminOrLeader ? MEMBER_HOME_LEADER_QUICK_ACTIONS : [])];
}

export function filterNavItems(
  items: readonly MemberNavItemDefinition[],
  access: MemberNavAccess,
): MemberNavItemDefinition[] {
  return items.filter((item) => {
    if (item.featureKey && access.isFeatureEnabled && !access.isFeatureEnabled(item.featureKey)) return false;
    switch (item.requires) {
      case MemberNavRequirement.AdminOrLeader:
        return access.isAdminOrLeader;
      default:
        return true;
    }
  });
}

export function isNavItemActive(item: MemberNavItemDefinition, pathname: string): boolean {
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/**
 * Item ativo do menu: primeiro pela página dinâmica aberta (ex.: um material de visita),
 * depois pelo prefixo da rota (cobre subpáginas e subpáginas das subpáginas).
 */
export function resolveActiveNavItemId(
  items: readonly MemberNavItemDefinition[],
  pathname: string,
  dynamicRoutes: readonly MemberDynamicRouteRef[],
): MemberNavItemId | null {
  const currentPath = stripSlashes(pathname);
  const dynamic = dynamicRoutes.find((route) => stripSlashes(route.path) === currentPath);
  const dynamicTarget = dynamic ? ENTITY_TYPE_NAV_ITEM[dynamic.entityType] : undefined;
  if (dynamicTarget && items.some((item) => item.id === dynamicTarget)) return dynamicTarget;

  const matches = items.filter((item) => isNavItemActive(item, pathname));
  if (matches.length === 0) return null;
  return matches.reduce((best, item) => (item.to.length > best.to.length ? item : best)).id;
}

export const isMemberContentEntityType = (entityType: string): boolean =>
  entityType in MEMBER_CONTENT_PAGE_BASE_PATH;

/**
 * Endereço de uma página de conteúdo aberta por id dentro da Área do Membro
 * (ex.: `/area-do-membro/ideias/:id`); `null` para tipos que não têm esse padrão.
 */
export const buildMemberContentPath = (entityType: string, id: string): string | null => {
  const base = MEMBER_CONTENT_PAGE_BASE_PATH[entityType];
  return base ? `${base}/${encodeURIComponent(id)}` : null;
};
