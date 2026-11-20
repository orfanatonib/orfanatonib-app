import { STUDIO_ROOT, STUDIO_ROUTE_META, type StudioRouteMeta } from "./shell.constants";

/** Remove a barra final: `/adm/estudio/` e `/adm/estudio` são a mesma tela. */
const normalize = (pathname: string): string => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);

/** O cabeçalho da tela em que o usuário está (a visão geral é o padrão para rota desconhecida do Estúdio). */
export function studioRouteMeta(pathname: string): StudioRouteMeta {
  const path = normalize(pathname);
  const found = STUDIO_ROUTE_META.find((item) => {
    if (item.exact) return path === item.path;
    // Tela de detalhe: só os subcaminhos (`/revisao/:id`), nunca a própria lista (`/revisao`).
    if (item.detail) return path.startsWith(`${item.path}/`);
    return path === item.path || path.startsWith(`${item.path}/`);
  });
  return found ?? STUDIO_ROUTE_META[STUDIO_ROUTE_META.length - 1];
}

export const isStudioRoot = (pathname: string): boolean => normalize(pathname) === STUDIO_ROOT;
