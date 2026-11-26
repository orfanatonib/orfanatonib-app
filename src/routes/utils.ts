import {
  buildMemberContentPath,
  isMemberAreaEntityType,
} from "@/pages/MemberArea/utils/navigation";
import type { DynamicRouteData, DynamicRouteTarget } from "./types";

/**
 * Endereço antigo por slug (material, ideia ou vídeo): logado, vai para o endereço
 * da Área do Membro; páginas de conteúdo do membro abrem dentro da casca (sidebar)
 * quando há login; o resto renderiza a página pura.
 */
export function resolveDynamicRouteTarget(
  route: DynamicRouteData,
  isAuthenticated: boolean,
): DynamicRouteTarget {
  const memberPath = isAuthenticated
    ? buildMemberContentPath(route.entityType, route.idToFetch)
    : null;
  if (memberPath) return { kind: "redirect", to: memberPath };
  if (isAuthenticated && isMemberAreaEntityType(route.entityType)) {
    return { kind: "member-shell" };
  }
  return { kind: "page" };
}
