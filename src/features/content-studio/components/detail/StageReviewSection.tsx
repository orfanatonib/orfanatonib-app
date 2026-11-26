import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Stack, Typography } from "@mui/material";

import type { StudioWorkspace } from "../../hooks/useStudioWorkspace";
import { REVIEW_TIMELINE_TITLE } from "../../review-timeline.constants";
import { ContentReviewCommentStatus, type ContentReviewCommentResponse, type ContentStageResponse } from "../../types";
import { formatContentStudioDateTime } from "../../utils";
import { ResolveCommentButton } from "../ResolveCommentButton";
import { commentsNewestFirst } from "../../review-timeline.utils";
import { ReviewCommentBody } from "../ReviewCommentBody";
import { ReviewTimeline, reviewTimelineCount } from "../ReviewTimeline";

interface StageReviewSectionProps {
  stage: ContentStageResponse;
  workspace: StudioWorkspace;
  busy: boolean;
}

/**
 * O que a revisão disse sobre a etapa. As observações abertas ficam à vista (a produção as resolve com um recado);
 * as já resolvidas e o histórico de decisões ficam recolhidos para a tela não virar uma lista longa.
 * Aprovar e devolver acontecem SÓ na tela de revisão; a produção não decide.
 */
export function StageReviewSection({ stage, workspace, busy }: StageReviewSectionProps) {
  const open = commentsNewestFirst(stage.reviewComments).filter((comment) => comment.status === ContentReviewCommentStatus.OPEN);
  const resolved = commentsNewestFirst(stage.reviewComments).filter((comment) => comment.status !== ContentReviewCommentStatus.OPEN);
  const versionOf = (comment: ContentReviewCommentResponse) =>
    stage.currentVersion?.id === comment.versionId ? stage.currentVersion.versionNumber : "anterior";
  const events = reviewTimelineCount(stage.reviewDecisions);

  return (
    <Stack spacing={1} mt={1} data-testid={`content-studio-stage-comments-${stage.id}`}>
      {open.map((comment) => (
        <Alert key={comment.id} severity="warning" icon={false} data-testid={`content-studio-stage-comment-${comment.id}`}>
          <Stack spacing={1} alignItems="flex-start">
            <ReviewCommentBody comment={comment} versionLabel={versionOf(comment)} replyLabel="Seu recado" />
            <ResolveCommentButton
              commentId={comment.id}
              disabled={busy}
              testId={`content-studio-resolve-comment-${comment.id}`}
              onResolve={(commentId, message) => void workspace.resolveComment(commentId, stage.id, message)}
            />
          </Stack>
        </Alert>
      ))}
      {resolved.length > 0 && (
        <Accordion disableGutters variant="outlined" data-testid={`content-studio-stage-resolved-${stage.id}`}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2" fontWeight={800}>
              Observações resolvidas ({resolved.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5} divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
              {resolved.map((comment) => (
                <Box key={comment.id} data-testid={`content-studio-stage-comment-${comment.id}`}>
                  <ReviewCommentBody comment={comment} versionLabel={versionOf(comment)} replyLabel="Seu recado" />
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
      {events > 0 && (
        <Accordion disableGutters variant="outlined">
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2" fontWeight={800}>
              {REVIEW_TIMELINE_TITLE} ({events})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ReviewTimeline hideTitle decisions={stage.reviewDecisions} testId={`content-studio-stage-review-history-${stage.id}`} />
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  );
}
