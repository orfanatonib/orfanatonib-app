import React from "react";
import {
  Paper,
  Grid,
  TextField,
  Stack,
  Button,
  Tooltip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Fab,
  Typography,
  InputAdornment,
} from "@mui/material";
import { Clear, Refresh, Search as SearchIcon, CleaningServices } from "@mui/icons-material";
import type { LeaderFilters } from "../types";

type Props = {
  filters: LeaderFilters;
  onChange: (updater: (prev: LeaderFilters) => LeaderFilters) => void;
  onRefresh: () => void;
  isXs?: boolean;
};

export default function LeaderToolbar({
  filters,
  onChange,
  onRefresh,
  isXs,
}: Props) {
  const set = <K extends keyof LeaderFilters>(
    key: K,
    val: LeaderFilters[K]
  ) => onChange((prev) => ({ ...prev, [key]: val }));

  const clear = () =>
    onChange(() => ({
      leaderSearchString: "",
      shelterSearchString: "",
      hasShelter: undefined,
      teamId: undefined,
      teamName: undefined,
      hasTeam: undefined,
    }));

  const hasFilters = Boolean(
    filters.leaderSearchString ||
    filters.shelterSearchString ||
    filters.hasShelter !== undefined ||
    filters.teamId ||
    filters.teamName ||
    filters.hasTeam !== undefined
  );

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        mb: 3,
        borderRadius: 2,
        boxShadow: 2,
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{ mb: 3, color: "text.primary", fontSize: { xs: "1.1rem", md: "1.25rem" } }}
      >
        Pesquisar
      </Typography>

      <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Busca por Líder"
              value={filters.leaderSearchString ?? ""}
              onChange={(e) => set("leaderSearchString", e.target.value || undefined)}
              placeholder="Nome, email, telefone do líder"
              inputProps={{ "aria-label": "Campo de busca por líder" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: filters.leaderSearchString && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => set("leaderSearchString", undefined)}
                      edge="end"
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  },
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Busca por Abrigo"
              value={filters.shelterSearchString ?? ""}
              onChange={(e) => set("shelterSearchString", e.target.value || undefined)}
              placeholder="Todos os campos do abrigo"
              inputProps={{ "aria-label": "Campo de busca por abrigo" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: filters.shelterSearchString && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => set("shelterSearchString", undefined)}
                      edge="end"
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  },
                },
              }}
            />
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="has-shelter-label">Vínculo</InputLabel>
              <Select
                labelId="has-shelter-label"
                label="Vínculo"
                value={filters.hasShelter ?? "all"}
                onChange={(e) => {
                  const value = e.target.value;
                  let hasShelterValue: boolean | undefined;

                  if (value === "all") {
                    hasShelterValue = undefined;
                  } else if (value === "true") {
                    hasShelterValue = true;
                  } else if (value === "false") {
                    hasShelterValue = false;
                  }

                  set("hasShelter", hasShelterValue);
                }}
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="true">Com abrigo</MenuItem>
                <MenuItem value="false">Sem abrigo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Nº da Equipe"
              value={filters.teamName ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                set("teamName", value ? value : undefined);
              }}
              placeholder="Ex: 1, 2, 3..."
              inputProps={{
                "aria-label": "Número da equipe",
                min: 1
              }}
              InputProps={{
                endAdornment: filters.teamName && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => set("teamName", undefined)}
                      edge="end"
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  },
                },
              }}
            />
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="has-team-label">Equipe</InputLabel>
              <Select
                labelId="has-team-label"
                label="Equipe"
                value={filters.hasTeam ?? "all"}
                onChange={(e) => {
                  const value = e.target.value;
                  let hasTeamValue: boolean | undefined;

                  if (value === "all") {
                    hasTeamValue = undefined;
                  } else if (value === "true") {
                    hasTeamValue = true;
                  } else if (value === "false") {
                    hasTeamValue = false;
                  }

                  set("hasTeam", hasTeamValue);
                }}
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="true">Com equipe</MenuItem>
                <MenuItem value="false">Sem equipe</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {}
          <Grid
            item
            xs={12}
            sm={12}
            md={12}
            sx={{
              display: { xs: "none", md: "flex" },
              justifyContent: "flex-end",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              {hasFilters && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CleaningServices />}
                  onClick={clear}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2,
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
              <Tooltip title="Recarregar dados">
                <IconButton
                  onClick={onRefresh}
                  aria-label="Recarregar"
                  sx={{
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>

      {isXs && (
        <Box
          sx={{
            position: "fixed",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            right: "calc(env(safe-area-inset-right, 0px) + 16px)",
            zIndex: 1300,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Tooltip title="Recarregar dados" placement="left">
            <Fab
              size="medium"
              aria-label="Recarregar"
              onClick={onRefresh}
              sx={{ boxShadow: 4 }}
            >
              <Refresh />
            </Fab>
          </Tooltip>
          
          {hasFilters && (
            <Tooltip title="Limpar filtros" placement="left">
              <Fab
                size="medium"
                color="secondary"
                aria-label="Limpar filtros"
                onClick={clear}
                sx={{ boxShadow: 4 }}
              >
                <CleaningServices />
              </Fab>
            </Tooltip>
          )}
        </Box>
      )}
    </Paper>
  );
}
