import { Chip, Stack, Typography } from "@mui/material";
import { Edit, Group as GroupIcon, LocationOnOutlined, Visibility } from "@mui/icons-material";
import { AdminEntityCard } from "@/components/common/admin-shell";
import { fmtDate } from "@/utils/dateUtils";
import ChipsListWithExpand from "../components/ChipsListWithExpand";
import type { ShelterResponseDto } from "../types";
import { SHELTERS_TESTID } from "./constants";

type Props = {
  shelter: ShelterResponseDto;
  isAdmin: boolean;
  addressEnabled: boolean;
  onView: (shelter: ShelterResponseDto) => void;
  onEdit: (shelter: ShelterResponseDto) => void;
  onDelete: (shelter: ShelterResponseDto) => void;
};

/** Cartão do mobile: só dados do abrigo (endereço, líderes, membros, datas) e suas ações. */
export default function ShelterCard({ shelter, isAdmin, addressEnabled, onView, onEdit, onDelete }: Props) {
  const p = SHELTERS_TESTID;
  const id = shelter.id;
  const leaders = shelter.leaders ?? [];
  const members = shelter.members ?? [];
  const place =
    addressEnabled && shelter.address ? `${shelter.address.city} / ${shelter.address.state}` : undefined;

  return (
    <AdminEntityCard
      testId={`${p}-card-${id}`}
      title={shelter.name}
      titleTestId={`${p}-card-title-${id}`}
      subtitle={place}
      onDelete={isAdmin ? () => onDelete(shelter) : undefined}
      deleteTestId={`${p}-card-delete-${id}`}
      deleteLabel="Excluir"
      meta={
        <Stack spacing={1}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            {place && <Chip size="small" variant="outlined" icon={<LocationOnOutlined />} label={place} />}
            <Chip size="small" color="info" icon={<GroupIcon />} label={`${members.length} membros`} />
          </Stack>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Líderes ({leaders.length})
          </Typography>
          <ChipsListWithExpand
            items={leaders.map((leader) => ({
              id: leader.id,
              label: leader?.user?.name || leader?.user?.email || "—",
              color: "primary" as const,
              variant: "outlined" as const,
            }))}
            maxVisible={2}
            emptyMessage="—"
          />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Membros ({members.length})
          </Typography>
          <ChipsListWithExpand
            items={members.map((member) => ({
              id: member.id,
              label: member.user?.name || member.user?.email || member.id,
              color: "secondary" as const,
              variant: "outlined" as const,
            }))}
            maxVisible={2}
            emptyMessage="Nenhum membro vinculado."
          />
          <Typography variant="caption" color="text.secondary" data-testid={`${p}-card-dates-${id}`}>
            Criado: {fmtDate(shelter.createdAt)} · Atualizado: {fmtDate(shelter.updatedAt)}
          </Typography>
        </Stack>
      }
      actions={[
        {
          key: "view",
          label: "Detalhes",
          variant: "outlined",
          icon: <Visibility />,
          testId: `${p}-card-view-${id}`,
          ariaLabel: `Detalhes de ${shelter.name}`,
          onClick: () => onView(shelter),
        },
        {
          key: "edit",
          label: "Editar",
          icon: <Edit />,
          testId: `${p}-card-edit-${id}`,
          ariaLabel: `Editar ${shelter.name}`,
          onClick: () => onEdit(shelter),
        },
      ]}
    />
  );
}
