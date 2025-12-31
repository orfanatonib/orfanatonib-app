import api from "@/config/axiosConfig";
import { TeacherProfile, ShelterSimple, Page, TeacherQuery, TeacherSimpleListDto } from "./types";

export async function apiListTeachers(params: TeacherQuery) {
  const { data } = await api.get<Page<TeacherProfile>>("/teacher-profiles", { params });
  return data;
}

export async function apiGetTeacher(teacherId: string) {
  const { data } = await api.get<TeacherProfile>(`/teacher-profiles/${teacherId}`);
  return data;
}

/**
 * Lista todos os membros de forma simplificada (apenas ID, nome e status de vinculação)
 * Usado para listas de seleção (selects, comboboxes)
 */
export async function apiListTeachersSimple() {
  const { data } = await api.get<TeacherSimpleListDto[]>("/teacher-profiles/simple");
  return data;
}



export type ManageTeacherTeamDto = {
  shelterId: string;    // UUID do abrigo (obrigatório)
  numberTeam: number;   // Número da equipe: 1, 2, 3, 4... (obrigatório, mínimo: 1)
};


 
/**
 * Endpoint único para vincular membro a equipe de um abrigo
 * - Busca a equipe com o numberTeam especificado no abrigo
 * - Se a equipe não existir, cria uma nova equipe automaticamente
 * - Se o membro já estiver vinculado a outra equipe, remove da anterior e vincula à nova
 */
export async function apiManageTeacherTeam(teacherId: string, payload: ManageTeacherTeamDto) {
  const { data } = await api.put<TeacherProfile>(`/teacher-profiles/${teacherId}`, payload);
  return data;
}

export async function apiListSheltersSimple() {
  const { data } = await api.get<ShelterSimple[]>("/shelters/simple");
  return data;
}
