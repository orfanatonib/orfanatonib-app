import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { CONTENT_STAGE_TYPE_LABELS } from "../../constants";
import { describeJobProgress, formatElapsed } from "../../generation-activity.utils";
import { AiGenerationCapability, type GenerationActivityItem } from "../../types";

interface GenerationJobRowProps {
  item: GenerationActivityItem;
  audienceName: string;
  now: number;
  /** Mostra o nome do material (a lista compacta mistura materiais). */
  showTheme?: boolean;
}

/** Uma geração em andamento: categoria, etapa, barra e cronômetro; toca para abrir a etapa. */
export function GenerationJobRow({ item, audienceName, now, showTheme = false }: GenerationJobRowProps) {
  const view = describeJobProgress(item, now);
  const imageJob = item.capability === AiGenerationCapability.IMAGE_GENERATION;
  return (
    <Box
      component={RouterLink}
      to={`/adm/estudio/pacotes/${item.packageId}?audience=${item.audience}&stage=${item.stageType}`}
      data-testid={`content-studio-activity-job-${item.jobId}`}
      sx={{
        display: "block",
        color: "inherit",
        textDecoration: "none",
        minHeight: 44,
        py: 1,
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2, borderRadius: 1 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" gap={1} alignItems="baseline">
        <Typography variant="body2" fontWeight={700} noWrap sx={{ minWidth: 0 }}>
          {showTheme ? `${item.theme} · ` : ""}
          {audienceName} · {CONTENT_STAGE_TYPE_LABELS[item.stageType]}
          {imageJob ? " (imagens)" : ""}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {formatElapsed(view.elapsedMs)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={view.percent}
        color={view.retrying ? "warning" : "primary"}
        aria-label={`Progresso: ${audienceName}, ${CONTENT_STAGE_TYPE_LABELS[item.stageType]}`}
        sx={{ height: 6, borderRadius: 3, my: 0.5 }}
      />
      <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ m: 0 }}>
        {view.percent}% · {view.headline}
      </Typography>
    </Box>
  );
}
