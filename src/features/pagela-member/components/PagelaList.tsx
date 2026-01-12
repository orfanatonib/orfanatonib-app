import * as React from "react";
import {
  Grid,
  Pagination,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PagelaCard from "./PagelaCard";
import type { Pagela } from "../types";
import type { Tri } from "../hooks";

type FiltersProps = {
  year?: number;
  visit?: number;
  presentQ: Tri;
  setYear: (v?: number) => void;
  setVisit: (v?: number) => void;
  setPresentQ: (v: Tri) => void;
  clearFilters: () => void;
};

const DEBOUNCE_MS = 450;

export default function PagelaList({
  rows,
  total,
  page,
  limit,
  setPage,
  filters,
  onEdit,
  onDelete,
}: {
  rows: Pagela[];
  total: number;
  page: number;
  limit: number;
  setPage: (p: number) => void;
  filters: FiltersProps;
  onEdit: (r: Pagela) => void;
  onDelete: (r: Pagela) => Promise<void>;
}) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const hasAny =
    filters.year !== undefined ||
    filters.visit !== undefined ||
    filters.presentQ !== "any";

  const [yearText, setYearText] = React.useState<string>(filters.year?.toString() ?? "");
  const [visitText, setVisitText] = React.useState<string>(filters.visit?.toString() ?? "");

  React.useEffect(() => {
    setYearText(filters.year?.toString() ?? "");
  }, [filters.year]);

  React.useEffect(() => {
    setVisitText(filters.visit?.toString() ?? "");
  }, [filters.visit]);

  const applyYearFromText = React.useCallback(() => {
    const raw = yearText.trim();
    if (raw === "") {
      if (filters.year !== undefined) filters.setYear(undefined);
      return;
    }
    const digits = raw.replace(/\D+/g, "");
    if (!digits) return;
    const n = Math.floor(Number(digits));
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(2000, Math.min(9999, n));
    if (clamped !== filters.year) filters.setYear(clamped);
    setYearText(String(clamped)); 
  }, [yearText, filters.year, filters.setYear]);

  const applyVisitFromText = React.useCallback(() => {
    const raw = visitText.trim();
    if (raw === "") {
      if (filters.visit !== undefined) filters.setVisit(undefined);
      return;
    }
    const digits = raw.replace(/\D+/g, "");
    if (!digits) return;
    const n = Math.floor(Number(digits));
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(1, Math.min(53, n));
    if (clamped !== filters.visit) filters.setVisit(clamped);
    setVisitText(String(clamped));
  }, [visitText, filters.visit, filters.setVisit]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      const raw = yearText.trim();
      if (raw === "") {
        if (filters.year !== undefined) filters.setYear(undefined);
        return;
      }
      const digits = raw.replace(/\D+/g, "");
      if (digits.length !== 4) return;
      const n = Number(digits);
      if (!Number.isFinite(n)) return;
      const clamped = Math.max(2000, Math.min(9999, Math.floor(n)));
      if (clamped !== filters.year) filters.setYear(clamped);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [yearText, filters.year, filters.setYear]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      const raw = visitText.trim();
      if (raw === "") {
        if (filters.visit !== undefined) filters.setVisit(undefined);
        return;
      }
      const digits = raw.replace(/\D+/g, "");
      if (digits.length < 1) return; 
      const n = Number(digits);
      if (!Number.isFinite(n)) return;
      const clamped = Math.max(1, Math.min(53, Math.floor(n)));
      if (clamped !== filters.visit) filters.setVisit(clamped);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [visitText, filters.visit, filters.setVisit]);

  const handleYearChange = (v: string) => {
    const digits = v.replace(/\D+/g, "").slice(0, 4);
    setYearText(digits);
  };
  const handleVisitChange = (v: string) => {
    const digits = v.replace(/\D+/g, "").slice(0, 2);
    setVisitText(digits);
  };

  const onKeyDownApply =
    (apply: () => void) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") apply();
    };

  return (
    <Stack spacing={1.75}>
      <Box
        sx={{
          display: "grid",
          gap: 1,
          pt: 1,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(5, minmax(140px, 1fr))" },
          alignItems: "center",
          overflowX: "auto",
          pb: 0.5,
        }}
      >
        <TextField
          label="Ano"
          margin="dense"
          size="small"
          type="text"
          value={yearText}
          onChange={(e) => handleYearChange(e.target.value)}
          onBlur={applyYearFromText}
          onKeyDown={onKeyDownApply(applyYearFromText)}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 4 }}
          fullWidth
        />

        <TextField
          label="Visita"
          margin="dense"
          size="small"
          type="text"
          value={visitText}
          onChange={(e) => handleVisitChange(e.target.value)}
          onBlur={applyVisitFromText}
          onKeyDown={onKeyDownApply(applyVisitFromText)}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 2 }}
          sx={{ width: { xs: "100%", sm: "100%" } }}
        />

        <FormControl size="small" margin="dense" fullWidth sx={{ minWidth: 0 }}>
          <InputLabel>Presença</InputLabel>
          <Select
            label="Presença"
            value={filters.presentQ}
            onChange={(e) => filters.setPresentQ(e.target.value as Tri)}
          >
            <MenuItem value="any">
              <AllInclusiveIcon fontSize="small" style={{ marginRight: 8 }} />
              Qualquer
            </MenuItem>
            <MenuItem value="yes">
              <CheckCircleIcon fontSize="small" style={{ marginRight: 8 }} />
              Sim
            </MenuItem>
            <MenuItem value="no">
              <HighlightOffIcon fontSize="small" style={{ marginRight: 8 }} />
              Não
            </MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto" }, display: "flex", justifyContent: "flex-end" }}>
          {hasAny && (
            <Button
              onClick={() => {
                filters.clearFilters();
                setYearText("");
                setVisitText("");
              }}
              size="small"
              variant="text"
              sx={{ fontWeight: 700, textTransform: "none" }}
            >
              Limpar filtros
            </Button>
          )}
        </Box>
      </Box>

      {rows.length > 0 ? (
        <Grid container spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
          {rows.map((r) => (
            <Grid key={r.id} item xs={12} sm={6} md={4} lg={4}>
              <PagelaCard row={r} onEdit={onEdit} onDelete={onDelete} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2">Sem registros para a busca.</Typography>
        </Paper>
      )}

      <Stack direction="row" justifyContent="center">
        <Pagination
          count={Math.max(1, Math.ceil(total / limit))}
          page={page}
          onChange={(_, p) => setPage(p)}
          size={isXs ? "small" : "medium"}
          color="primary"
        />
      </Stack>
    </Stack>
  );
}
