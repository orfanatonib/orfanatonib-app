import React from "react";
import { Avatar, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Edit as EditIcon, Groups, Visibility, WhatsApp } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { AdminEntityCard } from "@/components/common/admin-shell";
import AdminChipRow from "@/components/common/admin-shell/AdminChipRow";
import type { AdminChipRowItem } from "@/components/common/admin-shell/chipRow.types";
import type { RootState } from "@/store/slices";
import { fmtDate } from "@/utils/dateUtils";
import { initials } from "@/utils/textUtils";
import { buildWhatsappLink } from "@/utils/whatsapp";
import type { MemberProfile } from "../types";
import type { MemberRowActions } from "./memberColumns";

/**
 * Cartão do celular, no padrão `AdminEntityCard`: avatar + nome, e-mail como subtítulo, chips de
 * status/abrigo/equipe e ações (Ver, Equipe e WhatsApp).
 */
export default function MemberCard({ member, onView, onEdit }: MemberRowActions & { member: MemberProfile }) {
  const loggedUser = useSelector((state: RootState) => state.auth.user);
  const name = member.user?.name || member.user?.email || "—";
  const shelter = member.shelter;
  const leader = shelter?.leader?.user?.name;
  const whatsapp = buildWhatsappLink(member.user?.name, loggedUser?.name, member.user?.phone);

  const chips: AdminChipRowItem[] = [
    { key: "status", testId: `member-card-status-${member.id}`, label: member.active ? "Ativo" : "Inativo", color: member.active ? "success" : "default" },
    { key: "shelter", testId: `member-card-shelter-${member.id}`, label: shelter?.name ?? "Sem abrigo", color: shelter ? "primary" : "default" },
  ];
  if (shelter?.team) {
    chips.push({ key: "team", testId: `member-card-team-${member.id}`, label: `Equipe ${shelter.team.numberTeam}`, color: "info", icon: <Groups /> });
  }

  return (
    <AdminEntityCard
      testId={`member-card-${member.id}`}
      title={name}
      titleTestId={`member-card-title-${member.id}`}
      subtitle={member.user?.email || "—"}
      avatar={
        <Avatar aria-hidden sx={{ width: 44, height: 44, bgcolor: member.active ? "success.main" : "grey.500", fontWeight: 700 }}>
          {initials(member.user?.name)}
        </Avatar>
      }
      meta={
        <Stack spacing={1}>
          <AdminChipRow testId={`member-card-chips-${member.id}`} chips={chips} />
          {leader && (
            <Typography variant="body2" color="text.secondary">
              Líder: {leader}
            </Typography>
          )}
          {member.user?.phone && (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Telefone: {member.user.phone}
              </Typography>
              {whatsapp && (
                <Tooltip title="WhatsApp">
                  <IconButton
                    component="a"
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="success"
                    aria-label={`Abrir WhatsApp de ${name}`}
                    data-testid={`whatsapp-member-card-button-${member.id}`}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <WhatsApp />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
          <Typography variant="caption" color="text.secondary">
            Criado: {fmtDate(member.createdAt)} · Atualizado: {fmtDate(member.updatedAt)}
          </Typography>
        </Stack>
      }
      actions={[
        {
          key: "view",
          label: "Ver",
          variant: "outlined",
          icon: <Visibility />,
          onClick: () => onView(member),
          ariaLabel: `Ver detalhes de ${name}`,
          testId: `view-member-card-button-${member.id}`,
        },
        {
          key: "team",
          label: "Equipe",
          variant: "outlined",
          icon: <EditIcon />,
          onClick: () => onEdit(member),
          ariaLabel: `Gerenciar equipes de ${name}`,
          testId: `edit-member-card-button-${member.id}`,
        },
      ]}
    />
  );
}
