import FilterAltOff from "@mui/icons-material/FilterAltOff";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import DayPickerField from "@/components/common/DayPickerField";
import {
  PERIOD_PRESET_LABELS,
  PeriodPreset,
  activePreset,
  isPeriodInverted,
  periodForPreset,
} from "../period.utils";
import type { ContentAudienceDefinitionResponse } from "../types";

interface DashboardFiltersProps {
  startDate: string;
  endDate: string;
  audience: string;
  audiences: ContentAudienceDefinitionResponse[];
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
}

/** Filtros do painel: período (calendário em português + atalhos) e faixa etária. */
export function DashboardFilters({
  startDate,
  endDate,
  audience,
  audiences,
  onStartDateChange,
  onEndDateChange,
  onAudienceChange,
}: DashboardFiltersProps) {
  const period = { startDate, endDate };
  const inverted = isPeriodInverted(period);
  const selectedPreset = activePreset(period);
  const hasFilters = !!(startDate || endDate || audience);

  const applyPreset = (preset: PeriodPreset) => {
    const next = periodForPreset(preset);
    onStartDateChange(next.startDate);
    onEndDateChange(next.endDate);
  };

  const clearAll = () => {
    onStartDateChange("");
    onEndDateChange("");
    onAudienceChange("");
  };

  return (
    <Card variant="outlined" data-testid="content-studio-dashboard-filters">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Typography component="h2" variant="subtitle1" fontWeight={700}>
              Filtrar painel
            </Typography>
            {hasFilters && (
              <Button
                size="small"
                startIcon={<FilterAltOff />}
                onClick={clearAll}
                data-testid="content-studio-dashboard-clear-filters"
                sx={{ minHeight: 36 }}
              >
                Limpar filtros
              </Button>
            )}
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
            }}
          >
            <DayPickerField
              label="De"
              value={startDate}
              onChange={onStartDateChange}
              maxDate={endDate || undefined}
              error={inverted}
              testId="content-studio-dashboard-start-date"
            />
            <DayPickerField
              label="Até"
              value={endDate}
              onChange={onEndDateChange}
              minDate={startDate || undefined}
              error={inverted}
              helperText={inverted ? "A data final deve ser igual ou posterior à inicial." : undefined}
              testId="content-studio-dashboard-end-date"
            />
            <FormControl fullWidth>
              <InputLabel id="content-studio-dashboard-audience-label">
                Faixa etária
              </InputLabel>
              <Select
                labelId="content-studio-dashboard-audience-label"
                label="Faixa etária"
                value={audience}
                onChange={(event) => onAudienceChange(event.target.value)}
                inputProps={{ "data-testid": "content-studio-dashboard-audience" }}
              >
                <MenuItem value="">Todas as faixas</MenuItem>
                {audiences.map((definition) => (
                  <MenuItem key={definition.audience} value={definition.audience}>
                    {definition.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
            data-testid="content-studio-dashboard-presets"
          >
            <Typography variant="body2" color="text.secondary">
              Atalhos:
            </Typography>
            {Object.values(PeriodPreset).map((preset) => (
              <Chip
                key={preset}
                label={PERIOD_PRESET_LABELS[preset]}
                clickable
                color={selectedPreset === preset ? "primary" : "default"}
                variant={selectedPreset === preset ? "filled" : "outlined"}
                onClick={() => applyPreset(preset)}
                sx={{ minHeight: { xs: 44, sm: 32 } }}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
