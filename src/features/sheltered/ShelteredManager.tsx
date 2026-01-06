import React, { useCallback, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import ShelteredToolbar from "./components/ShelteredToolbar";
import ShelteredTable from "./components/ShelteredTable";
import ShelteredViewDialog from "./components/ShelteredViewDialog";
import ShelteredFormDialog from "./components/ShelteredFormDialog";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";
import { useShelteredDetails, useShelteredMutations, useSheltered } from "./hooks";
import {
  ShelteredFilters,
  ShelteredResponseDto,
  ShelteredSort,
  CreateShelteredForm,
  EditShelteredForm,
} from "./types";
import BackHeader from "@/components/common/header/BackHeader";

export default function ShelteredManager() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [filters, setFilters] = useState<ShelteredFilters>({
    shelteredSearchingString: "",
    shelterSearchingString: "",
    addressFilter: "",
    gender: undefined,
    birthDateFrom: "",
    birthDateTo: "",
    joinedFrom: "",
    joinedTo: "",
  });

  const [pageSize, setPageSize] = useState<number>(12);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [sorting, setSorting] = useState<ShelteredSort>({
    id: "updatedAt",
    desc: true,
  });

  const { rows, total, loading, error, setError, fetchPage } = useSheltered(
    pageIndex,
    pageSize,
    sorting,
    filters
  );
  const doRefresh = useCallback(() => {
    fetchPage();
  }, [fetchPage]);

  const {
    viewing,
    setViewing,
    loading: viewingLoading,
    fetchSheltered,
  } = useShelteredDetails();
  const handleOpenView = (row: ShelteredResponseDto) => {
    setViewing(row);
    fetchSheltered(row.id);
  };

  const {
    dialogLoading,
    dialogError,
    setDialogError,
    createSheltered,
    updateSheltered,
    deleteSheltered,
  } = useShelteredMutations(async () => {
    await fetchPage();
  });

  const [creating, setCreating] = useState<CreateShelteredForm | null>(null);
  const openCreate = () =>
    setCreating({
      name: "",
      gender: "M",
      guardianName: "",
      guardianPhone: "",
      birthDate: "",
      joinedAt: null,
      shelterId: null,
      address: {
        street: "",
        district: "",
        city: "",
        state: "",
        postalCode: "",
      } as any,
    });
  const submitCreate = async () => {
    if (!creating) return;
    const payload = { ...creating };
    if (!payload.joinedAt) payload.joinedAt = null;
    if (!payload.shelterId) payload.shelterId = null as any;
    const success = await createSheltered(payload, pageIndex + 1, pageSize, filters, sorting);
    // Só fecha o modal se a operação foi bem-sucedida
    if (success) {
      setCreating(null);
    }
  };

  const [editing, setEditing] = useState<EditShelteredForm | null>(null);
  const startEdit = (c: ShelteredResponseDto) => {
    const isoToBr = (raw?: string | null) => {
      if (!raw) return raw ?? "";
      const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? `${m[3]}/${m[2]}/${m[1]}` : String(raw);
    };
    setEditing({
      id: c.id,
      name: c.name,
      gender: c.gender,
      guardianName: c.guardianName,
      guardianPhone: c.guardianPhone,
      birthDate: isoToBr(c.birthDate),
      joinedAt: (isoToBr(c.joinedAt) as any) || null,
      shelterId: c.shelter?.id ?? null,
      address: c.address ? ({ ...c.address } as any) : undefined,
    });
  };
  const submitEdit = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    const success = await updateSheltered(id, rest, pageIndex + 1, pageSize, filters, sorting);
    // Só fecha o modal se a operação foi bem-sucedida
    if (success) {
      setEditing(null);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<ShelteredResponseDto | null>(
    null
  );
  const askDelete = (row: ShelteredResponseDto) => setConfirmDelete(row);
  const submitDelete = async () => {
    if (!confirmDelete) return;
    await deleteSheltered(
      confirmDelete.id,
      pageIndex + 1,
      pageSize,
      filters,
      sorting
    );
    setConfirmDelete(null);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pb: 4,
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BackHeader title="Gerenciar Abrigados" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ShelteredToolbar
            filters={filters}
            onChange={(updater) => {
              setFilters(updater);
              setPageIndex(0);
            }}
            onCreateClick={openCreate}
            onRefreshClick={doRefresh}
            isXs={isXs}
          />
        </motion.div>

        {loading && !rows.length && (
          <Box
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
              Carregando abrigados...
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {!loading && !error && rows.length === 0 && (
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.paper",
            }}
          >
            <SearchIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum abrigado encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tente ajustar os filtros de busca ou criar um novo abrigado.
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
        sorting={sorting ? ([sorting] as any) : []}
        setSorting={(s) => setSorting(Array.isArray(s) ? s[0] ?? null : (s as any))}
        onOpenView={handleOpenView}
        onStartEdit={startEdit}
        onAskDelete={askDelete}
            />
          </motion.div>
        )}

      <ShelteredViewDialog
        open={!!viewing}
        loading={viewingLoading}
        sheltered={viewing}
        onClose={() => setViewing(null)}
      />

      <ShelteredFormDialog
        mode="create"
        open={!!creating}
        value={creating}
        onChange={(v) => setCreating(v as CreateShelteredForm)}
        onCancel={() => {
          setCreating(null);
          setDialogError("");
        }}
        onSubmit={submitCreate}
        error={dialogError}
        loading={dialogLoading}
      />

      <ShelteredFormDialog
        mode="edit"
        open={!!editing}
        value={editing}
        onChange={(v) => setEditing(v as EditShelteredForm)}
        onCancel={() => {
          setEditing(null);
          setDialogError("");
        }}
        onSubmit={submitEdit}
        error={dialogError}
        loading={dialogLoading}
      />

      <DeleteConfirmDialog
        open={!!confirmDelete}
        title={confirmDelete?.name || ""}
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
