import React from "react";
import {
  Button,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  Paper,
  Stack,
  Box,
  MenuItem,
  Fab,
  Typography,
  InputAdornment,
} from "@mui/material";
import { Refresh, Clear, Search as SearchIcon, CleaningServices } from "@mui/icons-material";

export type TeacherFilters = {
  teacherSearchString?: string;
  shelterSearchString?: string;
  hasShelter?: boolean;
  teamId?: string;
  teamName?: string;
  hasTeam?: boolean;
};

type Props = {
  filters: TeacherFilters;
  onChange: (updater: (prev: TeacherFilters) => TeacherFilters) => void;
  onRefreshClick: () => void;
  isXs?: boolean;
};

export default function TeacherToolbar({
  filters,
  onChange,
  onRefreshClick,
  isXs,
}: Props) {
  const handleChange = <K extends keyof TeacherFilters>(
    key: K,
    value: TeacherFilters[K]
  ) => onChange((prev) => ({ ...prev, [key]: value }));

  const handleClear = () => {
    onChange(() => ({
      teacherSearchString: "",
      shelterSearchString: "",
      hasShelter: undefined,
      teamId: undefined,
      teamName: undefined,
      hasTeam: undefined,
    }));
  };

  const hasFilters = Boolean(
    filters.teacherSearchString || filters.shelterSearchString || filters.hasShelter !== undefined
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
        {/* Busca por Professor */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Busca por Professor"
            value={filters.teacherSearchString ?? ""}
            onChange={(e) => handleChange("teacherSearchString", e.target.value || undefined)}
            placeholder="Nome, email, telefone do professor"
            inputProps={{ "aria-label": "Campo de busca por professor" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: filters.teacherSearchString && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleChange("teacherSearchString", undefined)}
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
            onChange={(e) => handleChange("shelterSearchString", e.target.value || undefined)}
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
                    onClick={() => handleChange("shelterSearchString", undefined)}
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
          <TextField
            select
            fullWidth
            size="small"
            label="Vínculo"
            value={
              filters.hasShelter === undefined ? "" : filters.hasShelter ? "true" : "false"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                handleChange("hasShelter", undefined);
              } else {
                handleChange("hasShelter", value === "true");
              }
            }}
            sx={{
              borderRadius: 2,
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Com abrigo</MenuItem>
            <MenuItem value="false">Sem abrigo</MenuItem>
          </TextField>
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
                  onClick={handleClear}
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
                  onClick={onRefreshClick}
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
              onClick={onRefreshClick}
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
                onClick={handleClear}
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
