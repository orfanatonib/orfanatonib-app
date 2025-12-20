import React, { memo, useMemo } from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, Divider, Typography, Chip, Box, TablePagination,
  useTheme, useMediaQuery, Tooltip, IconButton, Stack
} from "@mui/material";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Visibility, Edit as EditIcon, WhatsApp } from "@mui/icons-material";
import { TeacherProfile } from "../types";
import { fmtDate } from "@/utils/dates";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { buildWhatsappLink } from "@/utils/whatsapp";

/** Props da tabela */
type Props = {
  rows: TeacherProfile[];
  total: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (n: number) => void;
  setPageSize: (n: number) => void;
  sorting: SortingState;
  setSorting: (s: SortingState) => void;
  onView: (t: TeacherProfile) => void;
  onEdit: (t: TeacherProfile) => void;
};

type ActionsCellProps = {
  teacher: TeacherProfile;
  onView: (t: TeacherProfile) => void;
  onEdit: (t: TeacherProfile) => void;
};

const ActionsCell = memo(function ActionsCell({
  teacher,
  onView,
  onEdit,
}: ActionsCellProps) {
  const { user: loggedUser } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const wa = buildWhatsappLink(
    teacher.user?.name,
    loggedUser?.name,
    teacher.user?.phone
  );

  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      <Tooltip title="Detalhes">
        <IconButton
          size={isXs ? "small" : "medium"}
          onClick={() => onView(teacher)}
          aria-label="ver detalhes"
        >
          <Visibility fontSize="inherit" />
        </IconButton>
      </Tooltip>

      {wa && (
        <Tooltip title="WhatsApp">
          <IconButton
            size={isXs ? "small" : "medium"}
            component="a"
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "success.main" }}
            aria-label="abrir WhatsApp"
          >
            <WhatsApp fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={teacher.shelter?.id ? "Gerenciar Equipes do Abrigo" : "Gerenciar Equipes"}>
        <IconButton
          size={isXs ? "small" : "medium"}
          onClick={() => onEdit(teacher)}
          aria-label="gerenciar equipes"
          color="primary"
        >
          <EditIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

export default function TeacherTable({
  rows, total, pageIndex, pageSize, setPageIndex, setPageSize,
  sorting, setSorting, onView, onEdit,
}: Props) {

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const columns = useMemo<ColumnDef<TeacherProfile>[]>(() => [
    {
      id: "teacher",
      header: "Professor",
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 190 }}>
            <Typography fontWeight={600} noWrap>{u?.name || "—"}</Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              title={u?.email}
            >
              {u?.email || "—"}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "shelter",
      header: "Abrigo",
      cell: ({ row }) => (
        <Chip size="small" label={row.original.shelter?.name ?? "—"} />
      ),
      meta: { width: 150 },
    },
    {
      id: "team",
      header: "Equipe",
      cell: ({ row }) => {
        const teamNumber = row.original.shelter?.team?.numberTeam;
        return teamNumber !== undefined ? (
          <Chip size="small" label={`Equipe ${teamNumber}`} color="info" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.secondary">—</Typography>
        );
      },
      meta: { width: 100 },
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
      ] as ColumnDef<TeacherProfile>[])
      : []),
    {
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => (
        <ActionsCell
          teacher={row.original}
          onView={onView}
          onEdit={onEdit}
        />
      ),
      meta: { width: isXs ? 180 : 240 },
    },
  ], [isMdUp, isXs, onView, onEdit]);

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
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => {
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
                          direction={
                            sorted === "asc" ? "asc" :
                              sorted === "desc" ? "desc" : "asc"
                          }
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
                  <Typography variant="body2" color="text.secondary">
                    Nenhum professor (com profile) encontrado nesta página.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
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
        rowsPerPageOptions={isXs ? [6, 12, 24] : [12, 24, 50]}
        labelRowsPerPage={isXs ? "Linhas" : "Linhas por página"}
        sx={{
          "& .MuiTablePagination-toolbar": {
            px: 2,
          },
        }}
      />
    </Paper>
  );
}
