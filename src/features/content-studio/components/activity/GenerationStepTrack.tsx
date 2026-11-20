import Check from "@mui/icons-material/Check";
import { Box, Stack, Typography, keyframes } from "@mui/material";

import type { ProgressStep } from "../../generation-activity.utils";

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.45); }
  70% { box-shadow: 0 0 0 7px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;

interface GenerationStepTrackProps {
  steps: readonly ProgressStep[];
  current: number;
  /** Em tentativa nova a etapa pulsante vira estática (nada está avançando de fato). */
  paused?: boolean;
}

/** Linha do tempo da geração: etapas concluídas com ✓, a atual pulsando e as próximas apagadas. */
export function GenerationStepTrack({ steps, current, paused = false }: GenerationStepTrackProps) {
  return (
    <Stack
      direction="row"
      role="list"
      aria-label="Etapas da geração"
      data-testid="content-studio-generation-steps"
      sx={{ width: "100%", gap: 0.5 }}
    >
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <Stack key={step.key} role="listitem" aria-current={active ? "step" : undefined} alignItems="center" spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: done ? theme.palette.success.main : active ? theme.palette.primary.main : theme.palette.action.disabledBackground,
                color: done || active ? theme.palette.common.white : theme.palette.text.disabled,
                animation: active && !paused ? `${pulse} 1.6s infinite` : "none",
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              })}
            >
              {done ? <Check sx={{ fontSize: 15 }} /> : <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{index + 1}</Typography>}
            </Box>
            <Typography
              variant="caption"
              noWrap
              sx={{ maxWidth: "100%", fontWeight: active ? 700 : 400, color: active ? "text.primary" : "text.secondary", fontSize: 11 }}
            >
              {step.label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
