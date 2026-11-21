import React, { useState } from "react";
import { Box, Divider, Grid, TablePagination } from "@mui/material";
import type { SortingState } from "@tanstack/react-table";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/slices";
import { buildWhatsappLink } from "@/utils/whatsapp";
import type { UserRow } from "../types";
import UserCard from "../cards/UserCard";
import UsersCardsSortBar from "../cards/UsersCardsSortBar";
import { CARDS_PAGE_SIZE_OPTIONS } from "../cards/constants";
import { resolveCardSort, toggleInSet } from "../cards/utils";

type Props = {
  rows: UserRow[];
  total: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (n: number) => void;
  setPageSize: (n: number) => void;
  sorting: SortingState;
  setSorting: (s: SortingState) => void;
  onView: (u: UserRow) => void;
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
};

export default function UsersCards(props: Props) {
  const { rows, total, pageIndex, pageSize, setPageIndex, setPageSize, sorting, setSorting, onView, onEdit, onDelete } = props;
  const [open, setOpen] = useState<Set<string>>(new Set());
  const { user } = useSelector((state: RootState) => state.auth);
  const sort = resolveCardSort(sorting);

  return (
    <Box data-testid="users-cards" sx={{ px: { xs: 0, sm: 1 }, py: 0 }}>
      <UsersCardsSortBar
        sort={sort}
        onField={(field) => setSorting([{ id: field, desc: sort.desc }])}
        onToggleDirection={() => setSorting([{ id: sort.field, desc: !sort.desc }])}
      />

      <Grid container spacing={{ xs: 1, sm: 1.25 }}>
        {rows.map((u) => (
          <Grid item xs={12} key={u.id} sx={{ mb: { xs: 0.75, sm: 1 }, pb: { xs: 1, sm: 1.25 } }}>
            <UserCard
              user={u}
              expanded={open.has(u.id)}
              whatsappLink={buildWhatsappLink(u.name, user?.name, u.phone)}
              onToggle={() => setOpen((prev) => toggleInSet(prev, u.id))}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mt: 1 }} />
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
        rowsPerPageOptions={CARDS_PAGE_SIZE_OPTIONS}
        labelRowsPerPage="Linhas"
        sx={{ px: 0 }}
      />
    </Box>
  );
}
