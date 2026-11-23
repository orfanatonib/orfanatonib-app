import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Delete, Edit, Visibility } from "@mui/icons-material";
import type { AdminTableColumn } from "@/components/common/admin-shell";
import { fmtDate } from "@/utils/dateUtils";
import ChipsListWithExpand from "../components/ChipsListWithExpand";
import type { ShelterResponseDto } from "../types";
import { SHELTERS_SORT_KEY } from "./constants";

type Handlers = {
  isAdmin: boolean;
  addressEnabled: boolean;
  onView: (shelter: ShelterResponseDto) => void;
  onEdit: (shelter: ShelterResponseDto) => void;
  onDelete: (shelter: ShelterResponseDto) => void;
};

/** Colunas da tabela do desktop; a ordenação do cabeçalho vai para o servidor (`sort`/`order`). */
export function buildShelterColumns({
  isAdmin,
  addressEnabled,
  onView,
  onEdit,
  onDelete,
}: Handlers): AdminTableColumn<ShelterResponseDto>[] {
  const columns: AdminTableColumn<ShelterResponseDto>[] = [
    {
      key: "name",
      header: "Nome",
      sortKey: SHELTERS_SORT_KEY.NAME,
      render: (shelter) => <Typography fontWeight={700}>{shelter.name}</Typography>,
    },
  ];

  if (addressEnabled) {
    columns.push(
      {
        key: "city",
        header: "Cidade",
        sortKey: SHELTERS_SORT_KEY.CITY,
        render: (shelter) => <>{shelter.address?.city || "—"}</>,
      },
      {
        key: "state",
        header: "UF",
        sortKey: SHELTERS_SORT_KEY.STATE,
        render: (shelter) => <>{shelter.address?.state || "—"}</>,
      },
    );
  }

  columns.push(
    {
      key: "leaders",
      header: "Líderes",
      render: (shelter) => (
        <ChipsListWithExpand
          items={(shelter.leaders ?? []).map((leader) => ({
            id: leader.id,
            label: leader?.user?.name || leader?.user?.email || "—",
            color: "primary" as const,
            variant: "outlined" as const,
          }))}
          maxVisible={3}
          emptyMessage="—"
        />
      ),
    },
    {
      key: "members",
      header: "Membros",
      render: (shelter) => (
        <ChipsListWithExpand
          items={(shelter.members ?? []).map((member) => ({
            id: member.id,
            label: member.user?.name || member.user?.email || member.id,
            color: "secondary" as const,
            variant: "outlined" as const,
          }))}
          maxVisible={3}
          emptyMessage="Nenhum"
        />
      ),
    },
    {
      key: "createdAt",
      header: "Criado em",
      sortKey: SHELTERS_SORT_KEY.CREATED_AT,
      render: (shelter) => <>{fmtDate(shelter.createdAt)}</>,
    },
    {
      key: "updatedAt",
      header: "Atualizado em",
      sortKey: SHELTERS_SORT_KEY.UPDATED_AT,
      render: (shelter) => <>{fmtDate(shelter.updatedAt)}</>,
    },
    {
      key: "actions",
      header: "Ações",
      width: "150px",
      render: (shelter) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Detalhes">
            <IconButton
              data-testid={`view-shelter-button-${shelter.id}`}
              aria-label={`Detalhes de ${shelter.name}`}
              onClick={() => onView(shelter)}
            >
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              data-testid={`edit-shelter-button-${shelter.id}`}
              aria-label={`Editar ${shelter.name}`}
              onClick={() => onEdit(shelter)}
            >
              <Edit fontSize="inherit" />
            </IconButton>
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Excluir">
              <IconButton
                data-testid={`delete-shelter-button-${shelter.id}`}
                aria-label={`Excluir ${shelter.name}`}
                color="error"
                onClick={() => onDelete(shelter)}
              >
                <Delete fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  );

  return columns;
}
