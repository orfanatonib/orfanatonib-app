import api from "@/config/axiosConfig";
import type {
  LeaderProfile,
  ShelterSimple,
  PageDto,
  LeaderSimpleListDto,
  LeaderAssociationUpdateDto,
  MySheltersResponse,
  ShelterSimpleResponse,
  TeamsCompleteResponse,
  TeamSimple
} from "./types";

export type ListLeadersParams = {
  page?: number;
  limit?: number;
  sort?: "name" | "updatedAt" | "createdAt";
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


/**
 * Endpoint para editar associações de líder a múltiplos abrigos e equipes
 * PUT /leader-profiles/:leaderId
 * Vincula um líder a múltiplas equipes de múltiplos abrigos simultaneamente
 * IMPORTANTE: Remove automaticamente todas as associações atuais antes de criar as novas
 */
export async function apiUpdateLeaderAssociations(leaderId: string, payload: LeaderAssociationUpdateDto) {
  const { data } = await api.put<LeaderProfile>(`/leader-profiles/${leaderId}`, payload);
  return data;
}

export type ManageLeaderTeamDto = {
  shelterId: string;
  numberTeam: number;
};

export async function apiManageLeaderTeam(leaderId: string, payload: ManageLeaderTeamDto) {
  const newPayload: LeaderAssociationUpdateDto = [{
    shelterId: payload.shelterId,
    teams: [payload.numberTeam]
  }];
  return apiUpdateLeaderAssociations(leaderId, newPayload);
}

/**
 * Lista abrigos de forma simplificada com suas equipes
 * GET /shelters/simple
 * Ideal para dropdowns e seleções
 */
export async function apiListSheltersSimple() {
  const { data } = await api.get<ShelterSimpleResponse[]>("/shelters/simple");
  return data;
}

/**
 * Busca todas as equipes com detalhes completos
 * GET /teams
 * Retorna todas as equipes com seus abrigos, líderes e membros
 */
export async function apiListAllTeams() {
  const { data } = await api.get<TeamsCompleteResponse>("/teams");
  return data;
}

/**
 * Busca equipes de um abrigo específico
 * GET /teams/by-shelter/:shelterId
 */
export async function apiGetTeamsByShelter(shelterId: string) {
  const { data } = await api.get<TeamSimple[]>(`/teams/by-shelter/${shelterId}`);
  return data;
}

/**
 * Busca os abrigos do líder logado com todas as equipes e status de participação
 * GET /leader-profiles/my-shelters
 */
export async function apiGetMyShelters() {
  const { data } = await api.get<MySheltersResponse>("/leader-profiles/my-shelters");
  return data;
}
