import { Box, Button, LinearProgress, Paper, Stack, Typography } from "@mui/material";

import { describeJobProgress, formatElapsed, type ProgressJob } from "../../generation-activity.utils";
import { useNow } from "../../hooks/useNow";
import { GenerationJobStatus } from "../../generation.utils";
import { AiGenerationCapability, type ContentGenerationJobResponse } from "../../types";
import { GenerationStepTrack } from "./GenerationStepTrack";

interface GenerationProgressPanelProps {
  job: ContentGenerationJobResponse | null;
  /** Reconectando o acompanhamento em tempo real (o polling cobre o intervalo). */
  reconnecting?: boolean;
  onCancel?: () => void;
  cancelDisabled?: boolean;
}

/** O andamento de uma geração na etapa: fase atual, barra de progresso, cronômetro e linha do tempo. */
export function GenerationProgressPanel({ job, reconnecting = false, onCancel, cancelDisabled }: GenerationProgressPanelProps) {
  const now = useNow(true);
  const input: ProgressJob = job
    ? { status: job.status, attempts: job.attempts, progress: job.progress, startedAt: job.createdAt, capability: job.capability }
    : {
        status: GenerationJobStatus.PENDING,
        attempts: 0,
        progress: null,
        startedAt: new Date(now).toISOString(),
        capability: AiGenerationCapability.TEXT_STRUCTURED,
      };
  const view = describeJobProgress(input, now);

  return (
    <Paper
      variant="outlined"
      data-testid="content-studio-generation-progress"
      role="status"
      aria-live="polite"
      sx={(theme) => ({ borderRadius: 2, p: 2, borderLeft: `4px solid ${view.retrying ? theme.palette.warning.main : theme.palette.primary.main}` })}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} data-testid="content-studio-generation-headline">
              {view.headline}…
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tempo decorrido {formatElapsed(view.elapsedMs)}
            </Typography>
          </Box>
          <Typography fontWeight={800} color={view.retrying ? "warning.main" : "primary"} sx={{ flexShrink: 0 }}>
            {view.percent}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={view.percent}
          color={view.retrying ? "warning" : "primary"}
          aria-label="Progresso da geração"
          sx={{ height: 8, borderRadius: 4 }}
        />

        <GenerationStepTrack steps={view.steps} current={view.stepIndex} paused={view.retrying} />

        <Typography variant="caption" color="text.secondary">
          Você pode acompanhar outras etapas enquanto aguarda. Se a página cair ou for atualizada, a geração continua e o acompanhamento volta sozinho.
          {reconnecting && <span data-testid="content-studio-generation-reconnecting"> Reconectando ao acompanhamento…</span>}
        </Typography>

        {onCancel && (
          <Button color="inherit" disabled={cancelDisabled} onClick={onCancel} sx={{ minHeight: 44, alignSelf: { xs: "stretch", sm: "flex-start" } }}>
            Cancelar geração
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
