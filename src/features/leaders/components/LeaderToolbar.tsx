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
    }));

  const hasFilters = Boolean(
    filters.leaderSearchString || filters.shelterSearchString || filters.hasShelter !== undefined
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
        {/* Busca por Líder */}
        <Grid item xs={12} sm={6} md={4}>
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

        {/* Busca por Abrigo */}
        <Grid item xs={12} sm={6} md={4}>
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

        {/* Filtro de Vínculo */}
        <Grid item xs={12} sm={6} md={2}>
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

        {/* Botões de Ação */}
        <Grid item xs={12} sm={6} md={2}>
          {isXs ? (
            <Box sx={{ height: 40 }} />
          ) : (
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
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
          )}
        </Grid>
      </Grid>

      {/* FABs para Mobile */}
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
