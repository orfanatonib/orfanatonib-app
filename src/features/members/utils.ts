import { apiManageMemberTeam, ManageMemberTeamDto } from "./api";
import { MemberProfile } from "./types";

/**
 * Vincula um membro a uma equipe de um abrigo
 * - Se a equipe não existir, será criada automaticamente
 * - Se o membro já estiver em outra equipe, será movido automaticamente
 */
export async function addMemberToShelter(
  memberId: string,
  shelterId: string,
  numberTeam: number       // Número da equipe: 1, 2, 3, 4... (obrigatório, mínimo: 1)
): Promise<MemberProfile> {
  return apiManageMemberTeam(memberId, { shelterId, numberTeam });
}

