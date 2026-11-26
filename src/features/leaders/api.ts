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
  hasShelter?: boolean;
  /** Número da equipe (texto numérico, como o servidor espera). */
  teamName?: string;
  /** Líderes com equipe no abrigo (id exato). */
  shelterId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type ApiMessage = { message?: string };

export async function apiListLeaders(params: ListLeadersParams, signal?: AbortSignal) {
  const { data } = await api.get<PageDto<LeaderProfile>>(
    "/leader-profiles",
    { params, signal }
  );
  return data;
}

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

export async function apiListSheltersSimple() {
  const { data } = await api.get<ShelterSimpleResponse[]>("/shelters/simple");
  return data;
}

export async function apiListAllTeams() {
  const { data } = await api.get<TeamsCompleteResponse>("/teams");
  return data;
}

export async function apiGetTeamsByShelter(shelterId: string) {
  const { data } = await api.get<TeamSimple[]>(`/teams/by-shelter/${shelterId}`);
  return data;
}

export async function apiGetMyShelters() {
  const { data } = await api.get<MySheltersResponse>("/leader-profiles/my-shelters");
  return data;
}
