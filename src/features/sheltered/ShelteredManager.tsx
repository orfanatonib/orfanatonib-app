import React, { useCallback, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import BackHeader from "@/components/common/header/BackHeader";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";
import ShelteredToolbar from "./components/ShelteredToolbar";
import ShelteredTable from "./components/ShelteredTable";
import ShelteredViewDialog from "./components/ShelteredViewDialog";
import ShelteredFormDialog from "./components/ShelteredFormDialog";
import { useSheltered, useShelteredDetails, useShelteredMutations } from "./hooks";
import {
  SHELTERED_FILTERS_EMPTY,
  SHELTERED_MESSAGES,
  SHELTERED_PAGE_SIZE_DEFAULT,
  SHELTERED_SORT_DEFAULT,
  SHELTERED_TESTID,
} from "./constants";
import { ShelteredFormMode, ShelteredGender } from "./enums";
import type {
  CreateShelteredForm,
  EditShelteredForm,
  ShelteredFilters,
  ShelteredResponseDto,
  ShelteredSort,
} from "./types";

const emptyCreateForm = (): CreateShelteredForm => ({
  name: "",
  gender: ShelteredGender.MALE,
  guardianName: "",
  guardianPhone: "",
  birthDate: "",
  joinedAt: null,
  shelterId: null,
  address: { street: "", district: "", city: "", state: "", postalCode: "" },
});

const toEditForm = (sheltered: ShelteredResponseDto): EditShelteredForm => ({
  id: sheltered.id,
  name: sheltered.name,
  gender: sheltered.gender,
  guardianName: sheltered.guardianName ?? "",
  guardianPhone: sheltered.guardianPhone ?? "",
  // Mantém ISO: `isoToDayjs` só interpreta esse formato sem ambiguidade.
  // Uma data em DD/MM/AAAA seria lida como MM/DD/AAAA e trocaria dia por mês.
  birthDate: sheltered.birthDate,
  joinedAt: sheltered.joinedAt,
  shelterId: sheltered.shelter?.id ?? null,
  address: sheltered.address
    ? {
        street: sheltered.address.street,
        number: sheltered.address.number,
        district: sheltered.address.district,
        city: sheltered.address.city,
        state: sheltered.address.state,
        postalCode: sheltered.address.postalCode,
        complement: sheltered.address.complement,
      }
    : null,
});

export default function ShelteredManager() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [filters, setFilters] = useState<ShelteredFilters>({
    ...SHELTERED_FILTERS_EMPTY,
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<number>(SHELTERED_PAGE_SIZE_DEFAULT);
  const [sorting, setSorting] = useState<ShelteredSort>(SHELTERED_SORT_DEFAULT);

  const { rows, total, loading, error, setError, fetchPage } = useSheltered(
    pageIndex,
    pageSize,
    sorting,
    filters,
  );

  const refetch = useCallback(async () => {
    await fetchPage();
  }, [fetchPage]);

  const { viewing, setViewing, loading: viewingLoading, fetchSheltered } =
    useShelteredDetails();

  const {
    dialogLoading,
    dialogError,
    setDialogError,
    createSheltered,
    updateSheltered,
    deleteSheltered,
  } = useShelteredMutations(refetch);

  const [creating, setCreating] = useState<CreateShelteredForm | null>(null);
  const [editing, setEditing] = useState<EditShelteredForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ShelteredResponseDto | null>(null);

  const handleOpenView = (row: ShelteredResponseDto) => {
    setViewing(row);
    void fetchSheltered(row.id);
  };

  const handleStartEdit = (row: ShelteredResponseDto) => {
    setViewing(null);
    setDialogError("");
    setEditing(toEditForm(row));
  };

  const handleFiltersChange = (
    updater: (previous: ShelteredFilters) => ShelteredFilters,
  ) => {
    setFilters(updater);
    setPageIndex(0);
  };

  const handleSortingChange = (next: ShelteredSort) => {
    setSorting(next);
    setPageIndex(0);
  };

  const submitCreate = async () => {
    if (!creating) return;
    if (await createSheltered(creating)) setCreating(null);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const { id, ...payload } = editing;
    if (await updateSheltered(id, payload)) setEditing(null);
  };

  const submitDelete = async () => {
    if (!confirmDelete) return;
    if (await deleteSheltered(confirmDelete.id)) setConfirmDelete(null);
  };

  return (
    <Box
      data-testid={SHELTERED_TESTID.MANAGER}
      sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 4 }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BackHeader title="Gerenciar Acolhidos" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ShelteredToolbar
            filters={filters}
            onChange={handleFiltersChange}
            onCreateClick={() => {
              setDialogError("");
              setCreating(emptyCreateForm());
            }}
            onRefreshClick={() => void fetchPage()}
            isXs={isXs}
          />
        </motion.div>

        {loading && rows.length === 0 && (
          <Box
            data-testid={SHELTERED_TESTID.LOADING}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {SHELTERED_MESSAGES.LOADING}
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setError("")}
            data-testid={SHELTERED_TESTID.ERROR}
          >
            {error}
          </Alert>
        )}

        {!loading && !error && rows.length === 0 && (
          <Paper
            data-testid={SHELTERED_TESTID.EMPTY}
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.paper",
            }}
          >
            <SearchIcon
              aria-hidden
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {SHELTERED_MESSAGES.EMPTY_TITLE}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {SHELTERED_MESSAGES.EMPTY_HINT}
            </Typography>
          </Paper>
        )}

        {!loading && rows.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <ShelteredTable
              rows={rows}
              total={total}
              pageIndex={pageIndex}
              pageSize={pageSize}
              setPageIndex={setPageIndex}
              setPageSize={setPageSize}
              sorting={sorting}
              setSorting={handleSortingChange}
              onOpenView={handleOpenView}
              onStartEdit={handleStartEdit}
              onAskDelete={setConfirmDelete}
            />
          </motion.div>
        )}

        <ShelteredViewDialog
          open={Boolean(viewing)}
          loading={viewingLoading}
          sheltered={viewing}
          onClose={() => setViewing(null)}
          onEdit={handleStartEdit}
        />

        <ShelteredFormDialog
          mode={ShelteredFormMode.CREATE}
          open={Boolean(creating)}
          value={creating}
          onChange={(next) => setCreating(next as CreateShelteredForm)}
          onCancel={() => {
            setCreating(null);
            setDialogError("");
          }}
          onSubmit={() => void submitCreate()}
          error={dialogError}
          loading={dialogLoading}
        />

        <ShelteredFormDialog
          mode={ShelteredFormMode.EDIT}
          open={Boolean(editing)}
          value={editing}
          onChange={(next) => setEditing(next as EditShelteredForm)}
          onCancel={() => {
            setEditing(null);
            setDialogError("");
          }}
          onSubmit={() => void submitEdit()}
          error={dialogError}
          loading={dialogLoading}
        />

        <DeleteConfirmDialog
          open={Boolean(confirmDelete)}
          title={confirmDelete?.name ?? ""}
          loading={dialogLoading}
          testId={SHELTERED_TESTID.DELETE_DIALOG}
          onClose={() => {
            setConfirmDelete(null);
            setDialogError("");
          }}
          onConfirm={submitDelete}
        />
      </Container>
    </Box>
  );
}
