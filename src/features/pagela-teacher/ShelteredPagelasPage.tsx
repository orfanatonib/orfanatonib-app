import * as React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Alert,
  Snackbar,
  Grid,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Avatar,
  Chip,
  Stack,
  Fab,
  SwipeableDrawer,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { ArrowBack, FamilyRestroom, Phone, Add } from "@mui/icons-material";
import { useShelteredPagelas } from "./hooks";
import { apiFetchSheltered } from "../sheltered/api";
import PagelaList from "./components/PagelaList";
import PagelaQuickForm from "./components/PagelaQuickForm";
import type { ShelteredSimpleResponseDto } from "../sheltered/types";
import type { Pagela } from "./types";

function genderPastel(seed: string, gender?: string) {
  const g = (gender || "").toUpperCase();
  
  if (g === "F") {
    // Feminino: Tons de rosa/vermelho suave
    return {
      solid: "#e91e63", // Rosa vibrante
      soft: "#f8bbd0", // Rosa claro
      light: "#fce4ec", // Rosa muito claro
    };
  } else if (g === "M") {
    // Masculino: Tons de azul
    return {
      solid: "#2196f3", // Azul vibrante
      soft: "#90caf9", // Azul claro
      light: "#e3f2fd", // Azul muito claro
    };
  } else {
    // Neutro: Tons de cinza/roxo
    return {
      solid: "#9e9e9e", // Cinza
      soft: "#e0e0e0", // Cinza claro
      light: "#f5f5f5", // Cinza muito claro
    };
  }
}

const TEACHER_PROFILE_ID: string | null = null;

