import { Box, Chip, Stack, Typography } from "@mui/material";

import { REVIEW_TIMELINE_COLORS, REVIEW_TIMELINE_LABELS, REVIEW_TIMELINE_TITLE } from "../review-timeline.constants";
import { buildReviewTimeline, buildReviewTimelineNewestFirst } from "../review-timeline.utils";
import type { ContentReviewDecisionResponse } from "../types";
import { formatContentStudioDateTime } from "../utils";

interface ReviewTimelineProps {
  decisions: readonly ContentReviewDecisionResponse[];
  testId: string;
  /** Quando o título já vem de fora (um acordeão), não repete. */
  hideTitle?: boolean;
}

/** O que já aconteceu com o item na revisão (do mais recente para o mais antigo): enviado, ajuste pedido, reenviado, aprovado (com versão e data). */
export const reviewTimelineCount = (decisions: readonly ContentReviewDecisionResponse[]): number =>
  buildReviewTimeline(decisions).length;

export function ReviewTimeline({ decisions, testId, hideTitle = false }: ReviewTimelineProps) {
  const entries = buildReviewTimelineNewestFirst(decisions);
  if (entries.length === 0) return null;
  return (
    <Stack spacing={0.75} data-testid={testId}>
      {!hideTitle && (
        <Typography variant="subtitle2" component="h3" fontWeight={800}>
          {REVIEW_TIMELINE_TITLE}
        </Typography>
      )}
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 0.75 }}>
        {entries.map((entry) => (
          <Box
            component="li"
            key={entry.id}
            data-testid={`content-studio-review-event-${entry.kind}`}
            sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
          >
            <Chip
              size="small"
              color={REVIEW_TIMELINE_COLORS[entry.kind]}
              label={REVIEW_TIMELINE_LABELS[entry.kind]}
              sx={{ fontWeight: 700 }}
            />
            <Typography variant="caption" color="text.secondary">
              {entry.versionNumber !== null ? `versão ${entry.versionNumber} · ` : ""}
              {formatContentStudioDateTime(entry.at)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
