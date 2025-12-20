import { apiManageTeacherTeam, ManageTeacherTeamDto } from "./api";
import { TeacherProfile } from "./types";

/**
 * Vincula um professor a uma equipe de um abrigo
 * - Se a equipe não existir, será criada automaticamente
 * - Se o professor já estiver em outra equipe, será movido automaticamente
 */
export async function addTeacherToShelter(
  teacherId: string,
  shelterId: string,
  numberTeam: number       // Número da equipe: 1, 2, 3, 4... (obrigatório, mínimo: 1)
): Promise<TeacherProfile> {
  return apiManageTeacherTeam(teacherId, { shelterId, numberTeam });
}

