import ArrowForward from "@mui/icons-material/ArrowForward";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { audienceLabel } from "../../generation-activity.utils";
import { useGenerationActivity } from "../../hooks/useGenerationActivity";
import { useNow } from "../../hooks/useNow";
import type { ContentAudienceDefinitionResponse } from "../../types";
import { GenerationCapacityMeter } from "./GenerationCapacityMeter";
import { GenerationJobRow } from "./GenerationJobRow";

const MAX_ROWS = 3;

interface GenerationActivityCompactProps {
  audiences: readonly ContentAudienceDefinitionResponse[];
}

/** Mini painel da produção: o que está gerando agora e quantas vagas sobram. Some se a consulta falhar. */
export function GenerationActivityCompact({ audiences }: GenerationActivityCompactProps) {
  const { activity, error } = useGenerationActivity();
  const now = useNow((activity?.active.length ?? 0) > 0);
  if (!activity) return null;
  if (error && activity.active.length === 0) return null;

  const { active } = activity;
  const shown = active.slice(0, MAX_ROWS);
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }} data-testid="content-studio-activity-compact">
      <Stack spacing={1}>
        <GenerationCapacityMeter activity={activity} compact />
        {active.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma geração em andamento. Todas as vagas estão livres.
          </Typography>
        ) : (
          <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
            {shown.map((item) => (
              <GenerationJobRow key={item.jobId} item={item} audienceName={audienceLabel(item.audience, audiences)} now={now} showTheme />
            ))}
          </Stack>
        )}
        <Button component={RouterLink} to="/adm/estudio" size="small" endIcon={<ArrowForward />} sx={{ minHeight: 44, alignSelf: "flex-start" }}>
          {active.length > MAX_ROWS ? `Ver as ${active.length} gerações` : "Painel completo"}
        </Button>
      </Stack>
    </Paper>
  );
}
