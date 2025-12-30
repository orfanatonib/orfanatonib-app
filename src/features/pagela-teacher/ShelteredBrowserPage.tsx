import * as React from "react";
import {
  Box, Alert, Grid, Paper, TextField, InputAdornment,
  Typography, CircularProgress, Button, Fab, IconButton, Tooltip,
  useMediaQuery, useTheme, Pagination, Stack,
  FormControl, InputLabel, Select, MenuItem, LinearProgress, Fade
} from "@mui/material";
import { Search, PersonAdd, ArrowBack, Favorite, CheckCircle, Cancel, Clear } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/slices";
import { selectIsAdmin, selectIsLeader, selectIsTeacher } from "@/store/selectors/routeSelectors";

import { useShelteredBrowser } from "./hooks";
import ShelteredCard from "./components/ShelteredCard";
import { CreateShelteredForm, EditShelteredForm, ShelteredResponseDto } from "../sheltered/types";
import { useShelteredMutations } from "../sheltered/hooks";
import ShelteredFormDialog from "../sheltered/components/ShelteredFormDialog";
import { apiFetchSheltered } from "../sheltered/api";
import NoShelterLinkedPage from "./NoShelterLinkedPage";

export default function ShelteredBrowserPage() {
  const nav = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isAdmin = useSelector(selectIsAdmin);
  const isLeader = useSelector(selectIsLeader);
  const isTeacher = useSelector(selectIsTeacher);
  const user = useSelector((state: RootState) => state.auth.user);
  const canAccess = isAdmin || isLeader || isTeacher;

  const teacherShelter =
    user?.teacherProfile?.team?.shelter ??
    user?.teacherProfile?.shelter ??
    null;

  const hasLinkedShelter = React.useMemo(() => {
    if (isTeacher) return !!teacherShelter?.id;
    if (isLeader) return !!user?.leaderProfile?.team?.shelter?.id;
    return true; // admin não depende disso
  }, [isTeacher, isLeader, teacherShelter?.id, user?.leaderProfile?.team?.shelter?.id]);

  const shelterName = React.useMemo(() => {
    if (isTeacher && teacherShelter?.name) {
      return teacherShelter.name;
    }
    if (isLeader && user?.leaderProfile?.team?.shelter?.name) {
      return user.leaderProfile.team.shelter.name;
    }
    return null;
  }, [isTeacher, isLeader, user, teacherShelter]);

  const {
    q,
    onChangeQ,
    acceptedJesus,
    onChangeAcceptedJesus,
    active,
    onChangeActive,
    items,
    loading,
    error,
    setError,
    refetch,
    updateStatus,
    pagination,
  } = canAccess ? useShelteredBrowser() : { 
    q: "", 
    onChangeQ: () => {},
    acceptedJesus: "all" as const,
    onChangeAcceptedJesus: () => {},
    active: "all" as const,
    onChangeActive: () => {},
    items: [], 
    loading: false, 
    error: "", 
    setError: () => { }, 
    refetch: () => { },
    updateStatus: async () => {},
    pagination: {
      page: 1,
      setPage: () => {},
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    },
  };

  const [creating, setCreating] = React.useState<CreateShelteredForm | null>(null);
  const [editing, setEditing] = React.useState<EditShelteredForm | null>(null);

  const {
    dialogLoading,
    dialogError,
    setDialogError,
    createSheltered,
    updateSheltered,
  } = useShelteredMutations(async () => {
    await refetch();
  });

  const openCreate = () =>
    setCreating({
      name: "",
      gender: "M",
      guardianName: "",
      guardianPhone: "",
      birthDate: "",
      joinedAt: null,
      shelterId: null,
      address: { street: "", district: "", city: "", state: "", postalCode: "" } as any,
    });

  const submitCreate = async () => {
    if (!creating) return;
    const payload = { ...creating };
    if (!payload.joinedAt) payload.joinedAt = null;
    if (!payload.shelterId) payload.shelterId = null as any;

    try {
      await createSheltered(payload, 1, 12);
      setCreating(null);
      setDialogError("");
    } catch { }
  };

  const openEdit = async (shelteredId: string) => {
    try {
      const full: ShelteredResponseDto = await apiFetchSheltered(shelteredId);
      const isoToBr = (raw?: string | null) => {
        if (!raw) return raw ?? "";
        const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return m ? `${m[3]}/${m[2]}/${m[1]}` : String(raw);
      };
      setEditing({
        id: full.id,
        name: full.name ?? "",
        gender: (full.gender as any) ?? "M",
        guardianName: full.guardianName ?? "",
        guardianPhone: full.guardianPhone ?? "",
        birthDate: isoToBr(full.birthDate ?? ""),
        joinedAt: (isoToBr((full as any).joinedAt) as any) || null,
        shelterId: (full as any)?.shelter?.id ?? null,
        address: full.address
          ? {
            street: full.address.street ?? "",
            number: (full.address as any).number ?? "",
            district: full.address.district ?? "",
            city: full.address.city ?? "",
            state: full.address.state ?? "",
            postalCode: full.address.postalCode ?? "",
            complement: (full.address as any).complement ?? "",
          }
          : { street: "", number: "", district: "", city: "", state: "", postalCode: "", complement: "" } as any,
      });
      setDialogError("");
    } catch (e: any) {
      setDialogError(e?.response?.data?.message || e?.message || "Não foi possível abrir o abrigado para edição");
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    try {
      await updateSheltered(id, rest, 1, 12);
      setEditing(null);
      setDialogError("");
    } catch { }
  };

  React.useEffect(() => {
    document.title = "Lançar Pagela • Selecionar Abrigado";
  }, []);

  if (canAccess && !hasLinkedShelter) {
    return <NoShelterLinkedPage />;
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 4 },
        pt: { xs: 1.5, sm: 2, md: 4 },
        pb: { xs: 2, sm: 2, md: 4 },
        minHeight: "100vh",
        bgcolor: "#f8f9fa"
      }}
    >
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          {isXs && (
            <Tooltip title="Voltar">
              <IconButton
                onClick={() => nav(-1)}
                aria-label="Voltar para a página anterior"
                sx={{
                  mr: 0.5,
                  bgcolor: "white",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "grey.100" },
                }}
              >
                <ArrowBack />
              </IconButton>
            </Tooltip>
          )}

          <Box>
            <Typography
              component="h1"
              variant="h5"
              fontWeight={900}
              sx={{ color: "#2c3e50", fontSize: { xs: "1.25rem", md: "1.75rem" } }}
            >
              Área dos abrigados
            </Typography>
            {canAccess && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: "none", md: "block" }, mt: 0.5 }}
              >
                Toque em um abrigado para abrir suas pagelas
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {shelterName && (
            <Typography
              variant="body1"
              fontWeight={600}
              sx={{ 
                fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
                color: "primary.main",
                textAlign: "right",
                display: { xs: "none", sm: "block" }
              }}
            >
              Abrigados do Abrigo {shelterName}
            </Typography>
          )}
          {canAccess && (
            <Button
              onClick={openCreate}
              startIcon={<PersonAdd />}
              variant="contained"
              sx={{ display: { xs: "none", md: "inline-flex" } }}
            >
              Cadastrar abrigado
            </Button>
          )}
        </Box>
      </Box>

      {canAccess && (
        <Fab
          color="primary"
          aria-label="Cadastrar abrigado"
          onClick={openCreate}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            display: { xs: "flex", md: "none" },
            zIndex: 1300,
          }}
        >
          <PersonAdd />
        </Fab>
      )}

      {!canAccess ? (
        <Alert severity="warning" sx={{ mt: 4 }}>
          <Typography fontWeight="bold">
            Acesso não autorizado
          </Typography>
          <Typography>
            Você precisa ser um Administrador, Líder ou Professor para acessar esta área.
          </Typography>
        </Alert>
      ) : (
        <>
          <Paper
            elevation={0}
            sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              mb: { xs: 1.5, sm: 2 }, 
              borderRadius: { xs: 2, sm: 3 }, 
              border: "1px solid", 
              borderColor: "divider" 
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight={900} 
              sx={{ 
                mb: { xs: 0.75, sm: 1 }, 
                color: "#2c3e50",
                fontSize: { xs: "1rem", sm: "1.25rem" }
              }}
            >
              Selecionar Abrigado
            </Typography>
            <Box 
              sx={{ 
                display: "flex", 
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 1.5 },
                flexWrap: "wrap"
              }}
            >
              <TextField
                value={q}
                onChange={(e) => onChangeQ(e.target.value)}
                size="small"
                sx={{ 
                  flex: { xs: "1 1 100%", sm: "0 0 40%" },
                  width: { xs: "100%", sm: "40%" },
                  "& .MuiInputBase-root": {
                    fontSize: { xs: "0.875rem", sm: "1rem" }
                  },
                }}
                placeholder={isXs ? "Buscar abrigado…" : "Buscar por nome do abrigo, nome do responsável ou telefone do responsável…"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize={isXs ? "small" : "medium"} />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl 
                size="small" 
                sx={{ 
                  flex: { xs: "1 1 100%", sm: "0 0 20%" },
                  width: { xs: "100%", sm: "20%" }
                }}
              >
                <InputLabel id="accepted-jesus-label">Aceitou Jesus</InputLabel>
                <Select
                  labelId="accepted-jesus-label"
                  value={acceptedJesus}
                  onChange={(e) => onChangeAcceptedJesus(e.target.value as "all" | "accepted" | "not_accepted")}
                  label="Aceitou Jesus"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="accepted">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Favorite fontSize="small" />
                      Aceitou Jesus
                    </Box>
                  </MenuItem>
                  <MenuItem value="not_accepted">Não aceitou</MenuItem>
                </Select>
              </FormControl>

              <FormControl 
                size="small" 
                sx={{ 
                  flex: { xs: "1 1 100%", sm: "0 0 20%" },
                  width: { xs: "100%", sm: "20%" }
                }}
              >
                <InputLabel id="active-label">Status</InputLabel>
                <Select
                  labelId="active-label"
                  value={active}
                  onChange={(e) => onChangeActive(e.target.value as "all" | "active" | "inactive")}
                  label="Status"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckCircle fontSize="small" />
                      Ativos
                    </Box>
                  </MenuItem>
                  <MenuItem value="inactive">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Cancel fontSize="small" />
                      Inativos
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {(q || acceptedJesus !== "all" || active !== "all") && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Clear />}
                  onClick={() => {
                    onChangeQ("");
                    onChangeAcceptedJesus("all");
                    onChangeActive("all");
                  }}
                  sx={{
                    flex: { xs: "1 1 100%", sm: "0 0 auto" },
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { xs: "auto", sm: 120 },
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "text.secondary",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "error.main",
                      color: "error.main",
                      bgcolor: "error.light",
                    },
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loading && !items.length ? (
            <Box textAlign="center" my={{ xs: 4, sm: 6 }}>
              <CircularProgress size={isXs ? 32 : 40} />
            </Box>
          ) : items.length === 0 ? (
            <Box textAlign="center" my={{ xs: 4, sm: 6 }} px={2}>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
              >
                {q ? "Nenhum abrigado encontrado com os filtros aplicados." : "Nenhum abrigado cadastrado."}
              </Typography>

              {!q && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={openCreate}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      width: { xs: "100%", sm: "auto" },
                      px: { xs: 2, sm: 3 },
                      py: 1.25,
                      borderRadius: 2,
                    }}
                  >
                    Cadastrar abrigado
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <>
              <Fade in={loading && items.length > 0}>
                <LinearProgress 
                  sx={{ 
                    mb: 2, 
                    borderRadius: 1,
                    height: 3,
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 1,
                    }
                  }} 
                />
              </Fade>
              
              <Box sx={{ 
                position: "relative", 
                opacity: loading && items.length > 0 ? 0.6 : 1, 
                transition: "opacity 0.2s ease",
                pointerEvents: loading && items.length > 0 ? "none" : "auto"
              }}>
                <Grid container spacing={{ xs: 1.5, sm: 1.5, md: 2 }}>
                  {items.map((sheltered) => (
                    <Grid key={sheltered.id} item xs={12} sm={6} md={4} lg={3} xl={2.4 as any}>
                      <ShelteredCard
                        sheltered={sheltered}
                        onClick={(c) => nav(`/area-dos-abrigados/${c.id}`, { state: { sheltered: c } })}
                        onEdit={(c) => openEdit(c.id)}
                        onRefresh={refetch}
                        onToggleStatus={updateStatus}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              {pagination.totalPages > 1 && (
                <Stack spacing={2} alignItems="center" sx={{ mt: { xs: 3, md: 4 }, mb: { xs: 2, md: 2 }, position: "relative" }}>
                  {loading && items.length > 0 && (
                    <Box sx={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", zIndex: 1 }}>
                      <CircularProgress size={16} thickness={4} />
                    </Box>
                  )}
                  <Pagination
                    count={pagination.totalPages}
                    page={pagination.page}
                    onChange={(_, page) => pagination.setPage(page)}
                    color="primary"
                    size={isXs ? "small" : "large"}
                    showFirstButton={!isXs}
                    showLastButton={!isXs}
                    siblingCount={isXs ? 0 : 1}
                    boundaryCount={isXs ? 1 : 1}
                    disabled={loading}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    Mostrando {items.length} de {pagination.totalItems} abrigado(s)
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </>
      )}

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
    </Box>
  );
}
