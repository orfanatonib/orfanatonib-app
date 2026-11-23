import { Chip } from "@mui/material";
import { Delete, Edit, Visibility } from "@mui/icons-material";
import { PersonCard } from "@/components/common/admin-people";
import type { PersonCardAction } from "@/components/common/admin-people";
import { buildWhatsappLink } from "@/utils/whatsapp";
import { fmtDate } from "@/utils/dateUtils";
import type { UserRow } from "../types";
import { USERS_CARD_TEST_ID_PREFIX, USERS_LABELS } from "../constants";
import { roleAvatarColor, roleChipColor, roleLabel, yesNo } from "../cards/utils";

interface Props {
  user: UserRow;
  loggedName?: string;
  onView: (u: UserRow) => void;
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}

/** Mobile: cartão do usuário com todas as ações à vista (alvos de 44px). */
export default function UserCard({ user: u, loggedName, onView, onEdit, onDelete }: Props) {
  const actions: PersonCardAction[] = [
    { key: "view", label: USERS_LABELS.VIEW, ariaLabel: `Ver usuário ${u.name}`, icon: <Visibility />, onClick: () => onView(u) },
    { key: "edit", label: USERS_LABELS.EDIT, ariaLabel: `Editar usuário ${u.name}`, icon: <Edit />, onClick: () => onEdit(u) },
    { key: "delete", label: USERS_LABELS.DELETE, ariaLabel: `Excluir usuário ${u.name}`, icon: <Delete />, onClick: () => onDelete(u), color: "error" },
  ];
  return (
    <PersonCard
      testIdPrefix={USERS_CARD_TEST_ID_PREFIX}
      id={u.id}
      name={u.name}
      email={u.email}
      phone={u.phone}
      avatarColor={roleAvatarColor(u.role)}
      badges={
        <>
          <Chip size="small" color={roleChipColor(u.role)} label={roleLabel(u.role)} data-testid={`${USERS_CARD_TEST_ID_PREFIX}-role-${u.id}`} />
          <Chip size="small" color={u.active ? "success" : "default"} label={`Ativo: ${yesNo(u.active)}`} data-testid={`${USERS_CARD_TEST_ID_PREFIX}-active-${u.id}`} />
          <Chip size="small" color={u.completed ? "success" : "default"} label={`Completo: ${yesNo(u.completed)}`} data-testid={`${USERS_CARD_TEST_ID_PREFIX}-completed-${u.id}`} />
        </>
      }
      footnote={`Criado em ${fmtDate(u.createdAt)} · Atualizado em ${fmtDate(u.updatedAt)}`}
      whatsappHref={buildWhatsappLink(u.name, loggedName, u.phone)}
      actions={actions}
    />
  );
}
