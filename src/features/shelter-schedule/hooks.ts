import { useState, useEffect, useCallback } from "react";
import { apiListMyTeams } from "./api";
import { MyTeamResponseDto } from "./types";
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

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
