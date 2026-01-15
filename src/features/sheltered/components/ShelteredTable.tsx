import React, { useMemo } from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Divider, Typography, Box, Chip, useTheme, useMediaQuery, TablePagination
} from "@mui/material";
import {
  ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel,
  SortingState, useReactTable
} from "@tanstack/react-table";
import { Visibility, Edit, Delete } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { ShelteredResponseDto } from "../types";
import ShelteredCards from "./ShelteredCards";

type Props = {
  rows: ShelteredResponseDto[];
  total: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (n: number) => void;
  setPageSize: (n: number) => void;
  sorting: SortingState;
  setSorting: (s: SortingState) => void;
  onOpenView: (row: ShelteredResponseDto) => void;
  onStartEdit: (row: ShelteredResponseDto) => void;
  onAskDelete: (row: ShelteredResponseDto) => void;
};

import { formatDate, gLabel } from "@/utils/dateUtils";

export default function ShelteredTable(props: Props) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });

  return isXs ? <ShelteredCards {...props} /> : <ShelteredTableDesktop {...props} />;
}

function ShelteredTableDesktop(props: Props) {
  const {
    rows, total, pageIndex, pageSize, setPageIndex, setPageSize,
    sorting, setSorting, onOpenView, onStartEdit, onAskDelete,
  } = props;
  
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const columns = useMemo<ColumnDef<ShelteredResponseDto>[]>(() => ([
    {
      accessorKey: "name",
      header: "Nome do Acolhido",
      cell: ({ getValue }) => <Typography fontWeight={700}>{String(getValue())}</Typography>,
      meta: { width: 220 },
    },
    {
      accessorKey: "gender",
      header: "Gênero",
      cell: ({ getValue }) => <Typography>{gLabel(getValue() as any)}</Typography>,
      meta: { width: 110 },
    },
    {
      accessorKey: "guardianName",
      header: "Nome do Responsável",
      cell: ({ getValue }) => <Typography noWrap>{String(getValue() ?? "—")}</Typography>,
      meta: { width: 220 },
    },
    {
      id: "guardianPhone",
      header: "Telefone do Responsável",
      cell: ({ row }) => row.original.guardianPhone ?? "—",
      meta: { width: 140 },
    },
    {
      id: "shelterNumber",
      header: "Abrigo",
      cell: ({ row }) => row.original.shelter?.name ?? <Chip size="small" label="—" />,
      meta: { width: 100 },
    },
    {
      accessorKey: "birthDate",
      header: "Nascimento",
      cell: ({ getValue }) => formatDate(getValue() as any),
      meta: { width: 140 },
    },
    {
      accessorKey: "joinedAt",
      header: "No abrigo desde",
      cell: ({ getValue }) => formatDate(getValue() as any),
      meta: { width: 160 },
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ getValue }) => formatDate(getValue() as any, true),
      meta: { width: 180 },
    },
    {
      accessorKey: "updatedAt",
      header: "Atualizado em",
      cell: ({ getValue }) => formatDate(getValue() as any, true),
      meta: { width: 180 },
    },
    {
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Detalhes"><IconButton onClick={() => onOpenView(row.original)}><Visibility /></IconButton></Tooltip>
          <Tooltip title="Editar"><IconButton onClick={() => onStartEdit(row.original)}><Edit /></IconButton></Tooltip>
          <Tooltip title="Excluir"><IconButton color="error" onClick={() => onAskDelete(row.original)}><Delete /></IconButton></Tooltip>
        </Box>
      ),
      meta: { width: 150 },
    },
  ]), [onAskDelete, onOpenView, onStartEdit]);

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
    getRowId: (r) => r.id,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });

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
        <Table size={isXs ? "small" : "medium"} stickyHeader>
          <TableHead>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => {
                  const sorted = h.column.getIsSorted();
                  const width = (h.column.columnDef.meta as any)?.width;
                  const isActions = h.column.id === "actions";
                  return (
                    <TableCell
                      key={h.id}
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
                          onClick={h.column.getToggleSortingHandler()}
                          sx={{
                            "&.Mui-active": {
                              color: "primary.main",
                            },
                            "& .MuiTableSortLabel-icon": {
                              color: "primary.main !important",
                            },
                          }}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </TableSortLabel>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">Nenhum acolhido encontrado.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(r => (
                <TableRow
                  key={r.id}
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
                  {r.getVisibleCells().map(c => (
                    <TableCell
                      key={c.id}
                      sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {flexRender(c.column.columnDef.cell, c.getContext())}
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
        onPageChange={(_, p) => props.setPageIndex(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => { props.setPageSize(parseInt(e.target.value, 10)); props.setPageIndex(0); }}
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
