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
  Fab,
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
  DialogActions,
  DialogContentText,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { motion } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import type { SortingState } from "@tanstack/react-table";
import { useIntegrations, useIntegrationMutations } from "./hooks";
import type { IntegrationFilters, IntegrationResponseDto, CreateIntegrationDto, UpdateIntegrationDto } from "./types";
import BackHeader from "@/components/common/header/BackHeader";
import IntegrationFormDialog from "./components/IntegrationFormDialog";
import IntegrationViewDialog from "./components/IntegrationViewDialog";
import ImageCarouselDialog from "./components/ImageCarouselDialog";

export default function IntegrationManager() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const [pageSize, setPageSize] = React.useState<number>(12);
  const [pageIndex, setPageIndex] = React.useState<number>(0);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);

  const [filters, setFilters] = React.useState<IntegrationFilters>({
    search: "",
  });

  const { rows, total, loading, error, setError, fetchPage, refreshOne } =
    useIntegrations(pageIndex, pageSize, sorting, filters);

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

  const [viewing, setViewing] = React.useState<IntegrationResponseDto | null>(null);
  const [viewingImages, setViewingImages] = React.useState<{ integration: IntegrationResponseDto; startIndex: number } | null>(null);
  const [editing, setEditing] = React.useState<IntegrationResponseDto | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<IntegrationResponseDto | null>(null);
  const [showTop, setShowTop] = React.useState(false);
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());

  const {
    dialogLoading,
    dialogError,
    setDialogError,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useIntegrationMutations(fetchPage, refreshOne);

  const handleCreateClick = React.useCallback(() => {
    setCreating(true);
  }, []);

  const handleEdit = React.useCallback((integration: IntegrationResponseDto) => {
    setEditing(integration);
  }, []);

  const handleView = React.useCallback((integration: IntegrationResponseDto) => {
    setViewing(integration);
  }, []);

  const handleDeleteClick = React.useCallback((integration: IntegrationResponseDto) => {
    setDeleting(integration);
  }, []);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deleting) return;

    try {
      await handleDelete(deleting.id, () => {
        showSnack("Integração deletada com sucesso!", "success");
        setDeleting(null);
      });
    } catch (error) {
      showSnack("Erro ao deletar integração", "error");
    }
  }, [deleting, handleDelete, showSnack]);

  const handleCreateSubmit = React.useCallback(async (data: CreateIntegrationDto, files?: File[]) => {
    await handleCreate(data, files, () => {
      showSnack("Integração criada com sucesso!", "success");
      setCreating(false);
    });
  }, [handleCreate, showSnack]);

  const handleEditSubmit = React.useCallback(async (data: UpdateIntegrationDto, files?: File[]) => {
    if (!editing) return;
    await handleUpdate(editing.id, data, files, () => {
      showSnack("Integração atualizada com sucesso!", "success");
      setEditing(null);
    });
  }, [handleUpdate, editing, showSnack]);

  const handleCloseDialogs = React.useCallback(() => {
    setCreating(false);
    setEditing(null);
    setViewing(null);
  }, []);

  const handleImageError = React.useCallback((integrationId: string) => {
    setImageErrors(prev => new Set(prev).add(integrationId));
  }, []);

  React.useEffect(() => {
    if (!isXs) return;
    const onScroll = () => setShowTop(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isXs]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pb: 4,
      }}
    >

      <Container maxWidth="xl" sx={{ pt: 2 }}>
        <BackHeader title="Integrações da Feira de Ministério" />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            backgroundColor: "#ffffff",
          }}
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
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Integrações da Feira de Ministério
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gerencie as integrações de pessoas na Feira de Ministério
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: "bold",
              }}
            >
              Nova Integração
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
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                placeholder="Buscar por nome, telefone ou líder..."
                value={filters.search || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
                }}
                sx={{ flex: 1, minWidth: { xs: "100%", sm: "250px" } }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Ano da Integração</InputLabel>
                <Select
                  value={filters.integrationYear || ""}
                  label="Ano da Integração"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    integrationYear: e.target.value ? parseInt(e.target.value as string) : undefined
                  }))}
                >
                  <MenuItem value="">
                    <em>Todos os anos</em>
                  </MenuItem>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {(filters.search || filters.integrationYear) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFilters({ search: "" })}
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
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: "#ffffff",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Lista de Integrações ({total})
              </Typography>

              {rows.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Nenhuma integração encontrada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clique em "Nova Integração" para começar
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1.5}>
                    {rows.map((integration) => (
                      <Grid item xs={12} sm={6} md={4} key={integration.id}>
                        <Box
                          sx={{
                            p: 1.5,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                            minHeight: 120,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            "&:hover": {
                              bgcolor: "action.hover",
                              borderColor: "primary.light",
                            },
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5, fontSize: '1rem' }}>
                              {integration.name || "Nome não informado"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                              Ano: {integration.integrationYear || "Não informado"}
                            </Typography>

                            <Box sx={{ display: "flex", gap: 0.3 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                fullWidth
                                onClick={() => handleView(integration)}
                                sx={{ flex: 1, fontSize: '0.75rem', py: 0.5 }}
                              >
                                Ver
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                fullWidth
                                onClick={() => handleEdit(integration)}
                                sx={{ flex: 1, fontSize: '0.75rem', py: 0.5 }}
                              >
                                Editar
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                fullWidth
                                onClick={() => handleDeleteClick(integration)}
                                sx={{ flex: 1, fontSize: '0.75rem', py: 0.5 }}
                              >
                                Deletar
                              </Button>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 2,
                              overflow: "hidden",
                              flexShrink: 0,
                              position: "relative",
                              cursor: (integration.images && integration.images.length > 0) ? "pointer" : "default",
                            }}
                            onClick={() => {
                              if (integration.images && integration.images.length > 0) {
                                setViewingImages({ integration, startIndex: 0 });
                              }
                            }}
                          >
                            {integration.images && integration.images.length > 0 ? (
                              <>
                                <img
                                  src={integration.images[0].url}
                                  alt={`Foto de ${integration.name || "integração"}`}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: 8,
                                  }}
                                  onError={() => handleImageError(integration.id)}
                                />

                                {integration.images.length > 1 && (
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      bottom: 4,
                                      right: 4,
                                      bgcolor: "rgba(0, 0, 0, 0.7)",
                                      color: "white",
                                      borderRadius: 1,
                                      px: 1,
                                      py: 0.5,
                                      fontSize: "0.7rem",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    +{integration.images.length - 1}
                                  </Box>
                                )}

                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    bgcolor: "rgba(0, 0, 0, 0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: 0,
                                    transition: "opacity 0.2s",
                                    "&:hover": {
                                      opacity: 1,
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "white",
                                      bgcolor: "rgba(0, 0, 0, 0.6)",
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      fontSize: "0.6rem",
                                    }}
                                  >
                                    Ampliar
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <img
                                src={import.meta.env.VITE_SHELTER_FALLBACK_IMAGE_URL || ""}
                                alt={`Foto de ${integration.name || "integração"}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: 8,
                                }}
                                onError={() => handleImageError(integration.id)}
                              />
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {total > 0 && (
                <Box sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  mt: 3,
                  gap: 2,
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Mostrando {rows.length} de {total} integrações
                    {total > pageSize && ` (página ${pageIndex + 1} de ${Math.ceil(total / pageSize)})`}
                  </Typography>

                  {total > 12 && (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Itens por página</InputLabel>
                      <Select
                        value={pageSize}
                        label="Itens por página"
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPageIndex(0); // Reset to first page
                        }}
                      >
                        <MenuItem value={12}>12</MenuItem>
                        <MenuItem value={24}>24</MenuItem>
                        <MenuItem value={36}>36</MenuItem>
                        <MenuItem value={60}>60</MenuItem>
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

      <IntegrationFormDialog
        open={creating}
        onClose={handleCloseDialogs}
        onSubmit={handleCreateSubmit as any}
        loading={dialogLoading}
        error={dialogError}
      />

      <IntegrationFormDialog
        open={!!editing}
        onClose={handleCloseDialogs}
        onSubmit={handleEditSubmit as any}
        editing={editing}
        loading={dialogLoading}
        error={dialogError}
      />

      <IntegrationViewDialog
        open={!!viewing}
        onClose={handleCloseDialogs}
        integration={viewing}
        onImageClick={(integration, startIndex) => setViewingImages({ integration, startIndex })}
      />

      <ImageCarouselDialog
        open={!!viewingImages}
        onClose={() => setViewingImages(null)}
        images={viewingImages?.integration.images || []}
        title={viewingImages?.integration.name}
        startIndex={viewingImages?.startIndex || 0}
      />

      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          id="delete-dialog-title"
          sx={{
            pb: isXs ? 2 : 1,
            pt: isXs ? 3 : 2,
            px: isXs ? 3 : 3,
          }}
        >
          <Typography
            component="div"
            fontWeight="bold"
            color="error"
            sx={{
              fontSize: isXs ? '1.5rem' : '1.25rem',
              textAlign: isXs ? 'center' : 'left',
            }}
          >
            ⚠️ Confirmar Exclusão
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: isXs ? 2 : 1, px: isXs ? 3 : 3 }}>
          <DialogContentText
            id="delete-dialog-description"
            sx={{
              fontSize: isXs ? '1rem' : '0.95rem',
              mb: 1,
            }}
          >
            Tem certeza que deseja excluir a integração de{" "}
            <strong>{deleting?.name || "Nome não informado"}</strong>?
          </DialogContentText>
          <DialogContentText
            sx={{
              mt: 1,
              color: "text.secondary",
              fontSize: isXs ? '0.9rem' : '0.875rem',
              textAlign: isXs ? 'center' : 'left',
            }}
          >
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            px: isXs ? 3 : 3,
            pb: isXs ? 3 : 2,
            pt: isXs ? 1 : 0,
            flexDirection: isXs ? 'column' : 'row',
            gap: isXs ? 1.5 : 1,
            '& > :not(:first-of-type)': {
              ml: isXs ? 0 : 1,
            },
          }}
        >
          <Button
            onClick={() => setDeleting(null)}
            variant="outlined"
            fullWidth={isXs}
            sx={{
              minHeight: isXs ? 48 : 36,
              fontSize: isXs ? '1rem' : '0.875rem',
              fontWeight: 600,
              order: isXs ? 2 : 1,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={dialogLoading}
            fullWidth={isXs}
            startIcon={dialogLoading ? <CircularProgress size={16} /> : null}
            sx={{
              minHeight: isXs ? 48 : 36,
              fontSize: isXs ? '1rem' : '0.875rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
              },
              order: isXs ? 1 : 2,
            }}
          >
            {dialogLoading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
