import { useState, useEffect, useCallback } from "react";
import {
  apiListShelterSchedules,
  apiCreateShelterSchedule,
  apiUpdateShelterSchedule,
  apiDeleteShelterSchedule,
  apiListMyTeams,
} from "./api";
import {
  ShelterScheduleResponseDto,
  CreateShelterScheduleDto,
  UpdateShelterScheduleDto,
  MyTeamResponseDto,
} from "./types";
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

export function useShelterSchedules() {
  const [schedules, setSchedules] = useState<ShelterScheduleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiListShelterSchedules();
      setSchedules(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Erro ao carregar agendamentos"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = async (payload: CreateShelterScheduleDto) => {
    const created = await apiCreateShelterSchedule(payload);
    setSchedules((prev) => [...prev, created]);
    return created;
  };

  const updateSchedule = async (id: string, payload: UpdateShelterScheduleDto) => {
    const updated = await apiUpdateShelterSchedule(id, payload);
    setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteSchedule = async (id: string) => {
    await apiDeleteShelterSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}

export function useMyTeams() {
  const [teams, setTeams] = useState<MyTeamResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiListMyTeams();
      setTeams(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Erro ao carregar equipes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
  };
}
