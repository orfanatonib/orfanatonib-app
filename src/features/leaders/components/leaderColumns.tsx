import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { Edit as EditIcon, Visibility } from "@mui/icons-material";
import type { AdminTableColumn } from "@/components/common/admin-shell";
import { PersonWhatsAppButton } from "@/components/common/admin-people";
import { formatAdminDate } from "@/components/common/admin-shell/formatAdminDate";
import { buildWhatsappLink } from "@/utils/whatsapp";
import type { LeaderProfile } from "../types";
import { LEADERS_INLINE_LIMIT, LEADERS_LABELS, LEADERS_SORT_COLUMNS, LEADERS_TEST_ID_PREFIX } from "../constants";
import { collectMembers, countTeams, memberLabel } from "../utils";

const ACTION_SX = { width: 44, height: 44 } as const;
const ROW = `${LEADERS_TEST_ID_PREFIX}-row`;

export interface LeaderColumnHandlers {
  loggedName?: string;
  onView: (leader: LeaderProfile) => void;
  onEdit: (leader: LeaderProfile) => void;
}

/** Colunas da tabela do desktop; ordenação (`sortKey`) é pedida ao servidor. */
export function buildLeaderColumns({ loggedName, onView, onEdit }: LeaderColumnHandlers): AdminTableColumn<LeaderProfile>[] {
  return [
    {
      key: "name",
      header: "Líder",
      sortKey: LEADERS_SORT_COLUMNS.NAME,
      render: (leader) => (
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 170 }}>
          <Typography fontWeight={600} noWrap data-testid={`${ROW}-name-${leader.id}`}>{leader.user?.name || "—"}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap title={leader.user?.email}>{leader.user?.email}</Typography>
        </Box>
      ),
    },
    {
      key: "shelters",
      header: "Abrigos",
      render: (leader) => {
        const shelters = leader.shelters ?? [];
        return (
          <Box data-testid={`${ROW}-shelters-${leader.id}`}>
            {shelters.length === 0 ? (
              <Chip size="small" label={LEADERS_LABELS.NO_SHELTER} />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                {shelters.slice(0, LEADERS_INLINE_LIMIT).map((shelter) => (
                  <Chip key={shelter.id} size="small" label={shelter.name} />
                ))}
                {shelters.length > LEADERS_INLINE_LIMIT ? (
                  <Typography variant="caption" color="text.secondary">+{shelters.length - LEADERS_INLINE_LIMIT} outros</Typography>
                ) : null}
              </Box>
            )}
          </Box>
        );
      },
    },
    {
      key: "teams",
      header: "Equipes",
      render: (leader) => {
        const shelters = leader.shelters ?? [];
        const teams = countTeams(shelters);
        return (
          <span data-testid={`${ROW}-teams-${leader.id}`}>
            {teams === 0 ? (
              "—"
            ) : (
              <Tooltip title={shelters.flatMap((s) => s.teams.map((t) => `Equipe ${t.numberTeam} — ${s.name}`)).join(", ")}>
                <Typography component="span" variant="body2" color="primary" fontWeight={500}>
                  {teams} {teams === 1 ? "equipe" : "equipes"}
                </Typography>
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      key: "members",
      header: "Membros",
      render: (leader) => {
        const members = collectMembers(leader.shelters ?? []);
        return (
          <span data-testid={`${ROW}-members-${leader.id}`}>
            {members.length === 0 ? (
              "—"
            ) : (
              <Tooltip title={members.map(memberLabel).join(", ")}>
                <Typography component="span" variant="body2" color="primary" fontWeight={500}>
                  {members.length} {members.length === 1 ? "membro" : "membros"}
                </Typography>
              </Tooltip>
            )}
          </span>
        );
      },
    },
    { key: "createdAt", header: "Criado em", sortKey: LEADERS_SORT_COLUMNS.CREATED_AT, render: (l) => formatAdminDate(l.createdAt) ?? "—" },
    { key: "updatedAt", header: "Atualizado em", sortKey: LEADERS_SORT_COLUMNS.UPDATED_AT, render: (l) => formatAdminDate(l.updatedAt) ?? "—" },
    {
      key: "actions",
      header: "Ações",
      render: (leader) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title={LEADERS_LABELS.VIEW}>
            <IconButton sx={ACTION_SX} aria-label={`Ver líder ${leader.user?.name ?? ""}`} onClick={() => onView(leader)} data-testid={`${ROW}-view-${leader.id}`}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <PersonWhatsAppButton href={buildWhatsappLink(leader.user?.name, loggedName, leader.user?.phone)} testId={`${ROW}-wa-${leader.id}`} />
          <Tooltip title="Gerenciar associações">
            <IconButton sx={ACTION_SX} color="primary" aria-label={`Gerenciar associações de ${leader.user?.name ?? ""}`} onClick={() => onEdit(leader)} data-testid={`${ROW}-edit-${leader.id}`}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
}
