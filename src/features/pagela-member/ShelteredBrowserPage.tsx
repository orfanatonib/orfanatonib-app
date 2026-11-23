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
import { RootState, AppDispatch } from "@/store/slices";
import { selectIsAdmin, selectIsLeader, selectIsMember } from "@/store/selectors/routeSelectors";

import { useShelteredBrowser } from "./hooks";
import ShelteredCard from "./components/ShelteredCard";
import { CreateShelteredForm, EditShelteredForm, ShelteredResponseDto } from "../sheltered/types";
import { ShelteredFormMode, ShelteredGender } from "../sheltered/enums";
import { useShelteredMutations } from "../sheltered/hooks";
import ShelteredFormDialog from "../sheltered/components/ShelteredFormDialog";
import { apiFetchSheltered } from "../sheltered/api";
import NoShelterLinkedPage from "./NoShelterLinkedPage";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "@/store/slices/auth/authSlice";
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { logger } from '@/utils/logger';
import { MIN_TOUCH_TARGET_PX, SHELTERED_AREA_TESTID_PREFIX as TID } from "./constants";

export default function ShelteredBrowserPage() {
  const nav = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isAdmin = useSelector(selectIsAdmin);
  const isLeader = useSelector(selectIsLeader);
  const isMember = useSelector(selectIsMember);
  const user = useSelector((state: RootState) => state.auth.user);
  const canAccess = isAdmin || isLeader || isMember;

  const [fullProfile, setFullProfile] = React.useState<any>(null);
  const [checkingShelter, setCheckingShelter] = React.useState(false);
  const hasCheckedProfileRef = React.useRef(false);

  const memberShelter = React.useMemo(() => {

    if (fullProfile?.memberProfile?.team?.shelter?.id) {
      return fullProfile.memberProfile.team.shelter;
    }

    if (user?.memberProfile) {

      if ((user.memberProfile as any)?.team?.shelter?.id) {
        return (user.memberProfile as any).team.shelter;
      }

      if ((user.memberProfile as any)?.shelter?.id) {
        return (user.memberProfile as any).shelter;
      }
    }

    return null;
  }, [user?.memberProfile, fullProfile]);

  const leaderShelter = React.useMemo(() => {

    if (fullProfile?.leaderProfile?.teams) {
      const teamWithShelter = fullProfile.leaderProfile.teams.find((t: any) => t?.shelter?.id);
      if (teamWithShelter?.shelter) {
        return teamWithShelter.shelter;
      }
    }

    if (fullProfile?.leaderProfile?.team?.shelter?.id) {
      return fullProfile.leaderProfile.team.shelter;
    }

    if (user?.leaderProfile?.teams) {
      const teamWithShelter = user.leaderProfile.teams.find((t: any) => t?.shelter?.id);
      if (teamWithShelter?.shelter) {
        return teamWithShelter.shelter;
      }
    }

    if (user?.leaderProfile?.team?.shelter?.id) {
      return user.leaderProfile.team.shelter;
    }

    return null;
  }, [user?.leaderProfile, fullProfile]);

  React.useEffect(() => {

    if (hasCheckedProfileRef.current) return;

    if (fullProfile) {
      hasCheckedProfileRef.current = true;
      return;
    }

    const hasMemberShelter = isMember && (
      (user?.memberProfile as any)?.team?.shelter?.id ||
      (user?.memberProfile as any)?.shelter?.id
    );

    const hasLeaderShelter = isLeader && (
      user?.leaderProfile?.team?.shelter?.id ||
      (user?.leaderProfile?.teams && Array.isArray(user.leaderProfile.teams) &&
        user.leaderProfile.teams.some((t: any) => t?.shelter?.id))
    );

    const hasShelterFromRedux = hasMemberShelter || hasLeaderShelter;

    if (hasShelterFromRedux) {
      hasCheckedProfileRef.current = true;
      return;
    }

    if (!isMember && !isLeader) {
      hasCheckedProfileRef.current = true;
      return;
    }

    if (checkingShelter) return;

    hasCheckedProfileRef.current = true;

    const checkShelterLink = async () => {
      try {
        setCheckingShelter(true);
        const updatedUser = await dispatch(fetchCurrentUser()).unwrap();

        setFullProfile(updatedUser);
      } catch (error) {
        logger.error('Falha ao verificar vínculo com abrigo:', undefined, error);
        hasCheckedProfileRef.current = false;
      } finally {
        setCheckingShelter(false);
      }
    };

    checkShelterLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasLinkedShelter = React.useMemo(() => {
    if (isMember) {
      const shelterId = memberShelter?.id;
      return !!shelterId;
    }
    if (isLeader) {

      const shelterId =
        leaderShelter?.id ||
        user?.leaderProfile?.team?.shelter?.id ||
        (user?.leaderProfile?.teams && Array.isArray(user.leaderProfile.teams)
          ? user.leaderProfile.teams.find((t: any) => t?.shelter?.id)?.shelter?.id
          : null);
      return !!shelterId;
    }
    return true;
  }, [isMember, isLeader, memberShelter?.id, leaderShelter?.id, user?.leaderProfile]);

  const shelterName = React.useMemo(() => {
    if (isMember && memberShelter?.name) {
      return memberShelter.name;
    }
    if (isLeader) {
      const name =
        leaderShelter?.name ||
        user?.leaderProfile?.team?.shelter?.name ||
        (user?.leaderProfile?.teams && Array.isArray(user.leaderProfile.teams)
          ? user.leaderProfile.teams.find((t: any) => t?.shelter?.id)?.shelter?.name
          : null);
      return name || null;
    }
    return null;
  }, [isMember, isLeader, user, memberShelter, leaderShelter]);

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
    onChangeQ: () => { },
    acceptedJesus: "all" as const,
    onChangeAcceptedJesus: () => { },
    active: "all" as const,
    onChangeActive: () => { },
    items: [],
    loading: false,
    error: "",
    setError: () => { },
    refetch: () => { },
    updateStatus: async () => { },
    pagination: {
      page: 1,
      setPage: () => { },
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    },
  };

  const hasFilters = Boolean(q) || acceptedJesus !== "all" || active !== "all";
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
      gender: ShelteredGender.MALE,
      guardianName: "",
      guardianPhone: "",
      birthDate: "",
      joinedAt: null,
      shelterId: null,
      address: { street: "", district: "", city: "", state: "", postalCode: "" },
    });

  const submitCreate = async () => {
    if (!creating) return;
    const created = await createSheltered({
      ...creating,
      joinedAt: creating.joinedAt || null,
      shelterId: creating.shelterId || null,
    });
    if (created) setCreating(null);
  };

  const openEdit = async (shelteredId: string) => {
    try {
      const full: ShelteredResponseDto = await apiFetchSheltered(shelteredId);
      setEditing({
        id: full.id,
        name: full.name,
        gender: full.gender,
        guardianName: full.guardianName ?? "",
        guardianPhone: full.guardianPhone ?? "",
        birthDate: full.birthDate,
        joinedAt: full.joinedAt,
        shelterId: full.shelter?.id ?? null,
        address: full.address
          ? {
            street: full.address.street ?? "",
            number: full.address.number ?? "",
            district: full.address.district ?? "",
            city: full.address.city,
            state: full.address.state,
            postalCode: full.address.postalCode ?? "",
            complement: full.address.complement ?? "",
          }
          : { street: "", number: "", district: "", city: "", state: "", postalCode: "", complement: "" },
      });
      setDialogError("");
    } catch (e: unknown) {
      setDialogError(getApiErrorMessage(e, "Não foi possível abrir o acolhido para edição"));
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    if (await updateSheltered(id, rest)) setEditing(null);
  };

  React.useEffect(() => {
    document.title = "Lançar Pagela • Selecionar Acolhido";
  }, []);

  if (canAccess && !hasLinkedShelter) {
    return <NoShelterLinkedPage />;
  }

  return (
    <Box
      data-testid={`${TID}-page`}
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
                data-testid={`${TID}-back`}
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
              data-testid={`${TID}-heading`}
              variant="h5"
              fontWeight={900}
              sx={{ color: "#2c3e50", fontSize: { xs: "1.25rem", md: "1.75rem" } }}
            >
              Área dos acolhidos
            </Typography>
            {canAccess && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: "none", md: "block" }, mt: 0.5 }}
              >
                Toque em um acolhido para abrir suas pagelas
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {shelterName && (
            <Typography
              variant="body1"
              fontWeight={600}
              data-testid={`${TID}-shelter-name`}
              sx={{
                fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
                color: "primary.main",
                textAlign: "right",
                display: { xs: "none", sm: "block" }
              }}
            >
              Acolhidos do Abrigo {shelterName}
            </Typography>
          )}
          {canAccess && (
            <Button
              onClick={openCreate}
              startIcon={<PersonAdd />}
              variant="contained"
              data-testid={`${TID}-create`}
              sx={{ display: { xs: "none", md: "inline-flex" }, minHeight: MIN_TOUCH_TARGET_PX }}
            >
              Cadastrar acolhido
            </Button>
          )}
        </Box>
      </Box>

      {canAccess && (
        <Fab
          color="primary"
          aria-label="Cadastrar acolhido"
          onClick={openCreate}
          data-testid={`${TID}-create-fab`}
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
        <Alert severity="warning" sx={{ mt: 4 }} data-testid={`${TID}-unauthorized`}>
          <Typography fontWeight="bold">
            Acesso não autorizado
          </Typography>
          <Typography>
            Você precisa ser um Administrador, Líder ou Membro para acessar esta área.
          </Typography>
        </Alert>
      ) : (
        <>
          <Paper
            elevation={0}
            data-testid={`${TID}-toolbar`}
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
              Selecionar Acolhido
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
                inputProps={{ "data-testid": `${TID}-search`, "aria-label": "Buscar acolhido" }}
                sx={{
                  flex: { xs: "1 1 100%", sm: "0 0 40%" },
                  width: { xs: "100%", sm: "40%" },
                  "& .MuiInputBase-root": {
                    fontSize: { xs: "0.875rem", sm: "1rem" }
                  },
                }}
                placeholder={isXs ? "Buscar acolhido…" : "Buscar por nome do abrigo, nome do responsável ou telefone do responsável…"}
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
                  data-testid={`${TID}-filter-accepted`}
                >
                  <MenuItem value="all" data-testid={`${TID}-filter-accepted-option-all`}>Todos</MenuItem>
                  <MenuItem value="accepted" data-testid={`${TID}-filter-accepted-option-accepted`}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Favorite fontSize="small" />
                      Aceitou Jesus
                    </Box>
                  </MenuItem>
                  <MenuItem value="not_accepted" data-testid={`${TID}-filter-accepted-option-not-accepted`}>Não aceitou</MenuItem>
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
                  data-testid={`${TID}-filter-active`}
                >
                  <MenuItem value="all" data-testid={`${TID}-filter-active-option-all`}>Todos</MenuItem>
                  <MenuItem value="active" data-testid={`${TID}-filter-active-option-active`}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckCircle fontSize="small" />
                      Ativos
                    </Box>
                  </MenuItem>
                  <MenuItem value="inactive" data-testid={`${TID}-filter-active-option-inactive`}>
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
                  data-testid={`${TID}-clear-filters`}
                  onClick={() => {
                    onChangeQ("");
                    onChangeAcceptedJesus("all");
                    onChangeActive("all");
                  }}
                  sx={{
                    flex: { xs: "1 1 100%", sm: "0 0 auto" },
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { xs: "auto", sm: 120 },
                    minHeight: MIN_TOUCH_TARGET_PX,
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
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")} data-testid={`${TID}-error`}>
              {error}
            </Alert>
          )}

          {loading && !items.length ? (
            <Box textAlign="center" my={{ xs: 4, sm: 6 }} data-testid={`${TID}-loading`}>
              <CircularProgress size={isXs ? 32 : 40} />
            </Box>
          ) : items.length === 0 ? (
            <Box textAlign="center" my={{ xs: 4, sm: 6 }} px={2} data-testid={`${TID}-empty`}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
              >
                {hasFilters ? "Nenhum acolhido encontrado com os filtros aplicados." : "Nenhum acolhido cadastrado."}
              </Typography>

              {!hasFilters && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={openCreate}
                    data-testid={`${TID}-empty-create`}
                    sx={{
                      minHeight: MIN_TOUCH_TARGET_PX,
                      textTransform: "none",
                      fontWeight: 800,
                      width: { xs: "100%", sm: "auto" },
                      px: { xs: 2, sm: 3 },
                      py: 1.25,
                      borderRadius: 2,
                    }}
                  >
                    Cadastrar acolhido
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <>
              <Fade in={loading && items.length > 0}>
                <LinearProgress
                  data-testid={`${TID}-fetching`}
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

              <Box data-testid={`${TID}-list`} sx={{
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
                        onClick={(c) => nav(`/area-dos-acolhidos/${c.id}`, { state: { sheltered: c } })}
                        onEdit={(c) => openEdit(c.id)}
                        onRefresh={refetch}
                        onToggleStatus={updateStatus}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {pagination.totalPages > 1 && (
                <Stack spacing={2} alignItems="center" data-testid={`${TID}-pagination`} sx={{ mt: { xs: 3, md: 4 }, mb: { xs: 2, md: 2 }, position: "relative" }}>
                  {loading && items.length > 0 && (
                    <Box sx={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", zIndex: 1 }}>
                      <CircularProgress size={16} thickness={4} />
                    </Box>
                  )}
                  <Pagination
                    data-testid={`${TID}-pages`}
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
                    data-testid={`${TID}-pagination-summary`}
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    Mostrando {items.length} de {pagination.totalItems} acolhido(s)
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </>
      )}

      <ShelteredFormDialog
        mode={ShelteredFormMode.CREATE}
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
        mode={ShelteredFormMode.EDIT}
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
