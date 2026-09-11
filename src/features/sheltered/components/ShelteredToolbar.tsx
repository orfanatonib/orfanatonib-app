import React from "react";
import {
  Box,
  Button,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, CleaningServices, Clear, Refresh, Search } from "@mui/icons-material";
import {
  MIN_TOUCH_TARGET_PX,
  GENDER_LABELS,
  SHELTERED_FILTERS_EMPTY,
  SHELTERED_TESTID,
} from "../constants";
import { ShelteredGender } from "../enums";
import { hasActiveFilters } from "../utils";
import type { ShelteredFilters } from "../types";
import DateRangeFilter from "./DateRangeFilter";

type Props = {
  filters: ShelteredFilters;
  onChange: (updater: (previous: ShelteredFilters) => ShelteredFilters) => void;
  onCreateClick: () => void;
  onRefreshClick: () => void;
  isXs?: boolean;
};

type TextFilterKey = Extract<
  keyof ShelteredFilters,
  "searchString" | "shelterSearchingString" | "addressFilter"
>;

const TEXT_FILTERS: ReadonlyArray<{
  key: TextFilterKey;
  label: string;
  placeholder: string;
  testId: string;
  columns: number;
}> = [
  {
    key: "searchString",
    label: "Busca Geral",
    placeholder: "Nome do acolhido, responsável ou telefone",
    testId: "sheltered-filter-search",
    columns: 4,
  },
  {
    key: "shelterSearchingString",
    label: "Busca por Abrigo",
    placeholder: "Nome, cidade ou estado do abrigo",
    testId: "sheltered-filter-shelter",
    columns: 2,
  },
  {
    key: "addressFilter",
    label: "Endereço",
    placeholder: "Rua, bairro, cidade",
    testId: "sheltered-filter-address",
    columns: 3,
  },
];

export default function ShelteredToolbar({
  filters,
  onChange,
  onCreateClick,
  onRefreshClick,
  isXs,
}: Props) {
  const setFilter = <TKey extends keyof ShelteredFilters>(
    key: TKey,
    value: ShelteredFilters[TKey],
  ) => onChange((previous) => ({ ...previous, [key]: value }));

  const clearFilters = () => onChange(() => ({ ...SHELTERED_FILTERS_EMPTY }));

  const showClear = hasActiveFilters(filters);

  return (
    <Paper
      data-testid={SHELTERED_TESTID.TOOLBAR}
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
        {TEXT_FILTERS.map(({ key, label, placeholder, testId, columns }) => {
          const value = filters[key] ?? "";
          return (
            <Grid item xs={12} md={columns} key={key}>
              <TextField
                fullWidth
                size="small"
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={(event) => setFilter(key, event.target.value)}
                data-testid={testId}
                inputProps={{ "aria-label": label }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: value ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => setFilter(key, "")}
                        aria-label={`Limpar ${label}`}
                        data-testid={`${testId}-clear`}
                        sx={{
                          minWidth: MIN_TOUCH_TARGET_PX,
                          minHeight: MIN_TOUCH_TARGET_PX,
                        }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
            </Grid>
          );
        })}

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="sheltered-filter-gender-label">Gênero</InputLabel>
            <Select
              labelId="sheltered-filter-gender-label"
              label="Gênero"
              value={filters.gender ?? ""}
              onChange={(event) => {
                const { value } = event.target;
                setFilter(
                  "gender",
                  value === ShelteredGender.MALE || value === ShelteredGender.FEMALE
                    ? value
                    : undefined,
                );
              }}
              data-testid="sheltered-filter-gender"
            >
              <MenuItem value="" data-testid="sheltered-filter-gender-all">
                Todos
              </MenuItem>
              <MenuItem
                value={ShelteredGender.MALE}
                data-testid="sheltered-filter-gender-male"
              >
                {GENDER_LABELS[ShelteredGender.MALE]}
              </MenuItem>
              <MenuItem
                value={ShelteredGender.FEMALE}
                data-testid="sheltered-filter-gender-female"
              >
                {GENDER_LABELS[ShelteredGender.FEMALE]}
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <DateRangeFilter
            label="Nascimento"
            testId="sheltered-filter-birth-date"
            from={filters.birthDateFrom}
            to={filters.birthDateTo}
            onChange={(from, to) =>
              onChange((previous) => ({
                ...previous,
                birthDateFrom: from,
                birthDateTo: to,
              }))
            }
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <DateRangeFilter
            label="No Abrigo"
            testId="sheltered-filter-joined-at"
            from={filters.joinedFrom}
            to={filters.joinedTo}
            onChange={(from, to) =>
              onChange((previous) => ({
                ...previous,
                joinedFrom: from,
                joinedTo: to,
              }))
            }
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
                  zIndex: (theme) => theme.zIndex.speedDial,
                  display: { xs: "block", md: "none" },
                }}
              >
                <Stack spacing={1} alignItems="flex-end">
                  <Tooltip title="Limpar filtros">
                    <Fab
                      size="small"
                      color="secondary"
                      aria-label="Limpar filtros"
                      onClick={clearFilters}
                      data-testid="sheltered-clear-filters-fab"
                    >
                      <CleaningServices fontSize="small" />
                    </Fab>
                  </Tooltip>

                  <Tooltip title="Recarregar">
                    <Fab
                      size="small"
                      aria-label="Recarregar lista"
                      onClick={onRefreshClick}
                      data-testid="sheltered-refresh-fab"
                    >
                      <Refresh fontSize="small" />
                    </Fab>
                  </Tooltip>

                  <Tooltip title="Criar acolhido">
                    <Fab
                      color="primary"
                      aria-label="Criar acolhido"
                      onClick={onCreateClick}
                      data-testid="sheltered-create-fab"
                    >
                      <Add />
                    </Fab>
                  </Tooltip>
                </Stack>
              </Box>
            </>
          ) : (
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              flexWrap="wrap"
              useFlexGap
            >
              {showClear && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CleaningServices />}
                  onClick={clearFilters}
                  data-testid="sheltered-clear-filters"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 2,
                    minHeight: MIN_TOUCH_TARGET_PX,
                  }}
                >
                  Limpar
                </Button>
              )}
              <Tooltip title="Recarregar">
                <IconButton
                  onClick={onRefreshClick}
                  aria-label="Recarregar lista"
                  data-testid="sheltered-refresh"
                  sx={{
                    borderRadius: 2,
                    minWidth: MIN_TOUCH_TARGET_PX,
                    minHeight: MIN_TOUCH_TARGET_PX,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={onCreateClick}
                data-testid="sheltered-create"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  boxShadow: 2,
                  minHeight: MIN_TOUCH_TARGET_PX,
                  "&:hover": { boxShadow: 4 },
                }}
              >
                Criar Acolhido
              </Button>
            </Stack>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
