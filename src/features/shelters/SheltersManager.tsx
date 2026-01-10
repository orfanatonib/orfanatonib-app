import React, { useCallback, useState } from "react";
import { Alert, Box, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import SheltersToolbar from "./SheltersToolbar";
import SheltersTable from "./SheltersTable";
import ShelterViewDialog from "./ShelterViewDialog";
import { useShelterDetails, useShelterMutations, useShelters } from "./hooks";
import {
  ShelterResponseDto,
  ShelterFilters,
  ShelterSort,
} from "./types";
import { apiFetchShelters } from "./api";
import BackHeader from "@/components/common/header/BackHeader";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";
import { useSelector } from "react-redux";
import { selectIsAdmin, selectIsLeader } from "@/store/selectors/routeSelectors";
import ShelterDetailsPage from "./ShelterDetailsPage";

export default function SheltersManager() {
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const isLeader = useSelector(selectIsLeader);

  if (isLeader) {
    return <ShelterDetailsPage />;
  }
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [filters, setFilters] = useState<ShelterFilters>({
    searchString: undefined,
    nameSearchString: undefined,
    leaderId: undefined,
  });

  const [pageSize, setPageSize] = useState<number>(12);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [sorting, setSorting] = useState<ShelterSort>({ id: "updatedAt", desc: true });

  const { rows, total, loading, error, setError, fetchPage } =
    useShelters(pageIndex, pageSize, sorting, filters);

  const doRefresh = useCallback(() => {
    fetchPage();
  }, [fetchPage]);

  const { viewing, setViewing, loading: viewingLoading, fetchShelter } = useShelterDetails();
  const handleOpenView = (shelter: ShelterResponseDto) => {
    setViewing(shelter);
    fetchShelter(shelter.id);
  };

  const {
    deleteShelter,
  } = useShelterMutations(async () => {
    await fetchPage();
  });

  const handleCreate = () => {
    navigate("/adm/abrigos/novo");
  };

  const handleEdit = (shelter: ShelterResponseDto) => {
    navigate(`/adm/abrigos/${shelter.id}/edit`);
  };

  const [confirmDelete, setConfirmDelete] = useState<ShelterResponseDto | null>(null);
  const askDelete = (c: ShelterResponseDto) => setConfirmDelete(c);

  const submitDelete = async () => {
    if (!confirmDelete) return;
    await deleteShelter(confirmDelete.id);
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
          <BackHeader title="Gerenciar Abrigos" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <SheltersToolbar
            filters={filters}
            onChange={(updater) => {
              setFilters(updater);
              setPageIndex(0);
            }}
            onCreateClick={handleCreate}
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
              Carregando abrigos...
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
              Nenhum abrigo encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tente ajustar os filtros de busca ou criar um novo abrigo.
            </Typography>
          </Paper>
        )}

        {!loading && rows.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <SheltersTable
              isAdmin={isAdmin}
              rows={rows}
              total={total}
              pageIndex={pageIndex}
              pageSize={pageSize}
              setPageIndex={setPageIndex}
              setPageSize={setPageSize}
              sorting={sorting ? ([sorting] as any) : []}
              setSorting={(s) =>
                setSorting(Array.isArray(s) ? (s[0] ?? null) : (s as any))
              }
              onOpenView={handleOpenView}
              onStartEdit={handleEdit}
              onAskDelete={askDelete}
            />
          </motion.div>
        )}

      <ShelterViewDialog
        open={!!viewing}
        loading={viewingLoading}
        shelter={viewing}
        onClose={() => setViewing(null)}
      />

      <DeleteConfirmDialog
        open={!!confirmDelete}
        title={confirmDelete ? confirmDelete.name : ""}
        onClose={() => {
          setConfirmDelete(null);
        }}
        onConfirm={submitDelete}
      />
      </Container>
    </Box>
  );
}
