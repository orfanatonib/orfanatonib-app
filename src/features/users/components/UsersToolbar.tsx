import React from "react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  FormGroup,
  Paper,
  Fab,
  Typography,
  InputAdornment,
} from "@mui/material";
import { Add, Refresh, Search as SearchIcon, Clear, CleaningServices } from "@mui/icons-material";
import { UserFilters } from "../types";
import { UserRole } from "@/store/slices/auth/authSlice";

type Props = {
  filters: UserFilters;
  onChange: (updater: (prev: UserFilters) => UserFilters) => void;
  onCreate: () => void;
  onRefresh: () => void;
  isXs?: boolean;
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.LEADER]: "Líder",
  [UserRole.MEMBER]: "Membro",
  [UserRole.ADMIN]: "Administrador",
};

export default function UsersToolbar({
  filters,
  onChange,
  onCreate,
  onRefresh,
  isXs,
}: Props) {
  const roleOptions = ["all", UserRole.LEADER, UserRole.MEMBER] as const;

  const hasFilters = Boolean(filters.q || filters.role !== "all" || filters.onlyActive || filters.onlyCompleted);

  const handleClear = () => {
    onChange(() => ({
      q: "",
      role: "all",
      onlyActive: false,
      onlyCompleted: false,
    }));
  };

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
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            size="small"
            label="Buscar (nome, e-mail, telefone, papel)"
            value={filters.q}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, q: e.target.value }))
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: filters.q && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onChange((prev) => ({ ...prev, q: "" }))}
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

        <Grid item xs={12} md={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Papel</InputLabel>
            <Select
              value={filters.role}
              label="Papel"
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  role: e.target.value as (typeof roleOptions)[number],
                }))
              }
              sx={{
                borderRadius: 2,
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              {roleOptions
                .filter((role) => role !== "all")
                .map((role) => (
                  <MenuItem key={role} value={role}>
                    {roleLabels[role]}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1.5, sm: 2 },
              alignItems: { xs: "flex-start", sm: "center" },
              flexWrap: "wrap",
            }}
          >
            <Tooltip title="Exibe apenas usuários que estão ativos no sistema">
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.onlyActive}
                    onChange={(e) =>
                      onChange((p) => ({ ...p, onlyActive: e.target.checked }))
                    }
                    size="small"
                  />
                }
                label="Apenas ativos"
                sx={{ m: 0 }}
              />
            </Tooltip>

            <Tooltip title="Exibe apenas usuários que concluíram o cadastro">
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.onlyCompleted}
                    onChange={(e) =>
                      onChange((p) => ({ ...p, onlyCompleted: e.target.checked }))
                    }
                    size="small"
                  />
                }
                label="Apenas completos"
                sx={{ m: 0 }}
              />
            </Tooltip>
          </Box>
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    alignItems: "flex-end",
                  }}
                >
                  {hasFilters && (
                    <Tooltip title="Limpar Filtros">
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
                      onClick={onRefresh}
                      sx={{ boxShadow: 4 }}
                    >
                      <Refresh />
                    </Fab>
                  </Tooltip>
                  <Tooltip title="Criar Usuário">
                    <Fab
                      size="medium"
                      color="primary"
                      aria-label="Criar usuário"
                      onClick={onCreate}
                      sx={{ boxShadow: 4 }}
                    >
                      <Add />
                    </Fab>
                  </Tooltip>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
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
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={onCreate}
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
                Criar Usuário
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