export default function ShelteredPagelasPage() {
  const { shelteredId = "" } = useParams();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { sheltered?: ShelteredSimpleResponseDto } };
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [sheltered, setSheltered] = React.useState<ShelteredSimpleResponseDto | null>(
    loc.state?.sheltered || null
  );
  const [loadingShelteredren, setLoadingShelteredren] = React.useState(false);
  const [cError, setCErr] = React.useState("");

  React.useEffect(() => {
    if (!loc.state?.sheltered && shelteredId) {
      setLoadingShelteredren(true);
      setCErr("");
      apiFetchSheltered(shelteredId)
        .then((data) => {
          setSheltered({
            id: data.id,
            name: data.name,
            guardianName: data.guardianName || null,
            gender: data.gender,
            guardianPhone: data.guardianPhone || null,
            shelterId: data.shelter?.id || null,
            active: data.active,
            acceptedChrists: data.acceptedChrists || [],
          });
        })
        .catch((err: any) => {
          setCErr(err?.response?.data?.message || err.message || "Erro ao carregar abrigado");
        })
        .finally(() => {
          setLoadingShelteredren(false);
        });
    }
  }, [shelteredId, loc.state?.sheltered]);
  const colors = React.useMemo(
    () => genderPastel(sheltered?.name || shelteredId, (sheltered as any)?.gender),
    [sheltered, shelteredId]
  );

  const limit = React.useMemo(() => (isXs ? 5 : 9), [isXs]);
  
  const { filters, list, actions } = useShelteredPagelas(shelteredId, { limit });

  const [snack, setSnack] = React.useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  const showSnack = (m: string, s: typeof snack.severity = "success") =>
    setSnack({ open: true, message: m, severity: s });
  const closeSnack = (_?: unknown, r?: string) => {
    if (r === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  };

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [formInitial, setFormInitial] = React.useState<Pagela | null>(null);

  const findPagela = React.useCallback(
    (y: number, v: number) =>
      list.rows.find((r) => r.sheltered.id === shelteredId && r.year === y && r.visit === v) ?? null,
    [list.rows, shelteredId]
  );

  const openCreate = () => {
    setFormInitial(null);
    setSheetOpen(true);
  };
  const openEdit = (p: Pagela) => {
    setFormInitial(p);
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

  const initials = React.useMemo(() => {
    const parts = (sheltered?.name || "").trim().split(/\s+/).slice(0, 2);
    return parts.map((p: string) => p?.[0]?.toUpperCase() || "").join("");
  }, [sheltered?.name]);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 3, md: 5 },
        pb: 6,
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2 },
          mb: 2,
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          position: "relative",
          background: `linear-gradient(135deg, ${colors.soft} 0%, ${colors.solid} 100%)`,
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <Box sx={{ position: "absolute", top: -24, left: -24, width: 130, height: 130, borderRadius: "50%", bgcolor: "rgba(255,255,255,.28)", filter: "blur(3px)" }} />
          <Box sx={{ position: "absolute", bottom: -28, right: -28, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,.18)", filter: "blur(2px)" }} />
        </Box>

        {isXs ? (
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Stack spacing={0.75}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <IconButton
                  size="small"
                  onClick={() => nav(-1)}
                  aria-label="Voltar"
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "background.paper",
                    boxShadow: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": { bgcolor: "background.paper" },
                  }}
                >
                  <ArrowBack />
                </IconButton>

                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    border: "3px solid",
                    borderColor: "background.paper",
                    bgcolor: colors.solid,
                    fontWeight: 900,
                    flex: "0 0 auto",
                  }}
                >
                  {initials || "?"}
                </Avatar>
              </Box>

              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.15,
                  color: "#2c3e50",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
                title={sheltered?.name}
              >
                {sheltered?.name || "Abrigado"}
              </Typography>

              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "rgba(0,0,0,.75)" }}>
                <FamilyRestroom fontSize="small" />
                <Typography variant="body2" noWrap title={sheltered?.guardianName || "—"}>
                  {sheltered?.guardianName || "—"}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "rgba(0,0,0,.75)" }}>
                <Phone fontSize="small" />
                <Typography variant="body2" noWrap title={sheltered?.guardianPhone || "—"}>
                  {sheltered?.guardianPhone || "—"}
                </Typography>
              </Stack>

              {sheltered?.shelterId && (
                <Chip
                  size="small"
                  color="success"
                  label="Abrigo"
                  sx={{ fontWeight: 800, height: 22, alignSelf: "flex-start", "& .MuiChip-label": { px: 0.75 } }}
                />
              )}
            </Stack>
          </Box>
        ) : (
          <Grid
            container
            spacing={{ xs: 1.5, md: 2 }}
            alignItems="center"
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Grid item>
              <IconButton
                size="small"
                onClick={() => nav(-1)}
                aria-label="Voltar"
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "background.paper",
                  boxShadow: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "background.paper" },
                }}
              >
                <ArrowBack />
              </IconButton>
            </Grid>

            <Grid item xs>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    border: "3px solid",
                    borderColor: "background.paper",
                    bgcolor: colors.solid,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {initials || "?"}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#2c3e50",
                      lineHeight: 1.1,
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      fontWeight: 700,
                    }}
                  >
                    Pagela {((sheltered as any)?.gender === "F" ? "da" : "do")}{" "}
                    <Box component="span" sx={{ fontWeight: 900 }}>
                      {sheltered?.name || "Abrigado"}
                    </Box>
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ color: "rgba(0,0,0,.72)", flexWrap: "wrap" }}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <FamilyRestroom fontSize="small" />
                      <Typography variant="body2" noWrap>
                        {sheltered?.guardianName || "—"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Phone fontSize="small" />
                      <Typography variant="body2" noWrap>
                        {sheltered?.guardianPhone || "—"}
                      </Typography>
                    </Stack>
                    {sheltered?.shelterId && (
                      <Chip
                        size="small"
                        color="success"
                        label="Abrigo"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Grid>
          </Grid>

        )}
      </Paper>

      {(list.error || cError) && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => {
            list.setError("");
            setCErr("");
          }}
        >
          {list.error || cError}
        </Alert>
      )}

      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        <Grid item xs={12} lg={5}>
          {(list.loading && !list.rows.length) || loadingShelteredren ? (
            <Box textAlign="center" my={4}>
              <CircularProgress />
            </Box>
          ) : sheltered ? (
            isXs ? null : (
              <PagelaQuickForm
                initial={formInitial}
                shelteredId={shelteredId}
                shelteredName={sheltered?.name || ""}
                shelteredGender={sheltered?.gender || ""}
                defaultYear={0}
                defaultVisit={0}
                teacherProfileId={TEACHER_PROFILE_ID}
                findPagela={findPagela}
                onCreate={async (p) => {
                  await actions.create(p);
                  showSnack("Pagela salva!");
                }}
                onUpdate={async (id, p) => {
                  await actions.update(id, p);
                  showSnack("Pagela atualizada!");
                }}
              />
            )
          ) : null}
        </Grid>

        <Grid item xs={12} lg={7}>
          <Paper
            sx={{
              p: { xs: 1.5, md: 2 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.25 }}>
              Pagelas anteriores
            </Typography>
            <PagelaList
              rows={list.rows}
              total={list.total}
              page={list.page}
              limit={list.limit}
              setPage={list.setPage}
              filters={filters}
              onEdit={(row) => {
                if (isXs) {
                  openEdit(row);
                } else {
                  setFormInitial(row);
                }
              }}
              onDelete={async (row) => {
                await actions.remove(row.id);
                showSnack("Pagela excluída.", "info");
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {isXs && (
        <Fab
          color="primary"
          aria-label="Criar pagela"
          onClick={openCreate}
          sx={{ position: "fixed", bottom: 88, right: 16, zIndex: 1300 }}
        >
          <Add />
        </Fab>
      )}

      {isXs && (
        <SwipeableDrawer
          anchor="bottom"
          open={sheetOpen}
          onOpen={() => setSheetOpen(true)}
          onClose={closeSheet}
          disableSwipeToOpen={false}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: { height: "86vh", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
          }}
        >
          <Box sx={{ p: 1.25, pb: 2, height: "100%", overflow: "auto" }}>
            <PagelaQuickForm
              initial={formInitial}
              shelteredId={shelteredId}
              shelteredName={sheltered?.name || ""}
              shelteredGender={sheltered?.gender || ""}
              defaultYear={0}
              defaultVisit={0}
              teacherProfileId={TEACHER_PROFILE_ID}
              findPagela={findPagela}
              onCreate={async (p) => {
                await actions.create(p);
                showSnack("Pagela salva!");
                closeSheet();
              }}
              onUpdate={async (id, p) => {
                await actions.update(id, p);
                showSnack("Pagela atualizada!");
                closeSheet();
              }}
              onClose={closeSheet}
            />
          </Box>
        </SwipeableDrawer>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={2800}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert elevation={6} variant="filled" severity={snack.severity} onClose={closeSnack}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
