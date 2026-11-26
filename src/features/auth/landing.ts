/** Rotas de aterrissagem depois do login (única fonte: Login e redirecionamentos usam esta função). */
export const ADMIN_LANDING_PATH = "/adm";
export const MEMBER_LANDING_PATH = "/area-do-membro";

/** Papéis que gerenciam pelo painel (valores de `UserRole`; sem importá-lo para não puxar o store). */
const PANEL_ROLES: ReadonlySet<string> = new Set(["admin", "leader"]);

/** Admin e líder vão para o painel; membro (e papel desconhecido) para a Área do Membro. */
export function landingPathFor(role?: string | null): string {
  return role && PANEL_ROLES.has(role)
    ? ADMIN_LANDING_PATH
    : MEMBER_LANDING_PATH;
}
