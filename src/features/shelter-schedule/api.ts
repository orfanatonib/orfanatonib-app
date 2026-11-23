import api from "@/config/axiosConfig";
import { fetchAdminPage } from "@/components/common/admin-shell/listQuery";
import type { AdminListPage, AdminListParams } from "@/components/common/admin-shell/types";
import {
  ShelterScheduleResponseDto,
  CreateShelterScheduleDto,
  UpdateShelterScheduleDto,
  MyTeamResponseDto,
} from "./types";

export async function apiListShelterSchedules(teamId?: string): Promise<ShelterScheduleResponseDto[]> {
  const params = teamId ? { teamId } : {};
  const { data } = await api.get<ShelterScheduleResponseDto[]>("/shelter-schedules", { params });
  return data;
}

export async function apiCreateShelterSchedule(
  payload: CreateShelterScheduleDto
): Promise<ShelterScheduleResponseDto> {
  const { data } = await api.post<ShelterScheduleResponseDto>("/shelter-schedules", payload);
  return data;
}

export async function apiUpdateShelterSchedule(
  id: string,
  payload: UpdateShelterScheduleDto
): Promise<ShelterScheduleResponseDto> {
  const { data } = await api.put<ShelterScheduleResponseDto>(`/shelter-schedules/${id}`, payload);
  return data;
}

export async function apiDeleteShelterSchedule(id: string): Promise<void> {
  await api.delete(`/shelter-schedules/${id}`);
}

export async function apiListMyTeams(): Promise<MyTeamResponseDto[]> {
  const { data } = await api.get<MyTeamResponseDto[]>("/teams/my-teams");
  return data;
}

/** Página de agendamentos filtrada, ordenada e recortada no servidor (`GET /shelter-schedules?page=`). */
export function apiListShelterSchedulesPage(
  params: AdminListParams,
  signal: AbortSignal,
): Promise<AdminListPage<ShelterScheduleResponseDto>> {
  return fetchAdminPage<ShelterScheduleResponseDto>("/shelter-schedules", params, signal);
}
