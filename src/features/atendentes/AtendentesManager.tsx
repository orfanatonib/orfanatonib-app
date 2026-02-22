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
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Fab,
  IconButton,
  Tooltip,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { motion } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { SortingState } from "@tanstack/react-table";
import { useAtendentes, useAtendenteMutations } from "./hooks";
import type {
  AtendenteFilters,
  AtendenteResponseDto,
  CreateAtendenteDto,
  UpdateAtendenteDto,
  AtendenteFiles,
} from "./types";
import type { AtendentePdf } from "./types";
import BackHeader from "@/components/common/header/BackHeader";
import AtendenteFormDialog from "./components/AtendenteFormDialog";
import AtendenteViewDialog from "./components/AtendenteViewDialog";
import MediaDocumentPreviewModal from "@/utils/MediaDocumentPreviewModal";
import type { MediaItem } from "@/store/slices/types";
import { MediaType, MediaUploadType } from "@/store/slices/types";

function pdfToMediaItem(
  pdf: AtendentePdf,
  label?: "estadual" | "federal" | null
): MediaItem {
  const displayName =
    label === "estadual" ? "Estadual.pdf" : label === "federal" ? "Federal.pdf" : pdf.originalName ?? pdf.title;
  return {
    id: pdf.id,
    title: displayName,
    description: pdf.description ?? "",
    url: pdf.url ?? "",
    mediaType: (pdf.mediaType as MediaType) || MediaType.DOCUMENT,
    uploadType: (pdf.uploadType as MediaUploadType) || MediaUploadType.UPLOAD,
    isLocalFile: pdf.isLocalFile ?? true,
    platformType: pdf.platformType as MediaItem["platformType"],
    originalName: displayName,
    size: pdf.size,
  };
}

const PAGE_SIZE_MOBILE = 6;
const PAGE_SIZE_DESKTOP = 12;

