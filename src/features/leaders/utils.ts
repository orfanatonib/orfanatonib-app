import { apiManageLeaderTeam, ManageLeaderTeamDto } from "./api";
import { LeaderProfile } from "./types";

/**
 * Vincula um líder a uma equipe de um abrigo
 * - Se a equipe não existir, será criada automaticamente
 * - Se o líder já estiver em outra equipe, será movido automaticamente
 */
export async function addLeaderToShelter(
  leaderId: string,
  shelterId: string,
  numberTeam: number       // Número da equipe: 1, 2, 3, 4... (obrigatório, mínimo: 1)
): Promise<LeaderProfile> {
  return apiManageLeaderTeam(leaderId, { shelterId, numberTeam });
}
