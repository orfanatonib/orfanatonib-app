import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { apiFetchShelter } from '@/features/shelters/api';
import { ShelterResponseDto } from '@/features/shelters/types';
import { RootState } from '@/store/slices';
import type { TeamWithMembersDto } from '@/features/teams/types';

export const useShelterPage = (idToFetch: string) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loadingUser, initialized } = useSelector((state: RootState) => state.auth);

  const [shelter, setShelter] = useState<ShelterResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !loadingUser && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [initialized, loadingUser, isAuthenticated, navigate, location]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetchShelter(idToFetch);
        setShelter(data);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('Error loading shelter:', err);
        setError(err?.response?.data?.message || 'Erro ao carregar o abrigo. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (idToFetch) run();
  }, [idToFetch]);

  const uniqueLeaders = useMemo(() => {
    if (!shelter?.teams?.length) return [];
    const map = new Map<string, TeamWithMembersDto['leaders'][number]>();
    shelter.teams.forEach((team) => team.leaders?.forEach((p) => !map.has(p.id) && map.set(p.id, p)));
    return Array.from(map.values());
  }, [shelter?.teams]);

  const uniqueMembers = useMemo(() => {
    if (!shelter?.teams?.length) return [];
    const map = new Map<string, TeamWithMembersDto['members'][number]>();
    shelter.teams.forEach((team) => team.members?.forEach((p) => !map.has(p.id) && map.set(p.id, p)));
    return Array.from(map.values());
  }, [shelter?.teams]);

  const getLeaderTeams = useMemo(() => {
    const teamsMap = new Map<string, number[]>();
    shelter?.teams?.forEach((team) => {
      team.leaders?.forEach((l) => {
        const id = l.id;
        if (!teamsMap.has(id)) teamsMap.set(id, []);
        const current = teamsMap.get(id)!;
        if (!current.includes(team.numberTeam)) current.push(team.numberTeam);
      });
    });
    return (leaderId: string) => (teamsMap.get(leaderId) || []).slice().sort((a, b) => a - b);
  }, [shelter?.teams]);

  const getMemberTeams = useMemo(() => {
    const teamsMap = new Map<string, number[]>();
    shelter?.teams?.forEach((team) => {
      team.members?.forEach((t) => {
        const id = t.id;
        if (!teamsMap.has(id)) teamsMap.set(id, []);
        const current = teamsMap.get(id)!;
        if (!current.includes(team.numberTeam)) current.push(team.numberTeam);
      });
    });
    return (memberId: string) => (teamsMap.get(memberId) || []).slice().sort((a, b) => a - b);
  }, [shelter?.teams]);

  return {
    
    initialized,
    loadingUser,
    isAuthenticated,

    shelter,
    loading,
    error,

    uniqueLeaders,
    uniqueMembers,
    getLeaderTeams,
    getMemberTeams,
  };
};
