import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { Delete, Edit, Visibility } from "@mui/icons-material";
import type { AdminTableColumn } from "@/components/common/admin-shell";
import { PersonWhatsAppButton } from "@/components/common/admin-people";
import { formatAdminDate } from "@/components/common/admin-shell/formatAdminDate";
import { UserRole } from "@/store/slices/auth/authSlice";
import { buildWhatsappLink } from "@/utils/whatsapp";
import type { UserRow } from "../types";
import { USERS_LABELS, USERS_SORT_COLUMNS } from "../constants";
import { ROLE_LABELS } from "../cards/constants";
import { yesNo } from "../cards/utils";

const ACTION_SX = { width: 44, height: 44 } as const;

export interface UsersColumnHandlers {
  loggedName?: string;
  onView: (u: UserRow) => void;
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}

/** Colunas da tabela do desktop; ordenação (`sortKey`) é pedida ao servidor. */
export function buildUsersColumns({ loggedName, onView, onEdit, onDelete }: UsersColumnHandlers): AdminTableColumn<UserRow>[] {
  return [
    {
      key: "name",
      header: "Nome",
      sortKey: USERS_SORT_COLUMNS.NAME,
      render: (u) => (
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 160 }}>
          <Typography fontWeight={600} noWrap data-testid={`users-row-name-${u.id}`}>{u.name || "—"}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap title={u.email} data-testid={`users-row-email-${u.id}`}>
            {u.email}
          </Typography>
        </Box>
      ),
    },
    {
      key: "role",
      header: "Papel",
      sortKey: USERS_SORT_COLUMNS.ROLE,
      render: (u) => (
        <Chip size="small" variant="outlined" label={ROLE_LABELS[u.role as UserRole] ?? u.role} color={u.role === UserRole.ADMIN ? "secondary" : "default"} data-testid={`users-row-role-${u.id}`} />
      ),
    },
    {
      key: "active",
      header: "Ativo",
      render: (u) => <Chip size="small" label={yesNo(u.active)} color={u.active ? "success" : "default"} data-testid={`users-row-active-${u.id}`} />,
    },
    {
      key: "completed",
      header: "Completo",
      render: (u) => <Chip size="small" label={yesNo(u.completed)} color={u.completed ? "success" : "default"} data-testid={`users-row-completed-${u.id}`} />,
    },
    { key: "phone", header: "Telefone", render: (u) => <span data-testid={`users-row-phone-${u.id}`}>{u.phone || "—"}</span> },
    { key: "createdAt", header: "Criado em", sortKey: USERS_SORT_COLUMNS.CREATED_AT, render: (u) => formatAdminDate(u.createdAt) ?? "—" },
    { key: "updatedAt", header: "Atualizado em", sortKey: USERS_SORT_COLUMNS.UPDATED_AT, render: (u) => formatAdminDate(u.updatedAt) ?? "—" },
    {
      key: "actions",
      header: "Ações",
      render: (u) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <PersonWhatsAppButton href={buildWhatsappLink(u.name, loggedName, u.phone)} testId={`users-row-whatsapp-${u.id}`} />
          <Tooltip title={USERS_LABELS.VIEW}>
            <IconButton sx={ACTION_SX} aria-label={`Ver usuário ${u.name}`} onClick={() => onView(u)} data-testid={`users-row-view-${u.id}`}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title={USERS_LABELS.EDIT}>
            <IconButton sx={ACTION_SX} aria-label={`Editar usuário ${u.name}`} onClick={() => onEdit(u)} data-testid={`users-row-edit-${u.id}`}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title={USERS_LABELS.DELETE}>
            <IconButton sx={ACTION_SX} color="error" aria-label={`Excluir usuário ${u.name}`} onClick={() => onDelete(u)} data-testid={`users-row-delete-${u.id}`}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
}
