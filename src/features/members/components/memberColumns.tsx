import React from "react";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { Edit as EditIcon, Visibility, WhatsApp } from "@mui/icons-material";
import type { AdminTableColumn } from "@/components/common/admin-shell";
import { fmtDate } from "@/utils/dateUtils";
import { buildWhatsappLink } from "@/utils/whatsapp";
import type { MemberProfile } from "../types";

export type MemberRowActions = {
  onView: (member: MemberProfile) => void;
  onEdit: (member: MemberProfile) => void;
};

const TARGET_SX = { minWidth: 44, minHeight: 44 } as const;

/** Colunas da tabela do desktop; os cabeçalhos ordenáveis mudam o `sort` no servidor. */
export const buildMemberColumns = (
  { onView, onEdit }: MemberRowActions,
  loggedUserName: string | undefined,
): AdminTableColumn<MemberProfile>[] => [
  {
    key: "member",
    header: "Membro",
    sortKey: "name",
    render: (member) => (
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={600} title={member.user?.name}>
          {member.user?.name || "—"}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div" title={member.user?.email}>
          {member.user?.email || "—"}
        </Typography>
      </Box>
    ),
  },
  {
    key: "shelter",
    header: "Abrigo",
    render: (member) =>
      member.shelter?.name ? (
        <Chip size="small" label={member.shelter.name} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Sem abrigo
        </Typography>
      ),
  },
  {
    key: "team",
    header: "Equipe",
    render: (member) =>
      member.shelter?.team?.numberTeam !== undefined ? (
        <Chip size="small" color="info" variant="outlined" label={`Equipe ${member.shelter.team.numberTeam}`} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
      ),
  },
  { key: "createdAt", header: "Criado em", sortKey: "createdAt", render: (member) => fmtDate(member.createdAt) },
  { key: "updatedAt", header: "Atualizado em", sortKey: "updatedAt", render: (member) => fmtDate(member.updatedAt) },
  {
    key: "actions",
    header: "Ações",
    render: (member) => {
      const whatsapp = buildWhatsappLink(member.user?.name, loggedUserName, member.user?.phone);
      return (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Detalhes">
            <IconButton
              data-testid={`view-member-button-${member.id}`}
              onClick={() => onView(member)}
              aria-label={`Ver detalhes de ${member.user?.name}`}
              sx={TARGET_SX}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          {whatsapp && (
            <Tooltip title="WhatsApp">
              <IconButton
                data-testid={`whatsapp-member-button-${member.id}`}
                component="a"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir WhatsApp de ${member.user?.name}`}
                sx={{ ...TARGET_SX, color: "success.main" }}
              >
                <WhatsApp />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={member.shelter?.id ? "Gerenciar equipes do abrigo" : "Gerenciar equipes"}>
            <IconButton
              data-testid={`edit-member-button-${member.id}`}
              onClick={() => onEdit(member)}
              aria-label={`Gerenciar equipes de ${member.user?.name}`}
              color="primary"
              sx={TARGET_SX}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
  },
];
