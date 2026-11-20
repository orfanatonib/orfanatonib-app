import { Box, Stack, Typography } from "@mui/material";

import type { GenerationActivityResponse } from "../../types";

interface GenerationCapacityMeterProps {
  activity: GenerationActivityResponse;
  /** Versão enxuta: só os blocos e uma linha. */
  compact?: boolean;
}

/** As vagas de geração do Estúdio: 1 por categoria × 2 materiais = 8 blocos, os ocupados em destaque. */
export function GenerationCapacityMeter({ activity, compact = false }: GenerationCapacityMeterProps) {
  const { limits, usage } = activity;
  const used = usage.activeCategories;
  return (
    <Stack spacing={compact ? 0.75 : 1} data-testid="content-studio-capacity-meter">
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
        <Typography fontWeight={800} component="p" sx={{ m: 0 }}>
          {used} de {limits.maxTotal} vagas em uso
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {usage.activePackages} de {limits.maxPackages} materiais
        </Typography>
      </Stack>
      <Box role="img" aria-label={`${used} de ${limits.maxTotal} vagas de geração em uso`} sx={{ display: "grid", gridTemplateColumns: `repeat(${limits.maxTotal}, 1fr)`, gap: 0.5 }}>
        {Array.from({ length: limits.maxTotal }, (_, index) => (
          <Box
            key={index}
            data-filled={index < used}
            sx={(theme) => ({
              height: compact ? 8 : 12,
              borderRadius: 1,
              bgcolor: index < used ? theme.palette.primary.main : theme.palette.action.disabledBackground,
              transition: "background-color .3s",
            })}
          />
        ))}
      </Box>
      {!compact && (
        <Typography variant="caption" color="text.secondary">
          Uma geração por faixa etária, até {limits.maxPackages} materiais ao mesmo tempo (vale para todos os admins).
        </Typography>
      )}
    </Stack>
  );
}
