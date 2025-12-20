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
  Fab,
  Typography,
  InputAdornment,
} from "@mui/material";
import { Add, Refresh, CleaningServices, Search as SearchIcon, Clear } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { ShelterFilters } from "./types";
import { selectIsAdmin } from "@/store/selectors/routeSelectors";

type Props = {
  filters: ShelterFilters;
  onChange: (updater: (prev: ShelterFilters) => ShelterFilters) => void;
  onCreateClick: () => void;
  onRefreshClick: () => void;
  isXs?: boolean;
};

export default function SheltersToolbar({
  filters,
  onChange,
  onCreateClick,
  onRefreshClick,
  isXs,
}: Props) {
  const isAdmin = useSelector(selectIsAdmin);

  const handleChange = <K extends keyof ShelterFilters>(
    key: K,
    value: ShelterFilters[K]
  ) => {
    onChange((prev) => {
      const newFilters = { ...prev, [key]: value };
      
      // Mapear filtros internos para filtros principais da API
      if (key === 'shelterSearchString') {
        newFilters.shelterName = value as string | undefined;
        // Limpar filtro legado se estiver usando o novo
        if (value) {
          newFilters.nameSearchString = undefined;
          newFilters.searchString = undefined;
        }
      } else if (key === 'userSearchString') {
        newFilters.staffFilters = value as string | undefined;
      } else if (key === 'city' || key === 'addressSearchString') {
        newFilters.addressFilter = value as string | undefined;
      }
      
      return newFilters;
    });
  };

  const handleClear = () => {
    onChange(() => ({
      // Filtros principais
      shelterName: undefined,
      staffFilters: undefined,
      addressFilter: undefined,
      
      // Filtros legados para compatibilidade (estes são os que aparecem nos campos)
      addressSearchString: undefined,
      userSearchString: undefined,
      shelterSearchString: undefined,
      searchString: undefined,
      city: undefined,
      state: undefined,
      leaderId: undefined,
      teacherId: undefined,
      hasLeaders: undefined,
      hasTeachers: undefined,
      leaderIds: undefined,
      teacherIds: undefined,
    }));
  };

  const hasFilters = Boolean(
    filters.shelterSearchString || filters.userSearchString || filters.city
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

      <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Nome do Abrigo"
            value={filters.shelterSearchString ?? ""}
            onChange={(e) => handleChange("shelterSearchString", e.target.value || undefined)}
            placeholder="Nome do abrigo"
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

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Staff (Líderes e Professores)"
            value={filters.userSearchString ?? ""}
            onChange={(e) => handleChange("userSearchString", e.target.value || undefined)}
            placeholder="Nome, email ou telefone"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: filters.userSearchString && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleChange("userSearchString", undefined)}
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

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Endereço"
            value={filters.city ?? ""}
            onChange={(e) => handleChange("city", e.target.value || undefined)}
            placeholder="Rua, bairro, cidade, estado ou CEP"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: filters.city && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleChange("city", undefined)}
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

        <Grid item xs={12}>
          {isXs ? (
            <>
              <Box sx={{ height: 64 }} />
              <Box
                sx={{
                  position: "fixed",
                  bottom: 16,
                  right: 16,
                  zIndex: 9999,
                }}
              >
                <Stack spacing={1.5} alignItems="flex-end">
                  {hasFilters && (
                    <Tooltip title="Limpar filtros">
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

                  <Tooltip title="Recarregar">
                    <Fab
                      size="medium"
                      aria-label="Recarregar"
                      onClick={onRefreshClick}
                      sx={{ boxShadow: 4 }}
                    >
                      <Refresh />
                    </Fab>
                  </Tooltip>

                  {isAdmin && (
                    <Tooltip title="Criar Abrigo">
                      <Fab
                        size="medium"
                        color="primary"
                        aria-label="Criar Abrigo"
                        onClick={onCreateClick}
                        sx={{ boxShadow: 4 }}
                      >
                        <Add />
                      </Fab>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            </>
          ) : (
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
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

              <Tooltip title="Recarregar">
                <IconButton
                  onClick={onRefreshClick}
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

              {isAdmin && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={onCreateClick}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    boxShadow: 2,
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                >
                  Criar Abrigo
                </Button>
              )}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
