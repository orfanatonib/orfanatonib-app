import React from "react";
import { Box, Alert, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";

import MemberToolbar from "./components/MemberToolbar";
import MemberTable from "./components/MemberTable";
import MemberCards from "./components/MemberCards";
import MemberViewDialog from "./components/MemberViewDialog";
import MemberEditDialog from "./components/MemberEditDialog";

import { useSheltersIndex, useMemberMutations, useMemberProfiles } from "./hooks";
import { MemberProfile } from "./types";
import BackHeader from "@/components/common/header/BackHeader";

export type MemberFilters = {
  memberSearchString?: string;
  shelterSearchString?: string;
  hasShelter?: boolean;
  teamId?: string;
  teamName?: string;
  hasTeam?: boolean;
};

export default function MemberProfilesManager() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [pageSize, setPageSize] = React.useState<number>(12);
  const [pageIndex, setPageIndex] = React.useState<number>(0);
  const [sorting, setSorting] = React.useState([{ id: "updatedAt", desc: true }]);

  const [filters, setFilters] = React.useState<MemberFilters>({
    memberSearchString: "",
    shelterSearchString: "",
    hasShelter: undefined,
    teamId: undefined,
    teamName: undefined,
    hasTeam: undefined,
  });

  const { rows, total, loading, error, setError, fetchPage, refreshOne } =
    useMemberProfiles(pageIndex, pageSize, sorting as any, {
      memberSearchString: filters.memberSearchString || undefined,
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
    useMemberMutations(fetchPage, refreshOne);

  const [viewing, setViewing] = React.useState<MemberProfile | null>(null);
  const [editingTeam, setEditingTeam] = React.useState<MemberProfile | null>(null);

  const handleEditTeam = React.useCallback((member: MemberProfile) => {
    setEditingTeam(member);
  }, []);

  const handleFiltersChange = React.useCallback(
    (updater: (prev: MemberFilters) => MemberFilters) => {
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
          <MemberToolbar
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
        <MemberCards
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
        <MemberTable
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

        <MemberViewDialog
        open={!!viewing}
        member={viewing}
        onClose={() => setViewing(null)}
      />

      <MemberEditDialog
        open={!!editingTeam}
        member={editingTeam}
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
