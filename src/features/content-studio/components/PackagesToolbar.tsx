import Clear from "@mui/icons-material/Clear";
import Refresh from "@mui/icons-material/Refresh";
import Search from "@mui/icons-material/Search";
import { Box, Button, Chip, IconButton, InputAdornment, MenuItem, Stack, TextField } from "@mui/material";

import { QUICK_STATUS_FILTERS } from "../production.utils";
import type { ContentAudience, ContentAudienceDefinitionResponse, ContentPackageStatus } from "../types";

interface PackagesToolbarProps {
  search: string;
  status: ContentPackageStatus | "";
  audience: ContentAudience | "";
  audiences: readonly ContentAudienceDefinitionResponse[];
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ContentPackageStatus | "") => void;
  onAudienceChange: (value: ContentAudience | "") => void;
  onClear: () => void;
  onRefresh: () => void;
}

/** Busca (a cada digitação, com espera), atalhos de situação e filtro por faixa etária. */
export function PackagesToolbar({
  search,
  status,
  audience,
  audiences,
  hasFilters,
  onSearchChange,
  onStatusChange,
  onAudienceChange,
  onClear,
  onRefresh,
}: PackagesToolbarProps) {
  return (
    <Stack spacing={2} data-testid="content-studio-production-filters">
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por tema ou referência bíblica"
          label="Buscar"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Limpar busca" onClick={() => onSearchChange("")}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          inputProps={{ "data-testid": "content-studio-package-search" }}
        />
        <TextField
          select
          size="small"
          label="Faixa etária"
          value={audience}
          onChange={(event) => onAudienceChange(event.target.value as ContentAudience | "")}
          sx={{ minWidth: { md: 200 } }}
          inputProps={{ "data-testid": "content-studio-production-audience-filter" }}
        >
          <MenuItem value="">Todas as faixas</MenuItem>
          {audiences.map((item) => (
            <MenuItem key={item.audience} value={item.audience}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={0.5}>
          {hasFilters && (
            <Button onClick={onClear} size="small" sx={{ minHeight: 40 }}>
              Limpar filtros
            </Button>
          )}
          <Button onClick={onRefresh} size="small" startIcon={<Refresh />} sx={{ minHeight: 40 }}>
            Atualizar
          </Button>
        </Stack>
      </Stack>

      <Box
        role="group"
        aria-label="Filtrar por situação"
        sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
        data-testid="content-studio-status-chips"
      >
        {QUICK_STATUS_FILTERS.map((filter) => {
          const selected = status === filter.status;
          return (
            <Chip
              key={filter.label}
              label={filter.label}
              clickable
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() => onStatusChange(filter.status)}
              aria-pressed={selected}
              sx={{ minHeight: 36 }}
            />
          );
        })}
      </Box>
    </Stack>
  );
}
