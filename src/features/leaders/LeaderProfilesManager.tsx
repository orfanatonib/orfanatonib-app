import React from "react";
import {
  Box,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Snackbar,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import type { SortingState } from "@tanstack/react-table";
import LeaderToolbar from "./components/LeaderToolbar";
import LeaderTable from "./components/LeaderTable";
import LeaderCards from "./components/LeaderCards";
import LeaderViewDialog from "./components/LeaderViewDialog";
import LeaderMultiEditDialog from "./components/LeaderMultiEditDialog";
import {
  useLeaderMutations,
  useLeaderProfiles,
  useSheltersIndex,
} from "./hooks";
import type { LeaderFilters, LeaderProfile } from "./types";
import BackHeader from "@/components/common/header/BackHeader";

export default function LeaderProfilesManager() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const [pageSize, setPageSize] = React.useState<number>(12);
  const [pageIndex, setPageIndex] = React.useState<number>(0);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);

  const [filters, setFilters] = React.useState<LeaderFilters>({
    leaderSearchString: "",
    shelterSearchString: "",
    hasShelter: undefined,
  });

  const { rows, total, loading, error, setError, fetchPage, refreshOne } =
    useLeaderProfiles(pageIndex, pageSize, sorting, filters);

  const doRefresh = React.useCallback(() => {
    fetchPage();
  }, [fetchPage]);

  const {
    shelters,
    byNumber,
    loading: sheltersLoading,
    error: sheltersError,
    refresh: refreshShelters,
  } = useSheltersIndex();

  const [snack, setSnack] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });

  const showSnack = React.useCallback(
    (message: string, severity: typeof snack.severity = "success") => {
      setSnack({ open: true, message, severity });
    },
    []
  );

  const closeSnack = (_?: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  };

  const [viewing, setViewing] = React.useState<LeaderProfile | null>(null);
  const [editingTeam, setEditingTeam] = React.useState<LeaderProfile | null>(null);

  const {
    dialogLoading,
    dialogError,
    setDialogError,
  } = useLeaderMutations(fetchPage, refreshOne);

  const handleEditTeam = React.useCallback((leader: LeaderProfile) => {
    setEditingTeam(leader);
  }, []);

  React.useEffect(() => {
    refreshShelters();
  }, [refreshShelters]);

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
          <BackHeader title="Gerenciar Líderes" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <LeaderToolbar
            filters={filters}
            onChange={(updater) => {
              setFilters(updater);
              setPageIndex(0);
            }}
            onRefresh={doRefresh}
            isXs={isXs}
          />
        </motion.div>

        {(loading && !rows.length) || sheltersLoading ? (
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
              Carregando líderes...
            </Typography>
          </Box>
        ) : null}

        {(error || sheltersError) && !(loading || sheltersLoading) && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => {
              setError("");
              setDialogError("");
            }}
          >
            {error || sheltersError}
          </Alert>
        )}

        {!loading && !error && !sheltersLoading && !sheltersError && rows.length === 0 && (
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
              Nenhum líder encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tente ajustar os filtros de busca.
            </Typography>
          </Paper>
        )}

        {!loading && !sheltersLoading && rows.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {isXs ? (
        <LeaderCards
          rows={rows}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
          sorting={sorting}
          setSorting={setSorting}
          onView={(c) => setViewing(c)}
          onEdit={handleEditTeam}
        />
      ) : (
        <LeaderTable
          rows={rows}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
          sorting={sorting}
          setSorting={setSorting}
          onView={(c) => setViewing(c)}
          onEdit={handleEditTeam}
            />
            )}
          </motion.div>
        )}

        <LeaderViewDialog
        open={!!viewing}
        leader={viewing}
        onClose={() => setViewing(null)}
      />

      <LeaderMultiEditDialog
        open={!!editingTeam}
        leader={editingTeam}
        onClose={() => setEditingTeam(null)}
        onSuccess={async () => {
          await fetchPage();
          if (editingTeam) {
            await refreshOne(editingTeam.id);
          }
          setEditingTeam(null);
        }}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snack.severity}
          onClose={closeSnack}
        >
          {snack.message}
        </MuiAlert>
      </Snackbar>
      </Container>
    </Box>
  );
}
