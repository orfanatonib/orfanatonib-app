import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { GroupsOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  AdminListContent,
  AdminListToolbar,
  AdminPagination,
  useAdminList,
  type AdminFilterField,
} from "@/components/common/admin-shell";
import { getLeaderTeams, getSheltersTeamsMembersPage } from "../api";
import { ATTENDANCE_LIST_PREFIX } from "../constants";
import { attendanceTeamPath } from "../workspace.utils";
import type { LeaderTeamDto } from "../types";
import TeamSelection from "./TeamSelection";

const DEFAULT_SORT = "shelterName:ASC";

const SORT_OPTIONS = [
  { value: "shelterName:ASC", label: "Abrigo (A–Z)" },
  { value: "shelterName:DESC", label: "Abrigo (Z–A)" },
  { value: "teamCount:DESC", label: "Mais equipes" },
  { value: "teamCount:ASC", label: "Menos equipes" },
];

/**
 * "Lançar presença": a casca (título, abas e largura) é a do `AttendanceLayout`; aqui entram as
 * mesmas peças da casca administrativa (toolbar, conteúdo estável, paginação) com busca, abrigo,
 * ordenação e página decididos no servidor.
 */
export default function DrillDownAttendance() {
  const navigate = useNavigate();
  const p = ATTENDANCE_LIST_PREFIX;
  const list = useAdminList({
    fetcher: getSheltersTeamsMembersPage,
    defaultFilters: { sort: DEFAULT_SORT },
    errorMessage: "Não foi possível carregar os dados. Tente novamente.",
  });

  const [leaderTeams, setLeaderTeams] = useState<LeaderTeamDto[]>([]);
  useEffect(() => {
    let active = true;
    getLeaderTeams()
      .then((teams) => active && setLeaderTeams(teams))
      .catch(() => active && setLeaderTeams([]));
    return () => {
      active = false;
    };
  }, []);

  const fields: AdminFilterField[] = useMemo(() => {
    const byId = new Map<string, string>();
    leaderTeams.forEach((team) => byId.set(team.shelterId, team.shelterName));
    const shelters = [...byId.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [
      { kind: "select", key: "shelterId", label: "Abrigo", options: shelters, allLabel: "Todos os abrigos" },
      { kind: "select", key: "sort", label: "Ordenar por", options: SORT_OPTIONS, allLabel: null },
    ];
  }, [leaderTeams]);

  return (
    <Box data-testid="attendance-page">
      <Typography component="h2" variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
        Qual equipe participou?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Escolha o abrigo e a equipe. Na próxima etapa, selecione a visita ou
        reunião.
      </Typography>
      <AdminListToolbar
        testIdPrefix={p}
        searchLabel="Buscar abrigo, equipe ou membro"
        searchPlaceholder="Abrigo, equipe ou nome de membro..."
        search={list.search}
        onSearchChange={list.setSearch}
        fields={fields}
        filters={list.filters}
        onFilterChange={list.setFilter}
        onClearAll={list.clearAll}
        onRefresh={list.reload}
        fetching={list.fetching}
        activeFilterCount={list.activeFilterCount}
      />
      <AdminListContent
        testIdPrefix={p}
        initialLoading={list.initialLoading}
        fetching={list.fetching}
        error={list.error}
        onRetry={list.reload}
        isEmpty={list.items.length === 0}
        hasActiveFilters={list.hasActiveFilters}
        emptyMessage="Nenhuma equipe disponível para seu acesso."
        emptyIcon={<GroupsOutlined fontSize="large" />}
        skeletonWithCover={false}
      >
        <TeamSelection
          data={list.items}
          onTeamSelect={(_, team) => navigate(attendanceTeamPath(team.teamId))}
        />
      </AdminListContent>
      <AdminPagination
        testIdPrefix={p}
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        onChange={list.setPage}
      />
    </Box>
  );
}
