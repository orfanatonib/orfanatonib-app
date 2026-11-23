import React from "react";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { Delete, Edit, Visibility } from "@mui/icons-material";
import type { AdminTableColumn } from "@/components/common/admin-shell";
import { formatDate, gLabel } from "@/utils/dateUtils";
import { MIN_TOUCH_TARGET_PX, SHELTERED_MESSAGES } from "../constants";
import { ShelteredOrderBy } from "../enums";
import { toTestIdSuffix } from "../utils";
import type { ShelteredResponseDto } from "../types";

export type ShelteredRowActions = {
  onOpenView: (row: ShelteredResponseDto) => void;
  onStartEdit: (row: ShelteredResponseDto) => void;
  onAskDelete: (row: ShelteredResponseDto) => void;
};

const ICON_SX = { minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX } as const;

/** Colunas da tabela do desktop; os cabeçalhos ordenáveis mudam o `sort` no servidor. */
export const buildShelteredColumns = ({
  onOpenView,
  onStartEdit,
  onAskDelete,
}: ShelteredRowActions): AdminTableColumn<ShelteredResponseDto>[] => [
  {
    key: "name",
    header: "Acolhido",
    sortKey: ShelteredOrderBy.NAME,
    render: (row) => (
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={700} title={row.name}>
          {row.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {gLabel(row.gender)}
        </Typography>
      </Box>
    ),
  },
  {
    key: "guardian",
    header: "Responsável",
    render: (row) => (
      <Box sx={{ minWidth: 0 }}>
        <Typography title={row.guardianName ?? undefined}>{row.guardianName || "—"}</Typography>
        <Typography variant="caption" color="text.secondary">
          {row.guardianPhone || "—"}
        </Typography>
      </Box>
    ),
  },
  {
    key: "shelter",
    header: "Abrigo",
    render: (row) =>
      row.shelter ? (
        <Typography title={row.shelter.name}>{row.shelter.name}</Typography>
      ) : (
        <Chip size="small" label={SHELTERED_MESSAGES.NO_SHELTER} />
      ),
  },
  {
    key: "birthDate",
    header: "Nascimento",
    sortKey: ShelteredOrderBy.BIRTH_DATE,
    render: (row) => formatDate(row.birthDate),
  },
  {
    key: "joinedAt",
    header: "No abrigo desde",
    sortKey: ShelteredOrderBy.JOINED_AT,
    render: (row) => formatDate(row.joinedAt),
  },
  {
    key: "updatedAt",
    header: "Atualizado em",
    sortKey: ShelteredOrderBy.UPDATED_AT,
    render: (row) => formatDate(row.updatedAt, true),
  },
  {
    key: "actions",
    header: "Ações",
    render: (row) => {
      const suffix = toTestIdSuffix(row.id);
      return (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Detalhes">
            <IconButton
              onClick={() => onOpenView(row)}
              aria-label={`Ver detalhes de ${row.name}`}
              data-testid={`sheltered-row-view-${suffix}`}
              sx={ICON_SX}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              onClick={() => onStartEdit(row)}
              aria-label={`Editar ${row.name}`}
              data-testid={`sheltered-row-edit-${suffix}`}
              sx={ICON_SX}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
              color="error"
              onClick={() => onAskDelete(row)}
              aria-label={`Excluir ${row.name}`}
              data-testid={`sheltered-row-delete-${suffix}`}
              sx={ICON_SX}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
  },
];
