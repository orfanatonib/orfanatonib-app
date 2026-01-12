import api from "@/config/axiosConfig";
import { MemberProfile, ShelterSimple, Page, MemberQuery, MemberSimpleListDto } from "./types";

export async function apiListMembers(params: MemberQuery) {
  const { data } = await api.get<Page<MemberProfile>>("/member-profiles", { params });
  return data;
}

export async function apiGetMember(memberId: string) {
  const { data } = await api.get<MemberProfile>(`/member-profiles/${memberId}`);
  return data;
}

/**
 * Lista todos os membros de forma simplificada (apenas ID, nome e status de vinculação)
 * Usado para listas de seleção (selects, comboboxes)
 */
export async function apiListMembersSimple() {
  const { data } = await api.get<MemberSimpleListDto[]>("/member-profiles/simple");
  return data;
}



export type ManageMemberTeamDto = {
  shelterId: string;    // UUID do abrigo (obrigatório)
  numberTeam: number;   // Número da equipe: 1, 2, 3, 4... (obrigatório, mínimo: 1)
};


 
/**
 * Endpoint único para vincular membro a equipe de um abrigo
 * - Busca a equipe com o numberTeam especificado no abrigo
 * - Se a equipe não existir, cria uma nova equipe automaticamente
 * - Se o membro já estiver vinculado a outra equipe, remove da anterior e vincula à nova
 */
export async function apiManageMemberTeam(memberId: string, payload: ManageMemberTeamDto) {
  const { data } = await api.put<MemberProfile>(`/member-profiles/${memberId}`, payload);
  return data;
}

export async function apiListSheltersSimple() {
  const { data } = await api.get<ShelterSimple[]>("/shelters/simple");
  return data;
}
