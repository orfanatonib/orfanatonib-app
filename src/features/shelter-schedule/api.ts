import api from "@/config/axiosConfig";
import {
  ShelterScheduleResponseDto,
  CreateShelterScheduleDto,
  UpdateShelterScheduleDto,
  MyTeamResponseDto,
} from "./types";

/**
 * Lista agendamentos filtrados automaticamente por role do usuário
 * - Admin: todos os agendamentos
 * - Leader: agendamentos das suas equipes
 * - Member: agendamentos da sua equipe
 */
export async function apiListShelterSchedules(): Promise<ShelterScheduleResponseDto[]> {
  const { data } = await api.get<ShelterScheduleResponseDto[]>("/shelter-schedules");
  return data;
}

/**
 * Cria um novo agendamento
 * Automaticamente cria 2 eventos (visita e reunião) para professores
 */
export async function apiCreateShelterSchedule(
  payload: CreateShelterScheduleDto
): Promise<ShelterScheduleResponseDto> {
  const { data } = await api.post<ShelterScheduleResponseDto>("/shelter-schedules", payload);
  return data;
}

/**
 * Atualiza um agendamento existente
 * NÃO atualiza os eventos já criados
 */
export async function apiUpdateShelterSchedule(
  id: string,
  payload: UpdateShelterScheduleDto
): Promise<ShelterScheduleResponseDto> {
  const { data } = await api.put<ShelterScheduleResponseDto>(`/shelter-schedules/${id}`, payload);
  return data;
}

/**
 * Remove um agendamento
 * NÃO remove os eventos já criados
 */
export async function apiDeleteShelterSchedule(id: string): Promise<void> {
  await api.delete(`/shelter-schedules/${id}`);
}

/**
 * Lista equipes do usuário autenticado
 * - Admin: todas as equipes
 * - Leader: equipes onde é líder
 * - Member: equipe onde é professor
 */
export async function apiListMyTeams(): Promise<MyTeamResponseDto[]> {
  const { data } = await api.get<MyTeamResponseDto[]>("/teams/my-teams");
  return data;
}
