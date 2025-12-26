import React from "react";
import {
  Box,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search, Clear, RateReview } from "@mui/icons-material";
import { motion } from "framer-motion";
import FeedbackCard from "./components/FeedbackCard";
import FeedbackDetailsModal from "./components/FeedbackDetailsModal";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";
import { useFeedbackList, useFeedbackMutations, useFeedbackSearch } from "./hooks";
import { FeedbackData } from "@/store/slices/feedback/feedbackSlice";
import BackHeader from "@/components/common/header/BackHeader";

const FeedbackManager: React.FC = () => {
  const { items, loading, error, setError, refresh } = useFeedbackList();
  const { search, setSearch, filtered } = useFeedbackSearch(items);
  const { mLoading, mError, setMError, deleteOne, markAsRead } = useFeedbackMutations(refresh);
  const [selected, setSelected] = React.useState<FeedbackData | null>(null);
  const [toDelete, setToDelete] = React.useState<FeedbackData | null>(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showSnackbar = (message: string, severity: "success" | "error") =>
    setSnackbar({ open: true, message, severity });

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteOne(toDelete.id || "");
      showSnackbar("Feedback excluído com sucesso", "success");
    } catch {
      showSnackbar("Erro ao excluir feedback", "error");
    } finally {
      setToDelete(null);
    }
  };

  const handleMarkAsRead = async () => {
    if (!selected) return;
    try {
      await markAsRead(selected.id || "");
      showSnackbar("Feedback marcado como lido", "success");
    } catch {
      showSnackbar("Erro ao marcar como lido", "error");
    }
  };

  const hasQuery = Boolean(search);
  const isBusy = loading || mLoading;
  const isFiltering = isBusy && items.length > 0;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackHeader title="💬 Feedbacks Recebidos" />
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper
            elevation={2}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            <TextField
              fullWidth
              label="Buscar feedbacks"
              placeholder="Buscar por nome, email, comentário ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {isFiltering && (
                      <CircularProgress size={20} sx={{ mr: hasQuery ? 1 : 0 }} />
                    )}
                    {hasQuery && (
                      <Tooltip title="Limpar busca">
                        <IconButton
                          size="small"
                          onClick={() => setSearch("")}
                          sx={{
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          <Clear fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  },
                  "&.Mui-focused": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />
          </Paper>
        </motion.div>

        {/* Content Section */}
        {isBusy && items.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "50vh",
            }}
          >
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body2" mt={2} color="text.secondary">
              Carregando feedbacks...
            </Typography>
          </Box>
        ) : error || mError ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert
              severity="error"
              sx={{
                borderRadius: 3,
                fontSize: "1rem",
              }}
              onClose={() => {
                if (error) setError("");
                if (mError) setMError("");
              }}
            >
              {error || mError}
            </Alert>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: 3,
                bgcolor: "background.paper",
              }}
            >
              <RateReview sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                📭 Nenhum feedback encontrado
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {search
                  ? "Tente ajustar sua busca ou limpar os filtros."
                  : "Ainda não há feedbacks recebidos."}
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <>
            {isFiltering && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 2,
                }}
              >
                <CircularProgress size={32} />
              </Box>
            )}
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="stretch">
              {filtered.map((feedback, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={feedback.id}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  sx={{ display: "flex" }}
                >
                  <FeedbackCard
                    feedback={feedback}
                    onView={() => setSelected(feedback)}
                    onDelete={() => setToDelete(feedback)}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <FeedbackDetailsModal
          feedback={selected}
          onClose={() => setSelected(null)}
          onMarkAsRead={handleMarkAsRead}
          onDelete={() => {
            if (selected) setToDelete(selected);
            setSelected(null);
          }}
        />

        <DeleteConfirmDialog
          open={!!toDelete}
          title={toDelete?.name || ""}
          onClose={() => setToDelete(null)}
          onConfirm={handleDelete}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default FeedbackManager;
