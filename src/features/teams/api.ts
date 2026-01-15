import api from "@/config/axiosConfig";
import { TeamResponseDto, CreateTeamDto, UpdateTeamDto, TeamSimpleDto } from "./types";

export async function apiListTeams(shelterId?: string) {
  const params = shelterId ? { shelterId } : {};
  const { data } = await api.get<TeamResponseDto[]>("/teams", { params });
  return data;
}

export async function apiGetTeam(teamId: string) {
  const { data } = await api.get<TeamResponseDto>(`/teams/${teamId}`);
  return data;
}

export async function apiGetTeamsByShelter(shelterId: string) {
  const { data } = await api.get<TeamResponseDto[]>(`/teams/by-shelter/${shelterId}`);
  return data;
}

export async function apiCreateTeam(payload: CreateTeamDto) {
  const { data } = await api.post<TeamResponseDto>("/teams", payload);
  return data;
}

export async function apiUpdateTeam(teamId: string, payload: UpdateTeamDto) {
  try {
    const response = await api.put<TeamResponseDto>(`/teams/${teamId}`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export async function apiDeleteTeam(teamId: string) {
  await api.delete(`/teams/${teamId}`);
}

