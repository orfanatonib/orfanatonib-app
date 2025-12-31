import React from "react";
import { Box, Alert, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";

import TeacherToolbar from "./components/TeacherToolbar";
import TeacherTable from "./components/TeacherTable";
import TeacherCards from "./components/TeacherCards";
import TeacherViewDialog from "./components/TeacherViewDialog";
import TeacherEditDialog from "./components/TeacherEditDialog";

import { useSheltersIndex, useTeacherMutations, useTeacherProfiles } from "./hooks";
import { TeacherProfile } from "./types";
import BackHeader from "@/components/common/header/BackHeader";

export type TeacherFilters = {
  teacherSearchString?: string;
  shelterSearchString?: string;
  hasShelter?: boolean;
  teamId?: string;
  teamName?: string;
  hasTeam?: boolean;
};

export default function TeacherProfilesManager() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [pageSize, setPageSize] = React.useState<number>(12);
  const [pageIndex, setPageIndex] = React.useState<number>(0);
  const [sorting, setSorting] = React.useState([{ id: "updatedAt", desc: true }]);

  const [filters, setFilters] = React.useState<TeacherFilters>({
    teacherSearchString: "",
    shelterSearchString: "",
    hasShelter: undefined,
    teamId: undefined,
    teamName: undefined,
    hasTeam: undefined,
  });

  const { rows, total, loading, error, setError, fetchPage, refreshOne } =
    useTeacherProfiles(pageIndex, pageSize, sorting as any, {
      teacherSearchString: filters.teacherSearchString || undefined,
      shelterSearchString: filters.shelterSearchString || undefined,
      hasShelter: filters.hasShelter,
      teamId: filters.teamId,
      teamName: filters.teamName,
      hasTeam: filters.hasTeam,
    });

  const doRefresh = React.useCallback(() => {
    fetchPage();
  }, [fetchPage]);

  const {
    shelters,
    byId,
    loading: sheltersLoading,
    error: sheltersError,
    refresh: refreshShelters,
  } = useSheltersIndex();

  const { dialogLoading, dialogError, setDialogError } =
    useTeacherMutations(fetchPage, refreshOne);

  const [viewing, setViewing] = React.useState<TeacherProfile | null>(null);
  const [editingTeam, setEditingTeam] = React.useState<TeacherProfile | null>(null);

  const handleEditTeam = React.useCallback((teacher: TeacherProfile) => {
    setEditingTeam(teacher);
  }, []);

  const handleFiltersChange = React.useCallback(
    (updater: (prev: TeacherFilters) => TeacherFilters) => {
      setFilters((prev) => updater(prev));
      setPageIndex(0);
    },
    []
  );

  React.useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [total, pageSize, pageIndex]);

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
          <BackHeader title="Gerenciador de Membros" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <TeacherToolbar
            filters={filters}
            onChange={handleFiltersChange}
            onRefreshClick={doRefresh}
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
              Carregando membros...
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
              Nenhum membro encontrado
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
        <TeacherCards
          rows={rows}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
          sorting={sorting as any}
          setSorting={setSorting as any}
          onView={(t) => setViewing(t)}
          onEdit={handleEditTeam}
        />
      ) : (
        <TeacherTable
          rows={rows}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
          sorting={sorting as any}
          setSorting={setSorting as any}
          onView={(t) => setViewing(t)}
          onEdit={handleEditTeam}
            />
            )}
          </motion.div>
        )}

        <TeacherViewDialog
        open={!!viewing}
        teacher={viewing}
        onClose={() => setViewing(null)}
      />

      <TeacherEditDialog
        open={!!editingTeam}
        teacher={editingTeam}
        onClose={() => setEditingTeam(null)}
        onSuccess={async () => {
          await fetchPage();
          if (editingTeam) {
            await refreshOne(editingTeam.id);
          }
          setEditingTeam(null);
        }}
      />
      </Container>
    </Box>
  );
}
