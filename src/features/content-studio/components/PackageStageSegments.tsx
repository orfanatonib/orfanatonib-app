import { Box, Stack, Tooltip, useTheme } from "@mui/material";

import { CONTENT_STAGE_STATUS_LABELS, CONTENT_STAGE_TYPE_LABELS } from "../constants";
import { stageTone, type StageTone } from "../production-list.utils";
import type { ContentAudienceDefinitionResponse, ContentStageSegment } from "../types";

interface PackageStageSegmentsProps {
  segments: readonly ContentStageSegment[];
  audiences: readonly ContentAudienceDefinitionResponse[];
}

/** As etapas do material como uma fileira de segmentos: de relance se vê o quanto avançou e onde travou. */
export function PackageStageSegments({ segments, audiences }: PackageStageSegmentsProps) {
  const theme = useTheme();
  const colors: Record<StageTone, string> = {
    done: theme.palette.success.main,
    produced: theme.palette.info.main,
    working: theme.palette.primary.light,
    problem: theme.palette.error.main,
    stale: theme.palette.warning.main,
    todo: theme.palette.action.disabledBackground,
  };
  const nameOf = (audience: string) => audiences.find((item) => item.audience === audience)?.name ?? audience;

  return (
    <Stack direction="row" spacing={0.4} role="list" aria-label="Etapas do material" data-testid="content-studio-stage-segments" sx={{ width: "100%" }}>
      {segments.map((segment, index) => {
        const label = `${nameOf(segment.audience)} · ${CONTENT_STAGE_TYPE_LABELS[segment.stageType]}: ${CONTENT_STAGE_STATUS_LABELS[segment.status]}`;
        const tone = stageTone(segment.status);
        return (
          <Tooltip key={`${segment.audience}-${segment.stageType}-${index}`} title={label} arrow>
            <Box role="listitem" aria-label={label} data-tone={tone} sx={{ flex: 1, minWidth: 0, height: 8, borderRadius: 4, bgcolor: colors[tone] }} />
          </Tooltip>
        );
      })}
    </Stack>
  );
}
