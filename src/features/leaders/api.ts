import api from "@/config/axiosConfig";
import type { LeaderProfile, ShelterSimple, PageDto, LeaderSimpleListDto } from "./types";

export type ListLeadersParams = {
  page: number; 
  limit: number;
  sort?: "updatedAt" | "createdAt" | "name";
  order?: "asc" | "desc";
  leaderSearchString?: string;
  shelterSearchString?: string;
  hasShelter?: boolean;
  teamId?: string;
  teamName?: string;
  hasTeam?: boolean;
  q?: string;
  active?: boolean;
  hasShelters?: boolean;
  shelterName?: string;
  searchString?: string;
};

export type ApiMessage = { message?: string };

export async function apiCreateLeaderForUser(userId: string) {
  const { data } = await api.post<LeaderProfile>(`/leader-profiles/create-for-user/${userId}`);
  return data;
}

export async function apiListLeaders(params: ListLeadersParams) {
  const { data } = await api.get<PageDto<LeaderProfile>>(
    "/leader-profiles",
    { params }
  );
  return data;
}

/**
 * Lista todos os líderes de forma simplificada (apenas ID, nome e status de vinculação)
 * Usado para listas de seleção (selects, comboboxes)
 */
export async function apiListLeadersSimple() {
  const { data } = await api.get<LeaderSimpleListDto[]>("/leader-profiles/simple");
  return data;
}

export async function apiGetLeader(leaderId: string) {
  const { data } = await api.get<LeaderProfile>(
    `/leader-profiles/${leaderId}`
  );
  return data;
}


export type ManageLeaderTeamDto = {
  shelterId: string;    // UUID do abrigo (obrigatório)
  numberTeam: number;   // Número da equipe: 1, 2, 3, 4... (obrigatório, mínimo: 1)
};

/**
 * Endpoint único para vincular líder a equipe de um abrigo
 * - Busca a equipe com o numberTeam especificado no abrigo
 * - Se a equipe não existir, cria uma nova equipe automaticamente
 * - Se o líder já estiver vinculado a outra equipe, remove da anterior e vincula à nova
 */
export async function apiManageLeaderTeam(leaderId: string, payload: ManageLeaderTeamDto) {
  const { data } = await api.put<LeaderProfile>(`/leader-profiles/${leaderId}`, payload);
  return data;
}

export async function apiListSheltersSimple() {
  const { data } = await api.get<ShelterSimple[]>("/shelters/simple");
  return data;
}

/**
 * Busca os abrigos do líder logado
 * GET /leader-profiles/my-shelters
 * Retorna um array de abrigos completos (ShelterResponseDto)
 */
export async function apiGetMyShelters() {
  const { data } = await api.get<any[]>("/leader-profiles/my-shelters");
  return data;
}
