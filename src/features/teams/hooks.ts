import { useCallback, useState } from "react";
import {
  apiListTeams,
  apiGetTeam,
  apiGetTeamsByShelter,
  apiCreateTeam,
  apiUpdateTeam,
  apiDeleteTeam,
} from "./api";
import { TeamResponseDto, CreateTeamDto, UpdateTeamDto } from "./types";

export function useTeams(shelterId?: string) {
  const [teams, setTeams] = useState<TeamResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = shelterId
        ? await apiGetTeamsByShelter(shelterId)
        : await apiListTeams();
      setTeams(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Erro ao listar equipes");
    } finally {
      setLoading(false);
    }
  }, [shelterId]);

  return { teams, loading, error, setError, fetchTeams };
}

export function useTeamDetails() {
  const [team, setTeam] = useState<TeamResponseDto | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTeam = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setTeam(await apiGetTeam(id));
    } finally {
      setLoading(false);
    }
  }, []);

  return { team, setTeam, loading, fetchTeam };
}

export function useTeamMutations(onSuccess?: () => Promise<void>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createTeam = useCallback(
    async (payload: CreateTeamDto) => {
      setLoading(true);
      setError("");
      try {
        await apiCreateTeam(payload);
        if (onSuccess) await onSuccess();
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Erro ao criar equipe");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const updateTeam = useCallback(
    async (teamId: string, payload: UpdateTeamDto) => {
      setLoading(true);
      setError("");
      try {
        await apiUpdateTeam(teamId, payload);
        if (onSuccess) await onSuccess();
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Erro ao atualizar equipe");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      setLoading(true);
      setError("");
      try {
        await apiDeleteTeam(teamId);
        if (onSuccess) await onSuccess();
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Erro ao remover equipe");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  return { loading, error, setError, createTeam, updateTeam, deleteTeam };
}