export default function AtendentesManager() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const defaultPageSize = isXs ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [pageIndex, setPageIndex] = React.useState(0);

  React.useEffect(() => {
    setPageSize(defaultPageSize);
    setPageIndex(0);
  }, [defaultPageSize]);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [filters, setFilters] = React.useState<AtendenteFilters>({
    search: "",
  });

  const { rows, total, loading, error, setError, fetchPage, refreshOne } =
    useAtendentes(pageIndex, pageSize, sorting, filters);

  const doRefresh = React.useCallback(() => {
    fetchPage();
  }, [fetchPage]);

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

  const [viewing, setViewing] = React.useState<AtendenteResponseDto | null>(null);
  const [editing, setEditing] = React.useState<AtendenteResponseDto | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<AtendenteResponseDto | null>(null);
  const [showTop, setShowTop] = React.useState(false);
  const [pdfPreviewMedia, setPdfPreviewMedia] = React.useState<MediaItem | null>(null);

  const {
    dialogLoading,
    dialogError,
    setDialogError,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useAtendenteMutations(fetchPage, refreshOne);

  const handleCreateClick = React.useCallback(() => {
    setCreating(true);
  }, []);

  const handleEdit = React.useCallback((atendente: AtendenteResponseDto) => {
    setEditing(atendente);
  }, []);

  const handleView = React.useCallback((atendente: AtendenteResponseDto) => {
    setViewing(atendente);
  }, []);

  const handleDeleteClick = React.useCallback((atendente: AtendenteResponseDto) => {
    setDeleting(atendente);
  }, []);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deleting) return;
    try {
      await handleDelete(deleting.id, () => {});
      showSnack("Antecedente criminal excluído com sucesso!", "success");
      setDeleting(null);
      await doRefresh();
    } catch {
      showSnack("Erro ao excluir antecedente criminal", "error");
    }
  }, [deleting, handleDelete, showSnack, doRefresh]);

  const handleFormSubmit = React.useCallback(
    async (
      data: CreateAtendenteDto | UpdateAtendenteDto,
      files: AtendenteFiles,
      options?: { updateId?: string }
    ) => {
      if (options?.updateId) {
        await handleUpdate(options.updateId, data as UpdateAtendenteDto, files, () => {
          showSnack("Antecedente criminal atualizado com sucesso!", "success");
        });
      } else {
        await handleCreate(data as CreateAtendenteDto, files, () => {
          showSnack("Antecedente criminal criado com sucesso!", "success");
        });
      }
      await doRefresh();
    },
    [handleCreate, handleUpdate, showSnack, doRefresh]
  );

  const handleCloseDialogs = React.useCallback(() => {
    setCreating(false);
    setEditing(null);
    setViewing(null);
    setDialogError("");
  }, [setDialogError]);

  React.useEffect(() => {
    if (!isXs) return;
    const onScroll = () => setShowTop(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isXs]);

  const displayName = (a: AtendenteResponseDto) =>
    a.name ||
    a.attendableDisplayName ||
    (a.attendableType === "integration"
      ? "Integração FM"
      : a.attendableType === "user"
        ? "Usuário"
        : "Antecedente Criminal") +
      (a.attendableId ? ` (${a.attendableId.slice(0, 8)}…)` : "");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 4 }}>
      <Container maxWidth="xl" sx={{ pt: 2 }}>
        <BackHeader title="Antecedentes Criminais" />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          </motion.div>
        )}

        <Paper
          elevation={2}
          sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: "#ffffff" }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Antecedentes Criminais
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gerencie antecedentes criminais e documentos PDF vinculados a integração ou usuário
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                py: 1.5,
                fontWeight: "bold",
                whiteSpace: { xs: "nowrap", sm: "normal" },
                minHeight: 44,
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "inline", md: "none" } }}
              >
                Novo
              </Box>
              <Box
                component="span"
                sx={{ display: { xs: "none", md: "inline" } }}
              >
                Novo Antecedente Criminal
              </Box>
            </Button>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: "grey.50",
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <FilterListIcon fontSize="small" />
              Filtros
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 1 }}
            >
              <TextField
                size="small"
                placeholder="Buscar por nome..."
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
                sx={{ flex: 1, minWidth: { xs: "100%", sm: "250px" } }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Vínculo</InputLabel>
                <Select
                  value={filters.attendableType ?? ""}
                  label="Vínculo"
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      attendableType:
                        e.target.value === ""
                          ? undefined
                          : (e.target.value as "integration" | "user"),
                    }))
                  }
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  <MenuItem value="integration">Integração FM</MenuItem>
                  <MenuItem value="user">Usuário</MenuItem>
                </Select>
              </FormControl>
              {(filters.search || filters.attendableType) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    setFilters({ search: "", attendableType: undefined })
                  }
                  sx={{ alignSelf: "flex-start" }}
                >
                  Limpar filtros
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress size={60} />
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper
              elevation={2}
              sx={{ p: 3, borderRadius: 3, backgroundColor: "#ffffff" }}
            >
              <Typography variant="h6" gutterBottom>
                Lista de Antecedentes Criminais ({rows.length})
              </Typography>

              {rows.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Nenhum antecedente criminal encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clique em "Novo Antecedente Criminal" para começar
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1.5}>
                    {rows.map((atendente) => {
                      const name = displayName(atendente);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={atendente.id}>
                          <Box
                            sx={{
                              p: 1.5,
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 2,
                              minHeight: 100,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              "&:hover": {
                                bgcolor: "action.hover",
                                borderColor: "primary.light",
                              },
                              transition: "all 0.2s ease-in-out",
                            }}
                          >
                            <Box>
                              <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                sx={{ mb: 0.5, fontSize: "1rem" }}
                              >
                                {name}
                              </Typography>
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                {atendente.pdfEstadual?.url && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ fontSize: "0.8rem" }}
                                    >
                                      Estadual.pdf
                                    </Typography>
                                    <Tooltip title="Visualizar PDF">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPdfPreviewMedia(
                                            pdfToMediaItem(atendente.pdfEstadual!, "estadual")
                                          );
                                        }}
                                        sx={{ p: 0.25 }}
                                        aria-label="Visualizar PDF"
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                                {atendente.pdfFederal?.url && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ fontSize: "0.8rem" }}
                                    >
                                      Federal.pdf
                                    </Typography>
                                    <Tooltip title="Visualizar PDF">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPdfPreviewMedia(
                                            pdfToMediaItem(atendente.pdfFederal!, "federal")
                                          );
                                        }}
                                        sx={{ p: 0.25 }}
                                        aria-label="Visualizar PDF"
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", gap: 0.3, mt: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                fullWidth
                                onClick={() => handleView(atendente)}
                                sx={{ flex: 1, fontSize: "0.75rem", py: 0.5 }}
                              >
                                Ver
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                fullWidth
                                onClick={() => handleEdit(atendente)}
                                sx={{ flex: 1, fontSize: "0.75rem", py: 0.5 }}
                              >
                                Editar
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                fullWidth
                                onClick={() => handleDeleteClick(atendente)}
                                sx={{ flex: 1, fontSize: "0.75rem", py: 0.5 }}
                              >
                                Deletar
                              </Button>
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {total > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" },
                    mt: 3,
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Mostrando {rows.length} de {total} antecedentes criminais
                    {total > pageSize &&
                      ` (página ${pageIndex + 1} de ${Math.ceil(total / pageSize)})`}
                  </Typography>
                  {total > PAGE_SIZE_MOBILE && (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Itens por página</InputLabel>
                      <Select
                        value={pageSize}
                        label="Itens por página"
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPageIndex(0);
                        }}
                      >
                        {isXs ? (
                          <>
                            <MenuItem value={6}>6</MenuItem>
                            <MenuItem value={12}>12</MenuItem>
                            <MenuItem value={24}>24</MenuItem>
                          </>
                        ) : (
                          <>
                            <MenuItem value={12}>12</MenuItem>
                            <MenuItem value={24}>24</MenuItem>
                            <MenuItem value={36}>36</MenuItem>
                            <MenuItem value={60}>60</MenuItem>
                          </>
                        )}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              )}

              {total > pageSize && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Pagination
                    count={Math.ceil(total / pageSize)}
                    page={pageIndex + 1}
                    onChange={(_, page) => setPageIndex(page - 1)}
                    color="primary"
                    size={isXs ? "small" : "medium"}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Paper>
          </motion.div>
        )}

        {showTop && (
          <Fab
            color="primary"
            size="small"
            aria-label="Voltar ao topo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            sx={{ position: "fixed", bottom: 88, right: 16 }}
          >
            <ArrowUpwardIcon />
          </Fab>
        )}

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={closeSnack}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            onClose={closeSnack}
            severity={snack.severity}
          >
            {snack.message}
          </MuiAlert>
        </Snackbar>
      </Container>

      <AtendenteFormDialog
        open={creating}
        onClose={handleCloseDialogs}
        onSubmit={handleFormSubmit}
        loading={dialogLoading}
        error={dialogError}
      />

      <AtendenteFormDialog
        open={!!editing}
        onClose={handleCloseDialogs}
        onSubmit={handleFormSubmit}
        editing={editing}
        loading={dialogLoading}
        error={dialogError}
      />

      <AtendenteViewDialog
        open={!!viewing}
        onClose={handleCloseDialogs}
        atendente={viewing}
        onPreviewPdf={(pdf, label) =>
          setPdfPreviewMedia(pdfToMediaItem(pdf, label))
        }
      />

      <MediaDocumentPreviewModal
        open={!!pdfPreviewMedia}
        onClose={() => setPdfPreviewMedia(null)}
        media={pdfPreviewMedia}
        title={pdfPreviewMedia?.originalName ?? pdfPreviewMedia?.title}
      />

      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="delete-dialog-title">
          <Typography fontWeight="bold" color="error">
            Confirmar exclusão
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Tem certeza que deseja excluir o antecedente criminal de{" "}
            <strong>
              {deleting
                ? deleting.name || deleting.attendableDisplayName || deleting.id
                : ""}
            </strong>
            ? Esta ação não pode ser desfeita (os dois PDFs serão removidos).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={dialogLoading}
          >
            {dialogLoading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
