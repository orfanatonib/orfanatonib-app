import React, { useMemo } from "react";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Delete, Edit, Visibility } from "@mui/icons-material";
import { formatDate, gLabel } from "@/utils/dateUtils";
import {
  MIN_TOUCH_TARGET_PX,
  SHELTERED_MESSAGES,
  SHELTERED_PAGE_SIZE_DEFAULT,
  SHELTERED_PAGE_SIZE_OPTIONS,
  SHELTERED_TESTID,
} from "../constants";
import { ShelteredOrderBy, SortOrder } from "../enums";
import { toTestIdSuffix } from "../utils";
import type { ShelteredResponseDto, ShelteredSort } from "../types";
import ShelteredCards from "./ShelteredCards";

export type ShelteredListProps = {
  rows: ShelteredResponseDto[];
  total: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (page: number) => void;
  setPageSize: (size: number) => void;
  sorting: ShelteredSort | null;
  setSorting: (sorting: ShelteredSort) => void;
  onOpenView: (row: ShelteredResponseDto) => void;
  onStartEdit: (row: ShelteredResponseDto) => void;
  onAskDelete: (row: ShelteredResponseDto) => void;
};

type Column = {
  id: ShelteredOrderBy | "gender" | "guardianName" | "guardianPhone" | "shelter" | "actions";
  header: string;
  width: number;
  sortable: boolean;
  render: (row: ShelteredResponseDto) => React.ReactNode;
};

/** Table on desktop, cards on phones — same props, same behaviour. */
export default function ShelteredTable(props: ShelteredListProps) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });

  return isXs ? <ShelteredCards {...props} /> : <ShelteredTableDesktop {...props} />;
}

function ShelteredTableDesktop({
  rows,
  total,
  pageIndex,
  pageSize,
  setPageIndex,
  setPageSize,
  sorting,
  setSorting,
  onOpenView,
  onStartEdit,
  onAskDelete,
}: ShelteredListProps) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  const columns = useMemo<Column[]>(
    () => [
      {
        id: ShelteredOrderBy.NAME,
        header: "Nome do Acolhido",
        width: 220,
        sortable: true,
        render: (row) => <Typography fontWeight={700}>{row.name}</Typography>,
      },
      {
        id: "gender",
        header: "Gênero",
        width: 110,
        sortable: false,
        render: (row) => <Typography>{gLabel(row.gender)}</Typography>,
      },
      {
        id: "guardianName",
        header: "Nome do Responsável",
        width: 220,
        sortable: false,
        render: (row) => <Typography noWrap>{row.guardianName ?? "—"}</Typography>,
      },
      {
        id: "guardianPhone",
        header: "Telefone do Responsável",
        width: 160,
        sortable: false,
        render: (row) => <Typography>{row.guardianPhone ?? "—"}</Typography>,
      },
      {
        id: "shelter",
        header: "Abrigo",
        width: 140,
        sortable: false,
        render: (row) =>
          row.shelter ? (
            <Typography noWrap>{row.shelter.name}</Typography>
          ) : (
            <Chip size="small" label={SHELTERED_MESSAGES.NO_SHELTER} />
          ),
      },
      {
        id: ShelteredOrderBy.BIRTH_DATE,
        header: "Nascimento",
        width: 140,
        sortable: true,
        render: (row) => <Typography>{formatDate(row.birthDate)}</Typography>,
      },
      {
        id: ShelteredOrderBy.JOINED_AT,
        header: "No abrigo desde",
        width: 160,
        sortable: true,
        render: (row) => <Typography>{formatDate(row.joinedAt)}</Typography>,
      },
      {
        id: ShelteredOrderBy.CREATED_AT,
        header: "Criado em",
        width: 180,
        sortable: true,
        render: (row) => <Typography>{formatDate(row.createdAt, true)}</Typography>,
      },
      {
        id: ShelteredOrderBy.UPDATED_AT,
        header: "Atualizado em",
        width: 180,
        sortable: true,
        render: (row) => <Typography>{formatDate(row.updatedAt, true)}</Typography>,
      },
      {
        id: "actions",
        header: "Ações",
        width: 150,
        sortable: false,
        render: (row) => {
          const suffix = toTestIdSuffix(row.id);
          return (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Detalhes">
                <IconButton
                  onClick={() => onOpenView(row)}
                  aria-label={`Ver detalhes de ${row.name}`}
                  data-testid={`sheltered-row-view-${suffix}`}
                  sx={{ minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton
                  onClick={() => onStartEdit(row)}
                  aria-label={`Editar ${row.name}`}
                  data-testid={`sheltered-row-edit-${suffix}`}
                  sx={{ minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX }}
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
                  sx={{ minWidth: MIN_TOUCH_TARGET_PX, minHeight: MIN_TOUCH_TARGET_PX }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [onAskDelete, onOpenView, onStartEdit],
  );

  const handleSort = (columnId: ShelteredOrderBy) => {
    const isActive = sorting?.id === columnId;
    setSorting({ id: columnId, desc: isActive ? !sorting.desc : false });
    setPageIndex(0);
  };

  const sortDirection = sorting?.desc ? SortOrder.DESC : SortOrder.ASC;

  return (
    <Paper
      data-testid={SHELTERED_TESTID.TABLE}
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size={isCompact ? "small" : "medium"} stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => {
                const isSorted = sorting?.id === column.id;
                return (
                  <TableCell
                    key={column.id}
                    sx={{
                      width: column.width,
                      bgcolor: "background.default",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "text.primary",
                      borderBottom: "2px solid",
                      borderColor: "divider",
                    }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={isSorted}
                        direction={
                          isSorted && sortDirection === SortOrder.DESC ? "desc" : "asc"
                        }
                        onClick={() => handleSort(column.id as ShelteredOrderBy)}
                        data-testid={`sheltered-sort-${column.id}`}
                        sx={{
                          "&.Mui-active": { color: "primary.main" },
                          "& .MuiTableSortLabel-icon": { color: "primary.main !important" },
                        }}
                      >
                        {column.header}
                      </TableSortLabel>
                    ) : (
                      column.header
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 6 }}
                  data-testid="sheltered-table-empty"
                >
                  <Typography variant="body2" color="text.secondary">
                    {SHELTERED_MESSAGES.EMPTY_TITLE}.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  data-testid={`sheltered-row-${toTestIdSuffix(row.id)}`}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    "&:last-child td": { borderBottom: 0 },
                    transition: "background-color 0.2s ease",
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Divider />
      <TablePagination
        component="div"
        count={total}
        page={pageIndex}
        onPageChange={(_event, page) => setPageIndex(page)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          setPageSize(Number.parseInt(event.target.value, 10) || SHELTERED_PAGE_SIZE_DEFAULT);
          setPageIndex(0);
        }}
        rowsPerPageOptions={[...SHELTERED_PAGE_SIZE_OPTIONS]}
        labelRowsPerPage="Linhas por página"
        data-testid="sheltered-table-pagination"
        sx={{ "& .MuiTablePagination-toolbar": { px: 2 } }}
      />
    </Paper>
  );
}
