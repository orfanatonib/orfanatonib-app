import { Box, Chip, Stack, Typography } from "@mui/material";
import { Edit as EditIcon, Visibility } from "@mui/icons-material";
import { PersonCard } from "@/components/common/admin-people";
import type { PersonCardAction } from "@/components/common/admin-people";
import { buildWhatsappLink } from "@/utils/whatsapp";
import { fmtDate } from "@/utils/dateUtils";
import type { LeaderProfile } from "../types";
import { LEADERS_CARD_TEST_ID_PREFIX, LEADERS_LABELS } from "../constants";
import { collectMembers, countTeams } from "../utils";

interface Props {
  leader: LeaderProfile;
  loggedName?: string;
  onView: (leader: LeaderProfile) => void;
  onEdit: (leader: LeaderProfile) => void;
}

/** Mobile: cartão do líder com abrigos/equipes/membros resumidos e as ações à vista. */
export default function LeaderCard({ leader, loggedName, onView, onEdit }: Props) {
  const shelters = leader.shelters ?? [];
  const teams = countTeams(shelters);
  const members = collectMembers(shelters).length;
  const name = leader.user?.name ?? "";
  const actions: PersonCardAction[] = [
    { key: "view", label: LEADERS_LABELS.VIEW, ariaLabel: `Ver líder ${name}`, icon: <Visibility />, onClick: () => onView(leader) },
    { key: "edit", label: LEADERS_LABELS.EDIT, ariaLabel: `Gerenciar abrigos de ${name}`, icon: <EditIcon />, onClick: () => onEdit(leader) },
  ];
  return (
    <PersonCard
      testIdPrefix={LEADERS_CARD_TEST_ID_PREFIX}
      id={leader.id}
      name={name}
      email={leader.user?.email}
      phone={leader.user?.phone}
      avatarColor={leader.active ? "primary.main" : "grey.500"}
      badges={
        <>
          <Chip size="small" color={leader.active ? "success" : "default"} label={leader.active ? "Ativo" : "Inativo"} />
          <Chip size="small" variant="outlined" label={`${teams} ${teams === 1 ? "equipe" : "equipes"}`} data-testid={`${LEADERS_CARD_TEST_ID_PREFIX}-teams-${leader.id}`} />
          <Chip size="small" variant="outlined" label={`${members} ${members === 1 ? "membro" : "membros"}`} data-testid={`${LEADERS_CARD_TEST_ID_PREFIX}-members-${leader.id}`} />
        </>
      }
      footnote={`Criado em ${fmtDate(leader.createdAt)} · Atualizado em ${fmtDate(leader.updatedAt)}`}
      whatsappHref={buildWhatsappLink(name, loggedName, leader.user?.phone)}
      actions={actions}
    >
      <Box data-testid={`${LEADERS_CARD_TEST_ID_PREFIX}-shelters-${leader.id}`}>
        <Typography variant="caption" color="text.secondary">Abrigos</Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5} sx={{ mt: 0.25 }}>
          {shelters.length === 0 ? (
            <Chip size="small" label={LEADERS_LABELS.NO_SHELTER} />
          ) : (
            shelters.map((shelter) => <Chip key={shelter.id} size="small" color="info" variant="outlined" label={shelter.name} />)
          )}
        </Stack>
      </Box>
    </PersonCard>
  );
}
