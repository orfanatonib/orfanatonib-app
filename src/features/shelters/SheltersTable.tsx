import React, { useMemo } from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Divider, Typography, Chip, Box, useTheme, useMediaQuery, TablePagination
} from "@mui/material";
import {
  ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel,
  SortingState, useReactTable
} from "@tanstack/react-table";
import { Visibility, Edit, Delete } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { ShelterResponseDto, WEEKDAYS } from "./types";
import { fmtDate } from "@/utils/dates";
import SheltersCards from "./SheltersCards";
import ChipsListWithExpand from "./components/ChipsListWithExpand";

type Props = {
  isAdmin: boolean;
  rows: ShelterResponseDto[];
  total: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (n: number) => void;
  setPageSize: (n: number) => void;
  sorting: SortingState;
  setSorting: (s: SortingState) => void;
  onOpenView: (shelter: ShelterResponseDto) => void;
  onStartEdit: (shelter: ShelterResponseDto) => void;
  onAskDelete: (shelter: ShelterResponseDto) => void;
};

export default function SheltersTable(props: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
  return isXs ? <SheltersCards {...props} /> : <SheltersTableDesktop {...props} />;
}

function SheltersTableDesktop(props: Props) {
  const {
    isAdmin,
    rows, total, pageIndex, pageSize, setPageIndex, setPageSize,
    sorting, setSorting, onOpenView, onStartEdit, onAskDelete,
  } = props;

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const columns = useMemo<ColumnDef<ShelterResponseDto>[]>(() => {
    const base: ColumnDef<ShelterResponseDto>[] = [
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ getValue }) => <Typography fontWeight={700}>{String(getValue())}</Typography>,
        meta: { width: 200 },
      },
      {
        id: "leaders",
        header: "Líderes",
        cell: ({ row }) => {
          const leaders = row.original.leaders ?? [];
          return (
            <ChipsListWithExpand
              items={leaders.map((leader) => ({
                id: leader.id,
                label: leader?.user?.name || leader?.user?.email || "—",
                color: "primary" as const,
                variant: "outlined" as const,
              }))}
              maxVisible={3}
              emptyMessage="—"
            />
          );
        },
        meta: { width: 240 },
      },
      {
        id: "teachers",
        header: "Membros",
        cell: ({ row }) => {
          const list = row.original.teachers ?? [];
          return (
            <ChipsListWithExpand
              items={list.map((t) => ({
                id: t.id,
                label: t.user?.name || t.user?.email || t.id,
                color: "secondary" as const,
                variant: "outlined" as const,
              }))}
              maxVisible={3}
              emptyMessage="Nenhum"
            />
          );
        },
      },
      ...(isMdUp
        ? ([
            {
              accessorKey: "createdAt",
              header: "Criado em",
              cell: ({ getValue }) => <>{fmtDate(getValue() as string)}</>,
              meta: { width: 170 },
            },
            {
              accessorKey: "updatedAt",
              header: "Atualizado em",
              cell: ({ getValue }) => <>{fmtDate(getValue() as string)}</>,
              meta: { width: 170 },
            },
          ] as ColumnDef<ShelterResponseDto>[])
        : []),
      {
        id: "actions",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Detalhes">
              <IconButton size={isXs ? "small" : "medium"} onClick={() => onOpenView(row.original)}>
                <Visibility fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton size={isXs ? "small" : "medium"} onClick={() => onStartEdit(row.original)}>
                <Edit fontSize="inherit" />
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <Tooltip title="Excluir">
                <IconButton size={isXs ? "small" : "medium"} color="error" onClick={() => onAskDelete(row.original)}>
                  <Delete fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
        meta: { width: isXs ? 120 : 150 },
      },
    ];
    return base;
  }, [isXs, isMdUp, onAskDelete, onOpenView, onStartEdit]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    onSortingChange: (u) => {
      const next = typeof u === "function" ? u(sorting) : u;
      setSorting(next);
      setPageIndex(0);
    },
    onPaginationChange: (u) => {
      const next = typeof u === "function" ? u({ pageIndex, pageSize }) : u;
      setPageIndex(next.pageIndex ?? 0);
      setPageSize(next.pageSize ?? 12);
    },
    getRowId: (row) => row.id,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <TableContainer>
        <Table size="medium" stickyHeader>
          <TableHead>
            {headerGroups.map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const width = (header.column.columnDef.meta as any)?.width;
                  const isActions = header.column.id === "actions";
                  return (
                    <TableCell
                      key={header.id}
                      sx={{
                        width,
                        bgcolor: "background.default",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "text.primary",
                        borderBottom: "2px solid",
                        borderColor: "divider",
                      }}
                    >
                      {!isActions ? (
                        <TableSortLabel
                          active={!!sorted}
                          direction={sorted === "asc" ? "asc" : sorted === "desc" ? "desc" : "asc"}
                          onClick={header.column.getToggleSortingHandler()}
                          sx={{
                            "&.Mui-active": {
                              color: "primary.main",
                            },
                            "& .MuiTableSortLabel-icon": {
                              color: "primary.main !important",
                            },
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableSortLabel>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {rowModel.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum abrigo encontrado.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rowModel.rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                    "&:last-child td": {
                      borderBottom: 0,
                    },
                    transition: "background-color 0.2s ease",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
        onPageChange={(_, p) => setPageIndex(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10));
          setPageIndex(0);
        }}
        rowsPerPageOptions={[12, 24, 50]}
        labelRowsPerPage="Linhas por página"
        sx={{
          "& .MuiTablePagination-toolbar": {
            px: 2,
          },
        }}
      />
    </Paper>
  );
}
