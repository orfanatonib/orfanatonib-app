import React from "react";
import { Groups } from "@mui/icons-material";
import { useSelector } from "react-redux";
import {
  AdminTableListScreen,
  splitSort,
  useAdminList,
  type AdminFilterField,
  type AdminListFetcher,
} from "@/components/common/admin-shell";
import NoTeamLinked from "@/components/common/NoTeamLinked";
import type { RootState } from "@/store/slices";
import { useAuthRole } from "@/utils/useAuthRole";
import MemberCard from "./components/MemberCard";
import { buildMemberColumns } from "./components/memberColumns";
import MemberViewDialog from "./components/MemberViewDialog";
import MemberEditDialog from "./components/MemberEditDialog";
import { apiListMembers } from "./api";
import type { MemberProfile, MemberQuery } from "./types";

const PAGE_SIZE = 12;
const DEFAULT_SORT = "updatedAt:DESC";
const DEFAULT_FILTERS = { sort: DEFAULT_SORT };

const SORT_FIELD_LABELS: ReadonlyArray<[MemberQuery["sort"], string]> = [
  ["name", "Nome"],
  ["createdAt", "Criado em"],
  ["updatedAt", "Atualizado em"],
];

const SORT_OPTIONS = SORT_FIELD_LABELS.flatMap(([field, label]) => [
  { value: `${field}:ASC`, label: `${label} (crescente)` },
  { value: `${field}:DESC`, label: `${label} (decrescente)` },
]);

const SORT_FIELD: AdminFilterField = {
  kind: "select",
  key: "sort",
  label: "Ordenar por",
  allLabel: null,
  options: SORT_OPTIONS,
};

/** Filtros do admin; o líder só enxerga os membros dos próprios abrigos, então não filtra por abrigo. */
const ADMIN_FIELDS: AdminFilterField[] = [
  SORT_FIELD,
  {
    kind: "select",
    key: "hasShelter",
    label: "Vínculo",
    allLabel: "Todos",
    options: [
      { value: "true", label: "Com abrigo" },
      { value: "false", label: "Sem abrigo" },
    ],
  },
  { kind: "text", key: "shelterSearchString", label: "Abrigo", placeholder: "Todos os campos do abrigo" },
];
const LEADER_FIELDS: AdminFilterField[] = [SORT_FIELD];

/** Traduz o estado da lista (página 1-indexada, busca e filtros) para `GET /member-profiles`. */
const fetchMembers: AdminListFetcher<MemberProfile> = async (params, signal) => {
  const { filters } = params;
  const { sortBy, order } = splitSort(filters.sort);
  const query: MemberQuery = {
    page: params.page,
    limit: params.limit,
    memberSearchString: params.search.trim() || undefined,
    shelterSearchString: filters.shelterSearchString?.trim() || undefined,
    hasShelter: filters.hasShelter ? filters.hasShelter === "true" : undefined,
    sort: sortBy as MemberQuery["sort"],
    order: order === "ASC" ? "asc" : "desc",
  };
  const data = await apiListMembers(query, signal);
  return { items: data.items ?? [], total: data.total ?? 0, totalPages: Math.max(1, Math.ceil((data.total ?? 0) / params.limit)) };
};

export default function MemberProfilesManager() {
  const { isLeader } = useAuthRole();
  const user = useSelector((state: RootState) => state.auth.user);

  const list = useAdminList<MemberProfile>({
    fetcher: fetchMembers,
    pageSize: PAGE_SIZE,
    defaultFilters: DEFAULT_FILTERS,
    errorMessage: "Erro ao listar membros",
  });

  const [viewing, setViewing] = React.useState<MemberProfile | null>(null);
  const [editingTeam, setEditingTeam] = React.useState<MemberProfile | null>(null);

  // Líder sem equipe vinculada não tem o que listar.
  if (isLeader && (!user?.leaderProfile?.teams || user.leaderProfile.teams.length === 0)) {
    return <NoTeamLinked showBackButton={false} />;
  }

  const rowActions = { onView: setViewing, onEdit: setEditingTeam };

  return (
    <AdminTableListScreen
      testIdPrefix="member"
      title="Gerenciador de Membros"
      searchLabel="Buscar membro"
      searchPlaceholder="Nome, e-mail ou telefone do membro"
      fields={isLeader ? LEADER_FIELDS : ADMIN_FIELDS}
      list={list}
      emptyMessage="Nenhum membro encontrado."
      emptyIcon={<Groups aria-hidden sx={{ fontSize: 56, color: "text.secondary" }} />}
      columns={buildMemberColumns(rowActions, user?.name)}
      rowKey={(member) => member.id}
      renderCard={(member) => <MemberCard member={member} {...rowActions} />}
      cardsBelow="sm"
      overlays={
        <>
          <MemberViewDialog open={!!viewing} member={viewing} onClose={() => setViewing(null)} />
          <MemberEditDialog
            open={!!editingTeam}
            member={editingTeam}
            onClose={() => setEditingTeam(null)}
            onSuccess={() => {
              setEditingTeam(null);
              list.reload();
            }}
          />
        </>
      }
    />
  );
}
